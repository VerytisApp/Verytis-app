
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false
    }
});

async function checkProfileExact() {
    const userId = '4cf8db21-2e1e-4c22-9055-d586b7fed310';

    console.log(`Checking profile for user: ${userId} using EXACT API query`);

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, organization_id, slack_user_id, social_profiles')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return;
    }

    console.log('--- API Query Result ---');
    console.log(JSON.stringify(profile, null, 2));
    console.log('------------------------');

    if (profile.social_profiles && profile.social_profiles.github) {
        console.log("SUCCESS: GitHub data found in social_profiles.");
    } else {
        console.log("FAILURE: social_profiles.github is MISSING.");
    }
}

checkProfileExact();
