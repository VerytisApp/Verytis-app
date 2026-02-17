
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use ANON key to simulate client-side access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLS() {
    const userId = '4cf8db21-2e1e-4c22-9055-d586b7fed310';

    console.log(`Checking profile visibility with ANON key (simulating RLS issue)...`);

    // Try to select social_profiles specifically
    const { data, error } = await supabase
        .from('profiles')
        .select('id, social_profiles')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('RLS/Permission Error:', error);
    } else {
        console.log('--- ANON Query Result ---');
        console.log(JSON.stringify(data, null, 2));
        console.log('-------------------------');
    }
}

checkRLS();
