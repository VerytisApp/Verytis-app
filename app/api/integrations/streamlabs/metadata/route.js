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
        const { token } = await getValidToken('streamlabs', 'team', {
            organizationId: profile.organization_id
        });

        if (!token) return NextResponse.json({ error: 'Streamlabs not connected' }, { status: 403 });

        // Fetch Streamlabs user info for metadata
        const userResponse = await fetch('https://streamlabs.com/api/v2.0/user', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!userResponse.ok) {
            const err = await userResponse.json();
            throw new Error(err.error?.message || err.message || 'Failed to fetch Streamlabs user info');
        }

        const userData = await userResponse.json();

        // Fetch recent donations as sample data
        let recentDonations = [];
        try {
            const donationsRes = await fetch('https://streamlabs.com/api/v2.0/donations?limit=5', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (donationsRes.ok) {
                const donationsData = await donationsRes.json();
                recentDonations = (donationsData.data || []).map(d => ({
                    label: `${d.name} - ${d.currency}${d.amount}`,
                    value: d.donation_id
                }));
            }
        } catch (donErr) {
            console.warn('[API STREAMLABS METADATA] Could not fetch donations:', donErr.message);
        }

        return NextResponse.json({
            user: {
                display_name: userData?.streamlabs?.display_name || userData?.twitch?.display_name || 'Streamlabs User',
                platform: userData?.twitch ? 'twitch' : userData?.youtube ? 'youtube' : 'streamlabs'
            },
            recent_donations: recentDonations
        });
    } catch (error) {
        console.error('[API STREAMLABS METADATA] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
