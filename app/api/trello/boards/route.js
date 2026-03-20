import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidToken } from '@/lib/auth-util';

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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'team'; // 'team' or 'personal'

    const targetOrgId = profile.organization_id;
    const API_KEY = process.env.TRELLO_API_KEY;

    try {
        const { token, id: integration_id } = await getValidToken('trello', type, { 
            userId: user.id, 
            organizationId: targetOrgId 
        });

        if (!token) {
            console.warn(`[API TRELLO BOARDS] No token found for type: ${type}`);
            return NextResponse.json({ boards: [] });
        }

        // 2. Try Fetch Boards from Trello
        if (API_KEY && !token.toString().includes('demo')) {
            try {
                const response = await fetch(`https://api.trello.com/1/members/me/boards?key=${API_KEY}&token=${token}&fields=id,name,url&filter=open`);
                if (response.ok) {
                    const boards = await response.json();
                    return NextResponse.json({
                        boards: boards.map(b => ({ id: b.id, name: b.name, url: b.url, provider: 'trello' }))
                    });
                }
            } catch (e) {
                console.error('Trello API Fetch failed:', e.message);
            }
        }

        // 3. Fallback: Return already monitored boards from DB
        if (integration_id) {
            const { data: existing } = await supabase.from('monitored_resources')
                .select('*')
                .eq('integration_id', integration_id)
                .eq('type', 'folder');

            return NextResponse.json({
                boards: (existing || []).map(b => ({
                    id: b.external_id,
                    name: b.name,
                    url: '#',
                    provider: 'trello'
                }))
            });
        }

        return NextResponse.json({ boards: [] });

    } catch (error) {
        console.error('Critical failure in Trello boards route:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
