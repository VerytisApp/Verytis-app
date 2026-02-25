import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function simulateFinalClean() {
    const orgId = '1abe99cd-78ae-4f6a-b839-c44e68e408d1';
    console.log('🚀 SIMULATING CLEAN HIGH-FIDELITY DATA...');

    // 1. Get Entities
    const { data: teams } = await s.from('teams').select('id, name, monitored_resources(id, name, type, metadata), team_members(user_id, profiles(full_name))').eq('organization_id', orgId);
    const { data: profiles } = await s.from('profiles').select('id, full_name').eq('organization_id', orgId);
    const { data: agents } = await s.from('ai_agents').select('id, name').eq('organization_id', orgId);

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

    // 3. Clean up logs
    await s.from('activity_logs').delete().eq('organization_id', orgId);

    const logs = [];

    // 4. Generate Data
    for (const t of teams) {
        const repo = t.monitored_resources.find(r => r.type === 'repo');
        const board = t.monitored_resources.find(r => r.type === 'board' || r.type === 'folder');
        const slackChannel = t.monitored_resources.find(r => r.type === 'channel');
        const members = t.team_members.map(m => m.user_id);
        const admin = profiles.find(p => p.full_name === 'Tychique Esteve');

        if (members.length === 0) continue;

        // Set legitimate Slack member count cache (26)
        if (slackChannel) {
            console.log(`Caching Slack member count (26) for #${slackChannel.name}`);
            const updatedMeta = {
                ...(slackChannel.metadata || {}),
                slack_member_count: 26,
                last_sync_at: new Date().toISOString()
            };
            await s.from('monitored_resources').update({ metadata: updatedMeta }).eq('id', slackChannel.id);
        }

        // --- GITHUB ---
        if (repo) {
            logs.push({
                organization_id: orgId, actor_id: members[0], resource_id: repo.id,
                action_type: 'COMMIT',
                summary: `Pushed 3 commits to [${repo.name}]`,
                metadata: { repo: repo.name, impact: 'low' }
            });
            logs.push({
                organization_id: orgId, actor_id: admin.id, resource_id: repo.id,
                action_type: 'CODE_MERGE',
                summary: `Merged PR #10 into main in [${repo.name}]`,
                metadata: { repo: repo.name, impact: 'high' }
            });
        }

        // --- SLACK ---
        if (slackChannel) {
            logs.push({
                organization_id: orgId, actor_id: admin.id, resource_id: slackChannel.id,
                action_type: 'APPROVE',
                summary: `Approved production deployment for ${t.name}`,
                metadata: { slack_channel: slackChannel.name, impact: 'high' }
            });
            logs.push({
                organization_id: orgId, actor_id: members[0], resource_id: slackChannel.id,
                action_type: 'EDIT',
                summary: `Updated documentation in #${slackChannel.name}`,
                metadata: { slack_channel: slackChannel.name, impact: 'low' }
            });
            // Simulate 2 unlinked messages from "User X" (external)
            logs.push({
                organization_id: orgId, actor_id: null, resource_id: slackChannel.id,
                action_type: 'COMMENT',
                summary: `External query about deployment status in #${slackChannel.name}`,
                metadata: { slack_channel: slackChannel.name, slack_user_name: 'User X', impact: 'low' }
            });
        }
    }

    console.log(`Inserting ${logs.length} clean logs...`);
    await s.from('activity_logs').insert(logs);

    console.log('✨ CLEAN SIMULATION COMPLETE.');
}

simulateFinalClean().catch(console.error);
