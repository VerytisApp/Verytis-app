import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Streamlabs Webhook Receiver
 * Handles incoming events defined in TriggerNode.jsx:
 * - stream_end
 * - manual_clip_created
 * - highlight_generated
 * - replay_ready
 */
export async function POST(req) {
  try {
    const payload = await req.json();
    
    // Streamlabs payload structure varies, but usually has a 'type' or 'event'
    const eventType = payload.type || payload.event;
    const streamlabsId = payload.streamlabs_id || (payload.to && payload.to.id) || (payload.data && payload.data.user_id);

    if (!eventType || !streamlabsId) {
      console.warn('[STREAMLABS WEBHOOK] Received incomplete payload:', JSON.stringify(payload));
      return NextResponse.json({ error: 'Missing type or streamlabs_id' }, { status: 400 });
    }

    console.log(`[STREAMLABS WEBHOOK] Processing ${eventType} for account ${streamlabsId}`);

    // 1. Idempotency check via webhook_events table
    const webhookId = payload.id || req.headers.get('x-streamlabs-webhook-id') || `${eventType}-${streamlabsId}-${Date.now()}`;
    const { data: upsertData, error: upsertError } = await supabase.from('webhook_events').upsert({
      provider: 'streamlabs',
      external_id: webhookId.toString(),
      event_type: eventType,
      payload,
      status: 'completed'
    }, {
      onConflict: 'provider,external_id',
      ignoreDuplicates: true
    }).select('id').maybeSingle();

    if (upsertError) {
      console.error('[STREAMLABS WEBHOOK] Persistence Failure:', upsertError);
      return NextResponse.json({ error: 'Persistence Failure' }, { status: 500 });
    }

    if (!upsertData) {
      console.log(`[STREAMLABS WEBHOOK] Skip: Already processed event ${webhookId}`);
      return NextResponse.json({ status: 'already_processed' });
    }

    // 2. Identify the organization(s) connected to this Streamlabs account
    const { data: connections } = await supabase
      .from('user_connections')
      .select('id, organization_id, metadata')
      .eq('provider', 'streamlabs');

    const matchingConnectionIds = (connections || [])
      .filter(c => c.metadata?.streamlabs_id?.toString() === streamlabsId.toString())
      .map(c => c.id);

    if (matchingConnectionIds.length === 0) {
      console.warn(`[STREAMLABS WEBHOOK] No Workspace connection matches Streamlabs ID: ${streamlabsId}`);
      return NextResponse.json({ status: 'no_matching_connection' });
    }

    // 3. Find Active AI Agents with a TriggerNode subscribed to this provider/event
    const { data: agents } = await supabase
      .from('ai_agents')
      .select('id, visual_config, status')
      .eq('status', 'active');

    const triggeredAgents = (agents || []).filter(a => {
      const nodes = a.visual_config?.nodes || [];
      return nodes.some(n => 
        n?.type === 'triggerNode' &&
        n?.data?.trigger_type === 'app' &&
        (n?.data?.provider || '').toLowerCase() === 'streamlabs' &&
        (n?.data?.event_name || '').toLowerCase() === eventType.toLowerCase() &&
        matchingConnectionIds.includes(n?.data?.connection_id)
      );
    });

    if (triggeredAgents.length === 0) {
      console.log(`[STREAMLABS WEBHOOK] Event ${eventType} ignored: No subscribed active agents.`);
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
            message: `[STREAMLABS] Event: ${eventType}\nData: ${JSON.stringify(payload.data || payload)}`
          })
        });
        return { agentId: a.id, ok: res.ok };
      } catch (err) {
        return { agentId: a.id, ok: false, error: err.message };
      }
    }));

    console.log(`[STREAMLABS WEBHOOK] Triggered ${triggeredAgents.length} agents. Results:`, JSON.stringify(triggerResults));

    return NextResponse.json({ 
      status: 'ok', 
      processed_event: eventType,
      triggered_count: triggeredAgents.length,
      results: triggerResults
    });

  } catch (error) {
    console.error('[STREAMLABS WEBHOOK] Fatal processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
