import { NextResponse } from 'next/server';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const organizationId = searchParams.get('organizationId');

    if (!userId || !organizationId) {
        return NextResponse.json({ error: 'Missing userId or organizationId' }, { status: 400 });
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`;

    // TikTok OAuth v2 scopes - Restricted to basic info until app review is completed
    const scopes = 'user.info.basic';
    const state = JSON.stringify({ userId, organizationId });
    const encodedState = Buffer.from(state).toString('base64');

    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize');
    authUrl.searchParams.set('client_key', clientKey);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', encodedState);

    return NextResponse.redirect(authUrl.toString());
}
