import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req, { params }) {
    const { teamId } = await params;
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { data, error } = await supabase
            .from('monitored_resources')
            .select('*')
            .eq('team_id', teamId);

        if (error) throw error;
        return NextResponse.json({ resources: data });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req, { params }) {
    const { teamId } = await params;

    if (!teamId) {
        return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    try {
        const body = await req.json();
        const { integration_id, resource_id, resource_name, resource_type } = body;

        if (!integration_id || !resource_id || !resource_name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 1. Check if resource already exists GLOBALLY (due to unique constraint on integration_id, external_id)
        const { data: existing } = await supabase
            .from('monitored_resources')
            .select('id, team_id')
            .eq('integration_id', integration_id)
            .eq('external_id', resource_id.toString())
            .maybeSingle();

        if (existing) {
            if (existing.team_id === teamId) {
                return NextResponse.json({ error: 'Resource already added to this stack' }, { status: 409 });
            } else {
                // Option A: Transfer to this team
                // Option B: Error (Resource belongs to another team)
                // Let's go with Update/Transfer if it's currently null or just allow it to "move" to this team
                const { data: updated, error: updateError } = await supabase
                    .from('monitored_resources')
                    .update({ team_id: teamId, name: resource_name })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                return NextResponse.json({ resource: updated, message: 'Resource transferred to this stack' });
            }
        }

        // 2. Insert new resource
        const newResource = {
            team_id: teamId,
            integration_id: integration_id,
            external_id: resource_id.toString(),
            name: resource_name,
            type: (resource_type === 'github_repo' ? 'repo' : resource_type === 'slack_channel' ? 'channel' : resource_type) || 'repo',
            metadata: {},
            last_active_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('monitored_resources')
            .insert(newResource)
            .select()
            .single();

        if (error) {
            // Check for DB-level conflict just in case race condition
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Resource already added to a stack' }, { status: 409 });
            }
            throw error;
        }

        return NextResponse.json({ resource: data });

    } catch (error) {
        console.error('Error adding resource:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
