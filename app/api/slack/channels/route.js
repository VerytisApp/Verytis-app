import { NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';
import { decryptToken } from '@/lib/encryption';
import { createClient } from '@supabase/supabase-js';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    let organizationId = searchParams.get('organizationId');
    const teamId = searchParams.get('teamId');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (!organizationId && teamId) {
        const { data } = await supabase.from('teams').select('organization_id').eq('id', teamId).single();
        if (data) organizationId = data.organization_id;
    }

    const targetOrgId = organizationId || '5db477f6-c893-4ec4-9123-b12160224f70';

    const { data: integration } = await supabase.from('integrations')
        .select('settings')
        .eq('organization_id', targetOrgId)
        .eq('provider', 'slack')
        .single();

    const token = integration?.settings?.bot_token;

    if (!token) {
        return NextResponse.json({ error: 'No Slack access token found for this organization' }, { status: 401 });
    }

    const client = new WebClient(decryptToken(token));

    try {
        const result = await client.conversations.list({
            types: 'public_channel,private_channel',
            limit: 100,
            exclude_archived: true
        });

        const channels = result.channels.map(c => ({
            id: c.id,
            name: c.name,
            is_private: c.is_private,
            num_members: c.num_members
        }));

        return NextResponse.json({ channels });
    } catch (error) {
        console.error('Slack Channels Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
