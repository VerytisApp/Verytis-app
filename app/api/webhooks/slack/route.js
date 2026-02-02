import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- CONSTANTES DE PRÉSENTATION ---
const WELCOME_BLOCKS = [
    {
        type: "header",
        text: {
            type: "plain_text",
            text: "👋 Verytis Audit is active.",
            emoji: true
        }
    },
    {
        type: "section",
        text: {
            type: "mrkdwn",
            text: "I am here to secure your exchanges. I transform your informal decisions into a *certified audit trail*.\n\n*How does it work?* Simple: start your sentence with an emoji to give your message legal standing."
        }
    },
    {
        type: "divider"
    },
    {
        type: "section",
        text: {
            type: "mrkdwn",
            text: "*DECISION COMMANDS:*"
        }
    },
    {
        type: "section",
        fields: [
            {
                type: "mrkdwn",
                text: "*✅ APPROVE*\n`✅ / Action validation`\n_To validate a request._"
            },
            {
                type: "mrkdwn",
                text: "*❌ REJECT*\n`❌ / Proposal rejection`\n_To block a step._"
            }
        ]
    },
    {
        type: "section",
        fields: [
            {
                type: "mrkdwn",
                text: "*🔁 TRANSFER*\n`🔁 / Case delegation`\n_To delegate responsibility._"
            },
            {
                type: "mrkdwn",
                text: "*✏️ EDIT*\n`✏️ / Contract update`\n_To modify a plan._"
            }
        ]
    },
    {
        type: "section",
        fields: [
            {
                type: "mrkdwn",
                text: "*💬 COMMENT*\n`💬 / Context note`\n_To add context._"
            },
            {
                type: "mrkdwn",
                text: "*🗃️ ARCHIVE*\n`🗃️ / Project closure`\n_To close a topic._"
            }
        ]
    },
    {
        type: "divider"
    },
    {
        type: "context",
        elements: [
            {
                type: "mrkdwn",
                text: "📎 **Proofs:** Drag & drop a file (PDF/Image) with your message to certify it.\n🔒 **Security:** Only identified Verytis members can execute decisions. Messages from others are anonymized."
            }
        ]
    }
];

// --- 0. SÉCURITÉ & INTELLIGENCE ---
async function verifySlackRequest(req, rawBody) {
    const signature = req.headers.get('x-slack-signature');
    const timestamp = req.headers.get('x-slack-request-timestamp');

    if (!signature || !timestamp) return false;

    if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false;

    const basestring = `v0:${timestamp}:${rawBody}`;
    const hmac = crypto.createHmac('sha256', SLACK_SIGNING_SECRET).update(basestring).digest('hex');
    const calculatedSignature = `v0=${hmac}`;

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
}

async function sendSlackMessage(channel, content, threadTs = null) {
    if (!channel || !content) return;

    const body = {
        channel: channel,
        thread_ts: threadTs
    };

    if (typeof content === 'string') {
        body.text = content;
    } else if (Array.isArray(content)) {
        body.blocks = content;
        body.text = "Verytis Audit Instructions";
    }

    try {
        const res = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SLACK_BOT_TOKEN}`
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        // Log seulement si erreur, sinon ça pollue trop
        if (!data.ok) console.error("❌ Slack API Error:", data.error);
    } catch (e) {
        console.error("Erreur envoi Slack:", e);
    }
}

async function reactToMessage(channel, timestamp, emoji) {
    try {
        await fetch('https://slack.com/api/reactions.add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SLACK_BOT_TOKEN}`
            },
            body: JSON.stringify({
                channel: channel,
                timestamp: timestamp,
                name: emoji
            })
        });
    } catch (e) {
        console.error("Erreur réaction Slack:", e);
    }
}

function classifyMessage(text) {
    // Nettoyage : suppression des mentions <@Uxxxx> pour lire la commande proprement
    const cleanText = text ? text.replace(/<@[a-zA-Z0-9]+>/g, "").trim() : "";

    if (cleanText.startsWith('✅')) return { type: 'APPROVE', content: cleanText.substring(1).trim() };
    if (cleanText.startsWith('❌')) return { type: 'REJECT', content: cleanText.substring(1).trim() };
    if (cleanText.startsWith('🔁')) return { type: 'TRANSFER', content: cleanText.substring(1).trim() };
    if (cleanText.startsWith('✏️')) return { type: 'EDIT', content: cleanText.substring(1).trim() };
    if (cleanText.startsWith('💬')) return { type: 'COMMENT', content: cleanText.substring(1).trim() };
    if (cleanText.startsWith('🗃️')) return { type: 'ARCHIVE', content: cleanText.substring(2).trim() };

    return { type: 'DISCUSSION', content: cleanText };
}

async function handleFiles(files) {
    if (!files || files.length === 0) return [];
    const attachments = [];

    for (const file of files) {
        try {
            const response = await fetch(file.url_private_download, {
                headers: { 'Authorization': `Bearer ${SLACK_BOT_TOKEN}` }
            });
            const buffer = await response.arrayBuffer();
            const fileName = `${Date.now()}_${file.name}`;

            const { data, error } = await supabase.storage
                .from('proofs')
                .upload(fileName, buffer, { contentType: file.mimetype });

            if (!error) {
                attachments.push({ name: file.name, url: data.path, type: file.mimetype });
            }
        } catch (err) { console.error("Erreur fichier:", err); }
    }
    return attachments;
}

