import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        // 1. Init SSR Client for Authed User
        const supabase = createClient();

        // 2. Ensure User is Auth'd & Get Org Id
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
        }

        // 3. Parse Body
        const body = await req.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // 4. Generate Raw API Key (Standard Security)
        const rawKey = `vrts_live_${crypto.randomBytes(32).toString('hex')}`;

        // 5. Hash API Key
        const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

        // 6. DB Insertion
        const { data: agent, error: insertError } = await supabase
            .from('ai_agents')
            .insert({
                organization_id: profile.organization_id,
                name,
                description: description || '',
                api_key_hash: hashedKey,
                status: 'active'
            })
            .select('id, name, created_at')
            .single();

        if (insertError) {
            console.error('Failed to create agent:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // 6.5 Log to activity_logs
        await supabase.from('activity_logs').insert({
            organization_id: profile.organization_id,
            actor_id: user.id,
            action_type: 'AI_AGENT_REGISTERED',
            summary: name,
            metadata: { agent_id: agent.id }
        });

        // 7. Return Raw Key Once
        return NextResponse.json({
            success: true,
            agent,
            apiKey: rawKey // RAW KEY ONLY SHOWN ONCE
        }, { status: 200 });

    } catch (error) {
        console.error('Error creating AI Agent:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
