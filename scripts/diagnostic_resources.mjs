import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function diagnostic() {
    const orgId = '1abe99cd-78ae-4f6a-b839-c44e68e408d1';

    console.log('--- DIAGNOSTIC START ---');

    // 1. Current Integrations
    const { data: ints } = await s.from('integrations').select('id, provider, name, settings').eq('organization_id', orgId);
    console.log('Integrations found:', ints?.length);
    ints?.forEach(i => console.log(` - [${i.provider}] ${i.name} (ID: ${i.id}) Settings: ${!!i.settings}`));

    // 2. Teams
    const { data: teams } = await s.from('teams').select('id, name').eq('organization_id', orgId);
    const teamIds = teams?.map(t => t.id) || [];
    console.log('Teams found:', teams?.length);

    // 3. Monitored Resources
    const { data: res } = await s.from('monitored_resources').select('*').in('team_id', teamIds);
    console.log('Resources found:', res?.length);

    const validIntIds = new Set(ints?.map(i => i.id) || []);
    const orphaned = res?.filter(r => !validIntIds.has(r.integration_id)) || [];

    if (orphaned.length > 0) {
        console.log('⚠️ ORPHANED RESOURCES DETECTED:', orphaned.length);
        orphaned.forEach(r => console.log(` - Resource [${r.name}] points to stale integration ID: ${r.integration_id}`));
    } else {
        console.log('✅ All resources are linked to active integrations.');
    }

    // 4. Check API logic - mapping by provider name
    const resByProvider = {};
    res?.forEach(r => {
        const provider = ints?.find(i => i.id === r.integration_id)?.provider || 'unknown';
        if (!resByProvider[provider]) resByProvider[provider] = 0;
        resByProvider[provider]++;
    });
    console.log('Resources by provider:', resByProvider);
}

diagnostic().catch(console.error);
