const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProfileSchema() {
    console.log("--- Checking Profiles Table Schema ---");

    // Fetch one profile to see columns
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (profiles && profiles.length > 0) {
        console.log("Columns found:", Object.keys(profiles[0]));

        const hasSlackId = Object.keys(profiles[0]).some(k => k.includes('slack'));
        console.log(`Has Slack related column? ${hasSlackId}`);
    } else {
        console.log("Profiles table is empty, cannot inspect.");
    }
}

checkProfileSchema();
