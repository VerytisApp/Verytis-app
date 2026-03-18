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
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=${error}`);
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
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=${data.error}`);
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

        const supabaseStandard = createClient();
        const { data: { user: sessionUser }, error: sessionError } = await supabaseStandard.auth.getUser();

        if (sessionError) console.error('❌ [API GITHUB] Session retrieval error:', sessionError);
        console.log('[API GITHUB] Session User:', sessionUser?.id || 'NONE');

        const supabase = createAdminClient();
        // CASE 1: Member Linking (Passport ID)
        // MIGRATION: Centralized saving to user_connections
        let accountName = userData.login;
        const connectionType = (state.type === 'user_link' && !installationId) ? 'personal' : 'team';
        let finalInstallationId = installationId;

        // "HUNT" STRATEGY: Proactively look for organization installations if it's a team connection
        if (connectionType === 'team') {
            try {
                console.log('[API GITHUB] Hunting for Organization Installations...');
                const installationsRes = await fetch('https://api.github.com/user/installations', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (installationsRes.ok) {
                    const instData = await installationsRes.json();
                    const installations = instData.installations || [];
                    
                    // SELECTION PRIORITY: 
                    // 1. Direct match for the installationId passed in the URL (The user's specific choice)
                    // 2. Any Organization-type account
                    // 3. Fallback to first available
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
        }

        const connectionData = {
            user_id: state.userId || sessionUser?.id,
            organization_id: state.organizationId || null,
            provider: 'github',
            connection_type: connectionType,
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

        // If it's a team installation and it's a "GitHub App" style (installation_id exists), 
        // we might NOT want to save the token in the database per the 'Garde du Corps' logic, 
        // but for now we follow the instruction: "Tu ne sauvegardes aucun token en base de données ! Tu ne sauvegardes que l'installation_id."
        // Let's refine the logic: if finalInstallationId exists, we can null out the tokens in the database record
        // to ensure we ALWAYS generate them on the fly.
        if (connectionType === 'team' && finalInstallationId) {
            console.log('[API GITHUB] GitHub App Installation detected. Storing installation_id, tokens will be generated on the fly.');
            // Per instructions: "Tu ne sauvegardes AUCUN token en base de données ! Tu ne sauvegardes que l'installation_id."
            // However, we might still need some metadata.
            connectionData.access_token = null;
            connectionData.refresh_token = null;
        }
 

        // If it's a team installation, try to ensure organization_id is present
        if (connectionType === 'team' && !connectionData.organization_id && sessionUser) {
            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', sessionUser.id).single();
            if (profile?.organization_id) {
                connectionData.organization_id = profile.organization_id;
            }
        }

        // If it's a team installation, we might not have a userId in state, 
        // but we definitely have it if coming from the Settings page.
        if (!connectionData.user_id) {
            console.error('❌ [API GITHUB] No user_id found in state or session');
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=unauthorized`);
        }

        const { error: upsertError } = await supabase.from('user_connections').upsert(connectionData, {
            onConflict: 'user_id, provider, connection_type'
        });

        if (upsertError) {
            console.error('❌ [API GITHUB] Upsert error:', upsertError);
            
            // FALLBACK: If 'account_name' is missing, try 'external_account_name'
            if (upsertError.message?.includes('account_name')) {
                console.log('⚠️ [API GITHUB] "account_name" missing, falling back to "external_account_name"');
                const fallbackData = { ...connectionData };
                fallbackData.external_account_name = fallbackData.account_name;
                delete fallbackData.account_name;

                const { error: fallbackError } = await supabase.from('user_connections').upsert(fallbackData, {
                    onConflict: 'user_id, provider, connection_type'
                });

                if (fallbackError) {
                    console.error('❌ [API GITHUB] Fallback upsert also failed:', fallbackError);
                    throw new Error(`Database upsert failed (both column attempts): ${fallbackError.message}`);
                }
                console.log('✅ [API GITHUB] Connection saved successfully (fallback column)');
            } else {
                throw new Error(`Database upsert failed: ${upsertError.message}`);
            }
        } else {
            console.log('✅ [API GITHUB] Connection saved successfully');
        }

        // Prepare response HTML
        const html = `
            <html>
                <body>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({ 
                                type: '${connectionType === 'personal' ? 'GITHUB_LINKED' : 'GITHUB_CONNECTED'}', 
                                user: ${JSON.stringify(accountName)} 
                            }, '*');
                            window.close();
                        } else {
                            window.location.href = '/?connected=true&app=github&type=${connectionType}';
                        }
                    </script>
                    <p>GitHub ${connectionType === 'personal' ? 'Account Linked' : 'Team Hub Connected'}! You can close this window.</p>
                </body>
            </html>
        `;

        const finalResponse = new NextResponse(html, {
            headers: { 'Content-Type': 'text/html' },
        });
        finalResponse.cookies.delete('github_oauth_nonce');

        return finalResponse;

    } catch (err) {
        console.error('❌ OAuth Exception Details:', err);
        const encodedError = encodeURIComponent(err.message || 'unknown_server_error');
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=server_error&details=${encodedError}`);
    }
}
