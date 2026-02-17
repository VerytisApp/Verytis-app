/**
 * Register Trello Webhook
 * 
 * Usage: node scripts/register_trello_webhook.js <BOARD_ID>
 * 
 * Get your board ID from the Trello board URL:
 *   https://trello.com/b/<BOARD_SHORT_ID>/board-name
 * Or via API: https://api.trello.com/1/members/me/boards?key=KEY&token=TOKEN
 */

import 'dotenv/config';

const API_KEY = process.env.TRELLO_API_KEY;
const TOKEN = process.env.TRELLO_API_SECRET; // Trello uses API token for auth
const CALLBACK_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/trello`;

const boardId = process.argv[2];

if (!boardId) {
    console.log('Usage: node scripts/register_trello_webhook.js <BOARD_ID>');
    console.log('');
    console.log('To find your board IDs, run:');
    console.log(`  curl "https://api.trello.com/1/members/me/boards?key=${API_KEY}&token=${TOKEN}&fields=name,shortUrl"`);
    process.exit(1);
}

if (!API_KEY || !TOKEN) {
    console.error('❌ Missing TRELLO_API_KEY or TRELLO_API_SECRET in .env.local');
    process.exit(1);
}

async function registerWebhook() {
    console.log(`📋 Registering Trello webhook for board: ${boardId}`);
    console.log(`   Callback URL: ${CALLBACK_URL}`);
    console.log('');

    try {
        // First, list existing webhooks to avoid duplicates
        const existingRes = await fetch(
            `https://api.trello.com/1/tokens/${TOKEN}/webhooks?key=${API_KEY}`
        );
        const existing = await existingRes.json();

        const duplicate = existing.find(w => w.idModel === boardId && w.callbackURL === CALLBACK_URL);
        if (duplicate) {
            console.log(`⚠️  Webhook already exists for this board:`);
            console.log(`   ID: ${duplicate.id}`);
            console.log(`   Active: ${duplicate.active}`);
            return;
        }

        // Register new webhook
        const res = await fetch(`https://api.trello.com/1/webhooks?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callbackURL: CALLBACK_URL,
                idModel: boardId,
                description: `Verytis Audit Webhook — ${new Date().toISOString()}`,
                active: true
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`❌ Registration failed (${res.status}): ${errorText}`);
            return;
        }

        const webhook = await res.json();
        console.log(`✅ Webhook registered successfully!`);
        console.log(`   ID: ${webhook.id}`);
        console.log(`   Board: ${webhook.idModel}`);
        console.log(`   Active: ${webhook.active}`);
        console.log('');
        console.log('🎯 Now listening for: card moves, assignments, attachments, checklists, archives.');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

registerWebhook();
