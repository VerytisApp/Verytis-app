import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WebClient } from '@slack/web-api';

export async function POST(req) {
    try {
        const { recipientId } = await req.json();

        // recipientId is optional, we will fallback to the user's email 

        const supabase = createClient();

        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 2. Get Organization ID
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 400 });

        // 3. Fetch Slack Bot Token
        const { data: integration } = await supabase.from('integrations')
            .select('id, settings')
            .eq('organization_id', profile.organization_id)
            .eq('provider', 'slack')
            .single();

        const token = integration?.settings?.bot_token;

        if (!token) {
            return NextResponse.json({ error: 'Slack App is not fully connected' }, { status: 400 });
        }

        // 4. Resolve the user's Slack ID based on their Verytis email
        const slackClient = new WebClient(token);
        let targetSlackId = null;

        try {
            const userLookup = await slackClient.users.lookupByEmail({ email: user.email });
            if (userLookup.ok && userLookup.user?.id) {
                targetSlackId = userLookup.user.id;
            }
        } catch (lookupErr) {
            console.warn(`Could not find Slack user for email ${user.email} in this workspace.`);
            // if we can't find them by email, we cannot DM them.
            return NextResponse.json({ error: `Could not link your email (${user.email}) to a Slack account in this workspace.` }, { status: 400 });
        }

        if (!targetSlackId) {
            return NextResponse.json({ error: 'Could not resolve your Slack App User ID.' }, { status: 400 });
        }

        // 5. Dispatch Direct Message using Slack Web API natively
        await slackClient.chat.postMessage({
            channel: targetSlackId,
            text: "🚨 *Verytis AI-Ops Notification*\nThis is a test alert validating that the Verytis App can send you direct messages.",
            blocks: [
                {
                    type: "header",
                    text: {
                        type: "plain_text",
                        text: "Verytis AI-Ops Notification",
                        emoji: true
                    }
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: "Your integration is properly configured. You will now receive security alerts and compliance notifications directly here."
                    }
                }
            ]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Slack Test Alert Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send to Slack channel' }, { status: 500 });
    }
}
