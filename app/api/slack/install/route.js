import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

export async function GET(req) {
    if (!process.env.SLACK_CLIENT_ID) {
        return NextResponse.json({ error: 'SLACK_CLIENT_ID is not defined in environment variables' }, { status: 500 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'integration';
    const organizationId = profile?.organization_id;

    const scopes = [
        'chat:write', 'channels:read', 'groups:read', 
        'reactions:write', 'users:read'
    ].join(',');

    const state = JSON.stringify({
        organizationId: organizationId,
        userId: userId || user.id,
        type: type
    });

    const installUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL}/api/slack/callback&state=${encodeURIComponent(state)}`;

    return NextResponse.redirect(installUrl);
}
