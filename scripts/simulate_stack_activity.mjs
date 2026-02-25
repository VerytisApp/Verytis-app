import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function simulate() {
    const orgId = '1abe99cd-78ae-4f6a-b839-c44e68e408d1';
    console.log('🚀 SIMULATING STACK ACTIVITY...');

    // 1. Get Entities
    const { data: teams } = await s.from('teams').select('id, name, monitored_resources(id, name, type), team_members(user_id, profiles(full_name))').eq('organization_id', orgId);
    const { data: agents } = await s.from('ai_agents').select('id, name').eq('organization_id', orgId);

    const sentinel = agents.find(a => a.name === 'Sentinel-Bot');

    // 2. Inject Connections (Passports) for all members
    const providers = ['slack', 'github', 'trello'];
    const allMembers = [];
    teams.forEach(t => t.team_members.forEach(m => allMembers.push({ id: m.user_id, name: m.profiles.full_name, team: t.name })));

    console.log(`Injecting passports for ${allMembers.length} members...`);
    for (const m of allMembers) {
        const userProviders = [...providers]; // Give everyone everything for maximum "green circles"
        const connBatch = userProviders.map(p => ({
            user_id: m.id,
            provider: p,
            settings: { status: 'active', verified: true, last_check: new Date().toISOString() }
        }));
        await s.from('connections').upsert(connBatch, { onConflict: 'user_id,provider' });
    }

    // 3. Generate Activity logs (5-6 per stack)
    console.log('Generating activity history...');
    const logs = [];

    teams.forEach(t => {
        const repo = t.monitored_resources.find(r => r.type === 'repo');
        const board = t.monitored_resources.find(r => r.type === 'board' || r.type === 'folder');
        const channel = t.monitored_resources.find(r => r.type === 'channel');
        const members = t.team_members.map(m => m.user_id);

        // A. GitHub Commit
        if (repo && members.length > 0) {
            logs.push({
                organization_id: orgId,
                actor_id: members[0],
                resource_id: repo.id,
                action_type: 'GITHUB_COMMIT',
                summary: `Pushed 3 commits to branch 'main' in [${repo.name}]`,
                metadata: { repo: repo.name, impact: 'low' }
            });
        }

        // B. Trello Movement
        if (board && members.length > 0) {
            logs.push({
                organization_id: orgId,
                actor_id: members[Math.min(1, members.length - 1)],
                resource_id: board.id,
                action_type: 'CARD_MOVED',
                summary: `Moved "Sprint Planning" to COMPLETED in [${board.name}]`,
                metadata: { board_id: board.name, impact: 'low' }
            });
        }

        // C. Slack Message
        if (channel && members.length > 0) {
            logs.push({
                organization_id: orgId,
                actor_id: members[0],
                resource_id: channel.id,
                action_type: 'SLACK_MESSAGE',
                summary: `Daily standup summary posted in #${channel.name}`,
                metadata: { slack_channel: channel.name, impact: 'low' }
            });
        }

        // D. AI Telemetry
        if (sentinel && repo) {
            logs.push({
                organization_id: orgId,
                agent_id: sentinel.id,
                resource_id: repo.id,
                action_type: 'AI_TELEMETRY',
                summary: `Sentinel-Bot: Audited [${repo.name}] for IAM policy violations. No drifts found.`,
                metadata: { agent: 'Sentinel-Bot', target: repo.name, impact: 'low' }
            });
        }

        // E. PR Opened
        if (repo && members.length > 1) {
            logs.push({
                organization_id: orgId,
                actor_id: members[1],
                resource_id: repo.id,
                action_type: 'GITHUB_PR_OPENED',
                summary: `Opened PR: "Infrastructure hardening v2" in [${repo.name}]`,
                metadata: { repo: repo.name, impact: 'medium' }
            });
        }
    });

    console.log(`Inserting ${logs.length} new activity logs...`);
    const { error: logErr } = await s.from('activity_logs').insert(logs);
    if (logErr) console.error('Error inserting logs:', logErr);

    console.log('✨ SIMULATION COMPLETE.');
}

simulate().catch(console.error);
