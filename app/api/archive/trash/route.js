import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// POST /api/archive/trash — Restore or permanently purge
export async function POST(req) {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
        if (profile.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

        const body = await req.json();
        const { action, item_id } = body;

        if (!action || !item_id) {
            return NextResponse.json({ error: 'Missing action or item_id' }, { status: 400 });
        }

        // Fetch the trash item
        const { data: trashItem, error: fetchError } = await supabase
            .from('archive_trash')
            .select('*')
            .eq('id', item_id)
            .eq('organization_id', profile.organization_id)
            .single();

        if (fetchError || !trashItem) return NextResponse.json({ error: 'Trash item not found' }, { status: 404 });

        if (action === 'restore') {
            // Regenerate content hash for restored data
            const contentHash = crypto.createHash('sha256')
                .update(JSON.stringify(trashItem.data || {}))
                .digest('hex');

            // Re-insert into archive_items
            const { error: restoreError } = await supabase.from('archive_items').insert({
                organization_id: trashItem.organization_id,
                section: trashItem.section,
                category: trashItem.category,
                original_table: 'restored',
                original_id: trashItem.archive_item_id || trashItem.id,
                label: trashItem.label,
                data: trashItem.data,
                archived_by: user.id,
                content_hash: contentHash,
            });

            if (restoreError) throw restoreError;

            // Mark as restored in trash
            await supabase
                .from('archive_trash')
                .update({ restored: true })
                .eq('id', item_id);

            // Audit log
            await supabase.from('activity_logs').insert({
                organization_id: profile.organization_id,
                actor_id: user.id,
                action_type: 'DATA_RESTORED',
                summary: `Restored "${trashItem.label}" from trash`,
                metadata: { trash_item_id: item_id, section: trashItem.section }
            });

            return NextResponse.json({ success: true, action: 'restored' });
        }

        if (action === 'purge') {
            // Permanent delete
            const { error: purgeError } = await supabase
                .from('archive_trash')
                .delete()
                .eq('id', item_id)
                .eq('organization_id', profile.organization_id);

            if (purgeError) throw purgeError;

            // Audit log with proof
            await supabase.from('activity_logs').insert({
                organization_id: profile.organization_id,
                actor_id: user.id,
                action_type: 'DATA_PURGED',
                summary: `Permanently purged "${trashItem.label}"`,
                metadata: {
                    trash_item_id: item_id,
                    section: trashItem.section,
                    purged_label: trashItem.label,
                    data_keys: Object.keys(trashItem.data || {})
                }
            });

            return NextResponse.json({ success: true, action: 'purged' });
        }

        return NextResponse.json({ error: 'Invalid action. Use "restore" or "purge".' }, { status: 400 });

    } catch (error) {
        console.error('Error processing trash action:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
