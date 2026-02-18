const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const { data, error } = await supabase
        .from('integrations')
        .select('id, settings')
        .eq('provider', 'github')
        .single();

    if (error || !data) {
        console.log('No GitHub integration found:', error);
        process.exit(1);
    }

    const s = data.settings;
    console.log('--- GitHub Token Status ---');
    console.log('access_token present:', !!s.access_token);
    console.log('refresh_token present:', !!s.refresh_token);
    console.log('installation_id:', s.installation_id);
    console.log('created_at:', s.created_at);
    console.log('expires_in:', s.expires_in);

    if (s.created_at && s.expires_in) {
        const expiresAt = s.created_at + s.expires_in;
        const now = Math.floor(Date.now() / 1000);
        console.log('Token expired:', now > expiresAt);
        console.log('Expired', Math.round((now - expiresAt) / 3600), 'hours ago');
    } else {
        console.log('No created_at/expires_in — cannot check expiry');
    }

    // Try refreshing if refresh_token exists
    if (s.refresh_token) {
        console.log('\n--- Attempting Token Refresh ---');
        console.log('GITHUB_CLIENT_ID present:', !!process.env.GITHUB_CLIENT_ID);
        console.log('GITHUB_CLIENT_SECRET present:', !!process.env.GITHUB_CLIENT_SECRET);

        const res = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: s.refresh_token
            })
        });

        const result = await res.json();

        if (result.error) {
            console.log('Refresh FAILED:', result.error, result.error_description);
        } else {
            console.log('Refresh SUCCESS! New token received.');
            // Save to DB
            const newSettings = {
                ...s,
                access_token: result.access_token,
                refresh_token: result.refresh_token,
                expires_in: result.expires_in,
                refresh_token_expires_in: result.refresh_token_expires_in,
                created_at: Math.floor(Date.now() / 1000)
            };
            await supabase.from('integrations').update({ settings: newSettings }).eq('id', data.id);
            console.log('Token saved to database.');
        }
    } else {
        console.log('No refresh_token — cannot refresh. Need to re-install GitHub App.');
    }

    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
