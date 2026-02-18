import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    const TEST_ORG_ID = '5db477f6-c893-4ec4-9123-b12160224f70';

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { data: integrations, error } = await supabase
            .from('integrations')
            .select('id, provider, name, settings, created_at')
            .eq('organization_id', TEST_ORG_ID);

        if (error) throw error;

        // Filter connected ones only
        const connectedIntegrations = (integrations || []).filter(i => {
            if (i.provider === 'slack') return !!i.settings?.bot_token;
            if (i.provider === 'github') return !!i.settings?.access_token;
            if (i.provider === 'trello') return !!i.settings?.api_token;
            return false;
        }).map(i => ({
            id: i.id,
            provider: i.provider,
            name: i.name || i.provider,
            connected: true
        }));

        return NextResponse.json({ integrations: connectedIntegrations });
    } catch (error) {
        console.error('Error fetching integrations:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
