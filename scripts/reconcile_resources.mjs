import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function reconcile() {
    const orgId = '1abe99cd-78ae-4f6a-b839-c44e68e408d1';
    console.log('🚀 RECONCILING RESOURCES...');

    // 1. Get Golden Integrations (the ones with settings preferably)
    const { data: ints } = await s.from('integrations').select('*').eq('organization_id', orgId);
    const golden = {};
    ints.forEach(i => {
        if (!golden[i.provider] || (i.settings && !golden[i.provider].settings)) {
            golden[i.provider] = i;
        }
    });
    console.log('Golden Integrations:', Object.keys(golden).map(p => `${p} -> ${golden[p].id}`));

    // 2. Get Teams
    const { data: teams } = await s.from('teams').select('id, name').eq('organization_id', orgId);
    const tLookup = {}; teams.forEach(t => tLookup[t.name] = t.id);

    // 3. Define Mappings
    const mappings = {
        'Core Engineering': ['verytis-monorepo', 'auth-service', 'ledger-api', 'engineering', 'core-repo', 'Roadmap'],
        'Infrastructure Ops': ['infrastructure-iac', 'infrastructure', 'infra-repo'],
        'Security & Risk': ['security-ops', 'security-alerts', 'incident-response', 'Security Backlog', 'Security Audits'],
        'Governance & Compliance': ['prod-governance', 'governance-v3', 'compliance-log', 'compliance', 'Compliance Audit Q2', 'Compliance Tracker']
    };

    // 4. Update Resources
    const { data: res } = await s.from('monitored_resources').select('*').in('integration_id', ints.map(i => i.id));

    for (const r of res) {
        let updates = {};

        // Fix Integration
        const provider = ints.find(i => i.id === r.integration_id)?.provider;
        if (provider && golden[provider] && r.integration_id !== golden[provider].id) {
            updates.integration_id = golden[provider].id;
        }

        // Fix Team (if detached or mismatched)
        for (const [teamName, names] of Object.entries(mappings)) {
            if (names.includes(r.name)) {
                if (r.team_id !== tLookup[teamName]) {
                    updates.team_id = tLookup[teamName];
                }
                break;
            }
        }

        if (Object.keys(updates).length > 0) {
            console.log(`📡 Updating resource [${r.name}] -> ${JSON.stringify(updates)}`);
            await s.from('monitored_resources').update(updates).eq('id', r.id);
        }
    }

    // 5. Cleanup Stale Integrations
    const goldenIds = Object.values(golden).map(g => g.id);
    const toDelete = ints.filter(i => !goldenIds.includes(i.id)).map(i => i.id);
    if (toDelete.length > 0) {
        console.log(`🗑️ Deleting ${toDelete.length} stale integrations...`);
        await s.from('integrations').delete().in('id', toDelete);
    }

    console.log('✨ RECONCILIATION COMPLETE.');
}

reconcile().catch(console.error);
