import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) return NextResponse.json({ error: 'Organization not found' }, { status: 400 });

        // Fetch agents – updated_at est géré par Supabase (modifié uniquement lors des vraies sauvegardes PUT/PATCH)
        const { data: agents, error: agentsError } = await supabase
            .from('ai_agents')
            .select('id, name, description, status, created_at, updated_at, visual_config, is_draft')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false });

        if (agentsError) throw agentsError;

        // Fetch latest telemetry logs attached to these agents
        // For simplicity, fetch all recent logic for this org where action_type = 'AI_TELEMETRY'
        const { data: telemetryLogs, error: logsError } = await supabase
            .from('activity_logs')
            .select('id, agent_id, metadata, created_at, summary')
            .eq('organization_id', profile.organization_id)
            .eq('action_type', 'AI_TELEMETRY')
            .order('created_at', { ascending: false })
            .limit(100);

        if (logsError) throw logsError;

        // Attach logs and calculate summary stats for each agent
        const enrichedAgents = agents.map((agent, index) => {
            const agentLogs = telemetryLogs.filter(log => log.agent_id === agent.id);

            // Heuristic for "model" and "cost"
            const latestLogWithModel = agentLogs.find(l => l.metadata?.ai_context?.model);
            const totalCost = agentLogs.reduce((acc, l) => acc + (l.metadata?.metrics?.cost_usd || 0), 0);
            const avgCost = agentLogs.length > 0 ? totalCost / agentLogs.length : 0;
            const lastActivity = agentLogs.length > 0 ? agentLogs[0].created_at : agent.created_at;

            return {
                ...agent,
                model: latestLogWithModel?.metadata?.ai_context?.model || 'gpt-4',
                avg_cost: avgCost.toFixed(4),
                last_activity: lastActivity,
                telemetry: agentLogs,
                budget_limit: agent.budget_limit || null,
                current_spend: totalCost
            };
        });

        return NextResponse.json({ agents: enrichedAgents });

    } catch (error) {
        console.error('Error fetching agents:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
