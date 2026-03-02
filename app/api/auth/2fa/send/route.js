import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient as createClientAdmin } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export async function POST(req) {
    try {
        const { phone } = await req.json();

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        // Initialize Supabase admin to retrieve user and store the temporary code securely
        // Using Service Role to bypass RLS and manage user_metadata
        const supabaseAdmin = createClientAdmin(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Generate 6-digit 2FA code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Save code to user_metadata using Admin client
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: {
                ...user.user_metadata,
                temp_2fa_code: code,
                temp_2fa_expires: Date.now() + 10 * 60 * 1000 // 10 minutes
            }
        });

        // Send SMS via Twilio
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !twilioPhone) {
            return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 });
        }

        const client = twilio(accountSid, authToken);
        await client.messages.create({
            body: `Your Verytis AI-Ops verification code is: ${code}. Valid for 10 minutes.`,
            from: twilioPhone,
            to: phone
        });

        return NextResponse.json({ success: true, message: 'Verification code sent' });

    } catch (error) {
        console.error('2FA Send Error:', error);

        // Handle specific Twilio errors for better UX
        let errorMessage = 'Failed to send verification code.';
        if (error.message && error.message.includes('Permission to send an SMS has not been enabled for the region')) {
            errorMessage = 'Twilio Error: SMS to this region is blocked. Please enable Geo-Permissions for this country in your Twilio Console.';
        } else if (error.message && error.message.includes('unverified')) {
            errorMessage = 'Twilio Error: Your Twilio Trial account requires you to verify this phone number first in the Twilio Console.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
