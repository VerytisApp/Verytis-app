
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
    const { teamId } = await params;
    const { channelId } = await req.json();

    if (!teamId || !channelId) {
        return NextResponse.json({ error: 'Team ID and Channel ID are required' }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { data, error } = await supabase
            .from('monitored_resources')
            .update({ team_id: teamId })
            .eq('id', channelId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ channel: data });
    } catch (error) {
        console.error('Error linking channel:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const { teamId } = await params;
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');

    if (!teamId || !channelId) {
        return NextResponse.json({ error: 'Team ID and Channel ID are required' }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { error } = await supabase
            .from('monitored_resources')
            .update({ team_id: null }) // Unlink by setting team_id to null
            .eq('id', channelId)
            .eq('team_id', teamId); // Ensure we only unlink if it belongs to this team

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error unlinking channel:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
