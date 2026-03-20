import { NextResponse } from 'next/server';
import { createClient as createClientAdmin } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export async function POST(req) {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const metadata = user.user_metadata || {};
        const storedCode = metadata.temp_2fa_code;
        const expiresAt = metadata.temp_2fa_expires;

        if (!storedCode || !expiresAt) {
            return NextResponse.json({ error: 'No verification code requested or found' }, { status: 400 });
        }

        if (Date.now() > expiresAt) {
            return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
        }

        if (storedCode !== code) {
            return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
        }

        // Code matches, update user metadata to enable 2FA
        const supabaseAdmin = createClientAdmin(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Clear the temps and set enabled to true
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: {
                ...metadata,
                is_2fa_enabled: true,
                temp_2fa_code: null,
                temp_2fa_expires: null
            }
        });

        return NextResponse.json({ success: true, message: 'Two-Factor Authentication established successfully' });

    } catch (error) {
        console.error('2FA Verify Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to verify code' }, { status: 500 });
    }
}
