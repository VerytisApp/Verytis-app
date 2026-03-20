import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidToken } from '@/lib/auth-util';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'team';

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const targetOrgId = profile.organization_id;
    let integration_id = null;

    try {
        const { token: access_token, metadata, id } = await getValidToken('github', type, {
            userId: user.id,
            organizationId: targetOrgId
        });
        integration_id = id;

        const installation_id = metadata?.installation_id;

        if (!access_token) {
            console.warn(`[API GITHUB REPOS] No token found for type: ${type}`);
            return NextResponse.json({ repositories: [] });
        }

        try {
            // Priority: Use correct endpoint depending on token type
            let apiUrl = '';
            if (installation_id) {
                // For GitHub App installation access tokens, use /installation/repositories
                apiUrl = `https://api.github.com/installation/repositories`;
            } else {
                // Fallback for Personal OAuth (user access token)
                apiUrl = `https://api.github.com/user/repos?per_page=100&sort=updated`;
            }

            console.log(`[API GITHUB REPOS] Fetching from: ${apiUrl}`);

            let res = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Verytis-AI-Ops'
                }
            });

            // 401 RETRY LOGIC
            if (res.status === 401) {
                console.warn(`[API GITHUB REPOS] 401 Detected. Forcing refresh and retrying...`);
                
                const { token: newToken } = await getValidToken('github', type, {
                    userId: user.id,
                    organizationId: targetOrgId,
                    forceRefresh: true
                });

                if (newToken) {
                    res = await fetch(apiUrl, {
                        headers: {
                            'Authorization': `Bearer ${newToken}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'User-Agent': 'Verytis-AI-Ops'
                        }
                    });
                }
            }

            if (res.ok) {
                const data = await res.json();
                console.log(`[API GITHUB REPOS] Success! Found ${data.total_count || data.length} items`);
                
                const rawRepos = data.repositories || (Array.isArray(data) ? data : []);
                const repositories = rawRepos.map(repo => ({
                    id: repo.id,
                    name: repo.full_name,
                    private: repo.private,
                    url: repo.html_url,
                    description: repo.description,
                    updated_at: repo.updated_at
                }));
                return NextResponse.json({ repositories });
            } else {
                const errText = await res.text();
                console.error(`[API GITHUB REPOS] API Error ${res.status}:`, errText);
            }
        } catch (e) {
            console.error('[API GITHUB REPOS] Fetch Exception:', e);
        }

        // Fallback to database if API fails
        if (integration_id) {
            const { data: existing } = await supabase.from('monitored_resources')
                .select('*')
                .eq('integration_id', integration_id)
                .eq('type', 'repo');

            if (existing && existing.length > 0) {
                return NextResponse.json({
                    repositories: existing.map(r => ({
                        id: r.external_id,
                        name: r.name,
                        private: true,
                        url: '#',
                        description: 'Cached resource',
                        updated_at: r.last_active_at
                    }))
                });
            }
        }

        return NextResponse.json({ repositories: [] });

    } catch (error) {
        console.error('Error fetching GitHub repos:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
