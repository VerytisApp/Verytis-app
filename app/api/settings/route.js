import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

const OAUTH_PROVIDERS = ['github', 'slack', 'trello'];

export async function GET(req) {
    try {
        const supabase = createClient();
        console.log('[API SETTINGS] GET request initiated');

        // 1. Verify user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.warn('[API SETTINGS] Unauthorized');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.log('[API SETTINGS] User verified:', user.id);

        // 2. Fetch profile and organization data
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .maybeSingle();

        if (profileError) console.error('[API SETTINGS] Profile fetch error:', profileError);

        let orgName = 'Organisation';
        if (profile?.organization_id) {
            const { data: orgData } = await supabase
                .from('organizations')
                .select('name')
                .eq('id', profile.organization_id)
                .maybeSingle();
            if (orgData) orgName = orgData.name;
        }
        console.log('[API SETTINGS] Org Context:', { orgId: profile?.organization_id, orgName });

        // 3. Fetch connections (Self Personal + Org Team)
        let personalConnections = [];
        let teamConnections = [];

        // 3a. Personal connections
        const { data: pData, error: pError } = await supabase
            .from('user_connections')
            .select('*')
            .eq('user_id', user.id)
            .eq('connection_type', 'personal');
        
        if (pError) console.error('[API SETTINGS] Error fetching personal connections:', pError.message);
        else personalConnections = pData || [];

        // 3b. Team connections (Query by org_id if exists)
        if (profile?.organization_id) {
            const { data: tData, error: tError } = await supabase
                .from('user_connections')
                .select('*')
                .eq('organization_id', profile.organization_id)
                .eq('connection_type', 'team');
            if (tError) console.error('[API SETTINGS] Error fetching team connections:', tError.message);
            else teamConnections = tData || [];
        }

        const connections = [...personalConnections, ...teamConnections];
        
        // 3c. Legacy integrations table (important for GitHub/Slack Team)
        if (profile?.organization_id) {
            const { data: iData } = await supabase
                .from('integrations')
                .select('provider, settings')
                .eq('organization_id', profile.organization_id);
            
            if (iData) {
                iData.forEach(item => {
                    // Check if already in connections to avoid duplicates
                    if (!connections.some(c => c.provider === item.provider && c.connection_type === 'team')) {
                        connections.push({
                            provider: item.provider,
                            connection_type: 'team',
                            metadata: item.settings,
                            account_name: item.settings?.team_name || item.settings?.account_name || 'Team Integration'
                        });
                    }
                });
            }
        }

        console.log('[API SETTINGS] Connections found:', connections.length);

        // 4. Fetch organization settings (for LLM providers)
        const { data: settingsData, error: settingsError } = await supabase
            .from('organization_settings')
            .select('*')
            .eq('id', 'default')
            .maybeSingle();
        
        if (settingsError) console.error('[API SETTINGS] Settings fetch error:', settingsError);
        const settings = settingsData || {};

        const DEFAULT_PROVIDERS = [
            { id: 'openai', name: 'OpenAI', domain: 'openai.com', status: 'Not Configured', tokenPreview: '' },
            { id: 'anthropic', name: 'Anthropic Claude', domain: 'anthropic.com', status: 'Not Configured', tokenPreview: '' },
            { id: 'google', name: 'Google Gemini', domain: 'gemini.google.com', status: 'Not Configured', tokenPreview: '' },
            { id: 'github', name: 'GitHub', domain: 'github.com', status: 'Not Configured', tokenPreview: '' },
            { id: 'slack', name: 'Slack', domain: 'slack.com', status: 'Not Configured', tokenPreview: '' },
            { id: 'trello', name: 'Trello', domain: 'trello.com', status: 'Not Configured', tokenPreview: '' },
        ];

        const catalog = [];

        // 5a. Add LLM Providers (from settings.providers)
        (settings?.providers || []).forEach(p => {
            const { encryptedToken, ...rest } = p;
            const meta = DEFAULT_PROVIDERS.find(d => d.id === p.id) || {};
            catalog.push({ 
                ...meta, 
                ...rest, 
                status: 'Connected', 
                connection_type: 'llm' 
            });
        });

        // 5b. Add OAuth Connections (from user_connections)
        connections.forEach(c => {
            const meta = DEFAULT_PROVIDERS.find(d => d.id === c.provider) || {};
            catalog.push({
                ...meta,
                id: c.provider,
                account_name: c.account_name || c.external_account_name,
                connection_type: c.connection_type,
                status: 'Connected',
                is_oauth: true
            });
        });

        // 5c. Add Default Providers (Placeholders for not-configured apps)
        DEFAULT_PROVIDERS.forEach(dp => {
            // Only add if not already present in some form
            if (!catalog.some(c => c.id === dp.id)) {
                catalog.push({ ...dp, status: 'Not Configured' });
            }
        });

        console.log('[API SETTINGS] Unified catalog size:', catalog.length);

        const orgIntegrations = (teamConnections || []).map(c => ({
            id: c.provider,
            account_name: c.account_name || c.external_account_name || orgName,
            is_oauth: true,
            is_perso: false
        }));

        const personalIntegrations = (personalConnections || []).map(c => ({
            id: c.provider,
            account_name: c.account_name || c.external_account_name || user.email,
            is_oauth: true,
            is_perso: true
        }));

        // 5a. LLM Providers (from organization_settings)
        const llmCatalog = (settings?.providers || []).map(p => ({
            ...p,
            id: p.id,
            provider: p.id,
            connection_type: 'llm',
            status: p.status || 'Connected',
            account_name: 'Team Key',
            tokenPreview: p.tokenPreview || '...'
        })).map(({ encryptedToken, rawToken, ...rest }) => rest);

        // 5b. OAuth Connections (only from user_connections)
        const oauthCatalog = connections.map(c => ({
            id: c.provider,
            provider: c.provider,
            connection_type: c.connection_type,
            status: 'Connected',
            account_name: c.account_name,
            metadata: c.metadata // Expose metadata for specific tool links
        }));

        const finalProviders = [...llmCatalog, ...oauthCatalog];

        console.log('[API SETTINGS] Final Providers count:', finalProviders.length);

        return NextResponse.json({ 
            providers: finalProviders,
            // Compatibility: some UI components still expect `user_connections`
            user_connections: connections,
            settings: settingsData,
            user: {
                id: user.id,
                email: user.email
            }
        });

    } catch (error) {
        console.error('[API SETTINGS] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
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
        // IMPORTANT: Only save LLM providers into the global organization_settings.
        // OAuth providers are handled separately in the user_connections table.
        if (updateData.providers && Array.isArray(updateData.providers)) {
            updateData.providers = updateData.providers
                .filter(p => !p.is_oauth && (p.connection_type === 'llm' || p.id === 'openai' || p.id === 'anthropic' || p.id === 'google'))
                .map(p => {
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
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (type === 'llm') {
            // Handle LLM/Custom Providers (Team managed in organization_settings)
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
        } else {
            // Security: Only Admins can delete 'team' connections
            const { data: userProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (type.toLowerCase() === 'team' && userProfile?.role !== 'Admin') {
                return NextResponse.json({ error: 'Permission denied: Only Admins can disconnect Team integrations' }, { status: 403 });
            }

            // Handle OAuth Connections (Team or Personal in user_connections)
            console.log(`[API SETTINGS DELETE] Removing ${type.toUpperCase()} ${providerId} for user ${user.id}`);
            
            const { error: delError } = await supabase
                .from('user_connections')
                .delete()
                .match({ 
                    user_id: user.id,
                    provider: providerId.toLowerCase(),
                    connection_type: type.toLowerCase()
                });
            
            if (delError) {
                console.error(`[API SETTINGS DELETE] Error:`, delError.message);
                throw delError;
            }
        }

        // AGGRESSIVE CLEANUP: Also search and destroy in organization_settings.providers 
        // to prevent ghost records in the main list.
        const { data: ghostSettings } = await supabase
            .from('organization_settings')
            .select('providers')
            .eq('id', 'default')
            .single();

        if (ghostSettings?.providers) {
            const updatedProviders = ghostSettings.providers.filter(p => p.id !== providerId);
            if (updatedProviders.length !== ghostSettings.providers.length) {
                await supabase
                    .from('organization_settings')
                    .update({ providers: updatedProviders })
                    .eq('id', 'default');
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Unexpected error in settings API DELETE:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
