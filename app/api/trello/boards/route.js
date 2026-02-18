import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    const TEST_ORG_ID = '5db477f6-c893-4ec4-9123-b12160224f70';
    const API_KEY = process.env.TRELLO_API_KEY;

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // 1. Get Trello Integration Token
        const { data: integration, error } = await supabase
            .from('integrations')
            .select('settings')
            .eq('organization_id', TEST_ORG_ID)
            .eq('provider', 'trello')
            .single();

        if (error || !integration || !integration.settings?.api_token) {
            return NextResponse.json({ boards: [] });
        }

        const token = integration.settings.api_token;

        // 2. Fetch Boards from Trello
        const response = await fetch(`https://api.trello.com/1/members/me/boards?key=${API_KEY}&token=${token}&fields=id,name,url&filter=open`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Trello API error: ${response.status} ${errorText}`);
        }

        const boards = await response.json();

        // 3. Format response to match GitHub/Slack structure for frontend reuse
        // Frontend expects: { repositories: [...], channels: [...] }
        // Let's use 'boards' key but structure items similarly
        const formattedBoards = boards.map(board => ({
            id: board.id,
            name: board.name,
            url: board.url,
            provider: 'trello'
        }));

        return NextResponse.json({ boards: formattedBoards });

    } catch (error) {
        console.error('Error fetching Trello boards:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
