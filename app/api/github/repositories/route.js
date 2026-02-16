import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    const TEST_ORG_ID = '5db477f6-c893-4ec4-9123-b12160224f70';

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { data: integration } = await supabase.from('integrations')
            .select('settings')
            .eq('organization_id', TEST_ORG_ID)
            .eq('provider', 'github')
            .single();

        if (!integration || !integration.settings.access_token || !integration.settings.installation_id) {
            return NextResponse.json({ repositories: [] });
        }

        const { access_token, installation_id } = integration.settings;

        // Fetch repositories accessible to the installation for this user
        // https://docs.github.com/en/rest/apps/installations?apiVersion=2022-11-28#list-repositories-accessible-to-the-user-access-token
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
