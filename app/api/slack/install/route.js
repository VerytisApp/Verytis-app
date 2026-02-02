import { NextResponse } from 'next/server';

export async function GET() {
    if (!process.env.SLACK_CLIENT_ID) {
        return NextResponse.json({ error: 'SLACK_CLIENT_ID is not defined in environment variables' }, { status: 500 });
    }

    const scopes = [
        'channels:history', 'channels:read', 'chat:write', 'files:read',
        'groups:history', 'groups:read', 'reactions:read',
        'users:read', 'users:read.email'
    ].join(',');

    const installUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL}/api/slack/callback`;

    return NextResponse.redirect(installUrl);
}
