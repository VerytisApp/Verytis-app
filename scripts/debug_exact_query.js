const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runDebugQuery() {
    console.log("--- 🕵️‍♂️ DEBUGGING EXACT API QUERY ---");

    // Exact copy of query from route.js
    let query = supabase
        .from('activity_logs')
        .select(`
            id,
            created_at,
            action_type,
            summary,
            metadata
        `)
        // Exclude simple discussions
        .not('action_type', 'in', '("DISCUSSION","DISCUSSION_ANONYMOUS")')
        .order('created_at', { ascending: false })
        .limit(20);

    const { data: logs, error } = await query;

    if (error) {
        console.error("❌ SQL ERROR:", error);
        return;
    }

    console.log(`✅ FOUND ${logs.length} LOGS`);
    console.log("---------------------------------------------------");
    logs.forEach(l => {
        const isTransfer = l.action_type === 'TRANSFER';
        const icon = isTransfer ? '🚨 FOUND IT >' : '  ';
        console.log(`${icon} [${l.created_at}] Type: '${l.action_type}' | Channel: ${l.metadata?.slack_channel}`);
    });
    console.log("---------------------------------------------------");

    // Specific Verification
    const transferLog = logs.find(l => l.action_type === 'TRANSFER');
    if (transferLog) {
        console.log("🎉 TRANSFER IS IN THE QUERY RESULTS!");
    } else {
        console.log("😱 TRANSFER IS MISSING FROM QUERY RESULTS.");
        console.log("👉 Retrying WITHOUT the .not() filter...");

        // Retry without filter
        const { data: allLogs } = await supabase
            .from('activity_logs')
            .select('action_type, created_at, metadata')
            .order('created_at', { ascending: false })
            .limit(20);

        const hiddenTransfer = allLogs.find(l => l.action_type === 'TRANSFER');
        if (hiddenTransfer) {
            console.log("✅ Found TRANSFER when removing .not() filter.");
            console.log("❌ CONCLUSION: The .not() filter is incorrectly excluding TRANSFER.");
        } else {
            console.log("❌ TRANSFER is missing even without filters. Check database content/RLS.");
        }
    }
}

runDebugQuery();
