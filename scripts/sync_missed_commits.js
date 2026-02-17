const { createClient } = require('@supabase/supabase-js');

// Helper function to get valid token (simplified version of lib/github.js for script usage)
// Since we can't easily import ES modules in this CJS script context without package.json changes,
// I'll replicate the core logic or use dynamic import if needed. 
// For simplicity, I will implement the token fetch logic here directly.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Environment Variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getValidToken(integrationId) {
    const { data: integration, error } = await supabase.from('integrations')
        .select('settings')
        .eq('id', integrationId)
        .single();

    if (error || !integration) return null;

    const { access_token, refresh_token, expires_in, created_at } = integration.settings;

    // Check Expiration
    if (created_at && expires_in) {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = created_at + expires_in;
        const buffer = 300; // 5 minutes buffer

        if (now < expiresAt - buffer) {
            return access_token;
        }
    }

    // Refresh Token Logic
    if (!refresh_token) {
        console.warn('❌ Token expired and no refresh token available.', integrationId);
        return null;
    }

    console.log('🔄 Refreshing GitHub token...');

    try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            })
        });

        const data = await response.json();

        if (data.error || !data.access_token) {
            console.error('❌ Refresh failed:', data);
            return null;
        }

        // Update Database
        const newSettings = {
            ...integration.settings,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
            refresh_token_expires_in: data.refresh_token_expires_in,
            created_at: Math.floor(Date.now() / 1000)
        };

        await supabase.from('integrations')
            .update({ settings: newSettings })
            .eq('id', integrationId);

        console.log('✅ Token Refreshed.');
        return data.access_token;

    } catch (e) {
        console.error('❌ Exception during refresh', e);
        return null;
    }
}

async function syncMissedCommits() {
    console.log("🔄 Starting GitHub Commit Sync...");

    // 1. Fetch Monitored Repos
    const { data: resources, error: resError } = await supabase
        .from('monitored_resources')
        .select('*, teams(organization_id)')
        .eq('type', 'repo');

    if (resError) {
        console.error("❌ Error fetching resources:", resError);
        return;
    }

    console.log(`🔍 Found ${resources.length} monitored repositories.`);

    // 2. Load User Map (GitHub Username -> Profile)
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, social_profiles');
    const githubUserMap = new Map();

    profiles.forEach(p => {
        const github = p.social_profiles?.github;
        if (github?.username) {
            githubUserMap.set(github.username.toLowerCase(), p);
        }
        // Legacy string format support
        if (typeof github === 'string') {
            githubUserMap.set(github.toLowerCase(), p);
        }
    });

    // Manual mapping fallback
    githubUserMap.set('tychiqueesteve', profiles.find(p => p.social_profiles?.github?.username === 'tychiqueestevepro-maker') || { id: '4cf8db21-2e1e-4c22-9055-d586b7fed310', full_name: 'Tychique Esteve' });


    // 3. Process Each Repo
    for (const resource of resources) {
        console.log(`\n📦 Processing ${resource.name}...`);

        if (!resource.integration_id) {
            console.log("   ⚠️ No integration ID linked. Skipping.");
            continue;
        }

        const token = await getValidToken(resource.integration_id);
        if (!token) {
            console.log("   ❌ Could not get access token. Skipping.");
            continue;
        }

        // Fetch Commits from GitHub (Last 30)
        try {
            const response = await fetch(`https://api.github.com/repos/${resource.name}/commits?per_page=30`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                console.error(`   ❌ GitHub API Error: ${response.status} ${response.statusText}`);
                continue;
            }

            const commits = await response.json();
            console.log(`   ✅ Fetched ${commits.length} commits from GitHub.`);

            let addedCount = 0;

            for (const commit of commits) {
                const sha = commit.sha;

                // CHECK IF EXISTS IN DB
                // Using contains filter on JSONB column
                const { data: existing, error: checkError } = await supabase
                    .from('activity_logs')
                    .select('id')
                    .contains('metadata', { commits: [{ id: sha }] })
                    .maybeSingle();

                if (existing) {
                    process.stdout.write('.'); // Dot for skipped
                    continue;
                }

                // DOES NOT EXIST -> INSERT
                const authorLogin = commit.author?.login || commit.commit.author.name;
                const authorName = commit.commit.author.name;
                const message = commit.commit.message;
                const url = commit.html_url;
                const date = commit.commit.author.date;

                // Identify User
                let userId = null;
                let identificationMethod = 'ANONYMOUS';
                let isVerified = false;

                if (authorLogin) {
                    const profile = githubUserMap.get(authorLogin.toLowerCase());
                    if (profile) {
                        userId = profile.id;
                        identificationMethod = 'SOCIAL_LINK';
                        isVerified = true;
                    }
                    // Manual override if needed, but handled in map construction
                }

                // Insert Log
                // We emulate a "CODE_PUSH" event with a single commit
                // This ensures it uses the same UI components
                const { error: insertError } = await supabase.from('activity_logs').insert({
                    created_at: date, // Backdate to actual commit time
                    organization_id: resource.teams?.organization_id,
                    resource_id: resource.id,
                    actor_id: userId,
                    action_type: 'CODE_PUSH',
                    summary: `Pushed commit: ${message.split('\n')[0].substring(0, 50)}...`,
                    metadata: {
                        platform: 'GitHub',
                        repo: resource.name,
                        github_user: authorLogin,
                        identification_method: identificationMethod,
                        is_anonymous: !isVerified,
                        branch: 'main', // Assumption, but acceptable for recovery
                        commits: [{
                            id: sha,
                            message: message,
                            url: url,
                            author: authorName
                        }]
                    }
                });

                if (insertError) {
                    console.error(`\n   ❌ Failed to insert commit ${sha.substring(0, 7)}:`, insertError.message);
                } else {
                    process.stdout.write('+'); // Plus for added
                    addedCount++;
                }
            }

            if (addedCount > 0) {
                console.log(`\n   🎉 Recovered ${addedCount} missing commits.`);
            } else {
                console.log(`\n   ✨ All verified commits already exist.`);
            }

        } catch (e) {
            console.error("   ❌ Exception processing repo:", e);
        }
    }

    console.log("\n✅ Sync Process Completed.");
}

syncMissedCommits();
