import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(req) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                persistSession: false
            }
        }
    );

    try {
        const { userId, provider } = await req.json();

        if (!userId || !provider) {
            return NextResponse.json({ error: 'Missing userId or provider' }, { status: 400 });
        }

        console.log(`Disconnecting ${provider} for user ${userId}`);

        // Fetch current profile
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('social_profiles, slack_user_id')
            .eq('id', userId)
            .single();

        if (fetchError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const updates = {};

        if (provider === 'github') {
            const currentSocials = profile.social_profiles || {};
            // Remove github key
            delete currentSocials.github;
            updates.social_profiles = currentSocials;
        } else if (provider === 'trello') {
            const currentSocials = profile.social_profiles || {};
            // Remove trello key
            delete currentSocials.trello;
            updates.social_profiles = currentSocials;
        } else if (provider === 'slack') {
            updates.slack_user_id = null;
            // Also optional: remove from social_profiles if stored there too
            const currentSocials = profile.social_profiles || {};
            if (currentSocials.slack) {
                delete currentSocials.slack;
                updates.social_profiles = currentSocials;
            }
        } else {
            return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Disconnect error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
