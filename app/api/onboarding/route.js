import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { userId, full_name, job_title, password } = await req.json();

        if (!userId || !full_name || !password) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabaseAdmin = createAdminClient();
        const supabase = await createClient(); // For profile update with RLS if session exists

        // 1. Update password using admin API
        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password }
        );

        if (passwordError) {
            console.error('Password update error:', passwordError);
            throw passwordError;
        }

        // 2. Update profile in database
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                full_name,
                job_title,
                status: 'active'
            })
            .eq('id', userId)
            .select()
            .single();

        if (profileError) {
            console.error('Profile update error:', profileError);
            throw profileError;
        }

        return NextResponse.json({
            success: true,
            profile
        });

    } catch (error) {
        console.error('Onboarding API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to complete onboarding' },
            { status: 500 }
        );
    }
}
