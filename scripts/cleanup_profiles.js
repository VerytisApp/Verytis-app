
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

async function cleanupProfiles() {
    console.log('Starting cleanup...');

    // 1. Get all current profiles
    const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('organization_id', ORG_ID);

    if (fetchError) {
        console.error('Error fetching profiles:', fetchError);
        return;
    }

    console.log(`Found ${profiles.length} profiles in the database.`);

    // 2. Check if admin exists
    const adminProfile = profiles.find(p => p.email === ADMIN_EMAIL);

    // 3. Delete all profiles EXCEPT the admin
    const profilesToDelete = profiles.filter(p => p.email !== ADMIN_EMAIL);

    if (profilesToDelete.length > 0) {
        console.log(`Deleting ${profilesToDelete.length} test profiles...`);
        for (const profile of profilesToDelete) {
            console.log(`  - Deleting: ${profile.email} (${profile.full_name})`);

            // Delete from profiles table
            const { error: deleteProfileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', profile.id);

            if (deleteProfileError) {
                console.error(`    Error deleting profile: ${deleteProfileError.message}`);
            }

            // Also try to delete from auth.users (requires service role)
            const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(profile.id);
            if (deleteAuthError) {
                console.warn(`    Note: Could not delete auth user: ${deleteAuthError.message}`);
            }
        }
    }

    // 4. Update or create admin profile
    if (adminProfile) {
        console.log('Updating existing admin profile...');
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                full_name: ADMIN_NAME,
                job_title: ADMIN_JOB_TITLE,
                role: 'admin',
                status: 'active'
            })
            .eq('id', adminProfile.id);

        if (updateError) {
            console.error('Error updating admin:', updateError);
        } else {
            console.log('Admin profile updated successfully!');
        }
    } else {
        console.log('Admin profile not found in profiles table.');
        console.log('Note: You may need to use the invite flow to create the admin properly.');
    }

    // 5. Verify final state
    const { data: finalProfiles } = await supabase
        .from('profiles')
        .select('email, full_name, role, status')
        .eq('organization_id', ORG_ID);

    console.log('\n--- Final State ---');
    console.log(finalProfiles);
    console.log('\nCleanup complete!');
}

cleanupProfiles().catch(console.error);
