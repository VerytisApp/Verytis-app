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

    try {
        let tokenData = await getValidToken('tiktok', 'team', {
            organizationId: profile.organization_id
        });
        
        let token = tokenData.token;

        if (!token) {
            console.log('[API TIKTOK METADATA] No team token, checking personal connection...');
            const personalData = await getValidToken('tiktok', 'personal', {
                userId: user.id
            });
            token = personalData.token;
        }

        if (!token) return NextResponse.json({ error: 'TikTok not connected' }, { status: 403 });

        // Fetch TikTok user info for metadata display (Restricted to basic info only)
        const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!userResponse.ok) {
            const err = await userResponse.json();
            throw new Error(err.error?.message || err.error_description || 'Failed to fetch TikTok user info');
        }

        const userData = await userResponse.json();
        const tiktokUser = userData?.data?.user || {};

        return NextResponse.json({
            user: {
                display_name: tiktokUser.display_name || 'TikTok User',
                avatar_url: tiktokUser.avatar_url || null,
                follower_count: 0,
                following_count: 0,
            }
        });
    } catch (error) {
        console.error('[API TIKTOK METADATA] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