// --- 3. LE CERVEAU CENTRAL ---
export async function POST(req) {
    try {
        const rawBody = await req.text();

        if (process.env.NODE_ENV === 'production') {
            const isAuthentic = await verifySlackRequest(req, rawBody);
            if (!isAuthentic) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const body = JSON.parse(rawBody);

        if (body.type === 'url_verification') return NextResponse.json({ challenge: body.challenge });

        if (body.type === 'event_callback') {
            const event = body.event;

            console.log(`🔔 Event: ${event.type} | User: ${event.user} | Text: ${event.text}`);

            // 1. JOIN CHANNEL
            if (event.type === 'member_joined_channel') {
                console.log("👋 SENDING WELCOME (Join Event)");
                await sendSlackMessage(event.channel, WELCOME_BLOCKS);
                return NextResponse.json({ status: 'welcome_sent' });
            }

            // 2. MESSAGES & MENTIONS
            // On gère 'message' ET 'app_mention' pour être sûr de capter les "@Verytis help"
            if ((event.type === 'message' || event.type === 'app_mention') && !event.subtype) {

                // Ignorer les bots
                if (event.bot_id) return NextResponse.json({ status: 'ignored_bot' });

                // DÉTECTION COMMANDE D'AIDE (Hyper permissive)
                const textLower = event.text ? event.text.toLowerCase() : "";
                if (textLower.includes('help') || textLower.includes('aide')) {
                    console.log("🆘 WELCOME TRIGGERED BY HELP COMMAND");
                    await sendSlackMessage(event.channel, WELCOME_BLOCKS);
                    return NextResponse.json({ status: 'help_sent' });
                }

                // ... Reste de la logique d'auth et de logs ...
                const slackUserId = event.user;
                let userId = null;
                let isVerified = false;

                const { data: user } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('slack_user_id', slackUserId)
                    .single();

                if (user) {
                    userId = user.id;
                    isVerified = true;
                } else {
                    // --- MAGIE : AUTO-MATCHING PAR EMAIL ---
                    // 1. On demande à Slack : "Qui est ce user ?"
                    try {
                        const slackInfoRes = await fetch(`https://slack.com/api/users.info?user=${slackUserId}`, {
                            headers: { 'Authorization': `Bearer ${SLACK_BOT_TOKEN}` }
                        });
                        const slackInfo = await slackInfoRes.json();

                        if (slackInfo.ok && slackInfo.user && slackInfo.user.profile.email) {
                            const email = slackInfo.user.profile.email;
                            console.log(`🔍 Unknown Slack ID. Checking email: ${email}...`);

                            // 2. On cherche cet email dans Supabase
                            const { data: profileByEmail } = await supabase
                                .from('profiles')
                                .select('id')
                                .eq('email', email)
                                .single();

                            if (profileByEmail) {
                                // 3. FUSION : On enregistre le Slack ID pour la prochaine fois
                                await supabase
                                    .from('profiles')
                                    .update({ slack_user_id: slackUserId })
                                    .eq('id', profileByEmail.id);

                                userId = profileByEmail.id;
                                isVerified = true;
                                console.log(`✨ MAGIC LINK SUCCESS: ${email} is now linked to ${slackUserId}`);

                                // Petit notif de bienvenue pour confirmer le lien
                                await sendSlackMessage(event.channel, `👋 Compte lié avec succès ! Je vous ai reconnu via votre email *${email}*. Vos actions sont maintenant certifiées.`);
                            }
                        }
                    } catch (e) {
                        console.error("Erreur Auto-Link:", e);
                    }
                }

                const { type, content } = classifyMessage(event.text);
                const attachments = await handleFiles(event.files);

                let finalActionType = type;
                if (!isVerified) {
                    finalActionType = (type === 'DISCUSSION') ? 'DISCUSSION_ANONYMOUS' : 'ATTEMPTED_ACTION_ANONYMOUS';
                }

                if (content || attachments.length > 0) {
                    await supabase.from('activity_logs').insert({
                        actor_id: userId,
                        action_type: finalActionType,
                        summary: content,
                        metadata: {
                            slack_channel: event.channel,
                            ts: event.ts,
                            attachments: attachments,
                            is_anonymous: !isVerified
                        }
                    });

                    console.log(`💾 Logged: [${finalActionType}]`);

                    if (finalActionType !== 'DISCUSSION' && finalActionType !== 'DISCUSSION_ANONYMOUS') {
                        if (isVerified) {
                            await reactToMessage(event.channel, event.ts, 'white_check_mark');
                        } else {
                            await sendSlackMessage(event.channel, ":detective: Action enregistrée mais *non vérifiée*. Veuillez lier votre compte Verytis.", event.ts);
                        }
                    } else if (type === 'DISCUSSION' && isVerified) {
                        await reactToMessage(event.channel, event.ts, 'eyes');
                    }
                }
            }
        }
        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Erreur:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
