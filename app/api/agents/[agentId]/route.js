import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scrubText, scrubObject } from '@/lib/security/scrubber';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    try {
        const { agentId } = params;
        const supabase = createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) return NextResponse.json({ error: 'Organization not found' }, { status: 400 });

        // Fetch specific agent
        const { data: agent, error: agentError } = await supabase
            .from('ai_agents')
            .select('*')
            .eq('id', agentId)
            .eq('organization_id', profile.organization_id)
            .single();

        if (agentError) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

        // Fetch telemetry logs attached to this agent
        const { data: telemetryLogs, error: logsError } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('agent_id', agentId)
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (logsError) throw logsError;

        return NextResponse.json({ agent, logs: telemetryLogs });

    } catch (error) {
        console.error('Error fetching agent details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        const { agentId } = params;
        const supabase = createClient();
        const body = await req.json();
        const { status, policies, knowledge_configuration } = body;

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) return NextResponse.json({ error: 'Organization not found' }, { status: 400 });

        // Build the update payload dynamically
        const updatePayload = {};

        // Handle status change (Kill Switch)
        if (status) {
            if (!['active', 'suspended'].includes(status)) {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }
            updatePayload.status = status;
        }

        // Handle policies update (Guardrails)
        if (policies) {
            // Merge with existing policies to allow partial updates
            const { data: existing } = await supabase
                .from('ai_agents')
                .select('policies')
                .eq('id', agentId)
                .eq('organization_id', profile.organization_id)
                .single();

            updatePayload.policies = { ...(existing?.policies || {}), ...policies };
        }
        
        if (knowledge_configuration) {
            updatePayload.knowledge_configuration = knowledge_configuration;
        }

        if (Object.keys(updatePayload).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        // Apply the update
        const { data: agent, error: updateError } = await supabase
            .from('ai_agents')
            .update(updatePayload)
            .eq('id', agentId)
            .eq('organization_id', profile.organization_id)
            .select()
            .single();

        if (updateError) return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });

        // Log security-sensitive actions to the audit trail
        if (status) {
            const redactedSummary = scrubText(`${agent.name} status changed to ${status}`);
            const redactedMetadata = scrubObject({
                agent_id: agentId,
                previous_status: agent.status === status ? 'unknown' : (status === 'active' ? 'suspended' : 'active')
            });

            await supabase.from('activity_logs').insert({
                organization_id: profile.organization_id,
                actor_id: user.id,
                action_type: status === 'suspended' ? 'AGENT_KILLED' : 'AGENT_REACTIVATED',
                summary: redactedSummary,
                metadata: redactedMetadata
            });
        }

        if (policies) {
            await supabase.from('activity_logs').insert({
                organization_id: profile.organization_id,
                actor_id: user.id,
                action_type: 'AGENT_POLICIES_UPDATED',
                summary: scrubText(`${agent.name} policies updated`),
                metadata: scrubObject({ agent_id: agentId, updated_fields: Object.keys(policies) })
            });
        }

        return NextResponse.json({ success: true, agent });

    } catch (error) {
        console.error('Error updating agent:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { agentId } = params;
        const supabase = createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) return NextResponse.json({ error: 'Organization not found' }, { status: 400 });

        // Fetch agent name before deletion for the audit log
        const { data: agent } = await supabase
            .from('ai_agents')
            .select('name')
            .eq('id', agentId)
            .eq('organization_id', profile.organization_id)
            .single();

        if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

        // Delete agent — the BEFORE DELETE trigger (fn_archive_on_delete) will
        // automatically snapshot the full agent record into archive_items
        const { error: deleteError } = await supabase
            .from('ai_agents')
            .delete()
            .eq('id', agentId)
            .eq('organization_id', profile.organization_id);

        if (deleteError) throw deleteError;

        // Log the deletion to the audit trail
        await supabase.from('activity_logs').insert({
            organization_id: profile.organization_id,
            actor_id: user.id,
            action_type: 'AGENT_DELETED',
            summary: scrubText(`Agent "${agent.name}" was permanently deleted and archived`),
            metadata: scrubObject({ agent_id: agentId, agent_name: agent.name })
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting agent:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
