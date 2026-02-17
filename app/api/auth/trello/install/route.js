import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/trello/install?teamId=<uuid>
 * 
 * Initiates Trello OAuth flow.
 * Trello uses OAuth 1.0a natively, but their REST API also supports
 * a simpler token-based auth via authorize URL.
 * 
 * We use the "Authorize Route" approach:
 * https://developer.atlassian.com/cloud/trello/guides/rest-api/authorization/
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    const apiKey = process.env.TRELLO_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Trello API key not configured' },
            { status: 500 }
        );
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/trello/callback${teamId ? `?teamId=${teamId}` : ''}`;

    const authorizeUrl = new URL('https://trello.com/1/authorize');
    authorizeUrl.searchParams.set('expiration', 'never');
    authorizeUrl.searchParams.set('name', 'Verytis');
    authorizeUrl.searchParams.set('scope', 'read');
    authorizeUrl.searchParams.set('response_type', 'token');
    authorizeUrl.searchParams.set('key', apiKey);
    authorizeUrl.searchParams.set('callback_method', 'fragment');
    authorizeUrl.searchParams.set('return_url', callbackUrl);

    return NextResponse.redirect(authorizeUrl.toString());
}
