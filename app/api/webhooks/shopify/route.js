import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function verifyShopifyWebhookHmac({ rawBody, hmacHeader, secret }) {
  if (!rawBody || !hmacHeader || !secret) return false;
  const digest = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, 'utf8'), Buffer.from(hmacHeader, 'utf8'));
  } catch {
    return false;
  }
}

export async function POST(req) {
  const rawBody = await req.text();

  const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
  const shopDomain = (req.headers.get('x-shopify-shop-domain') || '').toLowerCase();
  const topic = (req.headers.get('x-shopify-topic') || '').toLowerCase();
  const webhookId = req.headers.get('x-shopify-webhook-id');

  const ok = verifyShopifyWebhookHmac({
    rawBody,
    hmacHeader,
    secret: process.env.SHOPIFY_CLIENT_SECRET
  });

  if (!ok) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload = null;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Idempotency (best effort)
  if (webhookId) {
    const { data: upsertData, error: upsertError } = await supabase.from('webhook_events').upsert({
      provider: 'shopify',
      external_id: webhookId,
      event_type: topic || 'unknown',
      payload,
      status: 'completed'
    }, {
      onConflict: 'provider,external_id',
      ignoreDuplicates: true
    }).select('id').maybeSingle();

    if (upsertError) {
      return NextResponse.json({ error: 'Persistence Failure' }, { status: 500 });
    }
    if (!upsertData) {
      return NextResponse.json({ status: 'already_processed' });
    }
  }

  if (!shopDomain) {
    return NextResponse.json({ status: 'ok' });
  }

  // Find Shopify connections matching the shop domain
  const { data: connections } = await supabase
    .from('user_connections')
    .select('id, organization_id, metadata')
    .eq('provider', 'shopify');

  const shopConnectionIds = (connections || [])
    .filter(c => {
      const store = (c.metadata?.store_url || c.metadata?.shop || '').toLowerCase();
      return store === shopDomain;
    })
    .map(c => c.id);

  if (shopConnectionIds.length === 0) {
    return NextResponse.json({ status: 'no_matching_connection' });
  }

  const { data: agents } = await supabase
    .from('ai_agents')
    .select('id, visual_config, status')
    .eq('status', 'active');

  const activeAgents = (agents || []).filter(a => {
    const nodes = a.visual_config?.nodes || [];
    return nodes.some(n =>
      n?.type === 'triggerNode' &&
      n?.data?.trigger_type === 'app' &&
      (n?.data?.provider || '').toLowerCase() === 'shopify' &&
      (n?.data?.event_name || '').toLowerCase() === (topic || 'orders/create') &&
      shopConnectionIds.includes(n?.data?.connection_id)
    );
  });

  // Trigger executions (best effort)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  await Promise.all(activeAgents.map(a => fetch(`${baseUrl}/api/run/agt_live_${a.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-token': process.env.CRON_SECRET
    },
    body: JSON.stringify({
      message: `[SHOPIFY ${topic || 'orders/create'}] shop=${shopDomain}\n\n${JSON.stringify(payload)}`
    })
  }).catch(() => null)));

  return NextResponse.json({ status: 'ok', triggered: activeAgents.length });
}

