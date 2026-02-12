import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

import crypto from 'crypto';

// ... (other imports)

export async function POST(req) {
    try {
        const signature = req.headers.get('x-hub-signature-256');
        const eventType = req.headers.get('x-github-event');

        // 0. SECURITY: Verify Signature
        const rawBody = await req.text(); // Need raw text for HMAC
        const secret = process.env.GITHUB_WEBHOOK_SECRET;

        if (secret && signature) {
            const hmac = crypto.createHmac('sha256', secret);
            const digest = Buffer.from('sha256=' + hmac.update(rawBody).digest('hex'), 'utf8');
            const checksum = Buffer.from(signature, 'utf8');

            if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
                console.error("❌ GitHub Webhook Signature Verification Failed");
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        } else if (secret && !signature) {
            console.error("❌ GitHub Webhook Missing Signature");
            return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        }

        // Parse JSON after verification
        const body = JSON.parse(rawBody);

        if (eventType !== 'pull_request') {
            // We only care about PRs for now (audit trail of code changes)
            // Silently ignore other events to avoid log noise, or return 200
            return NextResponse.json({ status: 'ignored_event_type' });
        }


        const action = body.action;
        const pr = body.pull_request;

        // 2. FILTERING: Process ONLY if action === 'closed' AND merged === true
        if (action !== 'closed' || !pr.merged) {
            return NextResponse.json({ status: 'ignored_action' });
        }

        console.log(`🐙 GitHub PR Merged: #${pr.number} in ${body.repository.full_name}`);

        // 3. IDENTIFICATION STRATEGY (The Core Logic)
        let userId = null;
        let isVerified = false;
        let method = 'ANONYMOUS';

        const githubUsername = pr.user.login; // The PR author
        // Also check merged_by if needed, but usually we credit the author of the PR content
        // Or if we want to credit who merged it: const mergerUsername = pr.merged_by.login;

        // Strategy A: Email Match (if available in payload? usually not in PR payload directly, maybe in commits url)
        // We skip Email for PR payload unless we fetch commits. 
        // Let's stick to Username matching via social_profiles first.

        // Strategy B: Social Profile Match
        // Query profiles where social_profiles->>github matches sender login
        // Note: JSONB query syntax in Supabase JS
        const { data: profileBySocial } = await supabase
            .from('profiles')
            .select('id')
            // This requires the functional index or just raw filter if valid JSONB
            .eq('social_profiles->>github', githubUsername) // This syntax depends on Supabase/PostgREST version support
            // Standard PostgREST: .filter('social_profiles->>github', 'eq', githubUsername)
            // or .contains('social_profiles', { github: githubUsername })
            .maybeSingle();

        // Let's try .contains for JSONB as it's more robust
        const { data: profileByContains } = await supabase
            .from('profiles')
            .select('id')
            .contains('social_profiles', { github: githubUsername })
            .maybeSingle();

        if (profileByContains) {
            userId = profileByContains.id;
            isVerified = true;
            method = 'SOCIAL_LINK';
            console.log(`✅ Identified User via GitHub Link: ${githubUsername} -> ${userId}`);
        } else {
            console.log(`🕵️‍♀️ User not identified for GitHub: ${githubUsername}. Logged as Anonymous.`);
        }

        // 4. LOGGING: Insert into activity_logs
        const repoName = body.repository.full_name;
        const prTitle = pr.title;
        const prUrl = pr.html_url;

        await supabase.from('activity_logs').insert({
            actor_id: userId, // Can be null
            action_type: 'CODE_MERGE',
            summary: `Merged PR #${pr.number} in ${repoName}: ${prTitle}`,
            metadata: {
                platform: 'GitHub',
                pr_number: pr.number,
                repo: repoName,
                url: prUrl,
                github_user: githubUsername,
                identification_method: method,
                is_anonymous: !isVerified,
                files_changed: pr.changed_files,
                additions: pr.additions,
                deletions: pr.deletions
            }
        });

        return NextResponse.json({ status: 'logged', identified: isVerified });

    } catch (error) {
        console.error('GitHub Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
