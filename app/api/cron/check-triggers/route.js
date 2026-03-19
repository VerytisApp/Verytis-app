import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function isAuthorized(req) {
  const header = req.headers.get('x-cron-token');
  return !!header && header === process.env.CRON_SECRET;
}

function agentHasAppTrigger(agent) {
  const nodes = agent?.visual_config?.nodes || [];
  return nodes.some(
    (n) =>
      n?.type === 'triggerNode' &&
      // Only triggers that require polling
      (n?.data?.trigger_type === 'app' || n?.data?.trigger_type === 'scheduled')
  );
}

export async function GET(req) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: agents, error } = await supabase
      .from('ai_agents')
      .select('id, organization_id, status, last_check, visual_config')
      .eq('status', 'active');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const activeWithAppTrigger = (agents || []).filter(agentHasAppTrigger);
    const nowIso = new Date().toISOString();

    // NOTE: Provider polling is intentionally minimal here.
    // We only bump last_check for active agents with app triggers.
    // Provider-specific polling (GitHub/Stripe/etc.) can be implemented incrementally.
    for (const a of activeWithAppTrigger) {
      await supabase
        .from('ai_agents')
        .update({ last_check: nowIso })
        .eq('id', a.id);
    }

    return NextResponse.json({
      ok: true,
      active_agents: (agents || []).length,
      app_trigger_agents: activeWithAppTrigger.length,
      checked_at: nowIso,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}

