
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: "Invalid request: No token provided." }, { status: 400 });
        }

        // 1. Verify and Decode Token
        const [payloadB64, signature] = token.split('.');
        if (!payloadB64 || !signature) {
            return NextResponse.json({ error: "Invalid token format." }, { status: 400 });
        }

        const secret = process.env.SLACK_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
        const expectedSignature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');

        if (signature !== expectedSignature) {
            return NextResponse.json({ error: "Invalid token signature." }, { status: 401 });
        }

        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
        // Payload: { u: userId, s: slackId, e: slackEmail, ve: authUser.email, o: orgName, n: nonce, exp }

        if (payload.exp < Date.now()) {
            return NextResponse.json({ error: "Verification link expired." }, { status: 410 });
        }

        const { u: userId, s: slackId, e: slackEmail, n: nonce } = payload;

        // Use service role admin client
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 2. Security Nonce Check (Ensures ONLY the LATEST link is valid)
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (authError || !authUser) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        // Check if the nonce in the token matches the one in the user's current metadata
        if (authUser.user_metadata?.slack_link_nonce !== nonce) {
            return NextResponse.json({ error: "This link is no longer valid. A new link has been requested." }, { status: 403 });
        }

        // 3. Perform the Link in PROFILES table
        // First check if already taken (race condition check)
        const { data: conflict } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('slack_user_id', slackId)
            .neq('id', userId) // Ignore if it's already self
            .single();

        if (conflict) {
            return NextResponse.json({ error: "This Slack account was linked to another user in the meantime." }, { status: 409 });
        }

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ slack_user_id: slackId })
            .eq('id', userId);

        if (updateError) {
            console.error("DB Link Error:", updateError);
            throw updateError;
        }

        // 4. Cleanup Nonce (Optional, but good for hygiene)
        const newMetaData = { ...authUser.user_metadata };
        delete newMetaData.slack_link_nonce;
        await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: newMetaData });

        // 5. Optional: Send a confirmation Slack DM welcome message
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

        return NextResponse.json({ success: true, message: "Account linked successfully" });

    } catch (e) {
        console.error("Link Confirm Error:", e);
        return NextResponse.json({ error: "Internal Server Error during verification." }, { status: 500 });
    }
}
