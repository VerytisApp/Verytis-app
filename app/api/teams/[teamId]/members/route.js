
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
    const { teamId } = await params;
    const { userId, role } = await req.json();

    if (!teamId || !userId) {
        return NextResponse.json({ error: 'Team ID and User ID are required' }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { data, error } = await supabase
            .from('team_members')
            .insert([{
                team_id: teamId,
                user_id: userId,
                role: role || 'Member'
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ member: data });
    } catch (error) {
        console.error('Error adding member:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const { teamId } = await params;
    // Extract userId from query params or body. DELETE with body is discouraged but supported by some.
    // Better to use URL query param ?userId=...
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!teamId || !userId) {
        return NextResponse.json({ error: 'Team ID and User ID are required' }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing member:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    const { teamId } = await params;
    const { userId, role } = await req.json();

    if (!teamId || !userId || !role) {
        return NextResponse.json({ error: 'Team ID, User ID, and Role are required' }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // 1. Update team member role
        const { data: memberData, error: memberError } = await supabase
            .from('team_members')
            .update({ role: role })
            .eq('team_id', teamId)
            .eq('user_id', userId)
            .select()
            .single();

        if (memberError) throw memberError;

        // 2. Sync Global Profile Role
        // Logic: "A manager is a manager because they manage a team"
        // If promoted to 'lead' (Team Manager), upgrade global profile to 'manager' (if they are currently just a 'member')
        if (role === 'lead') {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ role: 'manager' })
                .eq('id', userId)
                .eq('role', 'member'); // Only upgrade if currently 'member' (don't downgrade admins)

            if (profileError) console.error("Error syncing global profile role:", profileError);
        }

        return NextResponse.json({ member: memberData });
    } catch (error) {
        console.error('Error updating member role:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
