
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    console.log("--- Fetching Last 20 Logs (Any Type) ---");
    const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('id, created_at, action_type, summary, metadata')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) console.error(error);
    else {
        logs.forEach(log => {
            console.log(`[${log.created_at}] Type: ${log.action_type} | Summary: ${log.summary}`);
            if (log.action_type === 'DISCUSSION') {
                console.log(`   -> Raw Text would have been: ${log.summary}`);
            }
        });
    }
}

check();
