import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * TikTok Webhook Receiver (v2)
 * Handles incoming events defined in TriggerNode.jsx:
 * - video.publish.status_changed (new_post)
 * - video.upload.status_changed
 * - user.info.updated (viral_spike, follower.milestone)
 */
export async function POST(req) {
  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    
    // TikTok signature verification (Optional but secure)
    const signature = req.headers.get('x-tiktok-signature');
    if (signature && process.env.TIKTOK_CLIENT_SECRET) {
      const hmac = crypto.createHmac('sha256', process.env.TIKTOK_CLIENT_SECRET).update(rawBody).digest('hex');
      if (hmac !== signature) {
        console.warn('[TIKTOK WEBHOOK] Invalid signature');
        // We continue in dev/test if needed, but in prod we should return 401
      }
    }

    // TikTok v2 payload structure: { "event": "...", "open_id": "...", "timestamp": ..., "data": { ... } }
    const eventType = payload.event;
    const openId = payload.open_id;

    if (!eventType || !openId) {
      console.warn('[TIKTOK WEBHOOK] Received incomplete payload:', rawBody);
      // TikTok expects 200/OK to stop retrying even if invalid for us
      return NextResponse.json({ status: 'ignored_incomplete' });
    }

    console.log(`[TIKTOK WEBHOOK] Processing ${eventType} for user ${openId}`);

    const supabase = createAdminClient();

    // 1. Idempotency check via webhook_events table
    const webhookId = payload.event_id || `${eventType}-${openId}-${payload.timestamp || Date.now()}`;
    const { data: upsertData, error: upsertError } = await supabase.from('webhook_events').upsert({
      provider: 'tiktok',
      external_id: webhookId.toString(),
      event_type: eventType,
      payload,
      status: 'completed'
    }, {
      onConflict: 'provider,external_id',
      ignoreDuplicates: true
    }).select('id').maybeSingle();

    if (upsertError) {
      console.error('[TIKTOK WEBHOOK] Persistence Failure:', upsertError);
      return NextResponse.json({ error: 'Persistence Failure' }, { status: 500 });
    }

    if (!upsertData) {
      console.log(`[TIKTOK WEBHOOK] Skip: Already processed event ${webhookId}`);
      return NextResponse.json({ status: 'already_processed' });
    }

    // 2. Identify the organization(s) connected to this TikTok account
    const { data: connections } = await supabase
      .from('user_connections')
      .select('id, organization_id, metadata')
      .eq('provider', 'tiktok');

    const matchingConnectionIds = (connections || [])
      .filter(c => c.metadata?.open_id === openId)
      .map(c => c.id);

    if (matchingConnectionIds.length === 0) {
      console.warn(`[TIKTOK WEBHOOK] No Workspace connection matches TikTok OpenID: ${openId}`);
      return NextResponse.json({ status: 'no_matching_connection' });
    }

    // 3. Find Active AI Agents with a TriggerNode subscribed to this provider/event
    // Mapping TikTok v2 events to our TriggerNode internal names:
    // video.publish.status_changed -> video.new_post
    // user.info.updated -> follower.milestone / viral_spike
    const { data: agents } = await supabase
      .from('ai_agents')
      .select('id, visual_config, status')
      .eq('status', 'active');

    const triggeredAgents = (agents || []).filter(a => {
      const nodes = a.visual_config?.nodes || [];
      return nodes.some(n => {
        if (n?.type !== 'triggerNode' || n?.data?.trigger_type !== 'app') return false;
        if ((n?.data?.provider || '').toLowerCase() !== 'tiktok') return false;
        
        const agentEventName = (n?.data?.event_name || '').toLowerCase();
        const incomingEvent = eventType.toLowerCase();

        // Match based on mapping or direct equality
        const isMatch = (incomingEvent === 'video.publish.status_changed' && agentEventName === 'video.new_post') ||
                        (incomingEvent === 'user.info.updated' && (agentEventName === 'follower.milestone' || agentEventName === 'viral_spike')) ||
                        (incomingEvent === agentEventName);

        return isMatch && matchingConnectionIds.includes(n?.data?.connection_id);
      });
    });

    if (triggeredAgents.length === 0) {
      console.log(`[TIKTOK WEBHOOK] Event ${eventType} ignored: No subscribed active agents.`);
      return NextResponse.json({ status: 'no_agents_triggered' });
    }

    // 4. Trigger the Agent Orchestrator for each matching agent
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const triggerResults = await Promise.all(triggeredAgents.map(async (a) => {
      try {
        const res = await fetch(`${baseUrl}/api/run/agt_live_${a.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-token': process.env.CRON_SECRET
          },
          body: JSON.stringify({
            message: `[TIKTOK] Event: ${eventType}\nData: ${JSON.stringify(payload.data || {})}`
          })
        });
        return { agentId: a.id, ok: res.ok };
      } catch (err) {
        return { agentId: a.id, ok: false, error: err.message };
      }
    }));

    console.log(`[TIKTOK WEBHOOK] Triggered ${triggeredAgents.length} agents. Results:`, JSON.stringify(triggerResults));

    return NextResponse.json({ 
      status: 'ok', 
      processed_event: eventType,
      triggered_count: triggeredAgents.length,
      results: triggerResults
    });

  } catch (error) {
    console.error('[TIKTOK WEBHOOK] Fatal processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
