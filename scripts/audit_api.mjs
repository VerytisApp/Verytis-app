import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We simulate a user session (Tychique)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // We use service role to check what's there vs what's visible
);

async function testApi() {
    console.log('--- API AUDIT ---');
    const orgId = '1abe99cd-78ae-4f6a-b839-c44e68e408d1';

    // 1. Fetch Teams
    const { data: teams } = await supabase
        .from('teams')
        .select(`
            id, name,
            monitored_resources (
                id, name, type, integration_id,
                integrations (provider)
            )
        `)
        .eq('organization_id', orgId);

    console.log(`Teams found: ${teams?.length}`);
    teams?.forEach(t => {
        console.log(`Team: ${t.name}`);
        console.log(` Resources: ${t.monitored_resources?.length}`);
        t.monitored_resources?.forEach(r => {
            console.log(`  - [${r.integrations?.provider || '???'}] ${r.name} (${r.type})`);
        });
    });
}

testApi().catch(console.error);
