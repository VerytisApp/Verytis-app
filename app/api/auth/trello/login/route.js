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
    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/trello/callback?userId=${userId}&type=${type}${organizationId ? `&organizationId=${organizationId}` : ''}`;

    const trelloAuthUrl = `https://trello.com/1/authorize?expiration=${expiration}&name=${encodeURIComponent(appName)}&scope=${scope}&response_type=token&key=${apiKey}&return_url=${encodeURIComponent(returnUrl)}`;

    return NextResponse.redirect(trelloAuthUrl);
}
