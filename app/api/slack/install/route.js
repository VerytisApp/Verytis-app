import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

export async function GET(req) {
    if (!process.env.SLACK_CLIENT_ID) {
        return NextResponse.json({ error: 'SLACK_CLIENT_ID is not defined in environment variables' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    let organizationId = searchParams.get('organizationId');
    const teamId = searchParams.get('teamId');

    // Resolve Org ID from Team ID if needed
    if (!organizationId && teamId) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        const { data } = await supabase.from('teams').select('organization_id').eq('id', teamId).single();
        if (data) organizationId = data.organization_id;
    }

    const scopes = [
        'channels:history', 'channels:read', 'chat:write', 'files:read',
        'groups:history', 'groups:read', 'reactions:read',
        'users:read', 'users:read.email'
    ].join(',');

    const state = JSON.stringify({
        organizationId: organizationId || '5db477f6-c893-4ec4-9123-b12160224f70'
    });

    const installUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL}/api/slack/callback&state=${encodeURIComponent(state)}`;

    return NextResponse.redirect(installUrl);
}
