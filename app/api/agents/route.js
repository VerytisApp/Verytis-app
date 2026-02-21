import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) return NextResponse.json({ error: 'Organization not found' }, { status: 400 });

        // Fetch agents
        const { data: agents, error: agentsError } = await supabase
            .from('ai_agents')
            .select('id, name, description, status, created_at')
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

        // Attach logs to agents
        const enrichedAgents = agents.map(agent => ({
            ...agent,
            telemetry: telemetryLogs.filter(log => log.agent_id === agent.id)
        }));

        return NextResponse.json({ agents: enrichedAgents });

    } catch (error) {
        console.error('Error fetching agents:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
