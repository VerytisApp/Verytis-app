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
                    window.opener.postMessage({ type: 'YOUTUBE_ERROR', error: 'Missing code or state' }, '*');
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
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`,
                grant_type: 'authorization_code'
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('[YOUTUBE CALLBACK] Token exchange failed:', tokenData);
            const errorMsg = tokenData.error_description || 'Token exchange failed';
            const html = `
                <!DOCTYPE html>
                <html><body>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({ type: 'YOUTUBE_ERROR', error: '${errorMsg.replace(/'/g, "\\'")}' }, '*');
                        window.close();
                    } else {
                        window.location.href = '/?error=${errorMsg}';
                    }
                </script>
                </body></html>
            `;
            return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
        }

        // Fetch user info (email)
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        const userData = await userResponse.json();

        // Fetch YouTube channel info
        let channelName = userData.email || 'YouTube Account';
        try {
            const ytResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
            });
            const ytData = await ytResponse.json();
            if (ytData.items && ytData.items.length > 0) {
                channelName = ytData.items[0].snippet.title || channelName;
            }
        } catch (ytErr) {
            console.warn('[YOUTUBE CALLBACK] Could not fetch channel info:', ytErr.message);
        }

        const expiresAt = Math.floor(Date.now() / 1000) + tokenData.expires_in;

        // Save to user_connections
        const supabase = createAdminClient();
        const { data: existing } = await supabase
            .from('user_connections')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('provider', 'youtube')
            .maybeSingle();

        const connectionData = {
            organization_id: organizationId,
            user_id: userId,
            provider: 'youtube',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            account_name: channelName,
            connection_type: 'team',
            scope: 'team',
            metadata: {
                expires_in: tokenData.expires_in,
                expires_at: expiresAt,
                email: userData.email,
                picture: userData.picture,
                channel_name: channelName,
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
            console.error('[YOUTUBE CALLBACK] DB Error:', upsertError);
            throw upsertError;
        }

        // Redirect with postMessage script for better builder integration
        const html = `
            <!DOCTYPE html>
            <html><body>
            <script>
                if (window.opener) {
                    window.opener.postMessage({ type: 'YOUTUBE_CONNECTED' }, '*');
                    window.close();
                } else {
                    window.location.href = '/settings';
                }
            </script>
            </body></html>
        `;
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });

    } catch (err) {
        console.error('[YOUTUBE CALLBACK] Unexpected Error:', err);
        const errorMsg = err.message || 'unknown_youtube_error';
        const html = `
            <!DOCTYPE html>
            <html><body>
            <script>
                if (window.opener) {
                    window.opener.postMessage({ type: 'YOUTUBE_ERROR', error: '${errorMsg.replace(/'/g, "\\'")}' }, '*');
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
