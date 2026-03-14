import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

const OAUTH_PROVIDERS = ['github', 'slack', 'trello'];

export async function GET(req) {
    try {
        const supabase = createClient();

        // 1. Verify user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch the default organization settings
        const { data: settings, error: fetchError } = await supabase
            .from('organization_settings')
            .select('*')
            .eq('id', 'default')
            .maybeSingle();

        // 2b. Fetch account integrations (OAuth) & Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, social_profiles')
            .eq('id', user.id)
            .single();

        // 2a. Fetch Organization name
        let orgName = 'Organisation';
        if (profile?.organization_id) {
            const { data: orgData } = await supabase
                .from('organizations')
                .select('name')
                .eq('id', profile.organization_id)
                .single();
            if (orgData) orgName = orgData.name;
        }

        // Filter helper to remove MSTeams
        const isTeams = (item) => 
            item.id?.toLowerCase().includes('teams') || 
            item.name?.toLowerCase().includes('teams') || 
            item.provider?.toLowerCase().includes('teams');

        let orgIntegrations = [];
        if (profile?.organization_id) {
            const { data: intData } = await supabase
                .from('integrations')
                .select('id, provider, name, settings')
                .eq('organization_id', profile.organization_id);
            
            if (intData) {
                orgIntegrations = intData
                    .filter(i => !isTeams(i))
                    .map(i => ({
                        id: i.provider,
                        name: i.provider === 'github' ? 'GitHub' : 
                              i.provider === 'slack' ? 'Slack' : 
                              i.provider === 'trello' ? 'Trello' : 
                              (i.name || i.provider),
                        domain: i.provider === 'github' ? 'github.com' : i.provider === 'slack' ? 'slack.com' : i.provider === 'trello' ? 'trello.com' : 'example.com',
                        status: 'Connected',
                        is_oauth: true,
                        is_perso: false,
                        accountName: orgName
                    }));
            }
        }

        // 2c. Fetch Personal integrations from connections (for email/name)
        const { data: userConnections } = await supabase
            .from('connections')
            .select('provider, email, metadata')
            .eq('user_id', user.id);

        let personalIntegrations = [];
        if (profile?.social_profiles) {
            personalIntegrations = Object.keys(profile.social_profiles)
                .filter(provider => !provider.toLowerCase().includes('teams'))
                .map(provider => {
                    const conn = userConnections?.find(c => c.provider === provider);
                    return {
                        id: provider,
                        name: provider === 'github' ? 'GitHub' : 
                              provider === 'slack' ? 'Slack' : 
                              provider === 'trello' ? 'Trello' : 
                              (provider.charAt(0).toUpperCase() + provider.slice(1)),
                        domain: provider === 'github' ? 'github.com' : provider === 'slack' ? 'slack.com' : provider === 'trello' ? 'trello.com' : 'example.com',
                        status: 'Connected',
                        is_oauth: true,
                        is_perso: true,
                        accountName: conn?.email || user.email
                    };
                });
        }

        // 3. Scrub sensitive encrypted tokens & Filter unwanted providers
        if (settings && settings.providers && Array.isArray(settings.providers)) {
            settings.providers = settings.providers
                .filter(p => !isTeams(p) && !OAUTH_PROVIDERS.includes(p.id))
                .map(p => {
                    const { encryptedToken, ...rest } = p;
                    return { ...rest, is_org: true }; 
                });
        }

        // 4. Combine everything
        // We do NOT deduplicate by ID here because we want to show BOTH Org and Perso connections
        // for the same provider (GitHub, Slack, etc.) in the UI.
        const combinedProviders = [
            ...orgIntegrations,
            ...personalIntegrations,
            ...(settings?.providers || [])
        ];

        return NextResponse.json({ 
            settings: { 
                ...(settings || {}), 
                providers: combinedProviders 
            }, 
            user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email?.split('@')[0]
            }
        });

    } catch (error) {
        console.error('Unexpected error in settings API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const supabase = createClient();
        const body = await req.json();

        // 1. Verify user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. We could verify Admin role here on server-side as well,
        // though RLS handle it at the database layer.

        // Remove id and updated_at from the payload if present
        const { id, updated_at, ...updateData } = body;

        // 3. Encrypt sensitive provider LLM tokens via AES-256-GCM
        if (updateData.providers && Array.isArray(updateData.providers)) {
            updateData.providers = updateData.providers.map(p => {
                if (p.rawToken) {
                    p.encryptedToken = encrypt(p.rawToken);
                    delete p.rawToken;
                }
                return p;
            });
        }

        // 4. Update the global settings
        const { data, error: updateError } = await supabase
            .from('organization_settings')
            .update(updateData)
            .eq('id', 'default')
            .select()
            .single();

        if (updateError) {
            console.error('Error updating org settings:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, settings: data });

    } catch (error) {
        console.error('Unexpected error in settings API PUT:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const supabase = createClient();
        
        // Support both query params and body for maximum compatibility
        const { searchParams } = new URL(req.url);
        let providerId = searchParams.get('id');
        let type = searchParams.get('type') || 'llm';

        try {
            const body = await req.json();
            if (body.id) providerId = body.id;
            if (body.type) type = body.type;
        } catch (e) {
            // No body or invalid body, fall back to query params
        }

        if (!providerId) {
            return NextResponse.json({ error: 'Missing provider ID' }, { status: 400 });
        }

        // 1. Verify user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch profile for organization context
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, social_profiles')
            .eq('id', user.id)
            .single();

        if (type === 'llm') {
            // Handle LLM/Custom Providers
            const { data: settings } = await supabase
                .from('organization_settings')
                .select('providers')
                .eq('id', 'default')
                .single();

            if (settings?.providers) {
                const updatedProviders = settings.providers.filter(p => p.id !== providerId);
                const { error: llmErr } = await supabase
                    .from('organization_settings')
                    .update({ providers: updatedProviders })
                    .eq('id', 'default');
                if (llmErr) throw llmErr;
            }
        } else if (type === 'team') {
            // Handle Team OAuth Connections
            console.log(`[API DELETE] Removing TEAM ${providerId} for org ${profile?.organization_id}`);
            if (!profile?.organization_id) return NextResponse.json({ error: 'No organization context found' }, { status: 400 });

            const { error: delError } = await supabase
                .from('integrations')
                .delete()
                .eq('organization_id', profile.organization_id)
                .eq('provider', providerId);
            
            if (delError) {
                console.error(`[API DELETE] Integrations table delete error:`, delError);
                throw delError;
            }
            console.log(`[API DELETE] TEAM ${providerId} removed successfully`);
        } else if (type === 'personal') {
            // Handle Personal OAuth Connections
            console.log(`[API DELETE] Removing PERSONAL ${providerId} for user ${user.id}`);
            // a. Remove from profile json
            const currentSocials = profile?.social_profiles || {};
            const { [providerId]: removed, ...updatedSocials } = currentSocials;
            
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ social_profiles: updatedSocials })
                .eq('id', user.id);
            
            if (profileError) {
                console.error(`[API DELETE] Profile update error:`, profileError);
                throw profileError;
            }

            // b. Delete from connections table (accountName mapping)
            const { error: connError } = await supabase
                .from('connections')
                .delete()
                .eq('user_id', user.id)
                .eq('provider', providerId);
            
            if (connError) {
                console.warn(`[API DELETE] Connections table delete warn:`, connError.message);
            }
            console.log(`[API DELETE] PERSONAL ${providerId} removed successfully`);
        }

        // AGGRESSIVE CLEANUP: Also search and destroy in organization_settings.providers 
        // regardless of type, just in case of ghost records.
        const { data: ghostSettings } = await supabase
            .from('organization_settings')
            .select('providers')
            .eq('id', 'default')
            .single();

        if (ghostSettings?.providers) {
            const updatedProviders = ghostSettings.providers.filter(p => p.id !== providerId);
            if (updatedProviders.length !== ghostSettings.providers.length) {
                console.log(`[API DELETE] Cleaning up ghost record for ${providerId} in org_settings`);
                const { error: ghostErr } = await supabase
                    .from('organization_settings')
                    .update({ providers: updatedProviders })
                    .eq('id', 'default');
                if (ghostErr) console.warn('[API DELETE] Ghost cleanup failed (RLS?):', ghostErr.message);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Unexpected error in settings API DELETE:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
