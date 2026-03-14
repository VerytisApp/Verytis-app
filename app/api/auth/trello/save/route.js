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
        const { token, userId, type, organizationId } = await req.json();

        if (!token || !userId) {
            return NextResponse.json({ error: 'Missing token or userId' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Fetch Trello member info to get username (best-effort)
        let member = {};
        try {
            const memberRes = await fetch(`https://api.trello.com/1/members/me?key=${process.env.TRELLO_API_KEY}&token=${token}`);
            const memberText = await memberRes.text();
            if (memberRes.ok && memberText.startsWith('{')) {
                member = JSON.parse(memberText);
            }
        } catch (memberErr) {
            console.warn(`⚠️ Trello member lookup error:`, memberErr.message);
        }

        if (type === 'user_link') {
            // CASE: Personal Connection (save to profiles.social_profiles)
            const { data: profile } = await supabase.from('profiles').select('social_profiles').eq('id', userId).single();
            const currentSocials = profile?.social_profiles || {};

            const updatedSocials = {
                ...currentSocials,
                trello: {
                    id: member.id,
                    username: member.username,
                    full_name: member.fullName,
                    avatar_url: member.avatarUrl ? `https://trello-members.s3.amazonaws.com/${member.id}/${member.avatarHash}/170.png` : null,
                    connected_at: new Date().toISOString(),
                    access_token: token
                }
            };

            const { error } = await supabase.from('profiles')
                .update({ social_profiles: updatedSocials })
                .eq('id', userId);

            if (error) throw error;

            return NextResponse.json({ success: true, username: member.username || 'Trello User' });

        } else {
            // CASE: Team Integration (save to integrations table)
            if (!organizationId) {
                return NextResponse.json({ error: 'Missing organizationId for Team connection' }, { status: 400 });
            }

            const { data: existing } = await supabase.from('integrations')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('provider', 'trello')
                .single();

            const integrationData = {
                organization_id: organizationId,
                provider: 'trello',
                name: member.username || member.fullName || 'Trello',
                external_id: member.id || `token_${token.substring(0, 16)}`,
                settings: {
                    api_token: token,
                    api_key: process.env.TRELLO_API_KEY,
                    username: member.username || null,
                    full_name: member.fullName || null,
                    avatar_url: member.avatarUrl ? `https://trello-members.s3.amazonaws.com/${member.id}/${member.avatarHash}/170.png` : null,
                    connected_at: new Date().toISOString()
                }
            };

            let dbResult;
            if (existing) {
                dbResult = await supabase.from('integrations').update(integrationData).eq('id', existing.id);
            } else {
                dbResult = await supabase.from('integrations').insert(integrationData);
            }

            if (dbResult.error) throw dbResult.error;

            console.log('✅ Trello Team integration saved to DB');
            return NextResponse.json({ success: true, username: member.username || 'Trello' });
        }
    } catch (err) {
        console.error('Trello save error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
