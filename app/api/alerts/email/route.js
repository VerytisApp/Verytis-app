import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'mail.spacemail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports (will use STARTTLS)
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: process.env.SMTP_FROM || '"Verytis Security" <noreply@earlyverytis.com>',
            to: email,
            subject: '🚨 Test Alert: Verytis AI-Ops',
            text: 'This is a test alert from your Verytis AI-Ops Platform. Your email alerting configuration is working correctly.',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0;">Verytis AI-Ops Notification</h2>
                    </div>
                    <div style="padding: 30px; background-color: #ffffff;">
                        <h3 style="color: #0f172a; margin-top: 0;">Configuration Successful</h3>
                        <p style="color: #475569; line-height: 1.6;">
                            This is a test alert generated from your organization's settings panel. 
                            If you are receiving this, your SMTP delivery pipeline is working perfectly.
                        </p>
                        <p style="color: #475569; line-height: 1.6;">
                            You will now receive compliance digests and critical security blocks at this address.
                        </p>
                    </div>
                    <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <span style="color: #94a3b8; font-size: 12px;">Automated message from Verytis Security Gateway</span>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: 'Test email dispatched' });
    } catch (error) {
        console.error('Email Test Alert Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
    }
}
