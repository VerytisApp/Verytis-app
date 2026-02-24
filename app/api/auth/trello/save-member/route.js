import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { token, member } = await req.json();
        const targetUserId = user.id;

        if (!token || !member) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log('Trello save-member: mapping userId to', targetUserId);

        // Get current profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('social_profiles')
            .eq('id', targetUserId)
            .single();

        const currentSocials = profile?.social_profiles || {};

        // Update social_profiles with Trello data
        const updatedSocials = {
            ...currentSocials,
            trello: {
                id: member.id,
                username: member.username,
                fullName: member.fullName,
                email: member.email || null,
                connected_at: new Date().toISOString(),
                api_token: token // Store token for user-specific actions
            }
        };

        const { error } = await supabase
            .from('profiles')
            .update({ social_profiles: updatedSocials })
            .eq('id', targetUserId);

        if (error) {
            console.error('Trello member save error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('✅ Trello member account linked for user:', targetUserId);
        return NextResponse.json({ success: true, username: member.username });

    } catch (err) {
        console.error('Trello save-member error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
