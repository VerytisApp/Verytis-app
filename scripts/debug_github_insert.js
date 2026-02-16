const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
    console.log('Debugging GitHub Insert...');
    const TEST_ORG_ID = '5db477f6-c893-4ec4-9123-b12160224f70';

    const integrationData = {
        organization_id: TEST_ORG_ID,
        provider: 'github',
        name: 'test-github-user',
        external_id: '123456',
        settings: {
            access_token: 'test-token',
            installation_id: '123',
            username: 'test-user',
            html_url: 'https://github.com'
        }
    };

    console.log('Attempting insert with:', JSON.stringify(integrationData, null, 2));

    const { data, error } = await supabase.from('integrations').insert(integrationData).select();

    if (error) {
        console.error('❌ Insert Error:', error);
    } else {
        console.log('✅ Insert Success:', data);
    }
}

debug();
