
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    console.log("--- Fetching Last 10 Logs with Metadata ---");
    const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('id, created_at, action_type, summary, metadata')
        .order('created_at', { ascending: false })
        .limit(10);

    if (logs) {
        logs.forEach(log => {
            console.log(`[${log.created_at}] Type: ${log.action_type}`);
            console.log(`   Summary: ${log.summary}`);
            console.log(`   Slack Channel: '${log.metadata?.slack_channel}'`); // Quotes to see whitespace
            console.log('---');
        });
    }

    console.log("\n--- Fetching Monitored Resource 'proj-boost' ---");
    // We search by name or ID if we knew it. Let's list all resources to match.
    const { data: resources } = await supabase
        .from('monitored_resources')
        .select('id, name, external_id');

    if (resources) {
        resources.forEach(r => {
            console.log(`Resource: ${r.name} (ID: ${r.id}) -> Slack ID: '${r.external_id}'`);
        });
    }
}

check();
