import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedMegaV6() {
    console.log('🚀 DEPLOYING ULTIMATE MEGA DEMO v6.3 (High Density & Relationship Fix)...');

    // 1. Identify Target Organization
    const { data: org } = await supabase.from('organizations').select('id').eq('slug', 'verytis-test').single();
    let orgId = org?.id;

    if (!orgId) {
        console.log('🏢 Creating "verytis-test" organization...');
        const { data: newOrg } = await supabase.from('organizations').insert({
            name: 'Verytis Enterprise',
            slug: 'verytis-test',
            settings: { demo: true }
        }).select().single();
        orgId = newOrg.id;
    }

    console.log(`🎯 Target Organization ID: ${orgId}`);

    // 2. HARD RESET
    console.log('Purging old data...');
    await supabase.from('monthly_reports').delete().eq('organization_id', orgId);
    await supabase.from('decisions').delete().eq('organization_id', orgId);
    await supabase.from('activity_logs').delete().eq('organization_id', orgId);
    await supabase.from('ai_agents').delete().eq('organization_id', orgId);

    const { data: orgInts } = await supabase.from('integrations').select('id').eq('organization_id', orgId);
    if (orgInts?.length > 0) {
        const ids = orgInts.map(i => i.id);
        await supabase.from('monitored_resources').delete().in('integration_id', ids);
        await supabase.from('integrations').delete().in('id', ids);
    }

    const { data: orgTeams } = await supabase.from('teams').select('id').eq('organization_id', orgId);
    if (orgTeams?.length > 0) {
        const ids = orgTeams.map(t => t.id);
        await supabase.from('team_members').delete().in('team_id', ids);
        await supabase.from('teams').delete().in('id', ids);
    }

    // 3. SEED USERS
    console.log('👥 Seeding Workforce...');
    const staff = [
        { email: 'jane.governance@verytis.com', name: 'Jane Cooper', role: 'manager', title: 'Head of Data Compliance' },
        { email: 'robert.security@verytis.com', name: 'Robert Foss', role: 'member', title: 'Senior Security Architect' },
        { email: 'alice.ciso@verytis.com', name: 'Alice Thorne', role: 'member', title: 'CISO' },
        { email: 'sarah.product@verytis.com', name: 'Sarah Jenkins', role: 'member', title: 'VP of Product' },
        { email: 'david.sre@verytis.com', name: 'David Miller', role: 'member', title: 'Infrastructure Lead' },
        { email: 'cameron.eng@verytis.com', name: 'Cameron Williamson', role: 'member', title: 'Software Engineer' },
        { email: 'kristin.qa@verytis.com', name: 'Kristin Watson', role: 'member', title: 'QA Lead' },
        { email: 'wade.sec@verytis.com', name: 'Wade Warren', role: 'member', title: 'Security Analyst' },
        { email: 'guy.fin@verytis.com', name: 'Guy Hawkins', role: 'member', title: 'Financial Controller' }
    ];

    const staffIds = {};
    for (const s of staff) {
        const { data: ext } = await supabase.from('profiles').select('id').eq('email', s.email).single();
        let uid = ext?.id;
        if (!uid) {
            const { data } = await supabase.auth.admin.createUser({ email: s.email, password: 'DemoPassword123!', email_confirm: true });
            uid = data?.user?.id;
        }
        if (uid) {
            await supabase.from('profiles').upsert({ id: uid, organization_id: orgId, email: s.email, full_name: s.name, job_title: s.title, role: s.role, status: 'active' });
            staffIds[s.name.split(' ')[0].toLowerCase()] = uid;
        }
    }

    // 4. TEAMS
    console.log('🏗️ Creating Teams...');
    const tNodes = [
        { name: 'Core Engineering', type: 'operational', description: 'Product and core systems.' },
        { name: 'Security & Risk', type: 'operational', description: 'IAM, SOC and Threat detection.' },
        { name: 'Governance & Compliance', type: 'governance', description: 'Regulation and audit.' },
        { name: 'Infrastructure Ops', type: 'operational', description: 'Cloud and infra.' }
    ];
    const { data: teams } = await supabase.from('teams').upsert(tNodes.map(t => ({ ...t, organization_id: orgId })), { onConflict: 'organization_id,name' }).select();
    const tLookup = {}; teams?.forEach(t => tLookup[t.name] = t.id);

    // 5. MEMBERSHIPS
    console.log('🔗 Adding Memberships...');
    const mBatch = [];
    const add = (t, u, r) => { if (tLookup[t] && staffIds[u]) mBatch.push({ team_id: tLookup[t], user_id: staffIds[u], role: r }); };
    add('Core Engineering', 'cameron', 'lead'); add('Core Engineering', 'robert', 'member'); add('Core Engineering', 'kristin', 'member');
    add('Security & Risk', 'alice', 'lead'); add('Security & Risk', 'wade', 'member');
    add('Governance & Compliance', 'jane', 'lead'); add('Infrastructure Ops', 'david', 'lead');
    await supabase.from('team_members').insert(mBatch);

    // 6. INTEGRATIONS
    console.log('🔌 Connecting Stacks...');
    const iBatch = [
        { provider: 'slack', name: 'Slack', external_id: 'T01', settings: { bot_token: 'xoxb-demo', team_id: 'T01' } },
        { provider: 'github', name: 'GitHub', external_id: 'GH01', settings: { installation_id: '12345', access_token: 'gh-demo', username: 'VerytisApp' } },
        { provider: 'trello', name: 'Trello', external_id: 'TR01', settings: { api_token: 'tr-demo', username: 'Verytis' } }
    ];
    const { data: ints, error: intErr } = await supabase.from('integrations').upsert(iBatch.map(i => ({ organization_id: orgId, ...i })), { onConflict: 'organization_id,provider' }).select();
    if (intErr) { console.error('❌ Error creating integrations:', intErr); return; }
    const il = {}; ints?.forEach(i => il[i.provider] = i.id);

    // 7. RESOURCES
    console.log('📂 Linking Resources to Teams...');
    const rConfigs = [
        { p: 'slack', n: 'engineering', t: 'channel', team: 'Core Engineering' },
        { p: 'github', n: 'core-repo', t: 'repo', team: 'Core Engineering' },
        { p: 'github', n: 'infra-repo', t: 'repo', team: 'Infrastructure Ops' },
        { p: 'trello', n: 'Roadmap', t: 'folder', team: 'Core Engineering' },
        { p: 'trello', n: 'Security Audits', t: 'board', team: 'Security & Risk' },
        { p: 'trello', n: 'Compliance Tracker', t: 'board', team: 'Governance & Compliance' }
    ];
    const { data: resDocs } = await supabase.from('monitored_resources').upsert(rConfigs.map(rc => ({
        integration_id: il[rc.p], name: rc.n, type: rc.t, team_id: tLookup[rc.team], external_id: `EXT_${rc.n.toUpperCase()}`, audit_level: 'full'
    })), { onConflict: 'integration_id,external_id' }).select();
    const rLookup = {}; resDocs?.forEach(r => rLookup[r.name] = r.id);

    // 8. AI AGENTS
    console.log('🤖 Deploying Agents...');
    const aList = [
        { name: 'Sentinel-Bot', description: 'IAM drift monitor.' },
        { name: 'Flow-Optimizer', description: 'Resource optimizer.' },
        { name: 'Audit-Companion', description: 'Log analyzer.' }
    ];
    const { data: agents } = await supabase.from('ai_agents').upsert(aList.map(a => ({ ...a, organization_id: orgId, api_key_hash: `h_${a.name.toLowerCase()}`, status: 'active' })), { onConflict: 'organization_id,name' }).select();
    const aLookup = {}; agents?.forEach(a => aLookup[a.name] = a.id);

    // 9. LOGS (1000 Events)
    console.log('📉 Flooding 1000 events...');
    const scenarios = [
        { u: 'robert', r: 'core-repo', t: 'GITHUB_COMMIT', s: 'Secured API', p: 'github' },
        { u: 'alice', r: 'Security Audits', t: 'TRELLO_CARD', s: 'New audit policy', p: 'trello' },
        { g: 'Sentinel-Bot', r: 'core-repo', t: 'AI_TELEMETRY', s: 'Scan complete', p: 'ai', step: 'ANALYSIS' },
        { g: 'Sentinel-Bot', r: 'core-repo', t: 'AI_TELEMETRY', s: 'Blocking IP', p: 'ai', step: 'ACTION' },
        { g: 'Flow-Optimizer', r: 'infra-repo', t: 'AI_TELEMETRY', s: 'Scaling node', p: 'ai', step: 'ACTION' }
    ];

    const logs = []; const now = Date.now();
    for (let i = 0; i < 1000; i++) {
        const s = scenarios[i % scenarios.length];
        const date = new Date(now - (i * 15 * 60 * 1000)); // Every 15 mins
        logs.push({
            organization_id: orgId, actor_id: s.u ? staffIds[s.u] : null, agent_id: s.g ? aLookup[s.g] : null,
            action_type: s.t, resource_id: rLookup[s.r] || null, summary: `${s.s} [AUDIT-${i}]`,
            metadata: { platform: s.p, step: s.step, metrics: s.p === 'ai' ? { tokens: 500, duration: 100 } : null },
            created_at: date.toISOString()
        });
        if (logs.length === 100) { await supabase.from('activity_logs').insert(logs); logs.length = 0; process.stdout.write('.'); }
    }
    await supabase.from('activity_logs').insert(logs);

    console.log('\n✨ DONE!');
}

seedMegaV6().catch(console.error);
