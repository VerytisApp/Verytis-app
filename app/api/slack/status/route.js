import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    // 1. Context: "Test Corp"
    const TEST_ORG_ID = '5db477f6-c893-4ec4-9123-b12160224f70';

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2. Check if we have a token in 'integrations'
    const { data, error } = await supabase.from('integrations')
        .select('id, settings, name')
        .eq('organization_id', TEST_ORG_ID)
        .eq('provider', 'slack')
        .single();

    // 3. Determine status
    const isConnected = !!(data && data.settings?.bot_token);

    return NextResponse.json({
        connected: isConnected,
        teamName: data?.name || null,
        lastSync: isConnected ? new Date().toISOString() : null
    });
}
