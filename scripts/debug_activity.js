
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActivity() {
    // Get GitHub resources first to get their IDs
    const { data: resources } = await supabase
        .from('monitored_resources')
        .select('id, name')
        .ilike('name', '%Verytis%');

    console.log("GitHub Resources:", resources);

    if (resources && resources.length > 0) {
        const resourceIds = resources.map(r => r.id);

        const { data: events, error } = await supabase
            .from('activity_logs')
            .select('*')
            .in('resource_id', resourceIds);

        if (error) {
            console.error("Error fetching activity:", error);
        } else {
            console.log(`Found ${events.length} events for these resources.`);
            if (events.length > 0) {
                console.log("Sample Event:", JSON.stringify(events[0], null, 2));
            }
        }
    }
}

checkActivity();
