import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const supabase = await createClient();

        // Optional auth check if we want to personalize results (e.g., liked status)
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Fetch public published agents
        const { data: agents, error } = await supabase
            .from('published_agents')
            .select(`
                id, 
                author_id, 
                author_pseudo, 
                name, 
                category, 
                description, 
                is_verified, 
                icon_name, 
                bg_color, 
                text_color, 
                capabilities, 
                likes_count, 
                created_at
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching published agents:', error);
            // Fallback to empty array if table doesn't exist yet
            if (error.code === '42P01') {
                return NextResponse.json({ agents: [] });
            }
            throw error;
        }

        // 2. Format the response
        const formattedAgents = agents.map(agent => ({
            id: agent.id,
            name: agent.name,
            author: agent.author_pseudo,
            is_verified: agent.is_verified,
            category: agent.category,
            description: agent.description,
            icon_name: agent.icon_name || 'Bot',
            bgColor: agent.bg_color || 'bg-slate-100',
            color: agent.text_color || 'text-slate-600',
            capabilities: agent.capabilities || [],
            likes: agent.likes_count || 0,
            created_at: agent.created_at
        }));

        return NextResponse.json({ agents: formattedAgents });

    } catch (error) {
        console.error('Error in GET /api/library:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
