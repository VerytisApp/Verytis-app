import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    try {
        const { data: integrations, error } = await supabase
            .from('integrations')
            .select('id, provider, name, settings, created_at')
            .eq('organization_id', profile.organization_id);

        if (error) throw error;

        // Map all integrations with their connection status
        const allIntegrations = (integrations || []).map(i => {
            let connected = false;
            if (i.provider === 'slack') connected = !!i.settings?.bot_token;
            else if (i.provider === 'github') connected = !!i.settings?.access_token;
            else if (i.provider === 'trello') connected = !!i.settings?.api_token;

            return {
                id: i.id,
                provider: i.provider,
                name: (i.name || i.provider).charAt(0).toUpperCase() + (i.name || i.provider).slice(1),
                connected: connected,
                auth_type: 'OAuth 2.0'
            };
        });

        return NextResponse.json({ integrations: allIntegrations });
    } catch (error) {
        console.error('Error fetching integrations:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
