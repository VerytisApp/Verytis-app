import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

/**
 * Generates a JWT for GitHub App Authentication.
 */
function generateGitHubAppJWT() {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY;

    if (!appId || !privateKey) {
        throw new Error('GITHUB_APP_ID or GITHUB_PRIVATE_KEY is missing from environment');
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iat: now - 60, // Issued at (60 seconds ago for safety)
        exp: now + (10 * 60), // Expires in 10 minutes
        iss: appId
    };

    const header = { alg: 'RS256', typ: 'JWT' };
    
    const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    
    const token = `${encode(header)}.${encode(payload)}`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(token);
    const signature = sign.sign(privateKey, 'base64url');

    return `${token}.${signature}`;
}

/**
 * Gets an installation access token for a GitHub App.
 */
async function getInstallationAccessToken(installationId) {
    const jwt = generateGitHubAppJWT();
    
    const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${jwt}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to get installation access token: ${error.message}`);
    }

    const data = await response.json();
    return {
        token: data.token,
        expires_at: data.expires_at
    };
}

/**
 * Refreshes an OAuth access token.
 */
async function refreshOAuthToken(recordId, table, refreshToken, metadata) {
    const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        })
    });

    const data = await response.json();
    if (!data.access_token) {
        throw new Error('Failed to refresh OAuth token');
    }

    const supabase = createAdminClient();
    const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;

    const updateData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        metadata: {
            ...metadata,
            expires_in: data.expires_in,
            expires_at: expiresAt,
            refresh_token_expires_in: data.refresh_token_expires_in,
            created_at: Math.floor(Date.now() / 1000)
        }
    };

    if (table === 'user_connections') {
        const { error } = await supabase
            .from('user_connections')
            .update({
                access_token: updateData.access_token,
                refresh_token: updateData.refresh_token,
                metadata: updateData.metadata
            })
            .eq('id', recordId);
        if (error) throw error;
    } else {
        // Legacy integrations table
        const { error } = await supabase
            .from('integrations')
            .update({
                settings: {
                    ...metadata,
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                    expires_in: data.expires_in,
                    expires_at: expiresAt,
                    created_at: Math.floor(Date.now() / 1000)
                }
            })
            .eq('id', recordId);
        if (error) throw error;
    }

    return data.access_token;
}

/**
 * Garde du Corps: Ensures a valid GitHub token is available.
 */
export async function getValidGitHubToken({ connectionId, organizationId, type = 'team' }) {
    const supabase = createAdminClient();
    let query = supabase.from('user_connections').select('*').eq('provider', 'github');

    if (connectionId) {
        query = query.eq('id', connectionId);
    } else if (organizationId) {
        query = query.eq('organization_id', organizationId).eq('connection_type', type);
    } else {
        throw new Error('Either connectionId or organizationId must be provided');
    }

    const { data: connection, error } = await query.maybeSingle();

    if (error) throw error;
    if (!connection) {
        // Fallback to legacy integrations table if needed, but modern system uses user_connections
        return null;
    }

    const { access_token, refresh_token, metadata } = connection;
    const installationId = metadata?.installation_id;

    // CASE 1: GitHub App (Installation ID) - ALWAYS generate on the fly
    if (installationId) {
        console.log(`[GITHUB HELPER] Using GitHub App Installation: ${installationId}`);
        const { token } = await getInstallationAccessToken(installationId);
        return token;
    }

    // CASE 2: OAuth Token
    const expiresAt = metadata?.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const buffer = 300; // 5 minutes buffer

    if (access_token && expiresAt && now < expiresAt - buffer) {
        console.log('[GITHUB HELPER] Using existing valid OAuth token');
        return access_token;
    }

    // CASE 3: Needs Refresh
    if (refresh_token) {
        console.log('[GITHUB HELPER] OAuth token expired, refreshing...');
        return await refreshOAuthToken(connection.id, 'user_connections', refresh_token, metadata);
    }

    // Fallback: If no token but we have an access_token that MIGHT be old (legacy)
    if (access_token && !expiresAt) {
        console.warn('[GITHUB HELPER] Legacy token without expiration, using as-is');
        return access_token;
    }

    return null;
}
