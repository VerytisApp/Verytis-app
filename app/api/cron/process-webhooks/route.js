import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scrubText, scrubObject } from '@/lib/security/scrubber';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    // Basic protection (Vercel Cron automatically sends this header if configured)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log("🚦 Starting webhook processing batch...");

    // 1. Fetch pending webhook events (Batch of 50 to avoid lambda timeouts)
    const { data: events, error: fetchError } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(50);

    if (fetchError) {
        console.error("❌ Error fetching pending webhooks:", fetchError);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!events || events.length === 0) {
        console.log("✅ No pending webhooks to process");
        return NextResponse.json({ status: "success", processed: 0, failed: 0 });
    }

    console.log(`📦 Found ${events.length} webhooks to process`);

    // 2. Mark as processing to prevent concurrent duplicate executions run
    const eventIds = events.map(e => e.id);
    await supabase.from('webhook_events')
        .update({ status: 'processing' })
        .in('id', eventIds);

    // 3. Process each event sequentially
    let processed = 0;
    let failed = 0;

    for (const event of events) {
        try {
            if (event.provider === 'github') {
                await processGithubWebhook(supabase, event);
            } else {
                console.log(`⚠️ Unhandled provider: ${event.provider}`);
            }

            // Mark completed
            await supabase.from('webhook_events')
                .update({
                    status: 'completed',
                    processed_at: new Date().toISOString()
                })
                .eq('id', event.id);
            processed++;

        } catch (err) {
            console.error(`❌ Failed to process event ${event.id}:`, err);

            // Mark failed
            await supabase.from('webhook_events')
                .update({
                    status: 'failed',
                    error_message: err.message || JSON.stringify(err),
                    processed_at: new Date().toISOString()
                })
                .eq('id', event.id);
            failed++;
        }
    }

    console.log(`🏁 Batch processing completed. Processed: ${processed}, Failed: ${failed}`);
    return NextResponse.json({ status: "success", processed, failed });
}

// === GITHUB PROCESSING LOGIC ===
async function processGithubWebhook(supabase, event) {
    const eventType = event.event_type;
    const body = event.payload;

    if (eventType === 'pull_request') {
        const action = body.action;
        const pr = body.pull_request;

        if (action !== 'closed' || !pr.merged) {
            return; // Ignore
        }

        await logGitHubActivity(supabase, 'CODE_MERGE', body.repository, pr.user.login, `Merged PR #${pr.number}: ${pr.title}`, {
            pr_number: pr.number,
            url: pr.html_url,
            additions: pr.additions,
            deletions: pr.deletions
        });

    } else if (eventType === 'push') {
        const commits = body.commits || [];
        if (commits.length === 0) {
            return; // Ignore
        }

        const repoName = body.repository.full_name;
        const senderLogin = body.sender.login;
        const branch = body.ref.replace('refs/heads/', '');

        const summary = `Pushed ${commits.length} commit${commits.length > 1 ? 's' : ''} to ${branch}`;

        await logGitHubActivity(supabase, 'CODE_PUSH', body.repository, senderLogin, summary, {
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
        // Ping is just configuration testing
        return;
    }

    // ── Trigger active agents subscribed to this repository ─────────
    try {
        const orgId = event.organization_id;
        const repoFullName = body?.repository?.full_name;
        if (orgId && repoFullName) {
            const { data: subs } = await supabase
                .from('agent_resources')
                .select('agent_id')
                .eq('provider', 'github')
                .eq('external_id', repoFullName);

            const agentIds = [...new Set((subs || []).map(s => s.agent_id))];
            if (agentIds.length > 0) {
                const { data: agents } = await supabase
                    .from('ai_agents')
                    .select('id, status')
                    .in('id', agentIds)
                    .eq('organization_id', orgId)
                    .eq('status', 'active');

                await Promise.all((agents || []).map(a => fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/run/agt_live_${a.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-cron-token': process.env.CRON_SECRET
                    },
                    body: JSON.stringify({
                        message: `[GITHUB EVENT] ${eventType} on ${repoFullName}`
                    })
                })));
            }
        }
    } catch (e) {
        console.error('[WEBHOOK PROCESSOR] Failed to trigger agents for GitHub event:', e.message);
    }
}

async function logGitHubActivity(supabase, actionType, repository, githubUsername, summary, extraMetadata = {}) {
    let userId = null;
    let isVerified = false;
    let method = 'ANONYMOUS';
    let organizationId = null;
    let resourceId = null;

    // 1. Resolve organization_id and resource_id
    const { data: resource } = await supabase
        .from('monitored_resources')
        .select('id, team_id, teams(organization_id)')
        .eq('external_id', repository.id.toString())
        .maybeSingle();

    if (resource) {
        resourceId = resource.id;
        organizationId = resource.teams?.organization_id;
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

    if (profile) {
        userId = profile.id;
        isVerified = true;
        method = 'SOCIAL_LINK';
    }

    // 3. Log Activity (Scrubbed for GDPR/WORM Compliance)
    const redactedSummary = scrubText(`${summary} in ${repository.full_name}`);
    const redactedMetadata = scrubObject({
        platform: 'GitHub',
        repo: repository.full_name,
        github_user: githubUsername,
        identification_method: method,
        is_anonymous: !isVerified,
        ...extraMetadata
    });

    const { error: logError } = await supabase.from('activity_logs').insert({
        actor_id: userId,
        organization_id: organizationId,
        resource_id: resourceId,
        action_type: actionType,
        summary: redactedSummary,
        metadata: redactedMetadata
    });

    if (logError) {
        throw new Error(`Failed to insert activity_log: ${logError.message}`);
    }

    // 4. BROADCAST to realtime channels
    if (resourceId) {
        const { data: res } = await supabase
            .from('monitored_resources')
            .select('team_id')
            .eq('id', resourceId)
            .single();

        if (res?.team_id) {
            await supabase.channel(`team-activity-${res.team_id}`)
                .send({
                    type: 'broadcast',
                    event: 'new_activity',
                    payload: { resourceId, actionType, summary }
                });

            await supabase.channel(`resource-activity-${resourceId}`)
                .send({
                    type: 'broadcast',
                    event: 'new_activity',
                    payload: { resourceId, actionType, summary }
                });
        }
    }
}
