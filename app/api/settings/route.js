import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const supabase = createClient();

        // 1. Verify user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch the default organization settings
        const { data: settings, error: fetchError } = await supabase
            .from('organization_settings')
            .select('*')
            .eq('id', 'default')
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching org settings:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
        }

        // 3. Scrub sensitive encrypted tokens from traversing the network back to the client
        if (settings && settings.providers && Array.isArray(settings.providers)) {
            settings.providers = settings.providers.map(p => {
                const { encryptedToken, ...rest } = p;
                return rest;
            });
        }

        // 4. Provide user profile fallbacks for the initial alerting setup
        const userFallback = {
            email: user.email,
            phone: user.user_metadata?.alert_phone || user.phone || ''
        };

        return NextResponse.json({ settings, user: userFallback });

    } catch (error) {
        console.error('Unexpected error in settings API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const supabase = createClient();
        const body = await req.json();

        // 1. Verify user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. We could verify Admin role here on server-side as well,
        // though RLS handle it at the database layer.

        // Remove id and updated_at from the payload if present
        const { id, updated_at, ...updateData } = body;

        // 3. Encrypt sensitive provider LLM tokens via AES-256-GCM
        if (updateData.providers && Array.isArray(updateData.providers)) {
            updateData.providers = updateData.providers.map(p => {
                if (p.rawToken) {
                    p.encryptedToken = encrypt(p.rawToken);
                    delete p.rawToken;
                }
                return p;
            });
        }

        // 4. Update the global settings
        const { data, error: updateError } = await supabase
            .from('organization_settings')
            .update(updateData)
            .eq('id', 'default')
            .select()
            .single();

        if (updateError) {
            console.error('Error updating org settings:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, settings: data });

    } catch (error) {
        console.error('Unexpected error in settings API PUT:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
