const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const { data } = await supabase
        .from('integrations')
        .select('settings')
        .eq('provider', 'github')
        .single();

    const token = data.settings.access_token;
    const installId = data.settings.installation_id;

    console.log('Token (first 10 chars):', token?.substring(0, 10) + '...');
    console.log('Installation ID:', installId);

    // Test 1: Basic user endpoint
    console.log('\n--- Test 1: /user ---');
    const r1 = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    console.log('Status:', r1.status);
    if (r1.ok) {
        const u = await r1.json();
        console.log('User:', u.login);
    } else {
        console.log('Error:', await r1.text());
    }

    // Test 2: Installation repos
    console.log('\n--- Test 2: /user/installations/' + installId + '/repositories ---');
    const r2 = await fetch(`https://api.github.com/user/installations/${installId}/repositories`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    console.log('Status:', r2.status);
    if (r2.ok) {
        const d = await r2.json();
        console.log('Repos:', d.total_count, d.repositories?.map(r => r.full_name));
    } else {
        console.log('Error:', await r2.text());
    }

    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
