import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const targetOrgId = profile.organization_id;

    // 2. Check for unified connection in 'user_connections'
    const { data } = await supabase.from('user_connections')
        .select('id, access_token, account_name, metadata')
        .eq('organization_id', targetOrgId)
        .eq('provider', 'trello')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    const isConnected = !!(data && data.access_token);
    let workspaceName = data?.account_name || 'Trello Workspace';

    return NextResponse.json({
        connected: isConnected,
        username: workspaceName,
        account_name: workspaceName,
        connection_type: 'team',
        lastSync: isConnected ? new Date().toISOString() : null
    });
}
