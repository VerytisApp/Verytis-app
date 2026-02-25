
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync('.env.local'));

async function main() {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
        .from('archive_items')
        .select('*')
        .eq('original_table', 'teams')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        process.exit(1);
    }

    console.log(JSON.stringify(data, null, 2));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
