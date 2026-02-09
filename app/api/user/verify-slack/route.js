
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    try {
        if (!token) {
            return new Response("Invalid request: No token provided.", { status: 400 });
        }

        // 1. Verify and Decode Stateless Token
        const [payloadB64, signature] = token.split('.');
        if (!payloadB64 || !signature) {
            return new Response("Invalid token format.", { status: 400 });
        }

        const secret = process.env.SLACK_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
        const expectedSignature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');

        if (signature !== expectedSignature) {
            return new Response("Invalid token signature.", { status: 401 });
        }

        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
        // Payload: { u: userId, s: slackId, e: slackEmail, exp: timestamp }

        if (payload.exp < Date.now()) {
            return new Response("Verification link expired.", { status: 410 });
        }

        const { u: userId, s: slackId, e: slackEmail } = payload;

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 2. Perform the Link in PROFILES table
        // We update the profile with the Slack ID.
        // First check if already taken (race condition check)
        const { data: conflict } = await supabase
            .from('profiles')
            .select('id')
            .eq('slack_user_id', slackId)
            .neq('id', userId) // Ignore if it's already self
            .single();

        if (conflict) {
            return new Response("This Slack account was linked to another user in the meantime.", { status: 409 });
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ slack_user_id: slackId })
            .eq('id', userId);

        if (updateError) {
            console.error("DB Link Error:", updateError);
            throw updateError;
        }

        // 3. Optional: Send a confirmation Slack DM welcome message?
        // We can do this asynchronously without waiting.
        if (process.env.SLACK_BOT_TOKEN) {
            fetch('https://slack.com/api/chat.postMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
                },
                body: JSON.stringify({
                    channel: slackId,
                    text: `👋 Compte lié avec succès ! Je vous ai reconnu via votre email *${slackEmail}*. Vos actions sont maintenant certifiées.`
                })
            }).catch(err => console.error("Welcome DM failed", err));
        }

        // 4. Redirect back to dash
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/users?linked=success`);

    } catch (e) {
        console.error("Verify Error:", e);
        return new Response("Internal Server Error during verification.", { status: 500 });
    }
}
