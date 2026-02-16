import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkActivityLogs() {
    console.log("🔍 Checking recent activity logs...");

    const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('metadata->>platform', 'GitHub') // Filter specifically for GitHub events
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Error fetching logs:", error);
        return;
    }

    if (data.length === 0) {
        console.log("📭 No activity logs found.");
    } else {
        console.log(`✅ Found ${data.length} recent logs:\n`);
        data.forEach(log => {
            console.log(`[${new Date(log.created_at).toLocaleString()}] ${log.action_type}`);
            console.log(`Summary: ${log.summary}`);
            console.log(`Metadata:`, JSON.stringify(log.metadata, null, 2));
            console.log('-----------------------------------');
        });
    }
}

checkActivityLogs();
