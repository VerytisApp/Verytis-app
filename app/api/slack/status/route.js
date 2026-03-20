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
        .select('id, access_token, account_name')
        .eq('organization_id', targetOrgId)
        .eq('provider', 'slack')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    // 3. Determine status
    const isConnected = !!(data && (data.access_token || data.id));

    return NextResponse.json({
        connected: isConnected,
        username: data?.account_name || null,
        account_name: data?.account_name || null,
        connection_type: 'team',
        lastSync: isConnected ? new Date().toISOString() : null
    });
}
