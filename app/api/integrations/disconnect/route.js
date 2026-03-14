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

        // 2. Fetch profile for organization and social_profiles context
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, social_profiles')
            .eq('id', user.id)
            .single();

        console.log(`[API DISCONNECT] App: ${appName}, Type: ${connectionType}, User: ${user.id}`);

        if (connectionType === 'team') {
            // CASE: Team Integration
            if (!profile?.organization_id) {
                return NextResponse.json({ error: 'No organization context found' }, { status: 400 });
            }

            const { error: delError } = await supabase
                .from('integrations')
                .delete()
                .match({ 
                    organization_id: profile.organization_id, 
                    provider: appName.toLowerCase() 
                });
            
            if (delError) throw delError;
            console.log(`[API DISCONNECT] TEAM ${appName} removed successfully`);

        } else if (connectionType === 'personal') {
            // CASE: Personal Account Connection
            
            // a. Remove from profile.social_profiles (JSONB)
            const currentSocials = profile?.social_profiles || {};
            const providerKey = appName.toLowerCase();
            const { [providerKey]: removed, ...updatedSocials } = currentSocials;
            
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ social_profiles: updatedSocials })
                .eq('id', user.id);
            
            if (profileError) throw profileError;

            // b. Delete from connections table (accountName mapping)
            const { error: connError } = await supabase
                .from('connections')
                .delete()
                .match({ 
                    user_id: user.id, 
                    provider: providerKey 
                });
            
            if (connError) {
                console.warn(`[API DISCONNECT] Connections table delete hint:`, connError.message);
            }
            console.log(`[API DISCONNECT] PERSONAL ${appName} removed successfully`);
        }

        // 3. Aggressive Cleanup: Remove from organization_settings.providers (Ghosts)
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
