import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WebClient } from '@slack/web-api';

export async function GET(req, { params }) {
    const { channelId } = params; // This is the monitored_resource ID (UUID)
    const TEST_ORG_ID = '5db477f6-c893-4ec4-9123-b12160224f70';

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // 1. Get the monitored resource to find external_id (Slack channel ID)
        const { data: resource } = await supabase.from('monitored_resources')
            .select('external_id, integration_id')
            .eq('id', channelId)
            .single();

        if (!resource) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
        }

        // 2. Get Slack token from integration
        const { data: integration } = await supabase.from('integrations')
            .select('settings')
            .eq('id', resource.integration_id)
            .single();

        if (!integration?.settings?.bot_token) {
            return NextResponse.json({ error: 'No Slack token' }, { status: 401 });
        }

        const client = new WebClient(integration.settings.bot_token);

        // 3. Get channel members from Slack
        const membersResult = await client.conversations.members({
            channel: resource.external_id,
            limit: 100
        });

        if (!membersResult.members || membersResult.members.length === 0) {
            return NextResponse.json({ members: [] });
        }

        // 4. Get user info for each member
        const members = [];
        for (const userId of membersResult.members.slice(0, 20)) { // Limit to 20 for performance
            try {
                const userInfo = await client.users.info({ user: userId });
                if (userInfo.user && !userInfo.user.is_bot) {
                    members.push({
                        id: userInfo.user.id,
                        name: userInfo.user.real_name || userInfo.user.name,
                        email: userInfo.user.profile?.email || null,
                        title: userInfo.user.profile?.title || 'Team Member',
                        avatar: userInfo.user.profile?.image_48 || null,
                        initials: (userInfo.user.real_name || userInfo.user.name || 'U')
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2),
                        isConnected: false // TODO: Check if user exists in profiles table
                    });
                }
            } catch (e) {
                console.error('Error fetching user', userId, e.message);
            }
        }

        return NextResponse.json({
            members,
            total: membersResult.members.length
        });

    } catch (error) {
        console.error('Channel Members Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
