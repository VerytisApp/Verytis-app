import { createClient } from '@supabase/supabase-js';

// Re-export constants or types if needed? No, just functions.

/**
 * Ensures a valid GitHub access token is available for the given integration.
 * If the current token is expired and a refresh token exists, it refreshes it.
 * 
 * @param {string} integrationId - The UUID of the integration record
 * @returns {Promise<string|null>} - The valid access token or null if failed
 */
export async function getValidGitHubToken(integrationId) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch current token data
    const { data: integration, error } = await supabase.from('integrations')
        .select('settings')
        .eq('id', integrationId)
        .single();

    if (error || !integration) {
        console.error('GitHub Token Utility: Integration not found', error);
        return null;
    }

    const { access_token, refresh_token, expires_in, created_at } = integration.settings;

    // 2. Check Expiration
    // If we don't have created_at or expires_in, assume valid (legacy) or indefinite? 
    // GitHub tokens usually expire in 8 hours.
    if (!created_at || !expires_in) {
        // Assume valid if we can't check, unless we want to force refresh?
        // Let's return logic to "try using it"
        return access_token;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = created_at + expires_in;
    const buffer = 300; // 5 minutes buffer

    if (now < expiresAt - buffer) {
        return access_token;
    }

    // 3. Refresh Token
    if (!refresh_token) {
        console.warn('GitHub Token Utility: Token expired and no refresh token available.', integrationId);
        return null; // Cannot refresh
    }

    console.log('GitHub Token Utility: Refreshing token for integration', integrationId);

    try {
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
                refresh_token: refresh_token
            })
        });

        const data = await response.json();

        if (data.error || !data.access_token) {
            console.error('GitHub Token Utility: Refresh failed', data);
            return null;
        }

        // 4. Update Database
        const newSettings = {
            ...integration.settings,
            access_token: data.access_token,
            refresh_token: data.refresh_token, // GitHub rotates refresh tokens!
            expires_in: data.expires_in,
            refresh_token_expires_in: data.refresh_token_expires_in,
            created_at: Math.floor(Date.now() / 1000)
        };

        await supabase.from('integrations')
            .update({ settings: newSettings })
            .eq('id', integrationId);

        return data.access_token;

    } catch (e) {
        console.error('GitHub Token Utility: Exception during refresh', e);
        return null; // Failed
    }
}
