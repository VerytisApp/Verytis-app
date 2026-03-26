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
                    window.opener.postMessage({ type: 'TIKTOK_ERROR', error: 'Missing code or state' }, '*');
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

        // Exchange code for tokens via TikTok v2 API
        const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: process.env.TIKTOK_CLIENT_KEY,
                client_secret: process.env.TIKTOK_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`,
            }).toString()
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || tokenData.error) {
            console.error('[TIKTOK CALLBACK] Token exchange failed:', tokenData);
            const errorMsg = tokenData.error_description || tokenData.error || 'Token exchange failed';
            const html = `
                <!DOCTYPE html>
                <html><body>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({ type: 'TIKTOK_ERROR', error: '${errorMsg.replace(/'/g, "\\'")}' }, '*');
                        window.close();
                    } else {
                        window.location.href = '/?error=${errorMsg}';
                    }
                </script>
                </body></html>
            `;
            return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
        }

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;
        const expiresIn = tokenData.expires_in;
        const openId = tokenData.open_id;

        // Fetch TikTok user info
        let accountName = 'TikTok Account';
        let avatarUrl = null;
        try {
            const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const userData = await userResponse.json();
            console.log('[TIKTOK CALLBACK] User Data:', JSON.stringify(userData));

            if (userData?.data?.user) {
                accountName = userData.data.user.display_name || accountName;
                avatarUrl = userData.data.user.avatar_url || null;
            }
        } catch (userErr) {
            console.warn('[TIKTOK CALLBACK] Could not fetch user info:', userErr.message);
        }

        const expiresAt = expiresIn
            ? Math.floor(Date.now() / 1000) + expiresIn
            : null;

        // Save to user_connections
        const supabase = createAdminClient();
        const { data: existing } = await supabase
            .from('user_connections')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('provider', 'tiktok')
            .maybeSingle();

        const connectionData = {
            organization_id: organizationId,
            user_id: userId,
            provider: 'tiktok',
            domain: 'tiktok.com',
            access_token: accessToken,
            refresh_token: refreshToken || null,
            account_name: accountName,
            connection_type: 'team',
            scope: 'team',
            metadata: {
                open_id: openId,
                expires_in: expiresIn || null,
                expires_at: expiresAt,
                avatar_url: avatarUrl,
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
            console.error('[TIKTOK CALLBACK] DB Error:', upsertError);
            throw upsertError;
        }

        // Redirect with postMessage script so settings page refreshes
        const html = `
            <!DOCTYPE html>
            <html><body>
            <script>
                if (window.opener) {
                    window.opener.postMessage({ type: 'TIKTOK_CONNECTED' }, '*');
                    window.close();
                } else {
                    window.location.href = '/settings';
                }
            </script>
            </body></html>
        `;
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });

    } catch (err) {
        console.error('[TIKTOK CALLBACK] Unexpected Error:', err);
        const errorMsg = err.message || 'unknown_tiktok_error';
        const html = `
            <!DOCTYPE html>
            <html><body>
            <script>
                if (window.opener) {
                    window.opener.postMessage({ type: 'TIKTOK_ERROR', error: '${errorMsg.replace(/'/g, "\\'")}' }, '*');
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
