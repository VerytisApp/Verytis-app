import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const encodedState = searchParams.get('state');

    if (!code || !encodedState) {
        const html = `
            <!DOCTYPE html>
            <html><body>
            <script>
                if (window.opener) {
                    window.opener.postMessage({ type: 'STREAMLABS_ERROR', error: 'Missing code or state' }, '*');
                    window.close();
                } else {
                    window.location.href = '/?error=missing_params';
                }
            </script>
            </body></html>
        `;
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
    }

    try {
        const stateStr = Buffer.from(encodedState, 'base64').toString();
        const state = JSON.parse(stateStr);
        const { userId, organizationId } = state;

        // Exchange code for tokens
        const tokenResponse = await fetch('https://streamlabs.com/api/v2.0/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: process.env.STREAMLABS_CLIENT_ID,
                client_secret: process.env.STREAMLABS_CLIENT_SECRET,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/streamlabs/callback`,
                code
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('[STREAMLABS CALLBACK] Token exchange failed:', tokenData);
            const errorMsg = tokenData.error_description || tokenData.error || 'Token exchange failed';
            const html = `
                <!DOCTYPE html>
                <html><body>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({ type: 'STREAMLABS_ERROR', error: '${errorMsg.replace(/'/g, "\\'")}' }, '*');
                        window.close();
                    } else {
                        window.location.href = '/?error=${errorMsg}';
                    }
                </script>
                </body></html>
            `;
            return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
        }

        // Fetch Streamlabs user info
        let accountName = 'Streamlabs Account';
        let streamlabsId = null;
        try {
            const userResponse = await fetch('https://streamlabs.com/api/v2.0/user', {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
            });
            const userData = await userResponse.json();
            console.log('[STREAMLABS CALLBACK] User Data:', JSON.stringify(userData));

            if (userData?.streamlabs) {
                accountName = userData.streamlabs.display_name || userData.streamlabs.username;
                streamlabsId = userData.streamlabs.id;
            } else if (userData?.twitch) {
                accountName = userData.twitch.display_name || userData.twitch.name;
                streamlabsId = userData.twitch.id; // Streamlabs often uses the platform ID as primary user ID
            } else if (userData?.youtube) {
                accountName = userData.youtube.title;
                streamlabsId = userData.youtube.id;
            } else if (userData?.google) {
                accountName = userData.google.title;
                streamlabsId = userData.google.id;
            }
        } catch (userErr) {
            console.warn('[STREAMLABS CALLBACK] Could not fetch user info:', userErr.message);
        }

        const expiresAt = tokenData.expires_in
            ? Math.floor(Date.now() / 1000) + tokenData.expires_in
            : null;

        // Save to user_connections
        const supabase = createAdminClient();
        const { data: existing } = await supabase
            .from('user_connections')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('provider', 'streamlabs')
            .maybeSingle();

        const connectionData = {
            organization_id: organizationId,
            user_id: userId,
            provider: 'streamlabs',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null,
            account_name: accountName,
            connection_type: 'team',
            scope: 'team',
            metadata: {
                streamlabs_id: streamlabsId,
                expires_in: tokenData.expires_in || null,
                expires_at: expiresAt,
                token_type: tokenData.token_type || 'Bearer',
                updated_at: Math.floor(Date.now() / 1000)
            }
        };

        let upsertError = null;
        if (existing) {
            const { error } = await supabase
                .from('user_connections')
                .update(connectionData)
                .eq('id', existing.id);
            upsertError = error;
        } else {
            const { error } = await supabase
                .from('user_connections')
                .insert(connectionData);
            upsertError = error;
        }

        if (upsertError) {
            console.error('[STREAMLABS CALLBACK] DB Error:', upsertError);
            throw upsertError;
        }

        // Redirect with postMessage script for better builder integration
        const html = `
            <!DOCTYPE html>
            <html><body>
            <script>
                if (window.opener) {
                    window.opener.postMessage({ type: 'STREAMLABS_CONNECTED' }, '*');
                    window.close();
                } else {
                    window.location.href = '/settings';
                }
            </script>
            </body></html>
        `;
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });

    } catch (err) {
        console.error('[STREAMLABS CALLBACK] Unexpected Error:', err);
        const errorMsg = err.message || 'unknown_streamlabs_error';
        const html = `
            <!DOCTYPE html>
            <html><body>
            <script>
                if (window.opener) {
                    window.opener.postMessage({ type: 'STREAMLABS_ERROR', error: '${errorMsg.replace(/'/g, "\\'")}' }, '*');
                    window.close();
                } else {
                    window.location.href = '/?error=server_error';
                }
            </script>
            </body></html>
        `;
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
    }
}
