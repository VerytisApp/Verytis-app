const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkIntegrations() {
    const { data: integrations, error } = await supabase
        .from('integrations')
        .select('id, provider, name, settings, created_at')
        .eq('organization_id', '5db477f6-c893-4ec4-9123-b12160224f70');

    if (error) {
        console.error('Error fetching integrations:', error);
    } else {
        console.log('Integrations:', JSON.stringify(integrations, null, 2));
    }
}

checkIntegrations();
