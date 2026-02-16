
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
                    role,
                    social_profiles
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

        // Fetch Recent Activity (Limit 10 for better mix)
        const slackChannelIds = channels.filter(c => c.integrations?.provider === 'slack' || c.type === 'channel').map(c => c.external_id).filter(Boolean);
        const repoNames = channels.filter(c => c.integrations?.provider === 'github' || c.type === 'repo').map(c => c.name).filter(Boolean);

        let recentActivity = [];
        let orConditions = [];

        if (slackChannelIds.length > 0) {
            // metadata->>slack_channel equals any of the IDs
            // Since we can't easily use .in with JSON arrow operator in basic postgrest unless properly escaped or using filter
            // Let's use chained ORs for now or a different approach if list is long.
            // Actually, querying JSONB array/values is best done with containment if possible, but here we want "field equals value"
            // Let's use the .or syntax with comma separation

            // Limit to first 10 channels to avoid URL length issues for now if many channels
            const safeIds = slackChannelIds.slice(0, 10);
            const slackFilter = safeIds.map(id => `metadata->>slack_channel.eq.${id}`).join(',');
            if (slackFilter) orConditions.push(slackFilter);
        }

        if (repoNames.length > 0) {
            const safeRepos = repoNames.slice(0, 10);
            const repoFilter = safeRepos.map(name => `metadata->>repo.eq.${name}`).join(',');
            if (repoFilter) orConditions.push(repoFilter);
        }

        if (orConditions.length > 0) {
            const finalOr = orConditions.join(',');
            const { data: logs } = await supabase
                .from('activity_logs')
                .select(`
                    *,
                    profiles:actor_id (full_name, email, avatar_url)
                `)
                .or(finalOr)
                .order('created_at', { ascending: false })
                .limit(50); // Increased limit for better mix
            recentActivity = logs || [];
        } else {
            // Fallback: Query by resource_id if no external IDs/Names
            const channelIds = channels.map(c => c.id);
            if (channelIds.length > 0) {
                const { data: logs } = await supabase
                    .from('activity_logs')
                    .select('*, profiles:actor_id(*)')
                    .in('resource_id', channelIds)
                    .order('created_at', { ascending: false })
                    .limit(50);
                recentActivity = logs || [];
            }
        }

        // Fetch Audit Scopes (from settings or defaults)
        const scopes = team.settings?.scopes || ['Channel Audit', 'Documentation Audit', 'Email Audit', 'Reports & Exports'];

        // Compute unique integrations
        const uniqueIntegrations = [...new Set(channels.map(c => c.integrations?.provider || (c.type === 'channel' ? 'slack' : 'teams')).filter(Boolean))];

        // Construct Response
        const fullTeam = {
            ...team,
            members: members.map(m => ({
                id: m.profiles?.id || m.user_id,
                name: m.profiles?.full_name || m.profiles?.email || 'Unknown',
                email: m.profiles?.email || '',
                role: m.role, // 'lead' or 'member'
                avatar: m.profiles?.avatar_url || '',
                joined_at: m.joined_at,
                social_profiles: m.profiles?.social_profiles || {}
            })),
            channels: channels.map(c => ({
                id: c.id,
                name: c.name,
                platform: c.integrations?.provider || (c.type === 'channel' ? 'slack' : c.type === 'repo' ? 'github' : 'other'),
                decisionsCount: c.decisionsCount,
                external_id: c.external_id
            })),
            integrations: [...new Set(channels.map(c => c.integrations?.provider || (c.type === 'channel' ? 'slack' : c.type === 'repo' ? 'github' : null)).filter(Boolean))],
            recentActivity: recentActivity.map(a => {
                const channel = channels.find(c =>
                    (c.integrations?.provider === 'slack' && c.external_id === a.metadata?.slack_channel) ||
                    (c.integrations?.provider === 'github' && c.name === a.metadata?.repo)
                );
                const channelName = channel?.name || 'Unknown';
                const actorName = a.profiles?.full_name || 'System';
                const actionType = a.action_type || 'Activity';

                return {
                    id: a.id,
                    description: a.summary || actionType,
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
