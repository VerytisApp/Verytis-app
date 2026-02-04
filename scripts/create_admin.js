
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_EMAIL = 'tychiqueesteve2005@gmail.com';
const ADMIN_NAME = 'Tychique Esteve';
const ADMIN_JOB_TITLE = 'CEO';
const ORG_ID = '5db477f6-c893-4ec4-9123-b12160224f70';

async function createAdmin() {
    console.log('Creating admin user...');

    // 1. Check if auth user exists
    const { data: listData } = await supabase.auth.admin.listUsers();
    let authUser = listData?.users?.find(u => u.email === ADMIN_EMAIL);

    if (!authUser) {
        console.log('Auth user not found, creating...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: ADMIN_EMAIL,
            email_confirm: true,
            user_metadata: { full_name: ADMIN_NAME }
        });

        if (createError) {
            console.error('Error creating auth user:', createError);
            return;
        }
        authUser = newUser.user;
        console.log('Auth user created with ID:', authUser.id);
    } else {
        console.log('Auth user already exists with ID:', authUser.id);
    }

    // 2. Create or update profile
    console.log('Creating/updating profile...');
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert([{
            id: authUser.id,
            organization_id: ORG_ID,
            email: ADMIN_EMAIL,
            full_name: ADMIN_NAME,
            job_title: ADMIN_JOB_TITLE,
            role: 'admin',
            status: 'active',
            avatar_url: ''
        }])
        .select()
        .single();

    if (profileError) {
        console.error('Error creating profile:', profileError);
        return;
    }

    console.log('\n✅ Admin created successfully!');
    console.log(profile);
}

createAdmin().catch(console.error);
