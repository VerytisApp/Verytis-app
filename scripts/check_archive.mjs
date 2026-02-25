import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const originalId = process.argv[2];

async function checkArchive() {
    console.log(`Checking archive for original_id: ${originalId}`);
    const { data, error } = await supabase
        .from('archive_items')
        .select('*')
        .eq('original_id', originalId);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data.length === 0) {
        console.log('No archive items found.');
    } else {
        console.log(`Found ${data.length} archive items:`);
        data.forEach(item => {
            console.log(`- Label: ${item.label}`);
            console.log(`  Table: ${item.original_table}`);
            console.log(`  Archived at: ${item.archived_at}`);
        });
    }
}

checkArchive().catch(console.error);
