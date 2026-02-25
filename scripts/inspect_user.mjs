import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const userId = process.argv[2];

async function inspect() {
    console.log(`Inspecting user: ${userId}`);
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Profile:', JSON.stringify(profile, null, 2));

    const { data: teams, error: tError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('organization_id', profile.organization_id);

    if (tError) console.error('Teams Error:', tError);
    else {
        console.log(`Found ${teams.length} teams for this org:`);
        teams.forEach(t => console.log(`- ${t.name}: ${t.id}`));
    }
}

inspect().catch(console.error);
