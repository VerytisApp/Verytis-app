
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

        // Fetch Members - Robust Query with logging
        const { data: members, error: membersError } = await supabase
            .from('team_members')
            .select(`
                *,
                profiles:user_id (
                    id,
                    full_name,
                    email,
                    avatar_url,
                    role
                )
            `)
            .eq('team_id', teamId);

        if (membersError) {
            console.error("DEBUG: Error fetching team members:", membersError);
            throw membersError;
        } else {
            // console.log(`DEBUG: Found ${members?.length} members for team ${teamId}`);
        }

        // Sort members: Leads (Managers) first, then by name
        members.sort((a, b) => {
            const roleA = a.role === 'lead' ? 0 : 1;
            const roleB = b.role === 'lead' ? 0 : 1;
            if (roleA !== roleB) return roleA - roleB;

            const nameA = a.profiles?.full_name || '';
            const nameB = b.profiles?.full_name || '';
            return nameA.localeCompare(nameB);
        });

        // Fetch Channels (Monitored Resources linked to this team)
        // Fetch Channels (Monitored Resources linked to this team)
        const { data: channelsRaw, error: channelsError } = await supabase
            .from('monitored_resources')
            .select(`
                *,
                integrations (provider)
            `)
            .eq('team_id', teamId);

        if (channelsError) throw channelsError;

        // Fetch Decision Counts & Map Channels
        const channels = await Promise.all((channelsRaw || []).map(async (c) => {
            let count = 0;
            if (c.external_id) {
                const { count: decisionCount } = await supabase
                    .from('activity_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('metadata->>slack_channel', c.external_id)
                    .in('action_type', ['APPROVE', 'REJECT', 'TRANSFER', 'EDIT', 'ARCHIVE']); // Filter for "Decisions"
                count = decisionCount || 0;
            }
            return {
                ...c,
                decisionsCount: count
            };
        }));

        // Fetch Recent Activity (Limit 5)
        const externalIds = channels.map(c => c.external_id).filter(Boolean);
        let recentActivity = [];

        if (externalIds.length > 0) {
            const orFilter = externalIds.map(id => `metadata->>slack_channel.eq.${id}`).join(',');

            const { data: logs } = await supabase
                .from('activity_logs')
                .select(`
                    *,
                    profiles:actor_id (full_name, email, avatar_url)
                `)
                .or(orFilter)
                .order('created_at', { ascending: false })
                .limit(5);
            recentActivity = logs || [];
        } else {
            const channelIds = channels.map(c => c.id);
            if (channelIds.length > 0) {
                const { data: logs } = await supabase
                    .from('activity_logs')
                    .select('*, profiles:actor_id(*)')
                    .in('resource_id', channelIds)
                    .order('created_at', { ascending: false })
                    .limit(5);
                recentActivity = logs || [];
            }
        }

        // Fetch Audit Scopes (from settings or defaults)
        const scopes = team.settings?.scopes || ['Channel Audit', 'Documentation Audit', 'Email Audit', 'Reports & Exports'];

        // Construct Response
        const fullTeam = {
            ...team,
            members: members.map(m => ({
                id: m.profiles?.id || m.user_id,
                name: m.profiles?.full_name || m.profiles?.email || 'Unknown',
                email: m.profiles?.email || '',
                role: m.role, // 'lead' or 'member'
                avatar: m.profiles?.avatar_url || '',
                joined_at: m.joined_at
            })),
            channels: channels.map(c => ({
                id: c.id,
                name: c.name,
                platform: c.integrations?.provider || (c.type === 'slack_channel' ? 'slack' : 'teams'),
                decisionsCount: c.decisionsCount,
                external_id: c.external_id
            })),
            recentActivity: recentActivity.map(a => {
                const channel = channels.find(c => c.external_id === a.metadata?.slack_channel);
                const channelName = channel?.name || 'Unknown';
                const actorName = a.profiles?.full_name || 'System';
                const actionType = a.action_type || 'Activity';

                return {
                    id: a.id,
                    description: `${a.details?.message || a.details?.text || actionType}`,
                    user: {
                        name: actorName,
                        avatar: a.profiles?.avatar_url
                    },
                    time: a.created_at,
                    channel: channelName,
                    actionType: actionType
                };
            }),
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
