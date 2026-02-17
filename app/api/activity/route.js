import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/activity?channelId=<uuid>
 *
 * Returns activity logs for a given monitored resource (channel/repo).
 * Query strategy mirrors api/teams/[teamId] for consistency:
 *   - Primary match:   resource_id = channelId
 *   - Metadata match:  metadata->>repo = resource.name (GitHub)
 *                      metadata->>slack_channel = resource.external_id (Slack)
 *
 * Auth: Access is scoped by channelId — you only see events for the resource you request.
 *       Page-level auth is handled by middleware (session check).
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // ── 1. Resolve Resource Details ─────────────────────────────────
        // We need the resource name/type to build the OR query (same as Stack API)
        let resource = null;
        if (channelId) {
            const { data, error } = await supabase
                .from('monitored_resources')
                .select('type, name, external_id')
                .eq('id', channelId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error resolving resource:', error);
            }
            resource = data;
        }

        // ── 2. Build Query ──────────────────────────────────────────────
        // Model: Exactly mirrors api/teams/[teamId] query pattern
        let query = supabase
            .from('activity_logs')
            .select(`
                id,
                created_at,
                action_type,
                summary,
                metadata,
                actor_id,
                resource_id,
                profiles:actor_id (
                    full_name,
                    email,
                    role
                )
            `)
            .not('action_type', 'in', '("DISCUSSION","DISCUSSION_ANONYMOUS")');

        // ── 3. Apply Resource Filter ────────────────────────────────────
        // Build OR conditions: match by resource_id OR by metadata fields
        // This is the SAME pattern used by api/teams (proven to work)
        if (channelId) {
            const conditions = [`resource_id.eq.${channelId}`];

            if (resource) {
                if (resource.type === 'repo' && resource.name) {
                    // GitHub: also match by repo name in metadata
                    conditions.push(`metadata->>repo.eq.${resource.name}`);
                } else if (resource.external_id) {
                    // Slack: also match by slack_channel ID in metadata
                    conditions.push(`metadata->>slack_channel.eq.${resource.external_id}`);
                }
            }

            query = query.or(conditions.join(','));
        }

        // ── 4. Execute (single order + limit, no duplicates) ────────────
        const { data: logs, error } = await query
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        // ── 5. Map to UI Format ─────────────────────────────────────────
        const events = (logs || []).map(log => {
            let actorName;
            let role;
            let email = null;

            if (log.actor_id && log.profiles?.full_name) {
                actorName = log.profiles.full_name;
                role = log.profiles.role || 'Member';
                email = log.profiles.email;
            } else {
                actorName = log.metadata?.slack_user_name || log.metadata?.github_user || 'User X';
                role = 'Not connected';
            }

            return {
                id: log.id,
                timestamp: log.created_at,
                type: mapActionType(log.action_type),
                action: formatAction(log.action_type),
                target: log.summary || 'No description',
                actor: actorName,
                email,
                role,
                meta: log.metadata?.attachments?.length > 0 ? `${log.metadata.attachments.length} file(s)` : null,
                isAnonymous: log.metadata?.is_anonymous || false,
                channelId: log.metadata?.slack_channel || 'Unknown',
                rawMetadata: log.metadata
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

// ── Helpers ─────────────────────────────────────────────────────────────

function mapActionType(actionType) {
    switch (actionType) {
        case 'APPROVE':
        case 'REJECT':
        case 'TRANSFER':
        case 'EDIT':
        case 'ARCHIVE':
        case 'PR_MERGED':
        case 'CARD_MOVED':
        case 'CARD_ARCHIVED':
            return 'decision';
        case 'COMMENT':
        case 'PR_OPENED':
            return 'comment';
        case 'FILE_SHARED':
        case 'CODE_PUSH':
        case 'ATTACHMENT_ADDED':
            return 'file';
        case 'MEMBER_JOINED':
        case 'CHANNEL_CREATED':
        case 'MEMBER_ASSIGNED':
        case 'CHECKLIST_DONE':
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
        case 'CODE_PUSH': return 'Pushed Commit';
        case 'PR_OPENED': return 'Opened PR';
        case 'PR_MERGED': return 'PR Merged';
        case 'CARD_MOVED': return 'Card Moved';
        case 'MEMBER_ASSIGNED': return 'Member Assigned';
        case 'ATTACHMENT_ADDED': return 'Attachment';
        case 'CHECKLIST_DONE': return 'Checklist Done';
        case 'CARD_ARCHIVED': return 'Card Archived';
        default: return actionType;
    }
}
