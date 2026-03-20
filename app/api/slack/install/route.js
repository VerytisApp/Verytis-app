import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

export async function GET(req) {
    if (!process.env.SLACK_CLIENT_ID) {
        return NextResponse.json({ error: 'SLACK_CLIENT_ID is not defined in environment variables' }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || user.id;
    const organizationId = profile?.organization_id;

    if (!organizationId) {
        return NextResponse.json({ error: 'Organization context required' }, { status: 400 });
    }

    const type = 'integration';
    
    // Always full bot rights for workspace connection
    const botScopes = [
        'chat:write', 'channels:read', 'groups:read', 'im:read', 'mpim:read',
        'reactions:write', 'users:read', 'im:history', 'mpim:history',
        'channels:history', 'groups:history'
    ].join(',');

    const state = JSON.stringify({
        organizationId: organizationId,
        userId: userId || user.id,
        type: type
    });

    // Base URL with bot scopes
    let installUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${botScopes}&redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL}/api/slack/callback&state=${encodeURIComponent(state)}`;


    return NextResponse.redirect(installUrl);
}
