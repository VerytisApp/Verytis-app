import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const installationId = searchParams.get('installation_id');
    const setupAction = searchParams.get('setup_action'); // 'install' or 'update'

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
                // redirect_uri is optional for GitHub Apps sometimes, but good to include if matching
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

        // Check if we can get installation details?
        // If installationId is present, we might want to store it.
        // For now, let's store it in settings.

        const TEST_ORG_ID = '5db477f6-c893-4ec4-9123-b12160224f70'; // Test Corp

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Check for existing integration
        const { data: existingInt } = await supabase.from('integrations')
            .select('id')
            .eq('organization_id', TEST_ORG_ID)
            .eq('provider', 'github')
            .single();

        const integrationData = {
            organization_id: TEST_ORG_ID,
            provider: 'github',
            name: userData.login, // Ideally this should be the installed Org name if different from User
            external_id: String(userData.id),
            settings: {
                access_token: accessToken,
                installation_id: installationId,
                username: userData.login,
                avatar_url: userData.avatar_url,
                html_url: userData.html_url
            }
        };

        if (existingInt) {
            await supabase.from('integrations').update(integrationData).eq('id', existingInt.id);
        } else {
            await supabase.from('integrations').insert(integrationData);
        }

        // Return HTML to close popup and notify parent
        const html = `
            <html>
                <body>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({ type: 'GITHUB_CONNECTED' }, '${process.env.NEXT_PUBLIC_BASE_URL}');
                            window.close();
                        } else {
                            // Fallback if not in a popup (e.g. direct visit)
                            window.location.href = '/?connected=true&app=github';
                        }
                    </script>
                    <p>Connection successful. You can close this window.</p>
                </body>
            </html>
        `;

        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html' },
        });

    } catch (err) {
        console.error('OAuth Exception:', err);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=server_error`);
    }
}
