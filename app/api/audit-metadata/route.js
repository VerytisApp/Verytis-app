import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const dynamic = 'force-dynamic';

export async function GET() {
    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Fetch Resources (Channels) with Team Info
        const { data: resources, error: resError } = await supabase
            .from('monitored_resources')
            .select('*, teams ( id, name )');

        if (resError) throw resError;

        // Fetch Teams
        const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('id, name');

        if (teamsError) throw teamsError;

        return NextResponse.json({
            resources: resources || [],
            teams: teams || []
        });

    } catch (error) {
        console.error('Error fetching audit metadata:', error);
        return NextResponse.json({ error: 'Failed to fetch audit metadata' }, { status: 500 });
    }
}
