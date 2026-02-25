import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function reconcileAll() {
    const orgId = '1abe99cd-78ae-4f6a-b839-c44e68e408d1';
    console.log('🚀 RECONCILING 15K+ LOGS & AGENTS...');

    // 1. Get Golden AI Agents
    const { data: agents } = await s.from('ai_agents').select('*').eq('organization_id', orgId);
    const goldenAgents = {};
    agents.forEach(a => {
        if (!goldenAgents[a.name] || a.description.length > goldenAgents[a.name].description.length) {
            goldenAgents[a.name] = a;
        }
    });

    // 2. Get Golden Admin Profile
    const { data: profiles } = await s.from('profiles').select('id, full_name').eq('organization_id', orgId);
    const admin = profiles.find(p => p.full_name === 'Tychique Esteve') || profiles[0];
    const { data: conns } = await s.from('connections').select('id, provider').eq('user_id', admin.id);
    const cMap = {};
    conns.forEach(c => cMap[c.provider] = c.id);

    console.log('Golden IDs resolved. Admin:', admin.id, 'Agents:', Object.keys(goldenAgents).length);

    // 3. Process Logs in Batches
    let lastId = null;
    let totalUpdated = 0;
    const batchSize = 1000;

    while (true) {
        let query = s.from('activity_logs').select('id, action_type, agent_id, connection_id, actor_id').eq('organization_id', orgId).order('id', { ascending: true }).limit(batchSize);
        if (lastId) query = query.gt('id', lastId);

        const { data: logs, error } = await query;
        if (error || !logs || logs.length === 0) break;

        console.log(`Scanning batch of ${logs.length}...`);

        for (const l of logs) {
            let update = {};
            let shouldUpdate = false;

            // AI Logic
            if (l.action_type === 'AI_TELEMETRY' || l.action_type.startsWith('AI_')) {
                const agentName = 'Sentinel-Bot';
                if (goldenAgents[agentName] && l.agent_id !== goldenAgents[agentName].id) {
                    update.agent_id = goldenAgents[agentName].id;
                    shouldUpdate = true;
                }
            }

            // Provider Logic
            const providerPrefix = l.action_type.split('_')[0].toLowerCase();
            if (['github', 'slack', 'trello'].includes(providerPrefix)) {
                // Connection Fix
                if (cMap[providerPrefix] && l.connection_id !== cMap[providerPrefix]) {
                    update.connection_id = cMap[providerPrefix];
                    shouldUpdate = true;
                }
                // Actor Fix (If NULL or if pointing to an ID not in our current valid profiles)
                const isValidActor = profiles.some(p => p.id === l.actor_id);
                if ((!l.actor_id || !isValidActor) && admin) {
                    update.actor_id = admin.id;
                    shouldUpdate = true;
                }
            }

            if (shouldUpdate) {
                await s.from('activity_logs').update(update).eq('id', l.id);
                totalUpdated++;
                if (totalUpdated % 100 === 0) console.log(` - Updated ${totalUpdated} records...`);
            }
            lastId = l.id;
        }
    }

    console.log(`✨ COMPLETE. Reconciled ${totalUpdated} records.`);
}

reconcileAll().catch(console.error);
