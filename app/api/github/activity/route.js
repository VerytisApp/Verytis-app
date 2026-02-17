import { getValidGitHubToken } from '@/lib/github';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
        return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // 1. Get Team's Monitored Repositories
        const { data: resources, error: resourceError } = await supabase
            .from('monitored_resources')
            .select('*')
            .eq('team_id', teamId)
            .eq('type', 'repo');

        if (resourceError) throw resourceError;
        if (!resources || resources.length === 0) {
            return NextResponse.json({ activity: [] });
        }

        // 2. Get GitHub App Installation Token
        const integrationId = resources[0].integration_id;
        if (!integrationId) {
            console.error("Resources found but no linked integration_id");
            return NextResponse.json({ activity: [] });
        }

        // Use utility to get valid token (handles refresh)
        const access_token = await getValidGitHubToken(integrationId);

        if (!access_token) {
            console.error("Failed to get valid access token for ID:", integrationId);
            return NextResponse.json({ activity: [] });
        }

        // 3. Fetch Activity from GitHub (Commits & PRs) for each repo
        let allActivity = [];

        // Fetch Profiles to map users
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, social_profiles');

        const profileMap = new Map();
        profiles?.forEach(p => {
            const githubProfile = p.social_profiles?.github;
            if (githubProfile?.username) {
                profileMap.set(githubProfile.username.toLowerCase(), p);
            }
            // Also map by ID if available?
            if (githubProfile?.id) {
                profileMap.set(String(githubProfile.id), p);
            }
        });

        // Loop through resources to fetch activity
        // Note: Promise.all for speed
        await Promise.all(resources.map(async (resource) => {
            // Resource name is typically "owner/repo"
            const repoFullName = resource.name;

            try {
                // A. Fetch Commits
                const commitsRes = await fetch(`https://api.github.com/repos/${repoFullName}/commits?per_page=5`, {
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (commitsRes.ok) {
                    const commits = await commitsRes.json();
                    commits.forEach(commit => {
                        const authorLogin = commit.author?.login; // GitHub username
                        const authorName = commit.commit?.author?.name; // Git author name

                        // User Mapping Logic
                        let actorName = 'Unknown';
                        let systemUser = null;

                        if (authorLogin) {
                            systemUser = profileMap.get(authorLogin.toLowerCase());
                        }

                        if (systemUser) {
                            actorName = systemUser.full_name;
                        } else if (authorLogin) {
                            actorName = `User ${authorLogin} (Utilisateur à connecter)`;
                        } else {
                            actorName = `User ${authorName || 'Unknown'} (Utilisateur à connecter)`;
                        }

                        allActivity.push({
                            id: commit.sha,
                            type: 'github_commit',
                            platform: 'github',
                            action: 'COMMIT',
                            target: commit.commit.message,
                            actor: actorName,
                            user: {
                                name: actorName,
                                avatar: commit.author?.avatar_url,
                                username: authorLogin
                            },
                            repo: repoFullName,
                            time: commit.commit.author.date,
                            url: commit.html_url
                        });
                    });
                }

                // B. Fetch Pull Requests
                const pullsRes = await fetch(`https://api.github.com/repos/${repoFullName}/pulls?state=all&per_page=3`, {
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (pullsRes.ok) {
                    const pulls = await pullsRes.json();
                    pulls.forEach(pr => {
                        const authorLogin = pr.user?.login;
                        const validProfile = authorLogin ? profileMap.get(authorLogin.toLowerCase()) : null;

                        let actorName = 'Unknown';
                        if (validProfile) {
                            actorName = validProfile.full_name;
                        } else if (authorLogin) {
                            actorName = `User ${authorLogin} (Utilisateur à connecter)`;
                        } else {
                            actorName = `User ${pr.user?.login || 'Unknown'} (Utilisateur à connecter)`;
                        }

                        // Determine action type based on state
                        const action = pr.state === 'open' ? 'OPEN_PR' : (pr.merged_at ? 'MERGE_PR' : 'CLOSE_PR');

                        allActivity.push({
                            id: String(pr.id),
                            type: 'github_pr',
                            platform: 'github',
                            action: action,
                            target: pr.title,
                            actor: actorName,
                            user: {
                                name: actorName,
                                avatar: pr.user?.avatar_url,
                                username: authorLogin
                            },
                            repo: repoFullName,
                            time: pr.created_at,
                            url: pr.html_url
                        });
                    });
                }

            } catch (err) {
                console.error(`Failed to fetch activity for ${repoFullName}`, err);
            }
        }));

        // 4. Sort by Time (Desc)
        allActivity.sort((a, b) => new Date(b.time) - new Date(a.time));

        return NextResponse.json({ activity: allActivity });

    } catch (error) {
        console.error("Github Activity API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}



