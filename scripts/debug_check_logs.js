
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("--- Checking Recent Activity Logs ---");
    const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) console.error(error);
    else {
        logs.forEach(log => {
            console.log(`[${log.created_at}] Action: ${log.action_type}, Channel: ${log.metadata?.slack_channel}, Actor: ${log.actor_id}`);
        });
    }

    console.log("\n--- Checking Monitored Resources ---");
    // The ID from the user's URL/logs
    const targetUuid = 'cfb41847-ecae-499b-9b13-c9586ae749de';
    const { data: resource, error: rError } = await supabase
        .from('monitored_resources')
        .select('*')
        .eq('id', targetUuid)
        .single();

    if (rError) console.error(rError);
    else {
        console.log(`Resource UUID: ${resource.id}`);
        console.log(`Slack External ID: ${resource.external_id}`);
        console.log(`Name: ${resource.name}`);
    }
}

check();
