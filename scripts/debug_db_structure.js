
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function getStructure() {
    try {
        const t = await supabase.from('teams').select('*').limit(1);
        console.log('Teams:', t.data?.length ? t.data[0] : 'None');
        const r = await supabase.from('monitored_resources').select('*').limit(1);
        console.log('Resources:', r.data?.length ? r.data[0] : 'None');
        const m = await supabase.from('team_members').select('*').limit(1);
        console.log('Team Members:', m.data?.length ? m.data[0] : 'None');
    } catch(e) { console.error(e); }
}
getStructure();

