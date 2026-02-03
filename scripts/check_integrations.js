const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    console.log('Connecting to Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    const TEST_ORG_ID = '5db477f6-c893-4ec4-9123-b12160224f70';
    console.log('Checking for Org:', TEST_ORG_ID);

    const { data: orgs, error: orgError } = await supabase.from('organizations').select('id, name').limit(1);
    if (orgError) console.error('Error fetching organizations:', orgError);
    else {
        console.log('Organizations table accessible. Count:', orgs.length);
        if (orgs.length > 0) console.log('Found Org:', orgs[0]);
    }

    const { data, error } = await supabase.from('integrations')
        .select('*')
        .eq('organization_id', TEST_ORG_ID);

    if (error) {
        console.error('Error fetching integrations:', error);
    } else {
        console.log('Integrations found:', data.length);
        data.forEach(int => {
            console.log(`- Provider: ${int.provider}, Name: ${int.name}`);
            console.log(`  Settings:`, JSON.stringify(int.settings));
        });
    }
}

check();
