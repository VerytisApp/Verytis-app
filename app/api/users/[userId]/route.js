
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
    const { userId } = await params;

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { data: user, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        const { data: permissions } = await supabase
            .from('user_permissions')
            .select('permission_key')
            .eq('user_id', userId)
            .eq('is_enabled', true);

        if (error) throw error;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Transform for frontend
        const formattedUser = {
            id: user.id,
            name: user.full_name || user.email.split('@')[0],
            email: user.email,
            avatar: user.avatar_url,
            role: user.role || 'Member',
            status: user.status || 'Active',
            title: user.job_title || 'Team Member',
            initials: (user.full_name || user.email).slice(0, 2).toUpperCase(),
            // Permissions from DB
            auditEnabled: true,
            scopes: permissions ? permissions.map(p => p.permission_key) : []
        };

        return NextResponse.json({ user: formattedUser });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    const { userId } = await params;
    const body = await req.json();

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // Map frontend fields to DB fields if necessary
        const updates = {};
        if (body.name) updates.full_name = body.name;
        if (body.role) updates.role = body.role.toLowerCase(); // Ensure enum match if case sensitive
        if (body.status) updates.status = body.status.toLowerCase();
        // if (body.scopes) updates.scopes = body.scopes; // Removed: profiles table does not have scopes column
        // Scopes are handled via user_permissions table below

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        // Handle Scopes Update (user_permissions)
        if (body.scopes) {
            // 1. Remove existing permissions for this user
            const { error: deleteError } = await supabase
                .from('user_permissions')
                .delete()
                .eq('user_id', userId);

            if (deleteError) console.error("Error clearing old permissions:", deleteError);

            // 2. Insert new permissions
            if (body.scopes.length > 0) {
                const newPermissions = body.scopes.map(scope => ({
                    user_id: userId,
                    permission_key: scope,
                    is_enabled: true
                }));

                const { error: insertError } = await supabase
                    .from('user_permissions')
                    .insert(newPermissions);

                if (insertError) console.error("Error inserting new permissions:", insertError);
            }
        }

        // 1. Upgrade/Manager assignment: Assign to Team as Lead
        // Support both old `assignTeamId` and new standard `teamId` from frontend
        const targetTeamId = body.teamId || body.assignTeamId;
        if (targetTeamId && body.role === 'manager') {
            const { error: teamError } = await supabase
                .from('team_members')
                .upsert({
                    team_id: targetTeamId,
                    user_id: userId,
                    role: 'lead'
                }, { onConflict: 'team_id,user_id' });

            if (teamError) console.error("Error assigning manager to team:", teamError);
        }

        // 2. Downgrade Case: Revoke Lead Status (set to member) from ALL teams
        if (body.isDowngrade) {
            const { error: teamError } = await supabase
                .from('team_members')
                .update({ role: 'member' })
                .eq('user_id', userId)
                .eq('role', 'lead');

            if (teamError) console.error("Error revoking manager roles:", teamError);
        }

        return NextResponse.json({ user: data });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const { userId } = await params;

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // In a real app, we might soft delete or just remove from org. 
        // For compliance/admin console, hard delete via Supabase Admin is powerful.
        // NOTE: This deletes the PROFILE. If using Supabase Auth, the Auth User remains unless triggered.
        // Ideally we should delete from auth.users via server-side admin API, but that requires different permissions.
        // For this table-based approach:

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
