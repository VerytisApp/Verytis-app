import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    // Hardcoded for MVP "Test Corp"
    const TEST_ORG_ID = '5db477f6-c893-4ec4-9123-b12160224f70';

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // Fetch monitored resources and their integration details
        const { data: resources, error } = await supabase
            .from('monitored_resources')
            .select(`
                id,
                name,
                type,
                last_active_at,
                created_at,
                audit_level,
                metadata,
                integration_id,
                team_id,
                integrations (
                    provider,
                    organization_id
                )
            `);

        if (error) throw error;

        // Filter for our ORG (though we only have one integration likely)
        const orgResources = resources.filter(r => {
            const match = r.integrations && r.integrations.organization_id === TEST_ORG_ID;
            if (!match) {
                console.log(`Resource ${r.id} (${r.name}) filtered out. OrgID: ${r.integrations?.organization_id} vs ${TEST_ORG_ID}`);
            }
            return match;
        });

        // Fetch activity stats for these resources
        const resourceIds = orgResources.map(r => r.id);
        const { data: activities, error: activityError } = await supabase
            .from('activity_logs')
            .select('resource_id, created_at, actor_id')
            .in('resource_id', resourceIds);

        const stats = {};
        if (activities) {
            activities.forEach(log => {
                if (!stats[log.resource_id]) {
                    stats[log.resource_id] = {
                        lastActive: null,
                        actors: new Set()
                    };
                }

                const currentLast = stats[log.resource_id].lastActive;
                if (!currentLast || new Date(log.created_at) > new Date(currentLast)) {
                    stats[log.resource_id].lastActive = log.created_at;
                }

                if (log.actor_id) {
                    stats[log.resource_id].actors.add(log.actor_id);
                }
            });
        }

        console.log(`Total resources: ${resources.length}, Filtered resources: ${orgResources.length}`);

        // Map to UI format
        const formattedResources = orgResources.map(r => {
            // Parse metadata if it's a string
            let meta = r.metadata || {};
            if (typeof meta === 'string') {
                try { meta = JSON.parse(meta); } catch { meta = {}; }
            }

            const resStats = stats[r.id] || { lastActive: null, actors: new Set() };

            // Prefer calculated lastActive, fallback to DB last_active_at, then created_at
            const effectiveLastActive = resStats.lastActive || r.last_active_at || r.created_at;
            const contributorCount = resStats.actors.size;

            return {
                id: r.id,
                teamId: r.team_id,
                name: r.name,
                platform: r.integrations?.provider || 'unknown',
                type: r.type,
                status: 'active', // 'active' | 'paused'
                lastActive: effectiveLastActive,
                decisions: 0, // Mock for now
                numMembers: contributorCount, // Real contributor count
                isPrivate: meta.is_private || false
            };
        });

        return NextResponse.json({
            resources: formattedResources,
            debug_all: resources.map(r => ({
                id: r.id,
                name: r.name,
                integration: r.integrations,
                org_id_match: r.integrations?.organization_id === TEST_ORG_ID
            }))
        });
    } catch (err) {
        console.error('Error fetching resources:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
