const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixIntegration() {
    console.log("--- Fixing Integration ---");

    // Get the ID of the existing integration
    const { data: integrations } = await supabase
        .from('integrations')
        .select('id')
        .eq('provider', 'slack')
        .single();

    if (!integrations) {
        console.log("No integration found to fix.");
        return;
    }

    console.log(`Updating integration ${integrations.id}...`);

    // Update with fake active status and token
    const { error } = await supabase
        .from('integrations')
        .update({
            status: 'active',
            access_token: 'xoxb-123456789-fake-token-for-testing-connection'
        })
        .eq('id', integrations.id);

    if (error) console.error("Error updating:", error);
    else console.log("Success! Integration is now ACTIVE with a fake token.");
}

fixIntegration();
