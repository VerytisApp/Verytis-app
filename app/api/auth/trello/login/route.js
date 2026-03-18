import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'integration';
    const organizationId = searchParams.get('organizationId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const apiKey = process.env.TRELLO_API_KEY;
    const appName = 'Verytis';
    const scope = 'read,write,account';
    const expiration = 'never';

    // Use environment variable but strip trailing slash for safety
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
    
    if (!baseUrl) {
        console.error('[TRELLO LOGIN] Missing NEXT_PUBLIC_BASE_URL');
        return NextResponse.json({ error: 'System configuration error: Missing Base URL' }, { status: 500 });
    }

    // CONSTRUCTION DE L'URL DE RETOUR (SANS PARAMÈTRES POUR TRELLO)
    const returnUrl = `${baseUrl}/api/auth/trello/callback`;

    // STOCKAGE DE L'ÉTAT DANS UN COOKIE (TRELLO EST TRÈS STRICT SUR LA RETURN_URL)
    const state = { userId, type, organizationId };
    const stateValue = JSON.stringify(state);

    // Trello OAuth 1.0 explicit params
    const trelloAuthUrl = `https://trello.com/1/authorize?` + 
        `expiration=${expiration}&` +
        `name=${encodeURIComponent(appName)}&` +
        `scope=${scope}&` +
        `response_type=token&` +
        `key=${apiKey}&` +
        `return_url=${encodeURIComponent(returnUrl)}&` +
        `callback_method=fragment`;

    const response = NextResponse.redirect(trelloAuthUrl);
    
    // Cookie temporaire (10 min) pour récupérer les infos au retour
    response.cookies.set('trello_auth_state', stateValue, {
        path: '/',
        maxAge: 600,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    });

    return response;
}
