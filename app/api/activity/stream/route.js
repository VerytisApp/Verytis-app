
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (data) => {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                } catch (e) { }
            };

            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            let targetSlackChannelId = null;
            if (channelId) {
                const { data: resource } = await supabase
                    .from('monitored_resources')
                    .select('external_id')
                    .eq('id', channelId)
                    .single();
                if (resource) targetSlackChannelId = resource.external_id;
            }

            // Start check from "now" minus 60 seconds to catch recent events on reconnect
            // This overlaps with initial fetch but ensures we don't miss events if connection drops
            let lastCheck = new Date(Date.now() - 60000).toISOString();
            console.log(`🔌 SSE Polling started for channel: ${channelId} (Slack: ${targetSlackChannelId}) at ${lastCheck}`);

            // POLL LOOP
            const pollInterval = setInterval(async () => {
                try {
                    let query = supabase
                        .from('activity_logs')
                        .select(`
                            id, created_at, action_type, summary, metadata, actor_id,
                            profiles:actor_id ( full_name, email, role )
                        `)
                        .gt('created_at', lastCheck)
                        .order('created_at', { ascending: true }); // Get oldest new logs first to advance timestamp correctly

                    const { data: newLogs, error } = await query;

                    if (error) {
                        console.error("SSE Polling Error:", error.message);
                    } else if (newLogs && newLogs.length > 0) {
                        // Update checkpoint to the latest log timestamp
                        lastCheck = newLogs[newLogs.length - 1].created_at;

                        for (const log of newLogs) {
                            if (targetSlackChannelId) {
                                const logChannel = log.metadata?.slack_channel;
                                if (logChannel !== targetSlackChannelId) continue;
                            }
                            console.log("🔔 SSE Polling: New Activity Found!", log.id);
                            sendEvent({ type: 'new_activity', log: log });
                        }
                    }
                    // Keepalive
                    sendEvent({ type: 'ping' });
                } catch (e) {
                    // console.error("SSE Loop Error:", e);
                }
            }, 2000);

            req.signal.addEventListener('abort', () => {
                console.log("🔌 SSE Connection closed.");
                clearInterval(pollInterval);
                try { controller.close(); } catch (e) { }
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
