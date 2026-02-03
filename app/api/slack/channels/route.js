import { NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';

export async function GET() {
    // 1. Retrieve Token from DB ("Test Corp" Context)
    const TEST_ORG_ID = '5db477f6-c893-4ec4-9123-b12160224f70';

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: integration } = await supabase.from('integrations')
        .select('settings')
        .eq('organization_id', TEST_ORG_ID)
        .eq('provider', 'slack')
        .single();

    const token = integration?.settings?.bot_token;

    if (!token) {
        return NextResponse.json({ error: 'No Slack access token found for this organization' }, { status: 401 });
    }

    const client = new WebClient(token);

    try {
        const result = await client.conversations.list({
            types: 'public_channel,private_channel',
            limit: 100,
            exclude_archived: true
        });

        const channels = result.channels.map(c => ({
            id: c.id,
            name: c.name,
            is_private: c.is_private,
            num_members: c.num_members
        }));

        return NextResponse.json({ channels });
    } catch (error) {
        console.error('Slack Channels Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
