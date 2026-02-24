import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

import crypto from 'crypto';

// GitHub Webhook Handler - Final Validation after UI fix
export async function POST(req) {
    const rawBody = await req.text();
    console.log(`📡 Incoming GitHub Webhook Body Length: ${rawBody.length}`);
    try {
        const signature = req.headers.get('x-hub-signature-256');
        const eventType = req.headers.get('x-github-event');
        const secret = process.env.GITHUB_WEBHOOK_SECRET;

        console.log(`📡 Event Type: ${eventType}, Signature: ${signature ? 'PRESENT' : 'MISSING'}`);

        // 0. SECURITY: Verify Signature
        if (!secret) {
            console.error("❌ Missing GITHUB_WEBHOOK_SECRET in environment");
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (!signature) {
            console.error("❌ GitHub Webhook Missing Signature");
            return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        }

        const hmac = crypto.createHmac('sha256', secret);
        const digest = Buffer.from('sha256=' + hmac.update(rawBody).digest('hex'), 'utf8');
        const checksum = Buffer.from(signature, 'utf8');

        if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
            console.error("❌ GitHub Webhook Signature Verification Failed");
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const deliveryId = req.headers.get('x-hub-signature-256'); // Wait, x-github-delivery is better for ID
        const deliveryIdActual = req.headers.get('x-github-delivery');
        const body = JSON.parse(rawBody);

        // 1. MULTI-TENANT ISOLATION: Resolve Organization ID
        const installationId = body.installation?.id;
        let organizationId = null;

        if (installationId) {
            const { data: integratedOrg } = await supabase
                .from('integrations')
                .select('organization_id')
                .eq('provider', 'github')
                .filter('settings->>installation_id', 'eq', String(installationId))
                .maybeSingle();

            if (integratedOrg) {
                organizationId = integratedOrg.organization_id;
            }
        }

        // 2. ATOMIC INSERT & IDEMPOTENCY (Optimized)
        const { data: upsertData, error: queueError } = await supabase.from('webhook_events').upsert({
            provider: 'github',
            external_id: deliveryIdActual,
            event_type: eventType,
            payload: body,
            organization_id: organizationId, // STRICT ISOLATION
            headers: {
                'x-github-delivery': deliveryIdActual || 'unknown',
                'x-github-event': eventType
            },
            status: 'pending'
        }, {
            onConflict: 'provider,external_id',
            ignoreDuplicates: true
        }).select('id').maybeSingle();

        if (queueError) {
            console.error('❌ Failed to queue GitHub webhook:', queueError);
            return NextResponse.json({ error: 'Persistence Failure' }, { status: 500 });
        }

        if (!upsertData) {
            console.log(`⏭️ GitHub Webhook Replay Detected (Delivery: ${deliveryIdActual}). Skipping.`);
            return NextResponse.json({ status: 'already_processed' });
        }

        console.log(`✅ GitHub Webhook queued successfully`);
        return NextResponse.json({ status: 'queued' });

    } catch (error) {
        console.error('GitHub Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
