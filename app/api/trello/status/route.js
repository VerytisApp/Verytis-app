import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/trello/status?teamId=<uuid>
 * 
 * Check if Trello is connected for the given team/org.
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    let organizationId = searchParams.get('organizationId');
    const teamId = searchParams.get('teamId');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (!organizationId && teamId) {
        const { data } = await supabase.from('teams').select('organization_id').eq('id', teamId).single();
        if (data) organizationId = data.organization_id;
    }

    const targetOrgId = organizationId || '5db477f6-c893-4ec4-9123-b12160224f70';

    const { data } = await supabase.from('integrations')
        .select('id, settings, name')
        .eq('organization_id', targetOrgId)
        .eq('provider', 'trello')
        .single();

    const isConnected = !!(data && data.settings?.api_token);

    return NextResponse.json({
        connected: isConnected,
        name: data?.name || null,
        lastSync: isConnected ? new Date().toISOString() : null
    });
}
