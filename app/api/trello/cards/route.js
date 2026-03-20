import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidToken } from '@/lib/auth-util';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const listId = searchParams.get('listId');
    const type = searchParams.get('type') || 'team';

    if (!listId) return NextResponse.json({ error: 'Missing listId' }, { status: 400 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
    
    const targetOrgId = profile?.organization_id;
    const API_KEY = process.env.TRELLO_API_KEY;

    try {
        const { token, id: integration_id } = await getValidToken('trello', type, {
            userId: user.id,
            organizationId: targetOrgId
        });

        if (!token || !API_KEY) {
            return NextResponse.json({ cards: [] });
        }

        const response = await fetch(`https://api.trello.com/1/lists/${listId}/cards?key=${API_KEY}&token=${token}&fields=id,name`);
        if (response.ok) {
            const cards = await response.json();
            return NextResponse.json({ cards });
        }

        return NextResponse.json({ cards: [] });
    } catch (error) {
        console.error('Trello cards fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
