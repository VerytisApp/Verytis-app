require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ORG_ID = '5db477f6-c893-4ec4-9123-b12160224f70';

const testUsers = [
    {
        email: 'manager@verytis.test',
        full_name: 'Manager User',
        job_title: 'Team Manager',
        role: 'manager',
        password: 'manager123'
    },
    {
        email: 'member@verytis.test',
        full_name: 'Team Member',
        job_title: 'Developer',
        role: 'member',
        password: 'member123'
    }
];

async function createTestUsers() {
    console.log('Creating test users...\n');

    for (const userData of testUsers) {
        console.log(`Creating ${userData.role}: ${userData.email}`);

        // 1. Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: { full_name: userData.full_name }
        });

        if (authError) {
            console.error(`  ❌ Auth error:`, authError.message);
            continue;
        }

        console.log(`  ✅ Auth user created: ${authUser.user.id}`);

        // 2. Create profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: authUser.user.id,
                organization_id: ORG_ID,
                email: userData.email,
                full_name: userData.full_name,
                job_title: userData.job_title,
                role: userData.role,
                status: 'active',
                avatar_url: ''
            }])
            .select()
            .single();

        if (profileError) {
            console.error(`  ❌ Profile error:`, profileError.message);
        } else {
            console.log(`  ✅ Profile created\n`);
        }
    }

    console.log('Done! Test users created:');
    console.log('- manager@verytis.test / manager123');
    console.log('- member@verytis.test / member123');
}

createTestUsers().catch(console.error);
