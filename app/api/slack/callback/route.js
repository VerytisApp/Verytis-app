import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=${error}`);
    }

    if (!code) {
        return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    try {
        // Exchange code for token
        const response = await fetch('https://slack.com/api/oauth.v2.access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.SLACK_CLIENT_ID,
                client_secret: process.env.SLACK_CLIENT_SECRET,
                code: code,
                redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/slack/callback`
            })
        });

        const data = await response.json();

        if (!data.ok) {
            console.error('Slack OAuth Error:', data.error);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=${data.error}`);
        }

        // Supabase Clients
        const supabaseStandard = createClient();
        const { data: { user: sessionUser } } = await supabaseStandard.auth.getUser();

        if (!sessionUser) {
            console.error('❌ [API SLACK] No active session found');
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=unauthorized`);
        }

        // 2. Parse State for context
        const stateParam = searchParams.get('state');
        let state = {};
        try {
            if (stateParam) state = JSON.parse(stateParam);
        } catch (e) {
            console.warn('[API SLACK] Failed to parse state:', e.message);
        }

        const supabase = createAdminClient();
        const isPersonal = state.type === 'user_link' || state.type === 'personal';
        
        let accountName = data.team?.name || 'Slack Workspace';
        let accessToken = data.access_token;
        let slackUserId = data.bot_user_id;

        // "SIGN IN" / PERSONAL IDENTIFICATION LOGIC
        if (isPersonal) {
            // For OAuth v2 with identity scopes, data might contain authed_user or user
            const targetUser = data.authed_user || data.user;
            if (targetUser) {
                accessToken = targetUser.access_token || accessToken;
                slackUserId = targetUser.id;
                
                // Prioritize EMAIL for display name in personal connections
                const email = targetUser.email || (data.user && data.user.email);
                if (email) {
                    accountName = email;
                    console.log('[API SLACK] Personal connection resolved to Email:', email);
                } else {
                    accountName = `User: ${slackUserId} (${data.team?.name || 'Slack'})`;
                    console.log('[API SLACK] Personal connection resolved to ID (Email missing):', slackUserId);
                }
            }
        }

        const connectionData = {
            user_id: sessionUser.id,
            organization_id: state.organizationId || null,
            provider: 'slack',
            connection_type: isPersonal ? 'personal' : 'team',
            account_name: accountName,
            access_token: accessToken,
            metadata: {
                team_id: data.team?.id,
                team_name: data.team?.name,
                bot_user_id: data.bot_user_id,
                user_id: slackUserId,
                scope: data.scope,
                user_scope: data.authed_user?.scope || data.user?.scope,
                app_id: data.app_id,
                authed_user: data.authed_user || data.user
            }
        };

        console.log('[API SLACK] Attempting upsert to user_connections:', {
            user_id: connectionData.user_id,
            provider: 'slack',
            type: connectionData.connection_type
        });

        const { error: upsertError } = await supabase.from('user_connections').upsert(connectionData, {
            onConflict: 'user_id, provider, connection_type'
        });

        if (upsertError) {
            console.error('❌ [API SLACK] Upsert error:', upsertError);
            
            // FALLBACK: If 'account_name' is missing, try 'external_account_name'
            if (upsertError.message?.includes('account_name')) {
                console.log('⚠️ [API SLACK] "account_name" missing, falling back to "external_account_name"');
                const fallbackData = { ...connectionData };
                fallbackData.external_account_name = fallbackData.account_name;
                delete fallbackData.account_name;

                const { error: fallbackError } = await supabase.from('user_connections').upsert(fallbackData, {
                    onConflict: 'user_id, provider, connection_type'
                });

                if (fallbackError) {
                    console.error('❌ [API SLACK] Fallback upsert also failed:', fallbackError);
                    throw new Error(`Database upsert failed (both column attempts): ${fallbackError.message}`);
                }
                console.log('✅ [API SLACK] Connection saved successfully (fallback column)');
            } else {
                throw new Error(`Database upsert failed: ${upsertError.message}`);
            }
        } else {
            console.log('✅ [API SLACK] Connection saved successfully');
        }

        // Return HTML to close popup and notify parent
        const html = `
            <html>
                <body>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({ type: 'SLACK_CONNECTED' }, '*');
                            window.close();
                        } else {
                            window.location.href = '/?connected=true&app=slack&type=${connectionData.connection_type}';
                        }
                    </script>
                    <p>Slack ${isPersonal ? 'Account Linked' : 'Team Hub Connected'} successful. You can close this window.</p>
                </body>
            </html>
        `;

        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html' },
        });

    } catch (err) {
        console.error('❌ Slack OAuth Exception:', err);
        const encodedError = encodeURIComponent(err.message || 'unknown_slack_error');
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=server_error&details=${encodedError}`);
    }
}
