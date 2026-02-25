import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateContentHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// GET /api/archive — List archived items (with optional section/category filter)
export async function GET(req) {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) return NextResponse.json({ error: 'Organization not found' }, { status: 400 });

        const { searchParams } = new URL(req.url);
        const source = searchParams.get('source');
        const context = searchParams.get('context');
        const view = searchParams.get('view'); // 'trash' for trash items

        // Trash view
        if (view === 'trash') {
            const { data: trashItems, error } = await supabase
                .from('archive_trash')
                .select('*')
                .eq('organization_id', profile.organization_id)
                .eq('restored', false)
                .order('deleted_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            return NextResponse.json({ items: trashItems, view: 'trash' });
        }

        // Normal archive view
        let query = supabase
            .from('archive_items')
            .select('id, section, category, original_table, original_id, label, archived_at, archived_by, retention_until, content_hash, archive_year, source_provider, context_label')
            .eq('organization_id', profile.organization_id)
            .order('archived_at', { ascending: false });

        if (source) query = query.eq('source_provider', source);
        if (context) query = query.eq('context_label', context);

        const { data: items, error } = await query.limit(200);
        if (error) throw error;

        // Count by provider for sidebar badges
        const { data: counts } = await supabase
            .from('archive_items')
            .select('source_provider')
            .eq('organization_id', profile.organization_id);

        const providerCounts = {};
        (counts || []).forEach(row => {
            const src = row.source_provider || 'system';
            providerCounts[src] = (providerCounts[src] || 0) + 1;
        });

        return NextResponse.json({ items, providerCounts });

    } catch (error) {
        console.error('Error fetching archive:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/archive — Archive a new item
export async function POST(req) {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) return NextResponse.json({ error: 'Organization not found' }, { status: 400 });

        const body = await req.json();
        const { source_table, original_id, section, category, label, data, source_provider, context_label } = body;

        if (!source_table || !original_id || (!section && !source_provider) || !category || !label) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Map section to provider for backward compatibility or explicit grouping
        const finalProvider = source_provider || section || 'system';

        const { data: item, error } = await supabase
            .from('archive_items')
            .insert({
                organization_id: profile.organization_id,
                section: section || 'system',
                source_provider: finalProvider,
                context_label,
                category,
                original_table: source_table,
                original_id,
                label,
                data: data || {},
                archived_by: user.id,
            })
            .select()
            .single();

        if (error) throw error;

        // Generate SHA-256 content hash and seal the record
        const contentHash = generateContentHash(data || {});
        await supabase
            .from('archive_items')
            .update({ content_hash: contentHash })
            .eq('id', item.id);

        item.content_hash = contentHash;

        // Log the archive action
        await supabase.from('activity_logs').insert({
            organization_id: profile.organization_id,
            actor_id: user.id,
            action_type: 'DATA_ARCHIVED',
            summary: `Archived "${label}" from ${source_table}`,
            metadata: { archive_item_id: item.id, section, category, original_id, content_hash: contentHash }
        });

        return NextResponse.json({ success: true, item });

    } catch (error) {
        console.error('Error archiving item:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
