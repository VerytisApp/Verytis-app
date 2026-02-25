import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function auditLogs() {
    const orgId = '1abe99cd-78ae-4f6a-b839-c44e68e408d1';
    console.log('--- LOG AUDIT START ---');

    // 1. Get Log Distribution
    const { data: logs, error } = await s.from('activity_logs').select('action_type, actor_id, connection_id, resource_id').eq('organization_id', orgId);

    if (error) {
        console.error('Error fetching logs:', error);
        return;
    }

    console.log('Total Logs:', logs.length);

    const stats = {};
    logs.forEach(l => {
        const key = l.action_type;
        if (!stats[key]) stats[key] = { count: 0, nullActor: 0, nullConn: 0, nullRes: 0 };
        stats[key].count++;
        if (!l.actor_id) stats[key].nullActor++;
        if (!l.connection_id) stats[key].nullConn++;
        if (!l.resource_id) stats[key].nullRes++;
    });

    console.log('Log Stats (Action Type):');
    console.table(stats);

    // 2. Check for unique actors/conns present
    const actors = new Set(logs.map(l => l.actor_id).filter(Boolean));
    const conns = new Set(logs.map(l => l.connection_id).filter(Boolean));

    console.log('Unique Actors present in logs:', actors.size);
    console.log('Unique Connections present in logs:', conns.size);

    // 3. Get valid profiles and connections for this org
    const { data: validProfiles } = await s.from('profiles').select('id, full_name').eq('organization_id', orgId);
    const { data: validConns } = await s.from('connections').select('id, provider').eq('user_id', validProfiles?.[0]?.id); // Just a quick check

    console.log('Valid Profiles for Org:', validProfiles?.length);
    console.log('--- AUDIT END ---');
}

auditLogs().catch(console.error);
