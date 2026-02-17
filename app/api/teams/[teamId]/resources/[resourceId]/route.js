import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(req, { params }) {
    const { teamId, resourceId } = await params;

    if (!teamId || !resourceId) {
        return NextResponse.json({ error: 'Team ID and Resource ID required' }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // Validate ownership/existence before delete? 
        // Or just delete where ID and TeamID match
        const { error } = await supabase
            .from('monitored_resources')
            .delete()
            .eq('id', resourceId)
            .eq('team_id', teamId); // Ensure we only delete from this team

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting resource:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
