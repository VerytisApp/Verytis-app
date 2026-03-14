import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const sz = searchParams.get('sz') || '64';

    if (!domain) {
        return new NextResponse('Domain is required', { status: 400 });
    }

    // Use Google's favicon service as a reliable fallback/proxy
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=${sz}`;
    
    try {
        const response = await fetch(faviconUrl);
        const blob = await response.blob();
        
        return new NextResponse(blob, {
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'image/x-icon',
                'Cache-Control': 'public, max-age=86400, s-maxage=86400',
            },
        });
    } catch (error) {
        return new NextResponse('Failed to fetch favicon', { status: 500 });
    }
}
