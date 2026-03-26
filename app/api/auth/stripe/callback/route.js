import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const encodedState = searchParams.get('state');

    if (!code || !encodedState) {
        return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    try {
        const stateStr = Buffer.from(encodedState, 'base64').toString();
        const state = JSON.parse(stateStr);
        const { userId, organizationId } = state;

        // Exchange code for account details
        const tokenResponse = await fetch('https://connect.stripe.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_secret: process.env.STRIPE_SECRET_KEY,
                code,
                grant_type: 'authorization_code'
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('[STRIPE CALLBACK] Token exchange failed:', tokenData);
            return NextResponse.json({ error: tokenData.error_description || 'Token exchange failed' }, { status: 400 });
        }

        // Exchange code for account details
        // ... (existing token exchange)

        // Get actual Account Name from Stripe API
        let accountName = tokenData.stripe_user_id || 'Stripe Account';
        try {
            const accResponse = await fetch('https://api.stripe.com/v1/account', {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`
                }
            });
            if (accResponse.ok) {
                const accData = await accResponse.json();
                accountName = accData.settings?.dashboard?.display_name || 
                              accData.business_profile?.name || 
                              accData.email || 
                              tokenData.stripe_user_id;
            }
        } catch (e) {
            console.warn('[STRIPE CALLBACK] Could not fetch account name:', e);
        }

        const supabase = createAdminClient();

        const { data: existing } = await supabase
            .from('user_connections')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('provider', 'stripe')
            .maybeSingle();

        const connectionData = {
            organization_id: organizationId,
            user_id: userId,
            provider: 'stripe',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            account_name: accountName,
            connection_type: 'team',
            scope: 'read_write',
            metadata: {
                 stripe_user_id: tokenData.stripe_user_id,
                 stripe_account_id: tokenData.stripe_user_id, // Added for webhook matching
                 stripe_publishable_key: tokenData.stripe_publishable_key,
                 livemode: tokenData.livemode,
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

        if (upsertError) throw upsertError;

        // Redirect with postMessage script for better builder integration
        const html = `
            <!DOCTYPE html>
            <html><body>
            <script>
                if (window.opener) {
                    window.opener.postMessage({ type: 'STRIPE_CONNECTED' }, '*');
                    window.close();
                } else {
                    window.location.href = '/settings';
                }
            </script>
            </body></html>
        `;
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });

    } catch (err) {
        console.error('[STRIPE CALLBACK] Unexpected Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
