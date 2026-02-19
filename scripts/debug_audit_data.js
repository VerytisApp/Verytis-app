
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
    console.log('--- CHECKING AUDIT DATA ---');

    // 1. Check Monitored Resources
    const { data: resources, error: resError } = await supabase
        .from('monitored_resources')
        .select(`
            id, 
            name, 
            external_id, 
            integrations ( provider )
        `);

    if (resError) {
        console.error('Error fetching resources:', resError);
    } else {
        console.log(`Found ${resources.length} monitored resources:`);
        resources.forEach(r => {
            console.log(`- Resource: ${r.name} (ID: ${r.id})`);
            console.log(`  External ID: ${r.external_id}`);
            console.log(`  Provider: ${r.integrations?.provider}`);
        });
    }

    // 2. Check Activity Logs (Sample)
    console.log('\n--- CHECKING ACTIVITY LOGS (Last 5) ---');
    const { data: logs, error: logError } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (logError) {
        console.error('Error fetching logs:', logError);
    } else {
        logs.forEach(log => {
            console.log(`- Log ID: ${log.id}`);
            console.log(`  Resource ID: ${log.resource_id}`);
            console.log(`  Action: ${log.action_type}`);
            console.log(`  Summary: ${log.summary}`);
            console.log(`  Metadata: ${JSON.stringify(log.metadata)}`);
        });
    }
}

checkData();
