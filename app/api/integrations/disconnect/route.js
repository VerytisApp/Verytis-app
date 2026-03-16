import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/integrations/disconnect
 * Granular disconnection of integrations (Team vs Personal)
 * Payload: { appName: string, connectionType: 'team' | 'personal' }
 */
export async function POST(req) {
    try {
        const supabase = createClient();
        const { appName, connectionType } = await req.json();

        if (!appName || !connectionType) {
            return NextResponse.json({ error: 'Missing appName or connectionType' }, { status: 400 });
        }

        // 1. Verify user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`[API DISCONNECT] App: ${appName}, Type: ${connectionType}, User: ${user.id}`);

        // Security: Only Admins/Managers can delete 'team' connections
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('role, organization_id')
            .eq('id', user.id)
            .single();

        const userRole = userProfile?.role?.toLowerCase();
        if (connectionType.toLowerCase() === 'team' && userRole !== 'admin' && userRole !== 'manager') {
            return NextResponse.json({ 
                error: 'Permission denied: Only Admins can disconnect Team integrations' 
            }, { status: 403 });
        }

        // 2. Fetch connection details BEFORE deletion to revoke token if necessary
        let connectionToRevoke = null;
        if (appName.toLowerCase() === 'slack') {
            const fetchQuery = supabase.from('user_connections').select('access_token');
            if (connectionType.toLowerCase() === 'team') {
                fetchQuery.match({
                    organization_id: userProfile.organization_id,
                    provider: 'slack',
                    connection_type: 'team'
                });
            } else {
                fetchQuery.match({
                    user_id: user.id,
                    provider: 'slack',
                    connection_type: 'personal'
                });
            }
            const { data: connData } = await fetchQuery.single();
            connectionToRevoke = connData;
        }

        // Revoke Slack Token if found
        if (connectionToRevoke?.access_token) {
            try {
                console.log(`[API DISCONNECT] Revoking Slack token for ${connectionType}...`);
                const revokeRes = await fetch('https://slack.com/api/auth.revoke', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${connectionToRevoke.access_token}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                const revokeData = await revokeRes.json();
                console.log(`[API DISCONNECT] Slack Revocation Result:`, revokeData.ok ? 'SUCCESS' : `FAILED (${revokeData.error})`);
            } catch (revErr) {
                console.error('[API DISCONNECT] Slack Revocation Error:', revErr);
                // We continue even if revocation fails to ensure local cleanup
            }
        }

        // 3. Targeted deletion in the centralized table
        const query = supabase.from('user_connections').delete();

        if (connectionType.toLowerCase() === 'team') {
            // Team disconnect removes it for the WHOLE organization
            if (!userProfile?.organization_id) throw new Error('User has no organization');
            
            query.match({
                organization_id: userProfile.organization_id,
                provider: appName.toLowerCase(),
                connection_type: 'team'
            });
            console.log(`[API DISCONNECT] Org-wide removal for ${appName}`);
        } else {
            // Personal disconnect only for THIS user
            query.match({ 
                user_id: user.id,
                provider: appName.toLowerCase(),
                connection_type: 'personal'
            });
        }

        const { error: delError } = await query;
        
        if (delError) {
            console.error('[API DISCONNECT] Table delete error:', delError.message);
            throw delError;
        }

        // 3. Cleanup: Remove from organization_settings.providers (Ghosts)
        const { data: orgSettings } = await supabase
            .from('organization_settings')
            .select('providers')
            .eq('id', 'default')
            .single();

        if (orgSettings?.providers) {
            const updatedProviders = orgSettings.providers.filter(p => p.id !== appName.toLowerCase());
            if (updatedProviders.length !== orgSettings.providers.length) {
                console.log(`[API DISCONNECT] Cleaning up ghost record for ${appName} in org_settings`);
                await supabase
                    .from('organization_settings')
                    .update({ providers: updatedProviders })
                    .eq('id', 'default');
            }
        }

        return NextResponse.json({ success: true, app: appName, type: connectionType });

    } catch (error) {
        console.error('Unexpected error in disconnect API:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
