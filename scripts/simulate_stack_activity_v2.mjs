import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function simulateMore() {
    const orgId = '1abe99cd-78ae-4f6a-b839-c44e68e408d1';
    console.log('🚀 SIMULATING MORE STACK ACTIVITY...');

    const { data: teams } = await s.from('teams').select('id, name, monitored_resources(id, name, type), team_members(user_id, profiles(full_name))').eq('organization_id', orgId);
    const { data: agents } = await s.from('ai_agents').select('id, name').eq('organization_id', orgId);
    const complianceWizard = agents.find(a => a.name === 'Compliance-Wizard');

    const logs = [];

    teams.forEach(t => {
        const repo = t.monitored_resources.find(r => r.type === 'repo');
        const board = t.monitored_resources.find(r => r.type === 'board' || r.type === 'folder');
        const members = t.team_members.map(m => m.user_id);

        // A. PR Merged
        if (repo && members.length > 0) {
            logs.push({
                organization_id: orgId,
                actor_id: members[0],
                resource_id: repo.id,
                action_type: 'PR_MERGED',
                summary: `Merged PR #42: "Security Patch 4.2" into main [${repo.name}]`,
                metadata: { repo: repo.name, impact: 'medium' }
            });
        }

        // B. Card Comment
        if (board && members.length > 0) {
            logs.push({
                organization_id: orgId,
                actor_id: members[Math.min(1, members.length - 1)],
                resource_id: board.id,
                action_type: 'COMMENT',
                summary: `Added comment to "Budget Review": "Approved for Q1" in [${board.name}]`,
                metadata: { board_id: board.name, impact: 'low' }
            });
        }

        // C. AI Compliance check
        if (complianceWizard && repo) {
            logs.push({
                organization_id: orgId,
                agent_id: complianceWizard.id,
                action_type: 'AI_TELEMETRY',
                summary: `Compliance-Wizard: Verified GDPR data handling in ${repo.name}. All systems compliant.`,
                metadata: { agent: 'Compliance-Wizard', target: repo.name, impact: 'low' }
            });
        }

        // D. Member Joined
        if (members.length > 0) {
            logs.push({
                organization_id: orgId,
                actor_id: members[0],
                action_type: 'MEMBER_JOINED',
                summary: `New contributor [${t.team_members[0].profiles.full_name}] joined the ${t.name} workspace.`,
                metadata: { team: t.name, impact: 'low' }
            });
        }
    });

    console.log(`Inserting ${logs.length} additional logs...`);
    const { error: logErr } = await s.from('activity_logs').insert(logs);
    if (logErr) console.error('Error:', logErr);

    console.log('✨ SECOND PHASE COMPLETE.');
}

simulateMore().catch(console.error);
