import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const supabase = await createClient();
        const body = await req.json();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Extract author pseudo from DB metadata, else default to name/email
        const { name, category, description, function1, function2, function3, sourceCodes, ...policies } = body;

        let authorPseudo = user.user_metadata?.pseudo;
        if (!authorPseudo) {
            authorPseudo = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous';
        }

        const capabilities = [function1, function2, function3].filter(Boolean);

        // Define icons and colors heuristically based on category
        let icon_name = 'Bot';
        let bg_color = 'bg-slate-100';
        let text_color = 'text-slate-600';

        if (category === 'DevSecOps') { icon_name = 'Shield'; bg_color = 'bg-indigo-50'; text_color = 'text-indigo-600'; }
        if (category === 'FinOps') { icon_name = 'DollarSign'; bg_color = 'bg-emerald-50'; text_color = 'text-emerald-600'; }
        if (category === 'Support Client') { icon_name = 'Users'; bg_color = 'bg-blue-50'; text_color = 'text-blue-600'; }

        // Compile source codes
        const filledSources = {};
        if (sourceCodes) {
            Object.entries(sourceCodes).forEach(([lang, code]) => {
                if (code && code.trim() !== '') {
                    filledSources[lang] = code;
                }
            });
        }

        const code_language = Object.keys(filledSources).join(',') || 'Python';
        const code_source = JSON.stringify(filledSources);

        const { data: newAgent, error: insertError } = await supabase
            .from('published_agents')
            .insert({
                author_id: user.id,
                author_pseudo: authorPseudo,
                name,
                category,
                description,
                is_verified: false, // User submitted agents are never verified by default
                icon_name,
                bg_color,
                text_color,
                capabilities,
                code_language,
                code_source,
                suggested_policies: policies || {}
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, agent: newAgent });

    } catch (error) {
        console.error('Error publishing agent:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
