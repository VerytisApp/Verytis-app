
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    console.log('Checking monitored_resources columns...');
    const { data, error } = await supabase
        .from('monitored_resources')
        .select('team_id')
        .limit(1);

    if (error) {
        console.error('Error selecting team_id:', error);
    } else {
        console.log('Success! team_id column exists.');
    }
}

checkSchema();
