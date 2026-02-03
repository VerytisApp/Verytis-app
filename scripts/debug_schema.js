
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
    console.log('🔍 Checking Schema Visibility...');

    // Try to inspect the schema using a raw RPC or just guessing
    // Since we can't easily list tables via JS client without metadata access, 
    // we'll try to select from a few expected tables.

    const tables = ['organizations', 'profiles', 'integrations', 'teams'];

    for (const table of tables) {
        console.log(`Checking table: ${table}...`);
        const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });

        if (error) {
            console.log(`❌ Error accessing ${table}:`, error.message, error.code);
        } else {
            console.log(`✅ Table ${table} is accessible!`);
        }
    }
}

checkSchema();
