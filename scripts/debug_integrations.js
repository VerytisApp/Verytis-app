const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
    console.log("--- Checking Database State ---");

    // 1. Check Integrations
    const { data: integrations, error: intError } = await supabase
        .from('integrations')
        .select('*');

    if (intError) console.error("Error fetching integrations:", intError);
    console.log(`\nFound ${integrations?.length || 0} integrations:`);
    integrations?.forEach(i => {
        console.log(`- Provider: ${i.provider}`);
        console.log('  Settings:', JSON.stringify(i.settings, null, 2));
    });

    // 2. Check Profiles (to see Org IDs)
    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('email, organization_id, role')
        .limit(5);

    if (profError) console.error("Error fetching profiles:", profError);
    console.log(`\nFound profiles:`);
    profiles?.forEach(p => {
        console.log(`- ${p.email} (Start with: ${p.role}) -> OrgID: ${p.organization_id}`);
    });
}

checkData();
