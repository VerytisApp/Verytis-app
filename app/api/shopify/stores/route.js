import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
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
        const { data: connections, error } = await supabase
            .from('user_connections')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .eq('provider', 'shopify');

        if (error) throw error;

        const stores = (connections || []).map(c => ({
            id: c.id,
            name: c.account_name || c.metadata?.store_url || 'Boutique Shopify',
            store_url: c.metadata?.store_url,
            is_im: false,
        }));

        return NextResponse.json({ stores });
    } catch (error) {
        console.error('[API SHOPIFY STORES] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
