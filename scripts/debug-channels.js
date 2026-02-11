const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing environment variables. Please run with source .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function formatLogTime(time) {
    if (!time) return 'N/A';
    return new Date(time).toISOString().substring(11, 19);
}

async function debug() {
    console.log('--- CHANNEL DEBUG ---');
    console.log('Fetching monitored_resources...');

    const { data: resources, error } = await supabase
        .from('monitored_resources')
        .select(`
            id, 
            name, 
            team_id, 
            external_id, 
            type,
            created_at,
            teams (
                id,
                name
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('ERROR:', error);
        return;
    }

    if (!resources || resources.length === 0) {
        console.log('No resources found.');
        return;
    }

    console.log(`Found ${resources.length} resources:\n`);

    for (const r of resources) {
        const teamName = r.teams ? r.teams.name : 'UNASSIGNED';
        const teamId = r.teams ? r.teams.id : r.team_id || 'NULL';
        const extId = r.external_id || 'MISSING';

        console.log(`Resource: [${r.name}]`);
        console.log(`  ID (DB):      ${r.id}`);
        console.log(`  External ID:  ${extId}`);
        console.log(`  Team:         ${teamName} (ID: ${teamId})`);
        console.log(`  Type:         ${r.type}`);

        // Count logs to check if active
        // Only if external_id is present
        if (r.external_id) {
            const { count } = await supabase
                .from('activity_logs')
                .select('*', { count: 'exact', head: true })
                .eq('metadata->>slack_channel', r.external_id);
            console.log(`  Log Count:    ${count || 0}`);
        } else {
            console.log(`  Log Count:    Unknown (No ExtID)`);
        }

        console.log('--------------------------------------------------');
    }
}

debug();
