import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getValidGitHubToken } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    let organizationId = searchParams.get('organizationId');
    const teamId = searchParams.get('teamId');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Resolve Org ID
    if (!organizationId && teamId) {
        const { data } = await supabase.from('teams').select('organization_id').eq('id', teamId).single();
        if (data) organizationId = data.organization_id;
    }

    const targetOrgId = organizationId || '5db477f6-c893-4ec4-9123-b12160224f70';

    try {
        const { data: integration } = await supabase.from('integrations')
            .select('id, settings')
            .eq('organization_id', targetOrgId)
            .eq('provider', 'github')
            .single();

        if (!integration) {
            return NextResponse.json({ repositories: [] });
        }

        const access_token = await getValidGitHubToken(integration.id);
        const { installation_id } = integration.settings;

        if (!access_token || !installation_id) {
            return NextResponse.json({ repositories: [] });
        }

        // Fetch repositories accessible to the installation
        const res = await fetch(`https://api.github.com/user/installations/${installation_id}/repositories`, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('GitHub API Error:', res.status, errorText);
            throw new Error(`GitHub API responded with ${res.status}`);
        }

        const data = await res.json();

        // Map to a simplified format
        const repositories = (data.repositories || []).map(repo => ({
            id: repo.id,
            name: repo.full_name,
            private: repo.private,
            url: repo.html_url,
            description: repo.description,
            updated_at: repo.updated_at
        }));

        return NextResponse.json({ repositories });

    } catch (error) {
        console.error('Error fetching GitHub repos:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
