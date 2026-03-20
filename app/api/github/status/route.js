import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidGitHubToken } from '@/lib/github';

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

    // Unified connection search (prioritize team level)
    const { data: conn } = await supabase
        .from('user_connections')
        .select('id, access_token, metadata, account_name, external_account_name, created_at')
        .eq('organization_id', targetOrgId)
        .eq('provider', 'github')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Legacy org integration fallback
    let legacyTeam = null;
    if (!conn) {
        const { data: legacy } = await supabase
            .from('integrations')
            .select('provider, settings')
            .eq('organization_id', targetOrgId)
            .eq('provider', 'github')
            .maybeSingle();
        legacyTeam = legacy || null;
    }

    const isConnected = !!(conn && (conn.access_token || conn.metadata?.installation_id))
        || !!(legacyTeam && (legacyTeam.settings?.access_token || legacyTeam.settings?.installation_id));

    const accountName =
        conn?.account_name ||
        conn?.external_account_name ||
        legacyTeam?.settings?.account_name ||
        legacyTeam?.settings?.organization_name ||
        null;

    return NextResponse.json({
        connected: isConnected,
        username: accountName,
        account_name: accountName,
        connection_type: 'team',
        lastSync: isConnected ? new Date().toISOString() : null
    });
}
