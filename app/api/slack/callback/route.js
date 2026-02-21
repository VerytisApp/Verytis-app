import { NextResponse } from 'next/server';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=${error}`);
    }

    if (!code) {
        return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    try {
        // Exchange code for token
        const response = await fetch('https://slack.com/api/oauth.v2.access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.SLACK_CLIENT_ID,
                client_secret: process.env.SLACK_CLIENT_SECRET,
                code: code,
                redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/slack/callback`
            })
        });

        const data = await response.json();

        if (!data.ok) {
            console.error('Slack OAuth Error:', data.error);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=${data.error}`);
        }

        // Parse state to get Organization ID
        const stateParam = searchParams.get('state');
        let state = {};
        try {
            if (stateParam) state = JSON.parse(stateParam);
        } catch (e) {
            // ignore
        }

        const targetOrgId = state.organizationId || '5db477f6-c893-4ec4-9123-b12160224f70'; // Test Corp fallback

        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // We use 'upsert' assuming verification logic usually prevents duplicates, 
        // but since unique constraint is (organization_id, provider), this is safe.
        // Wait, init_schema calls it (organization_id, provider) ? No, schema says unique(organization_id, provider) ? 
        // Let's check schema: unqiue(integration_id, external_id) is monitored_resources.
        // integrations table doesn't have a unique constraint on (org, provider) in init_schema.sql provided earlier! 
        // It has unique on ID. 
        // I will assume for now we want to UPDATE if one exists for this provider, but without constraint it might dupe.
        // I will check if one exists first.

        const { data: existingInt } = await supabase.from('integrations')
            .select('id')
            .eq('organization_id', targetOrgId)
            .eq('provider', 'slack')
            .single();

        if (existingInt) {
            await supabase.from('integrations').update({
                settings: { bot_token: data.access_token, team_id: data.team.id },
                name: data.team.name,
                external_id: data.team.id
            }).eq('id', existingInt.id);
        } else {
            await supabase.from('integrations').insert({
                organization_id: TEST_ORG_ID,
                provider: 'slack',
                name: data.team.name,
                external_id: data.team.id,
                settings: { bot_token: data.access_token, team_id: data.team.id }
            });
        }

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?connected=true&app=slack`);

    } catch (err) {
        console.error('OAuth Exception:', err);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=server_error`);
    }
}
