import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidToken } from '@/lib/auth-util';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');

    try {
        const { token } = await getValidToken('youtube', 'team', { 
            organizationId: profile.organization_id 
        });

        if (!token) return NextResponse.json({ error: 'YouTube not connected' }, { status: 403 });

        if (channelId) {
            // Fetch Playlists for a specific Channel
            const response = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${channelId}&maxResults=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || 'Failed to fetch playlists');
            }
            const data = await response.json();
            return NextResponse.json({
                items: data.items.map(p => ({ 
                    label: p.snippet.title, 
                    value: p.id 
                }))
            });
        } else {
            // Fetch Channels
            const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || 'Failed to fetch channels');
            }
            const data = await response.json();
            return NextResponse.json({
                items: data.items.map(c => ({ 
                    label: c.snippet.title, 
                    value: c.id,
                    thumbnail: c.snippet.thumbnails?.high?.url || c.snippet.thumbnails?.medium?.url || c.snippet.thumbnails?.default?.url 
                }))
            });
        }
    } catch (error) {
        console.error('[API YOUTUBE METADATA] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
