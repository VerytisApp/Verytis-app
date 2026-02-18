const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
    try {
        // Fetch a valid row to get IDs
        const { data: validRow } = await supabase
            .from('monitored_resources')
            .select('team_id, integration_id')
            .limit(1)
            .single();

        if (!validRow) {
            console.log('No rows found to use as template');
            return;
        }

        const dummyId = 'test_board_' + Date.now();
        console.log(`Attempting to insert resource with type='board' (Dummy ID: ${dummyId})...`);

        const { error: insertError } = await supabase
            .from('monitored_resources')
            .insert({
                team_id: validRow.team_id,
                integration_id: validRow.integration_id,
                external_id: dummyId,
                name: 'Test Board',
                type: 'board',
                metadata: {}
            })
            .select();

        if (insertError) {
            console.error('Insert Error:', insertError);
        } else {
            console.log('Successfully inserted type="board"!');
            // Cleanup
            await supabase.from('monitored_resources').delete().eq('external_id', dummyId);
            console.log('Cleaned up dummy resource.');
        }
    } catch (e) {
        console.error(e);
    }
}

inspectSchema();
