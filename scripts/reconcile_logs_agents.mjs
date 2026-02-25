import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function reconcileLogsAndAgents() {
    const orgId = '1abe99cd-78ae-4f6a-b839-c44e68e408d1';
    console.log('🚀 RECONCILING ACTIVITY LOGS & AI AGENTS...');

    // 1. Get Golden AI Agents
    const { data: agents } = await s.from('ai_agents').select('*').eq('organization_id', orgId);
    const goldenAgents = {};
    agents.forEach(a => {
        // Keep the one with a more descriptive description or the first one
        if (!goldenAgents[a.name] || a.description.length > goldenAgents[a.name].description.length) {
            goldenAgents[a.name] = a;
        }
    });
    console.log('Golden Agents:', Object.keys(goldenAgents).map(n => `${n} -> ${goldenAgents[n].id}`));

    // 2. Get Golden Admin Profile (Tychique)
    const { data: profiles } = await s.from('profiles').select('id, full_name').eq('organization_id', orgId);
    const admin = profiles.find(p => p.full_name === 'Tychique Esteve') || profiles[0];
    console.log('Golden Admin Profile:', admin?.id, `(${admin?.full_name})`);

    // 3. Get Golden Connections for Admin
    const { data: conns } = await s.from('connections').select('id, provider').eq('user_id', admin.id);
    const cMap = {};
    conns.forEach(c => cMap[c.provider] = c.id);
    console.log('Golden Connections:', cMap);

    // 4. Update Activity Logs (In chunks if needed, but 15k is manageable for a dedicated script)
    const { data: logs } = await s.from('activity_logs').select('id, action_type, agent_id, connection_id, actor_id').eq('organization_id', orgId);
    console.log('Reconciling', logs.length, 'logs...');

    let updateCount = 0;
    for (const l of logs) {
        let updates = {};

        // Link AI_TELEMETRY to Golden Agent
        if (l.action_type === 'AI_TELEMETRY' || l.action_type.startsWith('AI_')) {
            // Find appropriate agent based on metadata or name (fallback to Sentinel-Bot for generic telemetry)
            const agentName = 'Sentinel-Bot'; // Default
            if (goldenAgents[agentName] && l.agent_id !== goldenAgents[agentName].id) {
                updates.agent_id = goldenAgents[agentName].id;
            }
        }

        // Link Third-Party Logs to Connections
        const providerPrefix = l.action_type.split('_')[0].toLowerCase();
        if (['github', 'slack', 'trello'].includes(providerPrefix)) {
            if (cMap[providerPrefix] && l.connection_id !== cMap[providerPrefix]) {
                updates.connection_id = cMap[providerPrefix];
            }
            // If actor is missing, assign to admin
            if (!l.actor_id && admin) {
                updates.actor_id = admin.id;
            }
        }

        if (Object.keys(updates).length > 0) {
            await s.from('activity_logs').update(updates).eq('id', l.id);
            updateCount++;
            if (updateCount % 100 === 0) console.log(`Processed ${updateCount} updates...`);
        }
    }

    // 5. Cleanup Stale Agents
    const goldenAgentIds = Object.values(goldenAgents).map(a => a.id);
    const agentsToDelete = agents.filter(a => !goldenAgentIds.includes(a.id)).map(a => a.id);
    if (agentsToDelete.length > 0) {
        console.log(`🗑️ Deleting ${agentsToDelete.length} stale AI agents...`);
        // Note: activity_logs.agent_id is set null or delete cascade? Check schema.
        // If it's references set null, it's fine.
        await s.from('ai_agents').delete().in('id', agentsToDelete);
    }

    console.log(`✨ DONE. Total updates made: ${updateCount}`);
}

reconcileLogsAndAgents().catch(console.error);
