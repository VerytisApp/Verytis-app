import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidGitHubToken } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const repoFullName = searchParams.get('repo'); // e.g. "owner/repo"
    const type = searchParams.get('type') || 'team';

    if (!repoFullName) return NextResponse.json({ error: 'Missing repo' }, { status: 400 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
    const targetOrgId = profile?.organization_id;

    try {
        let access_token = null;

        if (type === 'team') {
            const { data: integration } = await supabase.from('integrations')
                .select('id')
                .eq('organization_id', targetOrgId)
                .eq('provider', 'github')
                .maybeSingle();
            if (integration) access_token = await getValidGitHubToken(integration.id);
        }

        if (!access_token) {
            const { data: connection } = await supabase.from('user_connections')
                .select('access_token')
                .eq(type === 'personal' ? 'user_id' : 'organization_id', type === 'personal' ? user.id : targetOrgId)
                .eq('provider', 'github')
                .eq('connection_type', type)
                .maybeSingle();
            if (connection) access_token = connection.access_token;
        }

        if (!access_token) return NextResponse.json({ issues: [] });

        const res = await fetch(`https://api.github.com/repos/${repoFullName}/issues?state=open&per_page=50`, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (res.ok) {
            const data = await res.json();
            // Filter out Pull Requests if you specifically only want issues
            const issues = data.filter(i => !i.pull_request).map(i => ({
                id: i.number,
                name: `#${i.number} - ${i.title}`,
                url: i.html_url
            }));
            return NextResponse.json({ issues });
        }

        return NextResponse.json({ issues: [] });
    } catch (error) {
        console.error('GitHub issues fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
