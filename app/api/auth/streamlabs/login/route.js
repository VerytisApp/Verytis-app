import { NextResponse } from 'next/server';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const organizationId = searchParams.get('organizationId');

    if (!userId || !organizationId) {
        return NextResponse.json({ error: 'Missing userId or organizationId' }, { status: 400 });
    }

    const clientId = process.env.STREAMLABS_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/streamlabs/callback`;

    // Streamlabs OAuth scopes
    const scopes = [
        'donations.read',
        'alerts.create',
        'socket.token',
        'points.read',
        'alerts.write',
    ].join(' ');

    const state = JSON.stringify({ userId, organizationId });
    const encodedState = Buffer.from(state).toString('base64');

    const authUrl = new URL('https://streamlabs.com/api/v2.0/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', encodedState);
    authUrl.searchParams.set('prompt', 'select_account consent'); // Essayer de forcer le choix de compte
    authUrl.searchParams.set('force_verify', 'true'); // Essayer de forcer la vérification

    return NextResponse.redirect(authUrl.toString());
}
