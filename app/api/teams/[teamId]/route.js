
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    const { teamId } = await params;

    if (!teamId) return NextResponse.json({ error: 'Team ID required' }, { status: 400 });

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // Fetch Team Details
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .eq('id', teamId)
            .single();

        if (teamError) throw teamError;
        if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

        // Fetch Members
        const { data: members, error: membersError } = await supabase
            .from('team_members')
            .select(`
                *,
                user:public.profiles(*)
            `)
            .eq('team_id', teamId);

        if (membersError) throw membersError;

        // Fetch Channels (Monitored Resources linked to this team)
        const { data: channels, error: channelsError } = await supabase
            .from('monitored_resources')
            .select('*')
            .eq('team_id', teamId);

        if (channelsError) throw channelsError;

        // Fetch Audit Scopes (from settings or defaults)
        // Mocking for now as it's not fully defined in schema
        const scopes = team.settings?.scopes || ['audit', 'docs', 'export'];

        // Construct Response
        const fullTeam = {
            ...team,
            members: members.map(m => ({
                id: m.user.id,
                name: m.user.full_name || m.user.email,
                email: m.user.email,
                role: m.role, // 'lead' or 'member'
                avatar: m.user.avatar_url,
                joined_at: m.joined_at
            })),
            channels: channels.map(c => ({
                id: c.id,
                name: c.name,
                platform: 'slack', // Assuming mainly slack for now, or derive from type
                decisionsConfig: c.metadata?.decisions_count || 12, // Mock or metadata
                external_id: c.external_id
            })),
            scopes,
            stats: {
                members: members.length,
                channels: channels.length,
                managers: members.filter(m => m.role === 'lead').length
            }
        };

        return NextResponse.json({ team: fullTeam });

    } catch (error) {
        console.error('Error fetching team details:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    const { teamId } = await params;
    const body = await req.json();

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { data, error } = await supabase
            .from('teams')
            .update(body)
            .eq('id', teamId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ team: data });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const { teamId } = await params;
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { error } = await supabase
            .from('teams')
            .delete()
            .eq('id', teamId);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
