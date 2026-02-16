import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

import crypto from 'crypto';

// GitHub Webhook Handler - Real-time activity verified & improved
export async function POST(req) {
    const rawBody = await req.text();
    console.log(`📡 Incoming GitHub Webhook Body Length: ${rawBody.length}`);
    try {
        const signature = req.headers.get('x-hub-signature-256');
        const eventType = req.headers.get('x-github-event');
        const secret = process.env.GITHUB_WEBHOOK_SECRET;

        console.log(`📡 Event Type: ${eventType}, Signature: ${signature ? 'PRESENT' : 'MISSING'}`);

        // 0. SECURITY: Verify Signature
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

        const body = JSON.parse(rawBody);
        console.log(`📡 GitHub Webhook Received: ${eventType} - ${body.action || 'push'}`);

        // 2. EVENT ROUTING
        if (eventType === 'pull_request') {
            const action = body.action;
            const pr = body.pull_request;

            // FILTERING: Process ONLY if action === 'closed' AND merged === true
            if (action !== 'closed' || !pr.merged) {
                console.log(`ℹ️ Ignoring PR action: ${action} (merged: ${pr.merged})`);
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
            if (commits.length === 0) {
                console.log(`ℹ️ GitHub Push with no commits (likely ref deletion)`);
                return NextResponse.json({ status: 'no_commits' });
            }

            const repoName = body.repository.full_name;
            const senderLogin = body.sender.login;
            const branch = body.ref.replace('refs/heads/', '');

            console.log(`🐙 GitHub Push: ${commits.length} commits to ${repoName} by ${senderLogin}`);

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
        } else if (eventType === 'ping') {
            console.log(`🐙 GitHub Ping: Webhook successfully configured for ${body.repository?.full_name || 'Organization'}`);
            return NextResponse.json({ status: 'pong' });
        } else {
            console.log(`ℹ️ Ignoring GitHub event: ${eventType}`);
            return NextResponse.json({ status: 'ignored_event_type' });
        }

        return NextResponse.json({ status: 'logged' });



        // Helper to handle identification and logging
        async function logGitHubActivity(actionType, repository, githubUsername, summary, extraMetadata = {}) {
            let userId = null;
            let isVerified = false;
            let method = 'ANONYMOUS';
            let organizationId = null;
            let resourceId = null;

            // 1. Resolve organization_id and resource_id from monitored_resources
            // external_id for GitHub is the repository ID (numerical)
            const { data: resource } = await supabase
                .from('monitored_resources')
                .select('id, team_id, teams(organization_id)')
                .eq('external_id', repository.id.toString())
                .maybeSingle();

            if (resource) {
                resourceId = resource.id;
                organizationId = resource.teams?.organization_id;
                console.log(`📍 Resource Found: ${resourceId} (Team: ${resource.team_id}, Org: ${organizationId})`);
            } else {
                console.log(`⚠️ Resource not found in monitored_resources for GitHub ID: ${repository.id}`);
            }

            // 2. Identify User
            const lowerGithubUsername = githubUsername.toLowerCase();

            let { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .contains('social_profiles', { github: { username: lowerGithubUsername } })
                .maybeSingle();

            if (!profile) {
                const { data: legacyProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .contains('social_profiles', { github: lowerGithubUsername })
                    .maybeSingle();
                profile = legacyProfile;
            }

            // MANUAL MAPPING FALLBACK (Mirroring backfill script)
            if (!profile && lowerGithubUsername === 'tychiqueesteve') {
                userId = '4cf8db21-2e1e-4c22-9055-d586b7fed310';
                isVerified = true;
                method = 'MANUAL_MAPPING';
                console.log(`🔗 Manual Mapping Applied: ${githubUsername} -> ${userId}`);
            } else if (profile) {
                userId = profile.id;
                isVerified = true;
                method = 'SOCIAL_LINK';
                console.log(`✅ Identified User via GitHub: ${githubUsername} -> ${userId}`);
            } else {
                console.log(`🕵️‍♀️ User not identified for GitHub: ${githubUsername}`);
            }

            // 3. Log Activity
            const { error: logError } = await supabase.from('activity_logs').insert({
                actor_id: userId,
                organization_id: organizationId,
                resource_id: resourceId,
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

            if (logError) {
                console.error(`❌ Error logging GitHub activity:`, logError);
            } else {
                console.log(`🚀 GitHub activity logged successfully`);
            }
        }

    } catch (error) {
        console.error('GitHub Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
