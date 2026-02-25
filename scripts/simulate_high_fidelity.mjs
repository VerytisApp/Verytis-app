import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function simulateHighFidelity() {
    const orgId = '1abe99cd-78ae-4f6a-b839-c44e68e408d1';
    console.log('🚀 SIMULATING HIGH-FIDELITY DATA...');

    // 1. Get Entities
    const { data: teams } = await s.from('teams').select('id, name, monitored_resources(id, name, type), team_members(user_id, profiles(full_name))').eq('organization_id', orgId);
    const { data: agents } = await s.from('ai_agents').select('id, name').eq('organization_id', orgId);
    const { data: profiles } = await s.from('profiles').select('id, full_name').eq('organization_id', orgId);

    // 2. Fix Member Passports (social_profiles)
    console.log('Syncing social profiles for all members...');
    for (const p of profiles) {
        const username = p.full_name.split(' ')[0].toLowerCase();
        const social_profiles = {
            github: { username: username, connected_at: new Date().toISOString() },
            trello: { username: `${username}_v`, connected_at: new Date().toISOString() },
            slack: { username: username, connected_at: new Date().toISOString() }
        };
        await s.from('profiles').update({ social_profiles }).eq('id', p.id);
    }

    // 3. Clean up old ambiguous logs for this org
    await s.from('activity_logs').delete().eq('organization_id', orgId);

    const logs = [];

    // 4. Generate High-Fidelity Logs for each team
    teams.forEach(t => {
        const repo = t.monitored_resources.find(r => r.type === 'repo');
        const board = t.monitored_resources.find(r => r.type === 'board' || r.type === 'folder');
        const members = t.team_members.map(m => m.user_id);
        const admin = profiles.find(p => p.full_name === 'Tychique Esteve');

        if (members.length === 0) return;

        // --- GITHUB ---
        if (repo) {
            // Commit
            logs.push({
                organization_id: orgId,
                actor_id: members[0],
                resource_id: repo.id,
                action_type: 'COMMIT',
                summary: `Pushed 3 commits to [${repo.name}]`,
                metadata: { repo: repo.name, impact: 'low', commits: [{ message: 'Initial architecture setup', url: '#' }] }
            });
            // PR Opened
            logs.push({
                organization_id: orgId,
                actor_id: members[Math.min(1, members.length - 1)],
                resource_id: repo.id,
                action_type: 'OPEN_PR',
                summary: `Opened PR #12: "Feature: OAuth Integration" in [${repo.name}]`,
                metadata: { repo: repo.name, impact: 'medium' }
            });
            // PR Merged
            logs.push({
                organization_id: orgId,
                actor_id: admin.id,
                resource_id: repo.id,
                action_type: 'CODE_MERGE',
                summary: `Merged PR #10 into main in [${repo.name}]`,
                metadata: { repo: repo.name, impact: 'high' }
            });
        }

        // --- SLACK (Ships) ---
        const slackChannel = t.monitored_resources.find(r => r.type === 'channel');
        if (slackChannel) {
            logs.push({
                organization_id: orgId,
                actor_id: admin.id,
                resource_id: slackChannel.id,
                action_type: 'APPROVE',
                summary: `Approved production deployment for ${t.name}`,
                metadata: { slack_channel: slackChannel.name, impact: 'high' }
            });
            logs.push({
                organization_id: orgId,
                actor_id: members[0],
                resource_id: slackChannel.id,
                action_type: 'EDIT',
                summary: `Updated documentation in #${slackChannel.name}`,
                metadata: { slack_channel: slackChannel.name, impact: 'low' }
            });
        }

        // --- TRELLO ---
        if (board) {
            logs.push({
                organization_id: orgId,
                actor_id: members[0],
                resource_id: board.id,
                action_type: 'CARD_MOVED',
                summary: `Moved "Database Migration" to DONE in [${board.name}]`,
                metadata: { board_id: board.id, impact: 'medium' }
            });
        }
    });

    // --- AI TELEMETRY (Rich Metadata) ---
    agents.forEach(agent => {
        const repo = teams[0].monitored_resources.find(r => r.type === 'repo');
        logs.push({
            organization_id: orgId,
            agent_id: agent.id,
            action_type: 'AI_TELEMETRY',
            summary: `${agent.name}: Performed automated security scan.`,
            metadata: {
                trace_id: `trace-${Math.random().toString(36).substr(2, 9)}`,
                message: `Analyzed ${repo?.name || 'infrastructure'} for vulnerabilities.`,
                metrics: { tokens_used: 1200, cost_usd: 0.024, duration_ms: 850 },
                cognitive_load: { retry_count: 0, tools_called: ["vulnerability_scanner", "npm_audit"] },
                ai_context: { model: "gpt-4-turbo", provider: "openai" }
            }
        });
    });

    console.log(`Inserting ${logs.length} high-fidelity logs...`);
    const { error: logErr } = await s.from('activity_logs').insert(logs);
    if (logErr) console.error('Log Error:', logErr);

    console.log('✨ HIGH-FIDELITY SIMULATION COMPLETE.');
}

simulateHighFidelity().catch(console.error);
