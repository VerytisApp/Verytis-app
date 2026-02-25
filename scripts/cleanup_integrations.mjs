import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanup() {
    console.log('🧹 Purging duplicate integrations and stale resources...');

    const orgId = '1abe99cd-78ae-4f6a-b839-c44e68e408d1';

    // 1. Get all integrations for this org
    const { data: integrations } = await supabase
        .from('integrations')
        .select('*')
        .eq('organization_id', orgId);

    if (!integrations) return;

    // 2. Identify duplicates by provider
    const providerMap = {};
    const toDelete = [];

    integrations.forEach(i => {
        if (!providerMap[i.provider]) {
            providerMap[i.provider] = i.id;
        } else {
            // Keep the one with settings if available
            if (i.settings && Object.keys(i.settings).length > 0) {
                toDelete.push(providerMap[i.provider]);
                providerMap[i.provider] = i.id;
            } else {
                toDelete.push(i.id);
            }
        }
    });

    if (toDelete.length > 0) {
        console.log(`🗑️ Deleting ${toDelete.length} duplicate integrations...`);

        // Delete monitored resources first due to FK
        await supabase.from('monitored_resources').delete().in('integration_id', toDelete);
        await supabase.from('integrations').delete().in('id', toDelete);
    }

    console.log('✨ Database sanitized.');
}

cleanup().catch(console.error);
