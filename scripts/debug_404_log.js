
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLog() {
    const id = '86521219-5f9d-4eed-b0bf-509f99cee7b0';
    console.log(`Checking for Activity Log ID: ${id}`);

    const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        console.error("Error:", error);
    } else if (data) {
        console.log("✅ Found Log:");
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.log("❌ Log NOT found.");
    }
}

checkLog();
