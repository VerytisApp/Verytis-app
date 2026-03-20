import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) return NextResponse.json({ error: 'Organization not found' }, { status: 400 });

        // Fetch Total Active Agents
        const { count: activeAgentsCount } = await supabase
            .from('ai_agents')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', profile.organization_id)
            .eq('status', 'active');

        // Fetch Latest Events (Granular feed) and ALL logs for metrics aggregation
        const { data: latestEvents, error: latestEventsError } = await supabase
            .from('activity_logs')
            .select(`
                id,
                created_at,
                action_type,
                summary,
                metadata,
                actor_id,
                agent_id,
                profiles:actor_id (
                    full_name
                )
            `)
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(5);

        if (latestEventsError) console.error("Error fetching latest events:", latestEventsError);

        // Since the foreign key was removed to support WORM policies, we fetch agent names manually
        const agentIds = [...new Set((latestEvents || []).map(log => log.agent_id).filter(Boolean))];
        const agentsMap = {};

        if (agentIds.length > 0) {
            const { data: agents } = await supabase
                .from('ai_agents')
                .select('id, name')
                .in('id', agentIds);

            (agents || []).forEach(agent => {
                agentsMap[agent.id] = agent.name;
            });
        }

        // Map events to the UI format
        const formattedEvents = (latestEvents || []).map(log => {
            let actorName = 'Unknown Agent';
            let actorType = 'agent';
            let avatar = '🤖';

            if (log.agent_id && agentsMap[log.agent_id]) {
                actorName = agentsMap[log.agent_id];
            } else if (log.profiles?.full_name) {
                actorName = log.profiles.full_name;
                actorType = 'human';
                const nameParts = actorName.split(' ');
                avatar = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[1][0]}` : actorName[0];
            }

            return {
                id: log.id,
                actor: { name: actorName, type: actorType, avatar },
                action: log.action_type || 'LLM_REQUEST',
                target: log.summary || 'Processing task',
                status: log.metadata?.status || 'VERIFIED',
                time: log.created_at
            };
        });

        // Fetch all logs to compute true metrics (In production, use a SQL RPC or View for performance)
        const { data: allLogs } = await supabase
            .from('activity_logs')
            .select('action_type, metadata')
            .eq('organization_id', profile.organization_id);

        let totalTokens = 0;
        let apiCosts = 0;
        let blockedRequests = 0;
        let totalLatency = 0;
        let latencyCount = 0;

        (allLogs || []).forEach(log => {
            const meta = log.metadata || {};

            // Count Tokens
            if (meta.usage?.total_tokens) totalTokens += meta.usage.total_tokens;

            // Sum Costs
            if (meta.metrics?.cost_usd) apiCosts += meta.metrics.cost_usd;

            // Count blocked
            if (log.action_type === 'POLICY_BLOCKED' || meta.status === 'BLOCKED') blockedRequests++;

            // Sum latency
            if (meta.metrics?.duration_ms) {
                totalLatency += meta.metrics.duration_ms;
                latencyCount++;
            }
        });

        const avgLatency = latencyCount > 0 ? (totalLatency / latencyCount / 1000).toFixed(2) : 0;

        // Real metrics for AI-Ops
        return NextResponse.json({
            metrics: {
                activeAgents: activeAgentsCount || 0,
                totalTokens: totalTokens,
                apiCosts: apiCosts,
                blockedRequests: blockedRequests,
                avgLatency: avgLatency
            },
            recentEvents: formattedEvents,
            distribution: [],
            velocity: [120, 150, 180, 130, 210, 250, 310] // TODO: Group by date for real velocity
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
