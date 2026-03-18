import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidGitHubToken } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    // Optional: allow UI to ask explicitly for team/personal
    const requestedType = (searchParams.get('type') || 'team').toLowerCase();

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const targetOrgId = profile.organization_id;

    // Team connection (preferred source: user_connections)
    const { data: teamConn } = await supabase
        .from('user_connections')
        .select('id, access_token, metadata, account_name, external_account_name, created_at')
        .eq('organization_id', targetOrgId)
        .eq('provider', 'github')
        .eq('connection_type', 'team')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Personal connection
    const { data: personalConn } = await supabase
        .from('user_connections')
        .select('id, access_token, metadata, account_name, external_account_name, created_at')
        .eq('user_id', user.id)
        .eq('provider', 'github')
        .eq('connection_type', 'personal')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Legacy org integration fallback (some older installs store settings in integrations)
    let legacyTeam = null;
    if (!teamConn) {
        const { data: legacy } = await supabase
            .from('integrations')
            .select('provider, settings')
            .eq('organization_id', targetOrgId)
            .eq('provider', 'github')
            .maybeSingle();
        legacyTeam = legacy || null;
    }

    const teamConnected = !!(teamConn && (teamConn.access_token || teamConn.metadata?.installation_id))
        || !!(legacyTeam && (legacyTeam.settings?.access_token || legacyTeam.settings?.installation_id));
    const personalConnected = !!(personalConn && (personalConn.access_token || personalConn.metadata?.installation_id));

    const teamName =
        teamConn?.account_name ||
        teamConn?.external_account_name ||
        legacyTeam?.settings?.team_name ||
        legacyTeam?.settings?.account_name ||
        null;
    const personalName = personalConn?.account_name || personalConn?.external_account_name || null;

    const selected =
        requestedType === 'personal'
            ? { connected: personalConnected, username: personalName, connection_type: 'personal' }
            : { connected: teamConnected, username: teamName, connection_type: 'team' };

    return NextResponse.json({
        ...selected,
        // Extra fields for newer UIs (non-breaking)
        team: { connected: teamConnected, username: teamName },
        personal: { connected: personalConnected, username: personalName },
        lastSync: selected.connected ? new Date().toISOString() : null
    });
}
