const { createClient } = require('@supabase/supabase-js');

// Validate Environment Variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Environment Variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillGitHubActors() {
    console.log("🔄 Starting GitHub Actor Backfill...");

    // 1. Fetch all profiles with a connected GitHub account
    // We can't query JSONB keys easily in all postgres versions via JS client if not indexed, 
    // but we can fetch all and filter in memory if the dataset is small (likely < 1000 users for this app)
    // Or use the contains filter which we know works.

    // To be safe and efficient, let's fetch profiles where social_profiles is not null
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, social_profiles')
        .not('social_profiles', 'is', null);

    if (profilesError) {
        console.error("❌ Error fetching profiles:", profilesError);
        return;
    }

    // Build a map of GitHub Username -> User ID
    const githubUserMap = new Map();
    profiles.forEach(p => {
        const github = p.social_profiles?.github;
        if (github) {
            let username = null;
            if (typeof github === 'string') username = github;
            else if (typeof github === 'object' && github.username) username = github.username;

            if (username && typeof username === 'string') {
                const lowerUsername = username.toLowerCase();
                githubUserMap.set(lowerUsername, p.id);

                // MANUAL MAPPING: Handle the legacy username for this specific user
                if (lowerUsername === 'tychiqueestevepro-maker') {
                    githubUserMap.set('tychiqueesteve', p.id);
                    console.log(`🔗 Manual Mapping Added: tychiqueesteve -> ${p.id} (Tychique Esteve)`);
                }
            }
        }
    });

    console.log(`✅ Loaded ${githubUserMap.size} GitHub-linked profiles.`);

    // 2. Fetch anonymous GitHub activity logs (actor_id is null, platform is GitHub)
    const { data: logs, error: logsError } = await supabase
        .from('activity_logs')
        .select('id, metadata')
        .is('actor_id', null)
        .eq('metadata->>platform', 'GitHub'); // Adjust if platform is stored differently

    if (logsError) {
        console.error("❌ Error fetching logs:", logsError);
        return;
    }

    console.log(`🔍 Found ${logs.length} anonymous GitHub logs.`);

    let updatedCount = 0;

    // 3. Update logs
    for (const log of logs) {
        const githubUser = log.metadata?.github_user || log.metadata?.user_login; // Handle potential schema variations

        if (githubUser) {
            const userId = githubUserMap.get(githubUser.toLowerCase());

            if (userId) {
                const { error: updateError } = await supabase
                    .from('activity_logs')
                    .update({
                        actor_id: userId,
                        metadata: {
                            ...log.metadata,
                            identification_method: 'BACKFILLED',
                            is_anonymous: false
                        }
                    })
                    .eq('id', log.id);

                if (updateError) {
                    console.error(`❌ Failed to update log ${log.id}:`, updateError);
                } else {
                    updatedCount++;
                    console.log(`✅ Linked log ${log.id} (${githubUser}) -> User ${userId}`);
                }
            }
        }
    }

    console.log(`🎉 Backfill Complete: Updated ${updatedCount} logs.`);
}

backfillGitHubActors();
