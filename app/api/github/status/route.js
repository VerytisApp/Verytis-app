import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidGitHubToken } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const targetOrgId = profile.organization_id;

    const { data, error } = await supabase.from('user_connections')
        .select('id, access_token, metadata, account_name')
        .eq('organization_id', targetOrgId)
        .eq('provider', 'github')
        .eq('connection_type', 'team')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    const isConnected = !!(data && (data.access_token || data.metadata?.installation_id));

    // Use the account_name settled during callback (resolves to Org or User login)
    const orgName = data?.account_name || null;

    return NextResponse.json({
        connected: isConnected,
        username: orgName,
        lastSync: isConnected ? new Date().toISOString() : null
    });
}
