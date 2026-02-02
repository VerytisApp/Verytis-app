import { NextResponse } from 'next/server';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=${error}`);
    }

    if (!code) {
        return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    try {
        // Exchange code for token
        const response = await fetch('https://slack.com/api/oauth.v2.access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.SLACK_CLIENT_ID,
                client_secret: process.env.SLACK_CLIENT_SECRET,
                code: code,
                redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/slack/callback`
            })
        });

        const data = await response.json();

        if (!data.ok) {
            console.error('Slack OAuth Error:', data.error);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=${data.error}`);
        }

        // TODO: In a real app, save data.access_token and data.team.id to your database here.
        // For now, we simulate success and redirect back to dashboard with a query param.

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?connected=true&app=slack`);

    } catch (err) {
        console.error('OAuth Exception:', err);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=server_error`);
    }
}
