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
    const boardId = searchParams.get('boardId');

    try {
        const { token } = await getValidToken('trello', 'team', { 
            organizationId: profile.organization_id 
        });

        if (!token) return NextResponse.json({ error: 'Not connected' }, { status: 403 });

        const API_KEY = process.env.TRELLO_API_KEY;

        if (boardId) {
            // Fetch Lists for a specific Board
            const response = await fetch(`https://api.trello.com/1/boards/${boardId}/lists?key=${API_KEY}&token=${token}&fields=id,name`);
            if (!response.ok) throw new Error('Failed to fetch lists');
            const lists = await response.json();
            return NextResponse.json({
                items: lists.map(l => ({ label: l.name, value: l.id }))
            });
        } else {
            // Fetch Boards
            const response = await fetch(`https://api.trello.com/1/members/me/boards?key=${API_KEY}&token=${token}&fields=id,name&filter=open`);
            if (!response.ok) throw new Error('Failed to fetch boards');
            const boards = await response.json();
            return NextResponse.json({
                items: boards.map(b => ({ label: b.name, value: b.id }))
            });
        }
    } catch (error) {
        console.error('[API TRELLO METADATA] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
