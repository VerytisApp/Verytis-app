import { NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';
import { createClient } from '@/lib/supabase/server';
import { getValidToken } from '@/lib/auth-util';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'team'; // 'team' or 'personal'

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const targetOrgId = profile.organization_id;
    let integration_id = null;

    try {
        const { token, id } = await getValidToken('slack', type, {
            userId: user.id,
            organizationId: targetOrgId
        });
        integration_id = id;

        if (!token) {
            console.warn('[API SLACK CHANNELS] Final Token NOT found. Falling back to monitored_resources cache.');
            const { data: existing } = await supabase.from('monitored_resources')
                .select('*')
                .eq('type', 'channel');

            return NextResponse.json({
                channels: (existing || []).map(c => ({ id: c.external_id, name: c.name, num_members: 0 }))
            });
        }

        const client = new WebClient(token);
        let channels = [];
        let usersList = [];
        
        try {
            console.log(`[API SLACK CHANNELS] Initiating API calls for ID: ${integration_id}`);
            
            // 1. Fetch Conversations
            let convRes = await client.conversations.list({
                types: 'public_channel,private_channel,im,mpim',
                limit: 1000,
                exclude_archived: true
            }).catch(async (e) => {
                if (e.message?.includes('missing_scope')) {
                    console.warn('[API SLACK CHANNELS] conversations.list failed with missing_scope. Retrying with public_channel only.');
                    return await client.conversations.list({
                        types: 'public_channel',
                        limit: 1000,
                        exclude_archived: true
                    }).catch(e2 => {
                        console.error('[API SLACK CHANNELS] Fallback failed:', e2.message);
                        return { ok: false, error: e2.message };
                    });
                }
                console.warn('[API SLACK CHANNELS] conversations.list thrown:', e.message);
                return { ok: false, error: e.message };
            });

            if (convRes.ok) {
                channels = convRes.channels.map(c => ({
                    id: c.id,
                    name: c.name || (c.is_im ? 'Message Direct' : c.id),
                    is_private: c.is_private,
                    is_im: c.is_im,
                    is_mpim: c.is_mpim,
                    user: c.user,
                    num_members: c.num_members || 0
                }));
            }

            // 2. Fetch Users (Isolated to prevent crash if scope missing)
            try {
                const usersRes = await client.users.list({ limit: 1000 });
                if (usersRes.ok) {
                    usersList = usersRes.members
                        .filter(m => !m.is_bot && !m.deleted && m.name !== 'slackbot')
                        .map(m => ({
                            id: m.id,
                            name: m.real_name || m.name,
                            is_im: true,
                            is_user: true,
                            status_text: m.profile?.status_text,
                            image: m.profile?.image_48
                        }));
                    console.log(`[API SLACK CHANNELS] Found ${usersList.length} workspace users.`);
                } else {
                    console.warn(`[API SLACK CHANNELS] users.list failed: ${usersRes.error}`);
                }
            } catch (uErr) {
                console.error('[API SLACK CHANNELS] users.list runtime error:', uErr.message);
            }

        } catch (error) {
            console.error('[API SLACK CHANNELS] Outer fetch error:', error.message);
        }

        // 3. Resolve names for IMs using usersList
        const userMap = new Map(usersList.map(u => [u.id, u.name]));
        
        channels = channels.map(c => {
            if (c.is_im && c.user && userMap.has(c.user)) {
                return { ...c, name: userMap.get(c.user) };
            }
            return c;
        });

        // Merge users as virtual IM targets if not already present in channels
        const existingImUserIds = new Set(channels.filter(c => c.is_im).map(c => c.user).filter(Boolean));
        const virtualIms = usersList.filter(u => !existingImUserIds.has(u.id));
        
        const allTargets = [...channels, ...virtualIms];

        return NextResponse.json({ 
            channels: allTargets,
            meta: {
                has_users: usersList.length > 0,
                needs_reconnect: !usersList.length && channels.length > 0 // Heuristic for older tokens
            }
        });

    } catch (error) {
        console.error('[API SLACK CHANNELS] Slack API Critical Error:', error.message);
        
        // Final Fallback: DB records
        if (integration_id) {
            const { data: existing } = await supabase.from('monitored_resources')
                .select('*')
                .eq('integration_id', integration_id)
                .eq('type', 'channel');

            return NextResponse.json({
                channels: (existing || []).map(c => ({ id: c.external_id, name: c.name, num_members: 0 }))
            });
        } else {
            // If integration_id is not available, return an empty array or a more generic error
            return NextResponse.json({ channels: [] });
        }
    }
}
