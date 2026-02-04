
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // Fetch teams with member counts and channel counts
        // Since Supabase doesn't support complex joins/counts easily in one go without views or RPC,
        // we might do it in 2 steps or just fetch raw data.

        // Let's fetch teams first
        const { data: teams, error } = await supabase
            .from('teams')
            .select(`
                *,
                team_members (count),
                monitored_resources (count)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data
        const formattedTeams = teams.map(team => ({
            id: team.id,
            name: team.name,
            description: team.description,
            type: team.type || 'Operational',
            status: 'Active', // Default status unless we add a column
            members: team.team_members?.[0]?.count || 0,
            channels: team.monitored_resources?.[0]?.count || 0,
            created_at: team.created_at,
            scopes: team.settings?.scopes || []
        }));

        return NextResponse.json({ teams: formattedTeams });
    } catch (error) {
        console.error('Error fetching teams:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const body = await req.json();
        const { name, description, type, organization_id, members, channels, scopes } = body;

        console.log('Creating team with:', { name, type, members: members?.length, channels: channels?.length, scopes });

        // Basic validation
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        // Get Org ID
        let orgId = organization_id;
        if (!orgId) {
            // Fallback for dev: use the Test Corp ID or fetch first available
            orgId = '5db477f6-c893-4ec4-9123-b12160224f70';
        }

        // Prepare settings with scopes
        const settings = {
            scopes: scopes || []
        };

        // 1. Create Team
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .insert([{
                name,
                description,
                type: type || 'operational',
                organization_id: orgId,
                settings
            }])
            .select()
            .single();

        if (teamError) throw teamError;

        const teamId = team.id;

        // 2. Add Members (if any)
        if (members && members.length > 0) {
            console.log('Adding members:', members);
            const membersToInsert = members.map(member => {
                // Map role: 'Manager' -> 'lead', anything else -> 'member'
                let role = (member.role || 'member').toLowerCase();
                if (role === 'manager') role = 'lead';

                return {
                    team_id: teamId,
                    user_id: member.id,
                    role
                };
            });

            console.log('Members to insert:', membersToInsert);

            const { error: membersError } = await supabase
                .from('team_members')
                .insert(membersToInsert);

            if (membersError) {
                console.error("Error adding members:", membersError);
            } else {
                console.log(`✅ Successfully added ${membersToInsert.length} members`);
            }
        } else {
            console.log('No members to add');
        }

        // 3. Link Channels (if any)
        if (channels && channels.length > 0) {
            const { error: channelsError } = await supabase
                .from('monitored_resources')
                .update({ team_id: teamId })
                .in('id', channels); // channels should be array of IDs

            if (channelsError) console.error("Error linking channels:", channelsError);
        }

        return NextResponse.json({ team });
    } catch (error) {
        console.error('Error creating team:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
