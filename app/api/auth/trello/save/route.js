import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/trello/save
 * 
 * Saves the Trello token to the integrations table.
 * Called by the callback page after extracting the token from the URL fragment.
 */
export async function POST(req) {
    try {
        const { token, userId, organizationId, selectedOrgId } = await req.json();

        if (!token || !userId || !organizationId) {
            return NextResponse.json({ error: 'Missing token, userId or organizationId' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Fetch Trello member info for IDs and basic data
        let member = {};
        let displayName = 'Trello Workspace';
        
        try {
            const memberRes = await fetch(`https://api.trello.com/1/members/me?key=${process.env.TRELLO_API_KEY}&token=${token}`);
            if (memberRes.ok) {
                member = await memberRes.json();
            }

            // ALWAYS USE WORKSPACE NAME FOR UNIFIED CONNECTION
            const orgRes = await fetch(`https://api.trello.com/1/members/me/organizations?key=${process.env.TRELLO_API_KEY}&token=${token}&fields=displayName,name`);
            if (orgRes.ok) {
                const orgs = await orgRes.json();
                if (orgs && orgs.length > 0) {
                    const targetOrg = selectedOrgId ? orgs.find(o => o.id === selectedOrgId) : orgs[0];
                    displayName = targetOrg?.displayName || targetOrg?.name || orgs[0].displayName || orgs[0].name;
                }
            }
        } catch (err) {
            console.warn(`⚠️ Trello data lookup error:`, err.message);
        }

        const connectionData = {
            user_id: userId,
            organization_id: organizationId,
            provider: 'trello',
            connection_type: 'team',
            scope: 'team',
            account_name: displayName,
            access_token: token,
            metadata: {
                trello_id: member.id,
                username: member.username,
                full_name: member.fullName,
                selected_org_id: selectedOrgId || null,
                is_workspace: true,
                avatar_url: member.avatarUrl ? `https://trello-members.s3.amazonaws.com/${member.id}/${member.avatarHash}/170.png` : null,
                connected_at: new Date().toISOString()
            }
        };

        console.log('[API TRELLO] Attempting upsert to user_connections:', {
            user_id: userId,
            organization_id: organizationId,
            provider: 'trello'
        });

        // Unify connection conflict: only one Trello per organization
        // Manual safe upsert to bypass missing unique constraint in DB
        const { data: existing } = await supabase.from('user_connections')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('provider', 'trello')
            .maybeSingle();

        let upsertError = null;
        if (existing) {
            console.log(`[API TRELLO] Updating existing connection: ${existing.id}`);
            const { error } = await supabase.from('user_connections')
                .update(connectionData)
                .eq('id', existing.id);
            upsertError = error;
        } else {
            console.log('[API TRELLO] Inserting new connection');
            const { error } = await supabase.from('user_connections')
                .insert(connectionData);
            upsertError = error;
        }

        if (upsertError) {
            console.error('❌ [API TRELLO] Upsert error:', upsertError);
            throw new Error(`Database upsert failed: ${upsertError.message}`);
        }

        return NextResponse.json({ success: true, username: member.username || 'Trello User' });
    } catch (err) {
        console.error('Trello save error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
