const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing environment variables. Please run with source .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUsers() {
    console.log('--- DEBUG USERS ---');
    const TEST_ORG_ID = '5db477f6-c893-4ec4-9123-b12160224f70'; // From api/users Route

    console.log(`Checking users in org: ${TEST_ORG_ID}`);

    const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', TEST_ORG_ID);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${users.length} users.`);
    users.forEach(u => console.log(`- ${u.id} | ${u.email} | SlackID: ${u.slack_user_id}`));

    // Test API Endpoint directly
    console.log('\n--- TESTING API ENDPOINT ---');
    try {
        const res = await fetch('http://localhost:3000/api/users');
        if (res.ok) {
            const json = await res.json();
            console.log(`API returned ${json.users ? json.users.length : 0} users.`);
            if (json.users && json.users.length > 0) {
                console.log('Sample User:', json.users[0]);
            }
        } else {
            console.log(`API Error: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.log('Body:', text);
        }
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }

    // Check all organizations
    const { data: orgs } = await supabase.from('organizations').select('*');
    console.log('\nAll Organizations:');
    orgs.forEach(o => console.log(`- ${o.id} | ${o.name}`));
}

debugUsers();
