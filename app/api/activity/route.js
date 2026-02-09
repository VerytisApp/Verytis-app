import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    console.log("🚀 API Activity: Executing Optimized Query with DB Filtering");
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId'); // This is the UUID from monitored_resources

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        let targetSlackChannelId = null;

        // 1. Resolve UUID -> Slack Channel ID (e.g., C0A36CT0GNN)
        if (channelId) {
            const { data: resource, error: resourceError } = await supabase
                .from('monitored_resources')
                .select('external_id')
                .eq('id', channelId)
                .single();

            if (resourceError && resourceError.code !== 'PGRST116') {
                console.error("Error resolving channel ID:", resourceError);
            }

            if (resource) {
                targetSlackChannelId = resource.external_id;
            }
        }

        // 2. Build Query
        let query = supabase
            .from('activity_logs')
            .select(`
                id,
                created_at,
                action_type,
                summary,
                metadata,
                actor_id,
                profiles:actor_id (
                    full_name,
                    email,
                    role
                )
            `)
            .not('action_type', 'in', '("DISCUSSION","DISCUSSION_ANONYMOUS")')
            .order('created_at', { ascending: false })
            .limit(100);

        // 3. Apply DB-level Filter if we have a target Slack ID
        if (targetSlackChannelId) {
            // Use arrow operator for JSONB to filter by text value
            // Note: This requires the column to be indexed for performance in large DBs, 
            // but is fine for now.
            query = query.eq('metadata->>slack_channel', targetSlackChannelId);
        }

        const { data: logs, error } = await query;

        if (error) throw error;

        // No need for in-memory filtering of channels anymore
        // We still keep the mapping logic

        // Map to UI format
        const events = logs.map(log => {
            let actorName;
            let role;

            // Connected user (has actor_id and profile)
            if (log.actor_id && log.profiles?.full_name) {
                actorName = log.profiles.full_name;
                role = log.profiles.role || 'Member';
            }
            // Anonymous user (not connected to Verytis)
            else {
                actorName = 'User X';
                role = 'Not connected';
            }

            return {
                id: log.id,
                timestamp: log.created_at,
                type: mapActionType(log.action_type),
                action: formatAction(log.action_type),
                target: log.summary || 'No description',
                actor: actorName,
                role: role,
                meta: log.metadata?.attachments?.length > 0 ? `${log.metadata.attachments.length} file(s)` : null,
                isAnonymous: log.metadata?.is_anonymous || false,
                channelId: log.metadata?.slack_channel || null
            };
        });

        return NextResponse.json({ events }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (err) {
        console.error('Error fetching activity logs:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function mapActionType(actionType) {
    switch (actionType) {
        case 'APPROVE':
        case 'REJECT':
        case 'TRANSFER':
        case 'EDIT':
        case 'ARCHIVE':
            return 'decision';
        case 'COMMENT':
            return 'comment';
        case 'FILE_SHARED':
            return 'file';
        case 'MEMBER_JOINED':
        case 'CHANNEL_CREATED':
            return 'system';
        case 'DISCUSSION_ANONYMOUS':
        case 'ATTEMPTED_ACTION_ANONYMOUS':
            return 'anonymous';
        default:
            return 'system';
    }
}

function formatAction(actionType) {
    switch (actionType) {
        case 'APPROVE': return 'Approval';
        case 'REJECT': return 'Rejection';
        case 'TRANSFER': return 'Transfer';
        case 'EDIT': return 'Edit';
        case 'ARCHIVE': return 'Archive';
        case 'COMMENT': return 'Comment';
        case 'FILE_SHARED': return 'File';
        case 'MEMBER_JOINED': return 'Member joined';
        case 'CHANNEL_CREATED': return 'Channel created';
        case 'ATTEMPTED_ACTION_ANONYMOUS': return 'Unverified action';
        default: return actionType;
    }
}
