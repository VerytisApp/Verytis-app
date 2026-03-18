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
        const { token, userId, type, organizationId, selectedOrgId, selectedOrgName } = await req.json();

        if (!token || !userId) {
            return NextResponse.json({ error: 'Missing token or userId' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Fetch Trello member info for IDs and basic data
        let member = {};
        let displayName = 'Trello User';
        
        try {
            const memberRes = await fetch(`https://api.trello.com/1/members/me?key=${process.env.TRELLO_API_KEY}&token=${token}`);
            if (memberRes.ok) {
                member = await memberRes.json();
                displayName = member.fullName || member.username;
            }

            // FOR TEAM CONNECTIONS: MUST USE WORKSPACE NAME
            if (type !== 'user_link') {
                const orgRes = await fetch(`https://api.trello.com/1/members/me/organizations?key=${process.env.TRELLO_API_KEY}&token=${token}&fields=displayName,name`);
                if (orgRes.ok) {
                    const orgs = await orgRes.json();
                    if (orgs && orgs.length > 0) {
                        // Use the selected one or the first available
                        const targetOrg = selectedOrgId ? orgs.find(o => o.id === selectedOrgId) : orgs[0];
                        displayName = targetOrg?.displayName || targetOrg?.name || orgs[0].displayName || orgs[0].name;
                    } else {
                        // If no org found but it's a team link, mark it as Workspace
                        displayName = 'Trello Workspace';
                    }
                }
            }
        } catch (err) {
            console.warn(`⚠️ Trello data lookup error:`, err.message);
        }

        // MIGRATION: Centralized saving to user_connections
        const isPersonal = type === 'user_link';
        const connectionData = {
            user_id: userId,
            organization_id: organizationId || null,
            provider: 'trello',
            connection_type: isPersonal ? 'personal' : 'team',
            account_name: displayName, // Strictly the Workspace name for Team, or User name for Perso
            access_token: token,
            metadata: {
                trello_id: member.id,
                username: member.username,
                full_name: member.fullName,
                selected_org_id: selectedOrgId || null,
                is_workspace: !isPersonal,
                avatar_url: member.avatarUrl ? `https://trello-members.s3.amazonaws.com/${member.id}/${member.avatarHash}/170.png` : null,
                connected_at: new Date().toISOString()
            }
        };

        console.log('[API TRELLO] Attempting upsert to user_connections:', {
            user_id: userId,
            provider: 'trello',
            type: connectionData.connection_type
        });

        const { error: upsertError } = await supabase.from('user_connections').upsert(connectionData, {
            onConflict: 'user_id, provider, connection_type'
        });

        if (upsertError) {
            console.error('❌ [API TRELLO] Upsert error:', upsertError);
            
            // FALLBACK: If 'account_name' is missing, try 'external_account_name'
            if (upsertError.message?.includes('account_name')) {
                console.log('⚠️ [API TRELLO] "account_name" missing, falling back to "external_account_name"');
                const fallbackData = { ...connectionData };
                fallbackData.external_account_name = fallbackData.account_name;
                delete fallbackData.account_name;

                const { error: fallbackError } = await supabase.from('user_connections').upsert(fallbackData, {
                    onConflict: 'user_id, provider, connection_type'
                });

                if (fallbackError) {
                    console.error('❌ [API TRELLO] Fallback upsert also failed:', fallbackError);
                    throw new Error(`Database upsert failed (both column attempts): ${fallbackError.message}`);
                }
                console.log('✅ [API TRELLO] Connection saved successfully (fallback column)');
            } else {
                throw new Error(`Database upsert failed: ${upsertError.message}`);
            }
        } else {
            console.log('✅ [API TRELLO] Connection saved successfully');
        }

        return NextResponse.json({ success: true, username: member.username || 'Trello User' });
    } catch (err) {
        console.error('Trello save error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
