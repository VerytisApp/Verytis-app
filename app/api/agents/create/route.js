import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { scrubText, scrubObject } from '@/lib/security/scrubber';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

// ─── STEP 2: Scrub secrets from visual_config before DB save ────
// The React Flow canvas may contain API keys typed into ToolNode inputs.
// We must strip them before persisting to Supabase.
function sanitizeVisualConfig(config) {
    if (!config || !config.nodes) return config;

    const sanitized = JSON.parse(JSON.stringify(config)); // deep clone
    const encryptedCredentials = {}; // Store encrypted keys by node id

    for (const node of sanitized.nodes) {
        if (!node.data) continue;

        // ─── ENCRYPTION: Encrypt credentials.api_key before redaction ───
        if (node.data.credentials?.api_key) {
            const encrypted = encrypt(node.data.credentials.api_key);
            if (encrypted) {
                encryptedCredentials[node.id] = {
                    api_key_encrypted: encrypted,
                    provider: (node.data.event_source || node.data.label || '').split('.')[0] || 'unknown'
                };
            }
            delete node.data.credentials; // Remove plaintext
        }

        // Strip raw API key values from auth_requirement
        if (node.data.auth_requirement) {
            delete node.data.auth_requirement.value;
            delete node.data.auth_requirement.raw_key;
        }

        // Strip any raw apiKey / token stored in node data
        const sensitiveKeys = ['apiKey', 'api_key', 'token', 'secret', 'password', 'accessToken', 'bearer'];
        for (const key of sensitiveKeys) {
            if (node.data[key]) {
                node.data[key] = '***REDACTED***';
            }
        }

        // Remove onChange (non-serializable function ref from React)
        delete node.data.onChange;
        // Remove connectedProviders (runtime-only, not for DB)
        delete node.data.connectedProviders;
    }

    // Attach encrypted credentials map to config
    if (Object.keys(encryptedCredentials).length > 0) {
        sanitized.encrypted_credentials = encryptedCredentials;
    }

    return sanitized;
}

export async function POST(req) {
    try {
        // 1. Init SSR Client for Authed User
        const supabase = createClient();

        // 2. Ensure User is Auth'd & Get Org Id
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
        }

        // 3. Parse Body
        const body = await req.json();
        const { id, name, description, system_prompt, policies, visual_config, is_draft } = body;

        if (!name && !id) {
            return NextResponse.json({ error: 'Name or ID is required' }, { status: 400 });
        }

        // ─── GLOBAL GOVERNANCE MERGE ───
        // Fetch org-level hard limits and merge them INTO agent policies.
        // Global policies override / supplement agent-level ones.
        const { data: orgSettings } = await supabase
            .from('organization_settings')
            .select('banned_keywords, blocked_actions, default_max_per_agent, max_org_spend')
            .eq('id', 'default')
            .maybeSingle();

        const globalBannedKeywords = orgSettings?.banned_keywords || [];
        const globalBlockedActions = orgSettings?.blocked_actions || [];
        const globalMaxPerAgent = orgSettings?.default_max_per_agent || null;

        // Merge: agent policies + global hard limits (union, no duplicates)
        const agentPolicies = policies || {};
        const mergedForbiddenKeywords = [
            ...new Set([
                ...(agentPolicies.forbidden_keywords || []),
                ...(agentPolicies.forbidden_words || []), // legacy key fallback
                ...globalBannedKeywords
            ])
        ];
        const mergedBlockedActions = [
            ...new Set([
                ...(agentPolicies.blocked_actions || []),
                ...globalBlockedActions
            ])
        ];

        // Budget cap: agent cannot exceed org default_max_per_agent
        let mergedBudgetMax = agentPolicies.budget_daily_max;
        if (globalMaxPerAgent != null) {
            if (mergedBudgetMax == null || mergedBudgetMax > globalMaxPerAgent) {
                mergedBudgetMax = globalMaxPerAgent;
            }
        }

        const enforcedPolicies = {
            ...agentPolicies,
            forbidden_keywords: mergedForbiddenKeywords,
            blocked_actions: mergedBlockedActions,
            budget_daily_max: mergedBudgetMax,
        };
        // Remove legacy key
        delete enforcedPolicies.forbidden_words;

        // 4. Generate Raw Agent ID (only if creating new)
        let rawKey = null;
        let hashedKey = null;

        if (!id) {
            rawKey = `agt_live_${crypto.randomUUID()}`;
            hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
        }

        // 5. DB Upsert logic — sanitize visual_config + enforce governance
        const agentData = {
            organization_id: profile.organization_id,
            name: name || 'Unnamed Agent',
            description: description || '',
            system_prompt: system_prompt || '',
            policies: enforcedPolicies,
            visual_config: sanitizeVisualConfig(visual_config),
            is_draft: is_draft || false,
            status: 'active'
        };

        if (hashedKey) {
            agentData.api_key_hash = hashedKey;
        }

        let result;
        if (id) {
            // Update existing
            result = await supabase
                .from('ai_agents')
                .update(agentData)
                .eq('id', id)
                .eq('organization_id', profile.organization_id)
                .select('id, name, created_at')
                .single();
        } else {
            // Insert new
            result = await supabase
                .from('ai_agents')
                .insert(agentData)
                .select('id, name, created_at')
                .single();
        }

        const { data: agent, error: dbError } = result;

        if (dbError) {
            console.error('Failed to save agent:', dbError);
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        // 6. Log to activity_logs
        const redactedSummary = scrubText(agent.name);
        const redactedMetadata = scrubObject({ agent_id: agent.id, action: id ? 'UPDATE' : 'CREATE' });

        await supabase.from('activity_logs').insert({
            organization_id: profile.organization_id,
            actor_id: user.id,
            action_type: id ? 'AI_AGENT_UPDATED' : 'AI_AGENT_REGISTERED',
            summary: redactedSummary,
            metadata: redactedMetadata
        });

        // 7. Return Agent Data
        return NextResponse.json({
            success: true,
            agent,
            agentId: rawKey // RAW KEY ONLY SHOWN ON NEW CREATION
        }, { status: 200 });

    } catch (error) {
        console.error('Error creating AI Agent:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
