import { NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';

export async function GET() {
    // In a real app, retrieve the token from DB based on current user's org.
    const token = process.env.SLACK_BOT_TOKEN;

    if (!token) {
        return NextResponse.json({ error: 'Not configured' }, { status: 401 });
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
