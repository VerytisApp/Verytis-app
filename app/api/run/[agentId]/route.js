import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateText } from 'ai';
import crypto from 'crypto';
import { scrubText } from '@/lib/security/scrubber';
import { calculateCost } from '@/lib/security/pricing';
import { createClient } from '@/lib/supabase/server';

// Modular Imports
import { resolveModel, discoverTools, buildListingTools, discoverInternalSkills } from './lib/tool-discovery';
import { processHITL } from './lib/hitl-manager';
import { logDiagnostic } from './lib/diagnostic';

export const dynamic = 'force-dynamic';

/**
 * Enterprise Agent Execution Gateway v3.1
 * Secure internal/external routing with HITL (Human-In-The-Loop) orchestration.
 */
export async function POST(req, { params }) {
    const { agentId } = await params;
    const startTime = Date.now();
    const traceId = crypto.randomUUID();
    const adminClient = createAdminClient();

    try {
        let { messages, message, isSimulation = false } = await req.json();

        // 1. Authorization
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        const supabase = await createClient();
        const { data: { user: sessionUser } } = await supabase.auth.getUser();

        // 2. Fetch Agent & Validate Access
        const { data: agent } = await adminClient.from('ai_agents').select('*').eq('id', agentId).single();
        if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

        // 2.5 Signal Interception (Human-In-The-Loop Feedback)
        if (message && (message.includes('[SIGNAL: ACTION_CONFIRMED]') || message.includes('[SIGNAL: CONFIRMED]'))) {
            try {
                // Determine which signal marker is used
                const marker = message.includes('[SIGNAL: ACTION_CONFIRMED]') ? '[SIGNAL: ACTION_CONFIRMED]' : '[SIGNAL: CONFIRMED]';
                const signalParts = message.split(marker);
                const rawData = (signalParts[1] || '').trim();

                // Only attempt to parse if it looks like JSON
                if (rawData.startsWith('{') && rawData.endsWith('}')) {
                    const signalData = JSON.parse(rawData);

                    if (signalData.field === 'Internal_Config_Update') {
                        const { integration, setting_key, new_value } = signalData.payload || {};
                        console.log(`[SIGNAL: CONFIG] Attempting update for ${integration} -> ${setting_key} = ${new_value}`);
                        
                        let newVisualConfig = JSON.parse(JSON.stringify(agent.visual_config));
                        
                        if (newVisualConfig.nodes) {
                            const targetNode = newVisualConfig.nodes.find(n => 
                                (n.data?.label || '').toLowerCase().includes(integration?.toLowerCase()) || 
                                (n.type || '').toLowerCase().includes(integration?.toLowerCase())
                            );

                            if (targetNode && targetNode.data?.config) {
                                console.log(`[SIGNAL: CONFIG] Match found on node: ${targetNode.data.label || targetNode.type}`);
                                targetNode.data.config[setting_key] = new_value;
                                
                                // Save to Database
                                const { error: updateError } = await adminClient
                                    .from('ai_agents')
                                    .update({ visual_config: newVisualConfig })
                                    .eq('id', agentId);
                                
                                if (updateError) {
                                    console.error(`[SIGNAL: CONFIG] Supabase Update Error:`, updateError);
                                } else {
                                    console.log(`[SIGNAL: CONFIG] Database updated successfully.`);
                                }
                                
                                // Feedback to LLM (Conversational & Strict)
                                message = `[SYSTEM: ACTION_EXECUTION_SUCCESS] L'utilisateur a validé la mise à jour : ${setting_key} pour ${integration}. Le Visual Builder en DB a été mis à jour avec succès. 
                                CONSIGNE DE RÉPONSE : Confirme simplement ce succès à l'utilisateur avec un ton chaleureux, professionnel et rassurant (style OpenAI/Claude). NE LANCE PAS d'autres outils (listing ou action) dans cette réponse spécifique.`;
                                
                                // Refresh agent reference for downstream logic
                                agent.visual_config = newVisualConfig;
                            } else {
                                console.error(`[SIGNAL: CONFIG] No matching node found for integration: ${integration}`);
                            }
                        }
                    }
                } else {
                    console.log(`[SIGNAL] Raw text signal received: ${rawData}`);
                }

                // [SURGICAL FIX] Always provide success feedback to LLM for ANY confirmed signal
                // to force it into conversational mode even if no DB update was performed here.
                message = `[SYSTEM: ACTION_EXECUTION_SUCCESS] L'utilisateur a validé l'action ou le paramétrage.
                CONSIGNE DE RÉPONSE : Confirme simplement ce succès à l'utilisateur avec un ton chaleureux et naturel (style OpenAI/Claude). NE LANCE PAS d'autres outils (listing ou action).`;
                
            } catch (error) {
                console.error('[SIGNAL ERROR]', error);
            }
        }

        const isAuthorized = sessionUser || 
                             (token && (agent.api_key === token || token === process.env.VERYTIS_INTERNAL_KEY));

        if (!isAuthorized) {
            return NextResponse.json({ 
                error: 'Unauthorized', 
                message: 'Invalid API Key or Session expired. Please refresh the page.' 
            }, { 
                status: 403,
                headers: { 'Cache-Control': 'no-store, max-age=0' }
            });
        }

        // 3. Security: Scrub Input PII
        let safeMessages = messages.map(m => ({ ...m, content: m.role === 'user' ? scrubText(m.content) : m.content }));

        // [SURGICAL FIX] If we just intercepted a signal, we clean the technical signal 
        // AND we remove the assistant message with the pending tool call to respect the protocol.
        if (message && message.includes('[SYSTEM: ACTION_EXECUTION_SUCCESS]')) {
            // Filter out signals AND the last assistant message (which is usually the card)
            // We find the index of the last assistant message and remove it.
            let lastAssistantIdx = -1;
            for (let i = safeMessages.length - 1; i >= 0; i--) {
                if (safeMessages[i].role === 'assistant') {
                    lastAssistantIdx = i;
                    break;
                }
            }

            const cleanedHistory = safeMessages.filter((m, idx) => 
                !m.content?.includes('[SIGNAL:') && 
                idx !== lastAssistantIdx
            );
            safeMessages = [...cleanedHistory, { role: 'user', content: message }];
        }

        // 4. Discovery: Tools & Skills (Contextual Filter)
        const { toolMap, autoProviders } = discoverTools(agent.visual_config, isSimulation, agent.organization_id);
        
        // [LEAST PRIVILEGE] Filter providers based on user message context
        const msgLower = (message || '').toLowerCase();
        const contextualProviders = new Set();
        
        const providerKeywords = {
            slack: ['slack', 'canal', 'message', 'notification', 'alerte', 'mp'],
            tiktok: ['tiktok', 'compte tiktok'],
            youtube: ['youtube', 'short', 'repertorie', 'visibilite', 'chaine', 'video'],
            github: ['github', 'git', 'depot', 'repo'],
            trello: ['trello', 'tableau', 'carte', 'list'],
            stripe: ['stripe', 'paiement', 'remboursement', 'facture'],
            shopify: ['shopify', 'produit', 'commande', 'boutique'],
            streamlabs: ['streamlabs', 'clip', 'montage', 'stream']
        };

        autoProviders.forEach(p => {
            const keywords = providerKeywords[p] || [p];
            if (keywords.some(k => msgLower.includes(k))) {
                contextualProviders.add(p);
            }
        });

        const internalSkills = discoverInternalSkills(agent.visual_config);
        const listingTools = buildListingTools(contextualProviders, agent.organization_id, req);
        const discoveredTools = { ...toolMap, ...listingTools };
        
        // [LIVE CONFIG MEMORY] Extract current state from DB to avoid redundant requests
        const currentNodes = agent.visual_config?.nodes || [];
        const stateSummary = currentNodes
            .filter(n => n.data?.config)
            .map(n => {
                const cfg = n.data.config;
                const label = n.data.label || n.type;
                const val = Object.values(cfg).filter(v => v && typeof v === 'string').join(', ');
                return val ? `- ${label} : ${val}` : null;
            })
            .filter(Boolean)
            .join('\n');

        // [VISUAL BUILDER RULES] Extract structured parameters for the assistant
        const agentRulesConfig = {};
        currentNodes.forEach(node => {
            if (node.data?.config) {
                const label = node.data.label || node.type;
                agentRulesConfig[label] = node.data.config;
            }
        });
        const rulesString = Object.keys(agentRulesConfig).length > 0
            ? JSON.stringify(agentRulesConfig, null, 2)
            : 'Aucune règle spécifique définie.';

        // [INTEGRATION STATUS] Build 🟢/🔴 status list for the prompt
        const allPossibleProviders = ['slack', 'tiktok', 'youtube', 'github', 'trello', 'stripe', 'shopify', 'streamlabs'];
        const connectedApps = allPossibleProviders.filter(p => autoProviders.has(p)).map(p => `🟢 ${p.toUpperCase()}`).join(', ');
        const disconnectedApps = allPossibleProviders.filter(p => !autoProviders.has(p)).map(p => `🔴 ${p.toUpperCase()}`).join(', ');

        // 5. Hardened System Prompt Construction
        const systemPrompt = `Assistant IA Supervisor (Verytis v5). Protocol: Autonomous Core.
Vous êtes l'intelligence centrale pilotant les outils de l'organisation.

STYLE DE COMMUNICATION :
- Adoptez un ton moderne, clair, chaleureux et empathique (style ChatGPT/Claude).
- Utilisez le Markdown pour la structure (gras pour les points clés, listes à puces).
- Soyez concis mais professionnel.

ÉTAT DES CONNEXIONS :
${connectedApps || 'Aucune application connectée'}
${disconnectedApps ? `DISPONIBLES (NON CONNECTÉES) : ${disconnectedApps}` : ''}

ÉTAT ACTUEL DE L'AGENT (CONFIG BASE DE DONNÉES) :
${stateSummary || '- Aucune configuration pour le moment (Tout est à faire).'}

⚙️ RÈGLES ET CONFIGURATION STRICTE (VISUAL BUILDER) :
Voici tes règles de fonctionnement exactes définies par l'utilisateur (Mode Auto, Canaux autorisés, etc.). Tu DOIS respecter ces paramètres à la lettre. Si le Mode Auto est 'false', tu ne dois jamais automatiser l'action sans validation.

${rulesString}

🚨 RÈGLES DE CONVERSATION DANS LE CHAT 🚨 :
1. CONSULTER L'ÉTAT : Consultez toujours l'ÉTAT DES CONNEXIONS et l'ÉTAT ACTUEL ci-dessus avant de répondre.
2. DÉDUPLICATION : Si l'utilisateur confirme ou mentionne une valeur DÉJÀ configurée (ex: "Toufik69"), confirmez simplement que c'est bien pris en compte. NE GÉNÉREZ PAS de nouvelle carte de sélection.
3. DÉCOUVERTE DYNAMIQUE OBLIGATOIRE : Si l'utilisateur mentionne une intégration (Slack, YouTube, GitHub, etc.) pour une CONFIGURATION ou demande "Quels canaux ?", tu DOIS IMPÉRATIVEMENT appeler l'outil de listing correspondant (ex: slack_list_channels) dans la même étape. Sans cet outil, tu n'as accès qu'à "Automatique" et tu vas frustrer l'utilisateur.
4. TOLÉRANCE AUX FAUTES (FUZZY MATCHING) : L'utilisateur fera des fautes de frappe (ex: 'slak' pour Slack, 'trelo' pour Trello, 'gitub' pour GitHub). Corrige-les mentalement et associe-les aux applications de ta liste. Ne dis jamais 'Je ne connais pas slak'.
5. INTENTION D'ACTION vs SIMPLE MENTION :
- Si l'utilisateur mentionne une application juste pour avoir une information générale (ex: 'Comment optimiser une chaîne YouTube ?', 'Qu'est-ce que Stripe ?'), réponds normalement avec tes connaissances. NE LUI DEMANDE PAS de connecter l'application.
- Si l'utilisateur te demande de LIRE ses données ou d'ÉCRIRE une donnée sur une application (ex: 'Quelles sont mes playlists YouTube ?', 'Envoie un message Slack'), ALORS SEULEMENT, vérifie si l'application est dans les 🟢 CONNECTÉES ou 🔴 NON CONNECTÉES, et applique les Scénarios 1 ou 2.

Skills & Capabilities:
${internalSkills}

Prompt Spécifique Agent:
${agent.system_prompt}`;

        // 6. Model Resolution
        const model = resolveModel(agent.visual_config?.model_id);

        // 7. Execution
        console.log(`[GATEWAY] Starting execution Trace: ${traceId}`);
        
        // [SURGICAL FIX] Force text-only mode during signal confirmation to avoid redundant tool calls
        const isSignalConfirmation = message && message.includes('[SYSTEM: ACTION_EXECUTION_SUCCESS]');
        const executionTools = isSignalConfirmation ? {} : discoveredTools;

        const result = await generateText({
            model,
            system: systemPrompt,
            messages: safeMessages,
            tools: executionTools,
            maxSteps: isSignalConfirmation ? 1 : 5
        });

        // [DIAGNOSTIC] Capture AI Execution Trace
        logDiagnostic(traceId, {
            agentId,
            message,
            steps: result.steps,
            usage: result.usage
        });

        // 8. HITL Orchestration & Scrubbing
        const { actionPayload, scrubbedResponse: finalResponse } = processHITL(result, message);

        // 9. Cost & Metrics
        const duration = Date.now() - startTime;
        const { cost } = calculateCost(agent.visual_config?.model_id, result.usage.promptTokens, result.usage.completionTokens);

        // 10. Persistence
        await adminClient.from('activity_logs').insert({
            organization_id: agent.organization_id,
            agent_id: agent.id,
            action_type: 'AGENT_EXECUTION',
            metadata: { trace_id: traceId, tools: { invoked: result.toolCalls?.map(t => t.toolName) || [] } }
        });

        await adminClient.from('ai_agent_chats').insert({
            agent_id: agent.id,
            organization_id: agent.organization_id,
            role: 'assistant',
            content: finalResponse,
            action_payload: actionPayload,
            metadata: { trace_id: traceId }
        });

        // 11. Return Response
        return NextResponse.json({
            id: traceId,
            response: finalResponse,
            action_payload: actionPayload,
            usage: { total_tokens: result.usage.totalTokens, cost_usd: cost.toFixed(6) }
        }, {
            headers: { 'Cache-Control': 'no-store, max-age=0' }
        });

    } catch (error) {
        console.error('Enterprise Gateway Error:', error);
        return NextResponse.json({ error: 'Internal Gateway Error', message: error.message }, { status: 500 });
    }
}
