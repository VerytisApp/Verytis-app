
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkResources() {
    const { data, error } = await supabase
        .from('monitored_resources')
        .select(`
            *,
            integrations (
                provider
            )
        `);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Monitored Resources:", JSON.stringify(data, null, 2));
    }
}

checkResources();
