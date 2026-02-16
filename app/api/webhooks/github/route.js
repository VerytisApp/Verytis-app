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

        // 2. EVENT ROUTING
        if (eventType === 'pull_request') {
            const action = body.action;
            const pr = body.pull_request;

            // FILTERING: Process ONLY if action === 'closed' AND merged === true
            if (action !== 'closed' || !pr.merged) {
                return NextResponse.json({ status: 'ignored_action' });
            }

            console.log(`🐙 GitHub PR Merged: #${pr.number} in ${body.repository.full_name}`);
            await logGitHubActivity('CODE_MERGE', body.repository, pr.user.login, `Merged PR #${pr.number}: ${pr.title}`, {
                pr_number: pr.number,
                url: pr.html_url,
                additions: pr.additions,
                deletions: pr.deletions
            });

        } else if (eventType === 'push') {
            const commits = body.commits || [];
            if (commits.length === 0) return NextResponse.json({ status: 'no_commits' });

            const repoName = body.repository.full_name;
            const senderLogin = body.sender.login;
            const branch = body.ref.replace('refs/heads/', '');

            console.log(`🐙 GitHub Push: ${commits.length} commits to ${repoName} by ${senderLogin}`);

            // We could log each commit, but a summary is often better for "high level" audit. 
            // However, for "Audit Trail", logging individual significant commits might be better.
            // Let's log the push as a single entry with commit details in metadata for now to reduce noise, 
            // OR log the head commit. 
            // User request implies "Commits" (plural). Let's log the push event.

            const summary = `Pushed ${commits.length} commit${commits.length > 1 ? 's' : ''} to ${branch}`;

            await logGitHubActivity('CODE_PUSH', body.repository, senderLogin, summary, {
                branch: branch,
                commits: commits.map(c => ({
                    id: c.id,
                    message: c.message,
                    url: c.url,
                    author: c.author.name
                })),
                compare_url: body.compare
            });
        } else {
            return NextResponse.json({ status: 'ignored_event_type' });
        }

        return NextResponse.json({ status: 'logged' });



        // Helper to handle identification and logging
        async function logGitHubActivity(actionType, repository, githubUsername, summary, extraMetadata = {}) {
            let userId = null;
            let isVerified = false;
            let method = 'ANONYMOUS';

            // Strategy: Social Profile Match (JSONB containment)
            // We check both string format and nested object format for robustness
            let { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .contains('social_profiles', { github: { username: githubUsername } })
                .maybeSingle();

            if (!profile) {
                // Fallback for legacy string format if any
                const { data: legacyProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .contains('social_profiles', { github: githubUsername })
                    .maybeSingle();
                profile = legacyProfile;
            }

            if (profile) {
                userId = profile.id;
                isVerified = true;
                method = 'SOCIAL_LINK';
                console.log(`✅ Identified User via GitHub: ${githubUsername} -> ${userId}`);
            } else {
                console.log(`🕵️‍♀️ User not identified for GitHub: ${githubUsername}`);
            }

            await supabase.from('activity_logs').insert({
                actor_id: userId,
                action_type: actionType,
                summary: `${summary} in ${repository.full_name}`,
                metadata: {
                    platform: 'GitHub',
                    repo: repository.full_name,
                    github_user: githubUsername,
                    identification_method: method,
                    is_anonymous: !isVerified,
                    ...extraMetadata
                }
            });
        }

    } catch (error) {
        console.error('GitHub Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
