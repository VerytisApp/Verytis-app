require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setAdminPassword() {
    const adminEmail = 'tychiqueesteve2005@gmail.com';
    const password = 'admin123';

    // Get admin user
    const { data: users } = await supabase.auth.admin.listUsers();
    const admin = users.users.find(u => u.email === adminEmail);

    if (!admin) {
        console.log('Admin not found');
        return;
    }

    // Set password
    const { error } = await supabase.auth.admin.updateUserById(admin.id, {
        password: password
    });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('✅ Admin password set to: admin123');
    }
}

setAdminPassword().catch(console.error);
