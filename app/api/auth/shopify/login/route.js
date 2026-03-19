import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function normalizeShopDomain(input) {
  const raw = (input || '').trim().toLowerCase();
  if (!raw) return null;
  const cleaned = raw.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  // Accept either full *.myshopify.com or a shop subdomain and expand it.
  if (cleaned.endsWith('.myshopify.com')) return cleaned;
  // Basic subdomain validation
  if (!/^[a-z0-9][a-z0-9-]*$/.test(cleaned)) return null;
  return `${cleaned}.myshopify.com`;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const storeUrl = searchParams.get('store_url') || searchParams.get('shop');
    const scope = (searchParams.get('scope') || 'personal').toLowerCase();

    if (!['personal', 'team'].includes(scope)) {
      return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
    }

    const shopDomain = normalizeShopDomain(storeUrl);
    if (!shopDomain) {
      return NextResponse.json({ error: 'Invalid store_url' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (scope === 'team') {
      const role = (profile?.role || '').toLowerCase();
      if (!['admin', 'manager'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (!profile?.organization_id) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
      }
    }

    const nonce = crypto.randomUUID();
    const state = {
      nonce,
      scope,
      userId: user.id,
      organizationId: scope === 'team' ? profile?.organization_id : null,
      shop: shopDomain,
      ts: Date.now(),
    };

    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/shopify/callback`;
    const requestedScopes = ['read_orders', 'read_products', 'read_customers'].join(',');

    const authorizeUrl = new URL(`https://${shopDomain}/admin/oauth/authorize`);
    authorizeUrl.searchParams.set('client_id', process.env.SHOPIFY_CLIENT_ID || '');
    authorizeUrl.searchParams.set('scope', requestedScopes);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('state', Buffer.from(JSON.stringify(state)).toString('base64url'));

    const res = NextResponse.redirect(authorizeUrl.toString());
    res.cookies.set('shopify_oauth_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}

