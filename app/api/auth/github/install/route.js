import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
        return NextResponse.json({ error: 'Missing organizationId parameter' }, { status: 400 });
    }

    // SECURITY: Generate a random nonce and store it in a cookie to prevent CSRF/State Injection
    const nonce = crypto.randomBytes(16).toString('hex');
    const state = JSON.stringify({
        type: 'app_install',
        organizationId: organizationId,
        nonce: nonce
    });

    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/github/callback`;
    const scope = 'repo workflow write:org read:user user:email';

    // Use native GitHub App installation URL to allow choosing an organization
    const appSlug = 'VerytisApp';
    const installUrl = `https://github.com/apps/${appSlug}/installations/new?state=${encodeURIComponent(state)}`;

    const response = NextResponse.redirect(installUrl);

    // Set a short-lived cookie with the nonce for validation in the callback
    response.cookies.set('github_oauth_nonce', nonce, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_SERVER_ENVIRONMENT === 'production',
        sameSite: 'lax',
        maxAge: 3600 // 1 hour
    });

    return response;
}
