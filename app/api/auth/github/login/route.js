import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/github/callback`;
    const scope = 'read:user user:email';

    // We pass the userId in the 'state' parameter to retrieve it in the callback
    // In production, this should be a secure random string + userId signed/encrypted
    const state = JSON.stringify({ userId, type: 'user_link' });

    console.log('GitHub Login Debug:', { clientId, redirectUri, scope, state });

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${encodeURIComponent(state)}&prompt=consent`;

    console.log('Redirecting to:', githubAuthUrl);

    return NextResponse.redirect(githubAuthUrl);
}
