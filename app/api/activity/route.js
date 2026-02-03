import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId'); // Optional: filter by channel

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
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
            // Exclude simple discussions - only show actions, system events, files
            .not('action_type', 'in', '("DISCUSSION","DISCUSSION_ANONYMOUS")')
            .order('created_at', { ascending: false })
            .limit(100);

        // If channelId provided, filter by slack channel in metadata
        if (channelId) {
            const { data: resource } = await supabase
                .from('monitored_resources')
                .select('external_id')
                .eq('id', channelId)
                .single();

            if (resource) {
                // Use containment operator for JSONB filtering
                query = query.contains('metadata', { slack_channel: resource.external_id });
            }
        }

        const { data: logs, error } = await query;

        if (error) throw error;

        // Filter: only include events that are actions, have attachments, or are system events
        const filteredLogs = logs.filter(log => {
            const actionType = log.action_type;
            const hasAttachments = log.metadata?.attachments?.length > 0;

            // Include if it's a real action (not discussion)
            const isAction = ['APPROVE', 'REJECT', 'TRANSFER', 'EDIT', 'ARCHIVE', 'COMMENT'].includes(actionType);

            // Include if it's a system event (member_joined, file_shared, etc.)
            const isSystemEvent = ['MEMBER_JOINED', 'FILE_SHARED', 'CHANNEL_CREATED'].includes(actionType);

            // Include anonymous attempted actions (for audit trail)
            const isAttemptedAction = actionType === 'ATTEMPTED_ACTION_ANONYMOUS';

            return isAction || isSystemEvent || isAttemptedAction || hasAttachments;
        });

        // Map to UI format
        const events = filteredLogs.map(log => {
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

        return NextResponse.json({ events });
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
