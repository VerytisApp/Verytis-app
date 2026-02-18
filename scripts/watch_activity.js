require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('👀 Watching for new actions in activity_logs...');

const channel = supabase
    .channel('activity-monitor')
    .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => {
            const log = payload.new;
            const time = new Date(log.created_at).toLocaleTimeString();
            console.log(`[${time}] ${log.metadata.platform || 'Unknown'}: ${log.action_type} - ${log.summary}`);
            console.log(`          User: ${log.metadata.trello_user || log.actor_id || 'Anonymous'}`);
        }
    )
    .subscribe();

// Keep process alive
setInterval(() => { }, 1000);
