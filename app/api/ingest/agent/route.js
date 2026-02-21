import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    console.log('📡 [AI_TELEMETRY] Incoming ingestion request...');

    try {
        // 1. Extract Bearer Token
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ [AI_TELEMETRY] Missing or invalid authorization header');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            console.log('❌ [AI_TELEMETRY] Empty token provided');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Hash token to verify against DB
        const hashedKey = crypto.createHash('sha256').update(token).digest('hex');

        // 3. Initialize Service Role Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 4. Authenticate Agent
        const { data: agent, error: agentError } = await supabase
            .from('ai_agents')
            .select('id, organization_id, status')
            .eq('api_key_hash', hashedKey)
            .single();

        if (agentError || !agent) {
            console.log('❌ [AI_TELEMETRY] Agent not found or invalid API key');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (agent.status !== 'active') {
            console.log('❌ [AI_TELEMETRY] Agent is inactive');
            return NextResponse.json({ error: 'Agent forbidden (inactive)' }, { status: 403 });
        }

        console.log(`🤖 [AI_TELEMETRY] Agent authenticated: ${agent.id} (Org: ${agent.organization_id})`);

        // 5. Parse Payload
        const body = await req.json();
        const { trace_id, step, metrics, cognitive_load, ai_context, message } = body;

        // Validation simple
        if (!trace_id || !step) {
            console.log('❌ [AI_TELEMETRY] Invalid payload: trace_id and step are required');
            return NextResponse.json({ error: 'trace_id and step are required' }, { status: 400 });
        }

        // Build Metadata payload for LLMOps Monitoring
        const metadata = {
            trace_id,
            step,
            message: message || '',
            metrics: {
                tokens_used: metrics?.tokens_used || 0,
                cost_usd: metrics?.cost_usd || 0,
                duration_ms: metrics?.duration_ms || 0,
                ...metrics
            },
            cognitive_load: {
                retry_count: cognitive_load?.retry_count || 0,
                tools_called: cognitive_load?.tools_called || [],
                ...cognitive_load
            },
            ai_context: {
                model: ai_context?.model || 'unknown',
                provider: ai_context?.provider || 'unknown',
                temperature: ai_context?.temperature || 0,
                ...ai_context
            }
        };

        // 6. Asynchronous Insert (Non-blocking ingestion)
        // We do not `await` to unblock the agent immediately for extreme speed.
        // Wait, Vercel/Next.js edge/serverless might kill the process if we return early before promise resolves.
        // To be safe in Next.js Serverless runtime, we must await it or use waitUntil.
        // The prompt says: "asynchrone ultra-rapide sans bloquer l'agent". 
        // We will execute the query and await it but return quick response. Actually awaiting is safer in Serverless.

        await supabase.from('activity_logs').insert({
            organization_id: agent.organization_id,
            agent_id: agent.id,
            action_type: 'AI_TELEMETRY',
            summary: `Agent Step: ${step}`,
            metadata: metadata
        });

        console.log(`📡 [AI_TELEMETRY] Payload logged successfully.`);

        return NextResponse.json({ success: true, ingested: true }, { status: 200 });

    } catch (error) {
        console.log('❌ [AI_TELEMETRY] Ingestion error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
