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

        // 2. Auth & Permissions Context
        const userId = req.headers.get('x-user-id') || searchParams.get('userId'); // Retrieve from secure header or param

        let userRole = 'admin'; // Default to admin for dev/demo if no user provided (simulated unsecured access)
        let userScopes = [];
        let userTeamId = null;

        if (userId) {
            // Fetch User Context
            const { data: userProfile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

            if (userProfile) userRole = userProfile.role;

            // Fetch Scopes
            const { data: perms } = await supabase
                .from('user_permissions')
                .select('permission_key')
                .eq('user_id', userId)
                .eq('is_enabled', true);
            userScopes = perms ? perms.map(p => p.permission_key) : [];

            // Fetch Team
            const { data: teamMember } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', userId)
                .eq('role', 'lead') // Only relevant if lead/manager
                .maybeSingle();
            if (teamMember) userTeamId = teamMember.team_id;
        }

        // 3. Build Base Query
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
            .not('action_type', 'in', '("DISCUSSION","DISCUSSION_ANONYMOUS")')
            .order('created_at', { ascending: false })
            .limit(100);

        // 4. Apply Security Filters (Scopes & Roles)
        if (userRole === 'member') {
            // Member: Strict restriction to own activity
            if (userId) query = query.eq('actor_id', userId);
        }
        else if (userRole === 'manager') {
            // Manager: Check for Audit Scope
            const hasAuditScope = userScopes.includes('Channel Audit') || userScopes.includes('Full Audit');

            if (!hasAuditScope || !userTeamId) {
                // No scope OR not assigned to team -> Fallback to own activity
                if (userId) query = query.eq('actor_id', userId);
            } else {
                // Has Scope AND Team: Filter by Team Resources
                const { data: teamResources } = await supabase
                    .from('monitored_resources')
                    .select('id')
                    .eq('team_id', userTeamId);

                const resourceIds = teamResources?.map(r => r.id) || [];

                if (resourceIds.length > 0) {
                    query = query.in('resource_id', resourceIds);
                } else {
                    // Team has no resources -> Show nothing (or own activity)
                    if (userId) query = query.eq('actor_id', userId);
                }
            }
        }
        // Admin: No extra filters (sees all)

        // 5. Apply Specific Param Filters (e.g. Channel)
        // 5. Apply Specific Param Filters
        // If a specific resource (channel/repo) is requested via ID
        if (channelId) {
            query = query.eq('resource_id', channelId);
        } else if (targetSlackChannelId) {
            // Fallback for legacy calls using external ID logic (if any)
            query = query.eq('metadata->>slack_channel', targetSlackChannelId);
        }

        const { data: logs, error } = await query;

        if (error) throw error;

        // Map to UI format
        const events = logs.map(log => {
            let actorName;
            let role;
            let email = null;

            // Connected user (has actor_id and profile)
            if (log.actor_id && log.profiles?.full_name) {
                actorName = log.profiles.full_name;
                role = log.profiles.role || 'Member';
                email = log.profiles.email;
            }
            // Anonymous user (not connected to Verytis)
            else {
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
                email: email,
                role: role,
                meta: log.metadata?.attachments?.length > 0 ? `${log.metadata.attachments.length} file(s)` : null,
                isAnonymous: log.metadata?.is_anonymous || false,
                channelId: log.metadata?.slack_channel || 'Unknown',
                rawMetadata: log.metadata // Include full metadata for audit export (proofs, text, etc.)
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
        case 'PR_MERGED':
            return 'decision';
        case 'COMMENT':
        case 'PR_OPENED':
            return 'comment';
        case 'FILE_SHARED':
        case 'CODE_PUSH':
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
        case 'CODE_PUSH': return 'Code Push';
        case 'PR_OPENED': return 'PR Opened';
        case 'PR_MERGED': return 'PR Merged';
        default: return actionType;
    }
}
