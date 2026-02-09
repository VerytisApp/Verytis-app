
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEmail } from '../../../../lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const { userId, slackEmail } = await req.json();

        if (!userId || !slackEmail) {
            return NextResponse.json({ error: 'Missing userId or slackEmail' }, { status: 400 });
        }

        // Use service role admin client for metadata operations
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

        // 1. Look up user in Slack to get real ID
        let slackUser = null;
        try {
            const slackRes = await fetch(`https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(slackEmail)}`, {
                headers: { 'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}` }
            });
            const slackData = await slackRes.json();

            if (slackData.ok && slackData.user) {
                slackUser = slackData.user;
            } else {
                console.warn("Slack Lookup Failed:", slackData.error);
                if (slackData.error === 'users_not_found') {
                    return NextResponse.json({ error: 'We could not find this email in the Slack workspace.' }, { status: 404 });
                }
            }
        } catch (e) {
            console.error("Slack API connectivity error:", e);
        }

        if (!slackUser) {
            return NextResponse.json({ error: 'Failed to verify email with Slack.' }, { status: 400 });
        }
        const slackId = slackUser.id;

        // 2. Check for conflicts
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('slack_user_id', slackId)
            .single();

        if (existingProfile) {
            if (existingProfile.id === userId) {
                return NextResponse.json({ message: 'You are already linked to this Slack account!' });
            } else {
                return NextResponse.json({ error: 'This Slack account is already linked to another user.' }, { status: 409 });
            }
        }

        // 3. Fetch User Details for Token Payload (Org & Email)
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (authError || !authUser) {
            return NextResponse.json({ error: 'User not found in auth system.' }, { status: 404 });
        }

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('organization_id')
            .eq('id', userId)
            .single();

        let orgName = 'Verytis';
        if (profile?.organization_id) {
            const { data: org } = await supabaseAdmin
                .from('organizations')
                .select('name')
                .eq('id', profile.organization_id)
                .single();
            if (org) orgName = org.name;
        }

        // 4. Generate Nonce & Update User Metadata (Invalidates previous links)
        const nonce = crypto.randomUUID();
        // Merge with existing metadata
        const newMetaData = {
            ...(authUser.user_metadata || {}),
            slack_link_nonce: nonce
        };

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: newMetaData
        });

        if (updateError) {
            console.error("Failed to update user nonce:", updateError);
            throw updateError;
        }

        // 5. Generate Token
        // Payload: { u: userId, s: slackId, e: slackEmail, ve: authUser.email, o: orgName, n: nonce, exp }
        // Payload keys shortened to keep token size reasonable
        const payloadObj = {
            u: userId,
            s: slackId,
            e: slackEmail,
            ve: authUser.email,
            o: orgName,
            n: nonce,
            exp: Date.now() + 1000 * 60 * 60 * 2 // 2 hours
        };
        const payloadStr = JSON.stringify(payloadObj);
        const payloadB64 = Buffer.from(payloadStr).toString('base64url');

        const secret = process.env.SLACK_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
        const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
        const token = payloadB64 + '.' + signature;

        // 6. Send Email
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const verifyLink = `${baseUrl}/verify-slack?token=${token}`;
        const logoPath = '/Users/tychiqueesteve/Verytis-app/components/image/Gemini Generated Image (14).png';

        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
                                
                                <!-- Header with Logo -->
                                <tr>
                                    <td align="center" style="padding: 40px 0 30px 0; background-color: #ffffff; border-bottom: 1px solid #f3f4f6;">
                                        <img src="cid:logo" alt="Verytis Logo" width="100" style="display: block; border-style: none;" />
                                    </td>
                                </tr>

                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 50px;">
                                        <h1 style="color: #111827; font-size: 22px; margin: 0 0 24px 0; font-weight: 600; text-align: center;">Link your Slack Account</h1>
                                        
                                        <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 32px 0; text-align: center;">
                                            We received a request to link the Slack account <strong>${slackEmail}</strong> to your Verytis identity.
                                        </p>

                                        <!-- Details Box -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; border-radius: 8px; margin-bottom: 32px;">
                                            <tr>
                                                <td style="padding: 24px;">
                                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td style="padding-bottom: 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Action</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding-bottom: 16px; color: #111827; font-size: 16px; font-weight: 500;">Link Account Manually</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding-bottom: 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Slack User</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color: #111827; font-size: 16px; font-weight: 500;">${slackUser.real_name || slackUser.name}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Button -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td align="center">
                                                    <a href="${verifyLink}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #2563EB; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                                                        Verify & Link Account &rarr;
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="color: #9ca3af; font-size: 14px; line-height: 20px; margin: 32px 0 0 0; text-align: center;">
                                            This link is valid for 2 hours. If you didn't request this, you can safely ignore this email.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f9fafb; padding: 24px 50px; text-align: center; border-top: 1px solid #e5e7eb;">
                                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                            &copy; ${new Date().getFullYear()} Verytis. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        const emailResult = await sendEmail({
            to: slackEmail,
            subject: 'Verify your Slack Account Link',
            html: emailHtml,
            attachments: [{
                filename: 'logo.png',
                path: logoPath,
                cid: 'logo'
            }]
        });

        if (!emailResult.success) {
            console.error("SMTP Error:", emailResult.error);
            if (process.env.NODE_ENV === 'development') {
                console.log("Mock Link (SMTP Failed):", verifyLink);
                return NextResponse.json({ message: 'Verification email sent (Mocked due to SMTP error)' });
            }
            throw new Error('Failed to send verification email.');
        }

        return NextResponse.json({ message: 'Verification email sent' });

    } catch (e) {
        console.error('Link Slack Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
