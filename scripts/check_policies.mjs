import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPolicies() {
    console.log('--- RLS POLICIES ---');
    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public';"
    });

    if (error) {
        console.error('Error fetching policies:', error);
        // Fallback: try to list tables and their RLS status
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

checkPolicies().catch(console.error);
