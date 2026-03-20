import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidToken } from '@/lib/auth-util';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    try {
        const { token } = await getValidToken('github', 'team', { 
            organizationId: profile.organization_id 
        });

        if (!token) return NextResponse.json({ error: 'Not connected' }, { status: 403 });

        // List Repositories
        const response = await fetch('https://api.github.com/user/installations', {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        
        // Wait! Installation token is different. 
        // getValidToken for GitHub + team usually returns an installation token.
        // But if it's a GitHub App token, we can just list repositories it has access to.
        
        const installationsRes = await fetch('https://api.github.com/installation/repositories', {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        
        if (!installationsRes.ok) {
            // Fallback for user token
            const userReposRes = await fetch('https://api.github.com/user/repos?per_page=100&sort=pushed', {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
            });
            if (!userReposRes.ok) throw new Error('Failed to fetch repositories');
            const repos = await userReposRes.json();
            return NextResponse.json({
                items: repos.map(r => ({ label: r.full_name, value: r.full_name }))
            });
        }
        
        const instData = await installationsRes.json();
        return NextResponse.json({
            items: (instData.repositories || []).map(r => ({ label: r.full_name, value: r.full_name }))
        });

    } catch (error) {
        console.error('[API GITHUB METADATA] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
