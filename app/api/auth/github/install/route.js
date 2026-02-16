import { NextResponse } from 'next/server';

export async function GET() {
    if (!process.env.GITHUB_CLIENT_ID) {
        return NextResponse.json({ error: 'GITHUB_CLIENT_ID is not defined in environment variables' }, { status: 500 });
    }

    const appSlug = 'VerytisApp'; // App Name provided by user
    const installUrl = `https://github.com/apps/${appSlug}/installations/new`;

    // Note: ensure your GitHub App settings have "Request user authorization (OAuth) during installation" 
    // enabled so that the callback receives a 'code' parameter.
    return NextResponse.redirect(installUrl);
}
