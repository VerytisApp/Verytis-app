import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(req) {
    try {
        const { phone } = await req.json();

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        if (phone.includes('000-0000')) {
            return NextResponse.json({ error: 'Invalid mock number' }, { status: 400 });
        }

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

        if (accountSid && authToken && twilioPhone) {
            const client = twilio(accountSid, authToken);

            // Format phone number to E.164 if needed (assumes they type +1...)
            // Just pass it directly to Twilio to try sending
            await client.messages.create({
                body: '🚨 Verytis AI-Ops Notification: Your SMS alerting channel is properly configured and active.',
                from: twilioPhone,
                to: phone
            });
            console.log(`[SMS Gateway] Successfully sent physical SMS to ${phone} via Twilio.`);
        } else {
            console.log(`[SMS Gateway Triggered] No Twilio credentials found. Mocking successful send to ${phone}.`);
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        return NextResponse.json({ success: true, message: 'Test SMS dispatched' });
    } catch (error) {
        console.error('SMS Test Alert Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send SMS' }, { status: 500 });
    }
}
