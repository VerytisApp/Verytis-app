
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

// SIMPLIFIED INIT (Matches debug script)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedData() {
    console.log('🌱 Starting Seed Process...');

    // 1. Create Test Organization
    console.log('🏢 Creating Test Organization...');

    // We insert or return existing to avoid duplicate key errors if it partially worked before
    const { data: org, error: orgError } = await supabase.from('organizations').upsert({
        name: 'Test Corp',
        slug: 'test-corp',
        domain: 'test-corp.com'
    }, { onConflict: 'slug' }).select().single();

    if (orgError) {
        console.error('Error creating org:', orgError);
        return;
    }
    console.log(`✅ Organization created/found: ${org.name} (${org.id})`);

    // 2. Create Admin User (Simulated Profile)
    const dummyUserId = '00000000-0000-0000-0000-000000000000'; // Placeholder UUID

    console.log('👤 Creating Admin Profile...');
    const { data: profile, error: profileError } = await supabase.from('profiles').upsert({
        id: dummyUserId,
        organization_id: org.id,
        email: 'admin@test-corp.com',
        full_name: 'Admin User',
        role: 'admin',
        status: 'active'
    }).select().single();

    if (profileError) {
        console.log("⚠️ Could not create profile (likely FK constraint on auth.users).");
        console.log("Error details:", profileError.message);
    } else {
        console.log(`✅ Profile created: ${profile.email}`);
    }

    console.log('🎉 Seeding Complete!');
}

seedData();
