
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const TEST_ORG_ID = '5db477f6-c893-4ec4-9123-b12160224f70'; // Hardcoded for MVP

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url, role, status, job_title')
            .eq('organization_id', TEST_ORG_ID);

        if (error) throw error;

        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.full_name || user.email.split('@')[0], // Fallback name
            email: user.email,
            avatar: user.avatar_url,
            role: user.role || 'Member',
            status: user.status || 'active',
            job_title: user.job_title || '',
            initials: (user.full_name || user.email).slice(0, 2).toUpperCase()
        }));

        return NextResponse.json({ users: formattedUsers });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
