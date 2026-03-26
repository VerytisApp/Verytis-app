import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const stateParam = searchParams.get('state');
    const installationId = searchParams.get('installation_id');

    if (error) {
        const html = `
            <!DOCTYPE html>
            <html><body>
            <script>
                if (window.opener) {
                    window.opener.postMessage({ type: 'GITHUB_ERROR', error: '${error}' }, '*');
                    window.close();
                } else {
                    window.location.href = '/?error=${error}';
                }
            </script>
            </body></html>
        `;
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
    }

    if (!code) {
        return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    try {
        // Exchange code for user access token
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code,
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('GitHub OAuth Error:', data.error_description);
            const html = `
                <!DOCTYPE html>
                <html><body>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({ type: 'GITHUB_ERROR', error: '${data.error}' }, '*');
                        window.close();
                    } else {
                        window.location.href = '/?error=${data.error}';
                    }
                </script>
                </body></html>
            `;
            return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
        }

        const accessToken = data.access_token;

        // Fetch User Info to identify who installed it
        const userRes = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        const userData = await userRes.json();

        // Fetch email if private (returns null in userData.email)
        let primaryEmail = userData.email;
        if (!primaryEmail) {
            try {
                const emailsRes = await fetch('https://api.github.com/user/emails', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                const emails = await emailsRes.json();
                if (Array.isArray(emails)) {
                    const primary = emails.find(e => e.primary && e.verified);
                    if (primary) primaryEmail = primary.email;
                }
            } catch (e) {
                console.error("Failed to fetch emails:", e);
            }
        }

        console.log("GitHub User Data:", { id: userData.id, login: userData.login, email: primaryEmail });

        // --- LOGIC SPLIT: APP INSTALLATION vs MEMBER LINKING ---

        let state = {};
        try {
            if (stateParam) state = JSON.parse(stateParam);
        } catch (e) {
            // ignore if not json
        }

        // SECURITY: Verify state nonce against cookie to prevent CSRF
        const cookieNonce = req.cookies.get('github_oauth_nonce')?.value;
        if (!state.nonce || state.nonce !== cookieNonce) {
            console.error('❌ GitHub OAuth State/Nonce mismatch or missing');
            return NextResponse.json({ error: 'Security validation failed: state mismatch' }, { status: 403 });
        }

        // Clear the nonce cookie after verification
        const responseHeaders = new Headers();
        // Note: In Next.js App Router, we usually handle this via the returned NextResponse object

        const supabaseStandard = await createClient();
        const { data: { user: sessionUser }, error: sessionError } = await supabaseStandard.auth.getUser();

        if (sessionError) console.error('❌ [API GITHUB] Session retrieval error:', sessionError);
        console.log('[API GITHUB] Session User:', sessionUser?.id || 'NONE');

        const supabase = createAdminClient();
        
        const connectionType = 'team';
        let accountName = userData.login;
        let finalInstallationId = installationId;

        // "HUNT" STRATEGY: Proactively look for organization installations
        try {
            console.log('[API GITHUB] Hunting for Organization Installations...');
            const installationsRes = await fetch('https://api.github.com/user/installations', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (installationsRes.ok) {
                const instData = await installationsRes.ok ? await installationsRes.json() : { installations: [] };
                const installations = instData.installations || [];
                
                const orgInst = installations.find(i => i.id.toString() === installationId?.toString()) ||
                                installations.find(i => i.account?.type === 'Organization') || 
                                installations[0];

                if (orgInst) {
                    console.log('[API GITHUB] Hub Account Found:', orgInst.account.login, `(${orgInst.account.type})`);
                    accountName = orgInst.account.login;
                    finalInstallationId = orgInst.id.toString();
                }
            }
        } catch (e) {
            console.error('[API GITHUB] Hunt failed:', e);
        }

        const connectionData = {
            user_id: state.userId || sessionUser?.id,
            organization_id: state.organizationId || null,
            provider: 'github',
            connection_type: 'team',
            scope: 'team',
            account_name: accountName,
            access_token: accessToken,
            refresh_token: data.refresh_token,
            metadata: {
                github_id: userData.id,
                avatar_url: userData.avatar_url,
                html_url: userData.html_url,
                email: primaryEmail,
                installation_id: finalInstallationId,
                scope: data.scope,
                token_type: data.token_type,
                expires_in: data.expires_in,
                expires_at: data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : null,
                created_at: Math.floor(Date.now() / 1000)
            }
        };

        // GitHub App logic: we might not save tokens if we generate them from installation_id
        if (finalInstallationId) {
            console.log('[API GITHUB] GitHub App Installation detected. Storing installation_id, tokens will be generated on the fly.');
            connectionData.access_token = null;
            connectionData.refresh_token = null;
        }

        if (!connectionData.organization_id) {
            console.error('❌ [API GITHUB] Missing organizationId in state');
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=missing_organization`);
        }

        if (!connectionData.user_id) {
            console.error('❌ [API GITHUB] No user_id found in state or session');
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=unauthorized`);
        }

        // Unify connection conflict: only one GitHub per organization
        // Manual safe upsert to bypass missing unique constraint in DB
        const { data: existing } = await supabase.from('user_connections')
            .select('id')
            .eq('organization_id', connectionData.organization_id)
            .eq('provider', 'github')
            .maybeSingle();

        let upsertError = null;
        if (existing) {
            console.log(`[API GITHUB] Updating existing connection: ${existing.id}`);
            const { error } = await supabase.from('user_connections')
                .update(connectionData)
                .eq('id', existing.id);
            upsertError = error;
        } else {
            console.log('[API GITHUB] Inserting new connection');
            const { error } = await supabase.from('user_connections')
                .insert(connectionData);
            upsertError = error;
        }

        if (upsertError) {
            console.error('❌ [API GITHUB] Upsert error:', upsertError);
            throw new Error(`Database upsert failed: ${upsertError.message}`);
        }

        // Redirect with postMessage script for better builder integration
        const html = `
            <!DOCTYPE html>
            <html><body>
            <script>
                if (window.opener) {
                    window.opener.postMessage({ type: 'GITHUB_CONNECTED' }, '*');
                    window.close();
                } else {
                    window.location.href = '/settings';
                }
            </script>
            </body></html>
        `;
        const finalResponse = new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
        finalResponse.cookies.delete('github_oauth_nonce');

        return finalResponse;

    } catch (err) {
        console.error('❌ OAuth Exception Details:', err);
        const errorMsg = err.message || 'unknown_server_error';
        const html = `
            <!DOCTYPE html>
            <html><body>
            <script>
                if (window.opener) {
                    window.opener.postMessage({ type: 'GITHUB_ERROR', error: '${errorMsg.replace(/'/g, "\\'")}' }, '*');
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
