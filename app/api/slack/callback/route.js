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
        const supabaseStandard = await createClient();
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
        
        let accountName = data.team?.name || 'Slack Workspace';
        let accessToken = data.access_token;
        let slackUserId = data.bot_user_id;

        const connectionData = {
            user_id: sessionUser.id,
            organization_id: state.organizationId || null,
            provider: 'slack',
            connection_type: 'team',
            scope: 'team',
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

        if (!connectionData.organization_id) {
             console.error('❌ [API SLACK] Missing organizationId in state');
             return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=missing_organization`);
        }

        console.log('[API SLACK] Attempting upsert to user_connections:', {
            user_id: connectionData.user_id,
            organization_id: connectionData.organization_id,
            provider: 'slack'
        });

        // Unify connection conflict: only one Slack per organization
        // We use manual check-then-act to bypass missing unique constraint in DB
        const { data: existing } = await supabase.from('user_connections')
            .select('id')
            .eq('organization_id', connectionData.organization_id)
            .eq('provider', 'slack')
            .maybeSingle();

        let upsertError = null;
        if (existing) {
            console.log(`[API SLACK] Updating existing connection: ${existing.id}`);
            const { error } = await supabase.from('user_connections')
                .update(connectionData)
                .eq('id', existing.id);
            upsertError = error;
        } else {
            console.log('[API SLACK] Inserting new connection');
            const { error } = await supabase.from('user_connections')
                .insert(connectionData);
            upsertError = error;
        }

        if (upsertError) {
            console.error('❌ [API SLACK] Upsert error:', upsertError);
            throw new Error(`Database upsert failed: ${upsertError.message}`);
        }

        // Return HTML to close popup and notify parent
        const html = `
            <html>
                <body style="background: #f8fafc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; color: #1e293b;">
                    <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05); border: 1px solid #e2e8f0;">
                        <h2 style="margin-bottom: 0.5rem; color: #0f172a;">Slack Connecté !</h2>
                        <p style="font-size: 0.875rem; color: #64748b;">Votre workspace est maintenant lié à Verytis.</p>
                        <script>
                            if (window.opener) {
                                window.opener.postMessage({ type: 'SLACK_CONNECTED' }, '*');
                                window.close();
                            } else {
                                window.location.href = '/settings?tab=integrations&connected=true&app=slack';
                            }
                        </script>
                    </div>
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
