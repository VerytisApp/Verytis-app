import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/trello/save
 * 
 * Saves the Trello token to the integrations table.
 * Called by the callback page after extracting the token from the URL fragment.
 */
export async function POST(req) {
    try {
        const { token, teamId } = await req.json();

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Resolve organization_id from teamId
        let organizationId = null;
        if (teamId) {
            const { data } = await supabase.from('teams').select('organization_id').eq('id', teamId).single();
            if (data) organizationId = data.organization_id;
        }
        const targetOrgId = organizationId || '5db477f6-c893-4ec4-9123-b12160224f70';

        // Fetch Trello member info to get username
        const memberRes = await fetch(`https://api.trello.com/1/members/me?key=${process.env.TRELLO_API_KEY}&token=${token}`);
        const member = await memberRes.json();

        // Check for existing integration
        const { data: existing } = await supabase.from('integrations')
            .select('id')
            .eq('organization_id', targetOrgId)
            .eq('provider', 'trello')
            .single();

        const integrationData = {
            organization_id: targetOrgId,
            provider: 'trello',
            name: member.username || member.fullName || 'Trello',
            external_id: member.id,
            settings: {
                api_token: token,
                api_key: process.env.TRELLO_API_KEY,
                username: member.username,
                full_name: member.fullName,
                avatar_url: member.avatarUrl ? `https://trello-members.s3.amazonaws.com/${member.id}/${member.avatarHash}/170.png` : null,
                connected_at: new Date().toISOString()
            }
        };

        if (existing) {
            await supabase.from('integrations').update(integrationData).eq('id', existing.id);
        } else {
            await supabase.from('integrations').insert(integrationData);
        }

        return NextResponse.json({ success: true, username: member.username });
    } catch (err) {
        console.error('Trello save error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
