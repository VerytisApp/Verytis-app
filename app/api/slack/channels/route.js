import { NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';
import { createClient } from '@/lib/supabase/server';
import { getValidToken } from '@/lib/auth-util';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const supabase = createClient();
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

    try {
        const { token, id: integration_id } = await getValidToken('slack', type, {
            userId: user.id,
            organizationId: targetOrgId
        });

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
        let result;
        try {
            result = await client.conversations.list({
                types: 'public_channel,private_channel,im,mpim',
                limit: 200,
                exclude_archived: true
            });
        } catch (e) {
            if (e.message.includes('missing_scope')) {
                result = await client.conversations.list({
                    types: 'public_channel',
                    limit: 200,
                    exclude_archived: true
                });
            } else {
                throw e;
            }
        }

        if (!result.ok) throw new Error(result.error);

        let channels = result.channels.map(c => ({
            id: c.id,
            name: c.name || (c.is_im ? 'Message Direct' : c.id),
            is_private: c.is_private,
            is_im: c.is_im,
            is_mpim: c.is_mpim,
            num_members: c.num_members || 0
        }));

        // Fallback for limited scopes: only show channels where the bot is invited
        if (channels.length === 0) {
            const memberResult = await client.users.conversations({
                types: 'public_channel,private_channel',
                limit: 200
            });
            if (memberResult.ok && memberResult.channels?.length > 0) {
                channels = memberResult.channels.map(c => ({
                    id: c.id,
                    name: c.name || c.id,
                    is_private: c.is_private,
                    is_im: false,
                    is_mpim: false,
                    num_members: c.num_members || 0
                }));
            }
        }

        return NextResponse.json({ channels });

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
