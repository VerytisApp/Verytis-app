import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const teamId = '2f552da5-3b31-4e15-923f-fc34daa09bfb'; // Infrastructure Ops

async function testDelete() {
    console.log(`Attempting to delete team: ${teamId}`);

    // First, check if it exists
    const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).single();
    if (!team) {
        console.log('Team not found. Already deleted?');
        return;
    }
    console.log('Found team:', team.name);

    // Try delete
    const { data, error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)
        .select();

    if (error) {
        console.error('❌ Delete Error:', error);
    } else {
        console.log('✅ Delete Success!', data);
    }
}

testDelete().catch(console.error);
