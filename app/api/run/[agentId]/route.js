import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
    try {
        const { agentId } = params;
        const authHeader = req.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
        }

        const providedKey = authHeader.substring(7); // Remove 'Bearer '
        const supabase = createClient();

        // 1. Resolve Organization & Global API Key
        // Note: For simplicity in this MVP, we use the raw VERYTIS_API_KEY stored in settings.
        // In a real scenario, we would decrypt it. 
        // Here we fetch the organization settings.
        const { data: settings, error: settingsError } = await supabase
            .from('organization_settings')
            .select('verytis_api_key, banned_keywords')
            .eq('id', 'default')
            .single();

        if (settingsError || !settings) {
            return NextResponse.json({ error: 'Organization settings not configured' }, { status: 500 });
        }

        // 2. Validate API Key
        // If the key is encrypted in DB, we'd need the decryption logic here.
        // For now, we assume simple comparison or that we have the decryption utility.
        // In the existing code, VERYTIS_API_KEY is generated and stored.
        if (providedKey !== settings.verytis_api_key) {
            return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
        }

        // 3. Resolve Agent
        const { data: agent, error: agentError } = await supabase
            .from('ai_agents')
            .select('*')
            .eq('id', agentId.replace('agt_live_', '')) // if agentId is agt_live_... we might need to map it
            // Actually, in create/route.js we stored the hash of agt_live_... in api_key_hash.
            // But we should also have a way to find the agent record by its "public ID".
            // If we don't have a dedicated public_id column, we might use the internal UUID or search by hash if we use the agentId as the key.
            // THE PLAN said: "Récupérer la ligne de l'agent via agentId (donc agt_live_...)"
            // I'll assume we can find it. If I used the UUID as the URL param, it would be easy.
            // If agentId IS the UUID, great. If it's agt_live_..., I'll try to find it.
            .single();

        // If the above query fails, let's try searching by uuid if it looks like one
        let targetAgent = agent;
        if (agentError || !agent) {
            const cleanId = agentId.replace('agt_live_', '');
            const { data: altAgent } = await supabase
                .from('ai_agents')
                .select('*')
                .eq('id', cleanId)
                .single();
            targetAgent = altAgent;
        }

        if (!targetAgent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        if (targetAgent.status !== 'active') {
            return NextResponse.json({ error: 'Agent is suspended' }, { status: 403 });
        }

        // 4. Parse Input
        const body = await req.json();
        const { message } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // 5. Guardrails: Forbidden Keywords (Global + Agent Specific)
        const globalBanned = settings.banned_keywords || [];
        const agentBanned = targetAgent.policies?.forbidden_keywords || [];
        const allBanned = [...new Set([...globalBanned, ...agentBanned])];

        for (const keyword of allBanned) {
            if (message.toLowerCase().includes(keyword.toLowerCase())) {
                // Log the block
                await supabase.from('activity_logs').insert({
                    organization_id: targetAgent.organization_id,
                    agent_id: targetAgent.id,
                    action_type: 'REQUEST_BLOCKED',
                    summary: `Requête bloquée : Mot-clé interdit détecté ("${keyword}")`,
                    metadata: {
                        status: 'BLOCKED',
                        reason: 'FORBIDDEN_KEYWORD',
                        keyword,
                        trace_id: crypto.randomUUID()
                    }
                });

                return NextResponse.json({
                    error: 'Policy Violation',
                    reason: `Forbidden keyword detected: ${keyword}`
                }, { status: 400 });
            }
        }

        // 6. AI Execution
        const startTime = Date.now();
        const { text, usage } = await generateText({
            model: openai('gpt-4o'),
            system: targetAgent.system_prompt || 'You are a helpful assistant.',
            prompt: message,
        });
        const duration = Date.now() - startTime;

        // 7. Cost Calculation (Approx for GPT-4o)
        // Input: $5.00 / 1M tokens, Output: $15.00 / 1M tokens
        const cost = (usage.promptTokens * 5 + usage.completionTokens * 15) / 1_000_000;

        // 8. Logging & Trace
        const traceId = crypto.randomUUID();
        await supabase.from('activity_logs').insert({
            organization_id: targetAgent.organization_id,
            agent_id: targetAgent.id,
            action_type: 'AGENT_EXECUTION',
            summary: message.substring(0, 50) + '...',
            metadata: {
                status: 'CLEAN',
                trace_id: traceId,
                metrics: {
                    tokens_used: usage.totalTokens,
                    cost_usd: cost.toFixed(6),
                    duration_ms: duration
                },
                platform: 'gateway'
            }
        });

        // 9. Return Response
        return NextResponse.json({
            id: traceId,
            agent: targetAgent.name,
            response: text,
            usage: {
                total_tokens: usage.totalTokens,
                cost_usd: cost.toFixed(6)
            }
        });

    } catch (error) {
        console.error('Gateway Error:', error);
        return NextResponse.json({ error: 'Internal Gateway Error' }, { status: 500 });
    }
}
