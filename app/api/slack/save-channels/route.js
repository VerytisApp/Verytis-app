import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
    try {
        const { channels } = await req.json(); // Expecting array of {id, name, is_private}

        const TEST_ORG_ID = '5db477f6-c893-4ec4-9123-b12160224f70';

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 1. Get Integration ID
        const { data: integration } = await supabase.from('integrations')
            .select('id')
            .eq('organization_id', TEST_ORG_ID)
            .eq('provider', 'slack')
            .single();

        if (!integration) {
            return NextResponse.json({ error: 'Slack integration not found' }, { status: 404 });
        }

        // 2. Prepare Insert Data
        const resources = channels.map(c => ({
            integration_id: integration.id,
            external_id: c.id,
            name: c.name,
            type: 'channel',
            audit_level: 'metadata_only', // Default
            last_active_at: new Date().toISOString(),
            metadata: JSON.stringify({
                num_members: c.num_members || 0,
                is_private: c.is_private || false
            })
        }));

        // 3. Upsert resources (using external_id + integration_id uniqueness?)
        // Schema doesn't strictly enforce unique(integration_id, external_id) unless added later, 
        // but let's check manually or assume upsert if PK allows. 
        // monitored_resources PK is UUID `id`. Upsert on 'external_id' might fail if not unique constraint.
        // Let's iterate or use OnConflict if a constraint exists.
        // For MVP speed, let's just insert and ignore dups or select first.
        // Better: Delete existing for this integration that match the IDs, then insert? Or just insert all.
        // Let's assume user wants to ADD.

        // Check which already exist to avoid duplicates
        const { data: existing } = await supabase.from('monitored_resources')
            .select('external_id')
            .eq('integration_id', integration.id);

        const existingIds = new Set(existing?.map(e => e.external_id) || []);
        const newResources = resources.filter(r => !existingIds.has(r.external_id));

        if (newResources.length > 0) {
            const { error } = await supabase.from('monitored_resources').insert(newResources);
            if (error) throw error;
        }

        return NextResponse.json({ success: true, count: newResources.length });

    } catch (error) {
        console.error('Save Channels Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
