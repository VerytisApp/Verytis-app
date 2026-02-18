const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const { data, error } = await supabase
        .from('integrations')
        .select('id, provider, name, settings')
        .eq('provider', 'github');

    console.log('Total GitHub integrations:', data?.length);
    data?.forEach((row, i) => {
        console.log(`\n--- Row ${i + 1} ---`);
        console.log('ID:', row.id);
        console.log('Name:', row.name);
        console.log('Installation ID:', row.settings?.installation_id);
        console.log('Token prefix:', row.settings?.access_token?.substring(0, 10));
        console.log('Has refresh_token:', !!row.settings?.refresh_token);
        console.log('created_at:', row.settings?.created_at);
    });

    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
