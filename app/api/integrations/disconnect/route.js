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
        const supabase = await createClient();
        const { appName } = await req.json();

        if (!appName) {
            return NextResponse.json({ error: 'Missing appName' }, { status: 400 });
        }

        // 1. Verify user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Security: Only Admins/Managers can disconnect Workspace integrations
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('role, organization_id')
            .eq('id', user.id)
            .single();

        const userRole = userProfile?.role?.toLowerCase();
        const isPrivileged = userRole === 'admin' || userRole === 'manager';

        if (!isPrivileged) {
            return NextResponse.json({ 
                error: 'Permission denied: Only Admins or Managers can disconnect Workspace integrations' 
            }, { status: 403 });
        }

        console.log(`[API DISCONNECT] App: ${appName}, Workspace/Org: ${userProfile.organization_id}, User: ${user.id}`);

        // 2. Revoke tokens if necessary (Slack specific)
        if (appName.toLowerCase() === 'slack') {
            const { data: conns } = await supabase
                .from('user_connections')
                .select('access_token')
                .eq('organization_id', userProfile.organization_id)
                .eq('provider', 'slack');

            if (conns && conns.length > 0) {
                for (const conn of conns) {
                    if (conn.access_token) {
                        try {
                            console.log(`[API DISCONNECT] Revoking Slack token...`);
                            await fetch('https://slack.com/api/auth.revoke', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${conn.access_token}`,
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                }
                            });
                        } catch (revErr) { console.error('[API DISCONNECT] Slack Revocation Error:', revErr); }
                    }
                }
            }
        }

        // 3. Delete ALL connections for this provider in THIS organization
        const { error: delError } = await supabase
            .from('user_connections')
            .delete()
            .match({
                organization_id: userProfile.organization_id,
                provider: appName.toLowerCase()
            });
        
        if (delError) {
            console.error('[API DISCONNECT] Table delete error:', delError.message);
            throw delError;
        }

        // 4. Cleanup Ghost records in organization_settings
        try {
            const { data: orgSettings } = await supabase
                .from('organization_settings')
                .select('id, providers')
                .eq('organization_id', userProfile.organization_id)
                .maybeSingle();

            if (orgSettings?.providers) {
                const updatedProviders = orgSettings.providers.filter(p => (p.id || p.provider || '').toLowerCase() !== appName.toLowerCase());
                if (updatedProviders.length !== orgSettings.providers.length) {
                    await supabase
                        .from('organization_settings')
                        .update({ providers: updatedProviders })
                        .eq('id', orgSettings.id);
                }
            }
        } catch (e) {
             console.warn('[API DISCONNECT] Could not cleanup org_settings ghosts:', e.message);
        }

        return NextResponse.json({ success: true, app: appName });

    } catch (error) {
        console.error('Unexpected error in disconnect API:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
