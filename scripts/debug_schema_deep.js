const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually load .env.local
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
            }
        });
    }
} catch (e) {
    console.warn('Could not load .env.local', e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('--- INSPECTING PROFILES TABLE ---');
    // Check if social_profiles column exists
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, social_profiles')
        .limit(1);

    if (pError) {
        console.log('Profiles Query Error (Column likely missing):', pError.message);
    } else {
        console.log('Profiles Column Check:', profiles);
    }

    console.log('\n--- INSPECTING ACTIVITY_LOGS TABLE ---');
    // Check if actor_id is nullable
    // We can't check schema directly via JS client usually, but we can try inserting a null actor_id
    try {
        const { data, error } = await supabase
            .from('activity_logs')
            .insert({
                action: 'TEST_NULL_ACTOR',
                target: 'Schema Check',
                actor_id: null,
                details: { test: true }
            })
            .select();

        if (error) {
            console.log('Activity Logs Insert Error:', error.message);
        } else {
            console.log('Activity Logs Insert Success (actor_id IS nullable):', data);
            // Cleanup
            await supabase.from('activity_logs').delete().eq('id', data[0].id);
        }
    } catch (e) {
        console.log('Execution Error:', e);
    }
}

inspectSchema();
