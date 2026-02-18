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

    // Fetch workspace name from Trello API (organization name)
    let workspaceName = data?.settings?.username || data?.name || null;

    if (isConnected && data.settings?.api_token) {
        try {
            const API_KEY = process.env.TRELLO_API_KEY;
            const token = data.settings.api_token;

            // First, try to get organizations
            const orgRes = await fetch(`https://api.trello.com/1/members/me/organizations?key=${API_KEY}&token=${token}&fields=displayName,name`, {
                headers: { 'Accept': 'application/json' }
            });

            if (orgRes.ok) {
                const orgs = await orgRes.json();
                if (orgs && orgs.length > 0) {
                    // Use first organization's display name
                    workspaceName = orgs[0].displayName || orgs[0].name;
                } else {
                    // Fallback: if no org, get member's full name
                    const memberRes = await fetch(`https://api.trello.com/1/members/me?key=${API_KEY}&token=${token}&fields=fullName,username`, {
                        headers: { 'Accept': 'application/json' }
                    });
                    if (memberRes.ok) {
                        const member = await memberRes.json();
                        workspaceName = member.fullName || member.username;
                    }
                }
            }
        } catch (e) {
            console.error('Failed to fetch Trello workspace name:', e);
            // Fall back to stored username
        }
    }

    return NextResponse.json({
        connected: isConnected,
        name: workspaceName,
        lastSync: isConnected ? new Date().toISOString() : null
    });
}
