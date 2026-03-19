import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function verifyShopifyQueryHmac(searchParams, secret) {
  const provided = searchParams.get('hmac');
  if (!provided || !secret) return false;

  const msg = [...searchParams.entries()]
    .filter(([k]) => k !== 'hmac' && k !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const digest = crypto.createHmac('sha256', secret).update(msg).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(digest, 'utf8'), Buffer.from(provided, 'utf8'));
  } catch {
    return false;
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const shop = (searchParams.get('shop') || '').toLowerCase();
  const stateB64 = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/settings?tab=integrations&error=${encodeURIComponent(error)}`);
  }
  if (!code || !shop || !stateB64) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // 1) Verify query HMAC (OAuth redirect)
  const okHmac = verifyShopifyQueryHmac(searchParams, process.env.SHOPIFY_CLIENT_SECRET);
  if (!okHmac) {
    return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
  }

  // 2) Verify state nonce vs cookie (CSRF)
  let state = null;
  try {
    state = JSON.parse(Buffer.from(stateB64, 'base64url').toString('utf8'));
  } catch {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
  }

  const cookieNonce = req.cookies.get('shopify_oauth_nonce')?.value;
  if (!state?.nonce || !cookieNonce || state.nonce !== cookieNonce) {
    return NextResponse.json({ error: 'Security validation failed: state mismatch' }, { status: 403 });
  }

  // 3) Exchange code for access token
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code,
    }),
  });

  const tokenJson = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenJson?.access_token) {
    return NextResponse.json({ error: 'Token exchange failed', details: tokenJson }, { status: 400 });
  }

  const accessToken = tokenJson.access_token;
  const grantedScope = tokenJson.scope || null;

  // 4) Persist to user_connections (admin client to avoid RLS surprises)
  const supabaseAdmin = createAdminClient();
  const connectionType = (state.scope || 'personal').toLowerCase() === 'team' ? 'team' : 'personal';

  const connectionData = {
    user_id: state.userId,
    organization_id: connectionType === 'team' ? state.organizationId : null,
    provider: 'shopify',
    connection_type: connectionType,
    scope: connectionType, // explicit column (mirrors connection_type)
    account_name: state.shop,
    access_token: accessToken,
    refresh_token: null,
    metadata: {
      store_url: state.shop,
      shop: shop,
      scope: grantedScope,
      token_type: 'shopify_access_token',
      created_at: Math.floor(Date.now() / 1000),
    },
  };

  const { error: upsertError } = await supabaseAdmin
    .from('user_connections')
    .upsert(connectionData, { onConflict: 'user_id,provider,connection_type' });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const html = `
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'SHOPIFY_CONNECTED',
              scope: ${JSON.stringify(connectionType)},
              shop: ${JSON.stringify(state.shop)}
            }, '*');
            window.close();
          } else {
            window.location.href = '/settings?tab=integrations&connected=true&app=shopify&type=${connectionType}';
          }
        </script>
        <p>Shopify connected! You can close this window.</p>
      </body>
    </html>
  `;

  const res = new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  res.cookies.delete('shopify_oauth_nonce');
  return res;
}

