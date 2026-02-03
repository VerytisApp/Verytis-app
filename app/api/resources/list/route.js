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
                integrations (
                    provider,
                    organization_id
                )
            `)
            .not('integration_id', 'is', null);

        if (error) throw error;

        // Filter for our ORG (though we only have one integration likely)
        const orgResources = resources.filter(r =>
            r.integrations && r.integrations.organization_id === TEST_ORG_ID
        );

        // Map to UI format
        const formattedResources = orgResources.map(r => {
            // Parse metadata if it's a string
            let meta = r.metadata || {};
            if (typeof meta === 'string') {
                try { meta = JSON.parse(meta); } catch { meta = {}; }
            }

            return {
                id: r.id,
                name: r.name,
                platform: r.integrations?.provider || 'unknown',
                type: r.type,
                status: 'active', // 'active' | 'paused'
                lastActive: r.last_active_at || r.created_at,
                decisions: 0, // Mock for now
                numMembers: meta.num_members || 0,
                isPrivate: meta.is_private || false
            };
        });

        return NextResponse.json({ resources: formattedResources });
    } catch (err) {
        console.error('Error fetching resources:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
