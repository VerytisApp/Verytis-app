import { createAdminClient } from './supabase/admin';
import { getValidGitHubToken } from './github/tokens';

/**
 * Unified utility to get a valid access token for any provider.
 * Handles both 'integrations' (team) and 'user_connections' (team/personal) tables.
 * Implements automatic refresh for GitHub.
 */
export async function getValidToken(provider, connectionType, { userId = null, organizationId = null, forceRefresh = false } = {}) {
    const supabase = createAdminClient();
    let token = null;
    let record = null;
    let table = 'user_connections';

    console.log(`[AUTH-UTIL] Getting token for ${provider} | Type: ${connectionType} | Org: ${organizationId} | User: ${userId}`);

    // 1. Try user_connections first as it's the modern centralized table
    const query = supabase.from('user_connections')
        .select('*')
        .eq('provider', provider)
        .eq('connection_type', connectionType);
    
    if (connectionType === 'personal') {
        if (!userId) throw new Error('userId is required for personal connections');
        query.eq('user_id', userId);
    } else {
        if (!organizationId) throw new Error('organizationId is required for team connections');
        query.eq('organization_id', organizationId);
    }

    const { data: connection } = await query.maybeSingle();
    
    if (connection) {
        record = connection;
        token = connection.access_token;
    } 

    // 2. Fallback to legacy 'integrations' table (only if still no token)
    if (!token && connectionType === 'team' && organizationId) {
        const { data: legacyInteg } = await supabase.from('integrations')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('provider', provider)
            .maybeSingle();
        
        if (legacyInteg) {
            table = 'integrations';
            record = legacyInteg;
            token = legacyInteg.settings?.access_token || legacyInteg.settings?.token || legacyInteg.settings?.bot_token || legacyInteg.settings?.api_token;
        }
    }

    // 3. Provider-specific logic (GitHub: handle App installations + refresh)
    if (provider === 'github') {
        const metadata = table === 'integrations' ? record.settings : record.metadata;

        // CASE 1: GitHub App installation with no stored access_token
        if (!token && metadata?.installation_id && connectionType === 'team') {
            console.log('[AUTH-UTIL] Using GitHub App installation flow for team connection');
            try {
                const appToken = await getValidGitHubToken({
                    connectionId: record.id,
                    organizationId,
                    type: connectionType,
                });
                if (appToken) {
                    return { token: appToken, metadata, id: record.id };
                }
            } catch (e) {
                console.error('[AUTH-UTIL] Failed to get installation token for GitHub App:', e.message);
            }
        }

        if (!token) {
            console.warn(`[AUTH-UTIL] No token found for ${provider} after installation/token attempts`);
            return { token: null, metadata: metadata || {}, id: record?.id || null };
        }
        const { refresh_token, created_at, expires_in } = metadata || {};

        const now = Math.floor(Date.now() / 1000);
        const expiresAt = (created_at || 0) + (expires_in || 0);
        const buffer = 300; // 5 minutes
        const isExpired = created_at && now >= (expiresAt - buffer);

        // Only refresh if we have a valid created_at and it's actually expired, or if forceRefresh is true
        if (refresh_token && (isExpired || forceRefresh)) {
            console.log(`[AUTH-UTIL] GitHub token for ${record.id} is ${isExpired ? 'expired' : 'being force refreshed'}. Refreshing...`);
            try {
                const response = await fetch('https://github.com/login/oauth/access_token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        client_id: process.env.GITHUB_CLIENT_ID,
                        client_secret: process.env.GITHUB_CLIENT_SECRET,
                        grant_type: 'refresh_token',
                        refresh_token: refresh_token
                    })
                });

                const data = await response.json();
                if (data.access_token) {
                    const updateData = {
                        access_token: data.access_token,
                        refresh_token: data.refresh_token,
                        expires_in: data.expires_in,
                        refresh_token_expires_in: data.refresh_token_expires_in,
                        created_at: Math.floor(Date.now() / 1000)
                    };

                    if (table === 'integrations') {
                        await supabase.from('integrations').update({ settings: { ...record.settings, ...updateData } }).eq('id', record.id);
                    } else {
                        await supabase.from('user_connections').update({ access_token: data.access_token, metadata: { ...record.metadata, ...updateData } }).eq('id', record.id);
                    }
                    return { 
                        token: data.access_token, 
                        metadata: { ...(table === 'integrations' ? record.settings : record.metadata), ...updateData },
                        id: record.id
                    };
                }
            } catch (e) {
                console.error('[AUTH-UTIL] GitHub refresh failed:', e.message);
            }
        }
    } else if (!token || !record) {
        console.warn(`[AUTH-UTIL] No token found for ${provider} after all attempts`);
        return { token: null, metadata: {}, id: null };
    }

    return { 
        token, 
        metadata: table === 'integrations' ? record.settings : record.metadata,
        id: record.id
    };
}
