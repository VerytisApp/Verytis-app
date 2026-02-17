const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const RESOURCE_ID = '8769f51e-1fc4-4e78-b3a8-e49b21220e7f'; // VerytisApp/Verytis-app

async function audit() {
    console.log("═══════════════════════════════════════════════════");
    console.log("  DEEP E2E AUDIT: Stack vs Timeline Event Visibility");
    console.log("═══════════════════════════════════════════════════\n");

    // ────────────────────────────────────────────────────
    // STEP 1: Raw DB - What actually exists?
    // ────────────────────────────────────────────────────
    console.log("1️⃣  RAW DATABASE (No Filters, Last 10):");
    const { data: rawLogs } = await supabase
        .from('activity_logs')
        .select('id, created_at, action_type, resource_id, actor_id, metadata, summary')
        .order('created_at', { ascending: false })
        .limit(10);

    rawLogs.forEach((log, i) => {
        const time = new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        console.log(`   ${i + 1}. [${time}] ${log.action_type} | resource_id: ${log.resource_id || 'NULL'} | repo: ${log.metadata?.repo || 'N/A'}`);
    });

    // ────────────────────────────────────────────────────
    // STEP 2: Resource Info
    // ────────────────────────────────────────────────────
    console.log("\n2️⃣  TARGET RESOURCE:");
    const { data: resource } = await supabase
        .from('monitored_resources')
        .select('id, name, type, external_id, team_id')
        .eq('id', RESOURCE_ID)
        .single();

    if (!resource) { console.error("   ❌ Resource not found!"); return; }
    console.log(`   Name: ${resource.name} | Type: ${resource.type} | TeamID: ${resource.team_id}`);

    // ────────────────────────────────────────────────────
    // STEP 3: Simulate STACK API (api/teams/[teamId])
    // ────────────────────────────────────────────────────
    console.log("\n3️⃣  STACK API SIMULATION (api/teams):");
    console.log(`   Query: .or(metadata->>repo.eq.${resource.name})`);

    const { data: stackLogs, error: stackErr } = await supabase
        .from('activity_logs')
        .select('id, created_at, action_type, resource_id, metadata')
        .or(`metadata->>repo.eq.${resource.name}`)
        .order('created_at', { ascending: false })
        .limit(50);

    if (stackErr) console.error("   ❌ Error:", stackErr);
    else {
        console.log(`   ✅ Found ${stackLogs.length} events`);
        stackLogs.slice(0, 5).forEach((log, i) => {
            const time = new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            console.log(`      ${i + 1}. [${time}] ${log.action_type} | resource_id: ${log.resource_id || 'NULL'}`);
        });
    }

    // ────────────────────────────────────────────────────
    // STEP 4: Simulate TIMELINE API (api/activity) - EXACT LOGIC
    // ────────────────────────────────────────────────────
    console.log("\n4️⃣  TIMELINE API SIMULATION (api/activity) - EXACT REPRODUCTION:");

    // Reproduce exactly what api/activity does:
    // Step A: Base query with .not and .order and .limit(100)
    let query = supabase
        .from('activity_logs')
        .select('id, created_at, action_type, resource_id, metadata, actor_id')
        .not('action_type', 'in', '("DISCUSSION","DISCUSSION_ANONYMOUS")')
        .order('created_at', { ascending: false })
        .limit(100);

    // Step B: No role filters apply (userId is null -> admin default, no channelAccess check needed)
    // Admin: no extra filters

    // Step C: Channel filter (section 5 of api/activity)
    const conditions = [`resource_id.eq.${RESOURCE_ID}`];
    if (resource.type === 'repo' && resource.name) {
        conditions.push(`metadata->>repo.ilike.${resource.name}`);
    }
    console.log(`   Channel Filter: .or(${conditions.join(',')})`);
    query = query.or(conditions.join(','));

    // Step D: SECOND .order().limit() — THIS IS THE BUG AREA
    console.log(`   ⚠️  DOUBLE .order().limit(): first .order().limit(100), then .order().limit(50)`);
    const { data: timelineLogs, error: tlErr } = await query
        .order('created_at', { ascending: false })
        .limit(50);

    if (tlErr) console.error("   ❌ Error:", tlErr);
    else {
        console.log(`   ✅ Found ${timelineLogs.length} events`);
        timelineLogs.slice(0, 5).forEach((log, i) => {
            const time = new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            console.log(`      ${i + 1}. [${time}] ${log.action_type} | resource_id: ${log.resource_id || 'NULL'}`);
        });
    }

    // ────────────────────────────────────────────────────
    // STEP 5: Simulate TIMELINE API - WITHOUT double order/limit
    // ────────────────────────────────────────────────────
    console.log("\n5️⃣  TIMELINE API - CLEAN (single .order().limit()):");
    const conditions2 = [`resource_id.eq.${RESOURCE_ID}`];
    if (resource.type === 'repo' && resource.name) {
        conditions2.push(`metadata->>repo.ilike.${resource.name}`);
    }

    const { data: cleanLogs, error: cleanErr } = await supabase
        .from('activity_logs')
        .select('id, created_at, action_type, resource_id, metadata')
        .not('action_type', 'in', '("DISCUSSION","DISCUSSION_ANONYMOUS")')
        .or(conditions2.join(','))
        .order('created_at', { ascending: false })
        .limit(50);

    if (cleanErr) console.error("   ❌ Error:", cleanErr);
    else {
        console.log(`   ✅ Found ${cleanLogs.length} events`);
        cleanLogs.slice(0, 5).forEach((log, i) => {
            const time = new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            console.log(`      ${i + 1}. [${time}] ${log.action_type} | resource_id: ${log.resource_id || 'NULL'}`);
        });
    }

    // ────────────────────────────────────────────────────
    // STEP 6: Compare Results
    // ────────────────────────────────────────────────────
    console.log("\n6️⃣  COMPARISON:");
    const stackIds = new Set(stackLogs?.map(l => l.id) || []);
    const timelineIds = new Set(timelineLogs?.map(l => l.id) || []);
    const cleanIds = new Set(cleanLogs?.map(l => l.id) || []);

    const missingInTimeline = stackLogs?.filter(l => !timelineIds.has(l.id)) || [];
    const missingInClean = stackLogs?.filter(l => !cleanIds.has(l.id)) || [];

    console.log(`   Stack events: ${stackIds.size}`);
    console.log(`   Timeline (double order/limit): ${timelineIds.size}`);
    console.log(`   Timeline (clean): ${cleanIds.size}`);
    console.log(`   Missing in Timeline (double): ${missingInTimeline.length}`);
    console.log(`   Missing in Timeline (clean): ${missingInClean.length}`);

    if (missingInTimeline.length > 0) {
        console.log("\n   ⚠️  EVENTS IN STACK BUT NOT IN TIMELINE (DOUBLE):");
        missingInTimeline.forEach(log => {
            const time = new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            console.log(`      → [${time}] ${log.action_type} | ID: ${log.id} | resource_id: ${log.resource_id || 'NULL'}`);
        });
    }

    if (missingInClean.length > 0) {
        console.log("\n   ⚠️  EVENTS IN STACK BUT NOT IN CLEAN TIMELINE:");
        missingInClean.forEach(log => {
            const time = new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            console.log(`      → [${time}] ${log.action_type} | ID: ${log.id} | resource_id: ${log.resource_id || 'NULL'}`);
        });
    }

    // ────────────────────────────────────────────────────
    // STEP 7: Check the ACTUAL API endpoint (curl simulation)
    // ────────────────────────────────────────────────────
    console.log("\n7️⃣  HITTING ACTUAL API ENDPOINT:");
    try {
        const ngrokUrl = 'https://periodically-preinventive-ella.ngrok-free.dev';
        const apiUrl = `${ngrokUrl}/api/activity?channelId=${RESOURCE_ID}`;
        console.log(`   URL: ${apiUrl}`);
        const response = await fetch(apiUrl, {
            headers: { 'ngrok-skip-browser-warning': '1' }
        });
        const data = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Events returned: ${data.events?.length || 0}`);
        if (data.events?.length > 0) {
            data.events.slice(0, 3).forEach((evt, i) => {
                const time = new Date(evt.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                console.log(`      ${i + 1}. [${time}] ${evt.action} | target: ${evt.target?.substring(0, 60)}`);
            });
        }

        // Compare with stack
        const stackTop = stackLogs?.[0];
        const apiTop = data.events?.[0];
        if (stackTop && apiTop) {
            console.log(`\n   Stack top event ID: ${stackTop.id}`);
            console.log(`   API top event ID:   ${apiTop.id}`);
            console.log(`   Match? ${stackTop.id === apiTop.id ? '✅ YES' : '❌ NO — THIS IS THE BUG'}`);
        }
    } catch (e) {
        console.log(`   ⚠️  Could not hit live API: ${e.message}`);
    }

    console.log("\n═══════════════════════════════════════════════════");
    console.log("  AUDIT COMPLETE");
    console.log("═══════════════════════════════════════════════════");
}

audit();
