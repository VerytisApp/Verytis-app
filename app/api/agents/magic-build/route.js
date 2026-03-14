import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req) {
  try {
    const { prompt, current_architecture } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const isModification = !!current_architecture && (current_architecture.nodes?.length > 0);

    // ─── FETCH MANDATORY ORG SETTINGS ───
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch global governance from organization_settings
    const { data: orgSettings } = await supabase
      .from('organization_settings')
      .select('banned_keywords, blocked_actions, default_max_per_agent')
      .eq('id', 'default')
      .single();

    const mandatoryGovernance = orgSettings ? `
### RÈGLES DE GOUVERNANCE CORPORATE (OBLIGATOIRES)
Ces règles sont définies au niveau de l'organisation et DOIVENT être incluses dans le nœud Shield (s1). Elles ne peuvent pas être supprimées par l'utilisateur :
- MOTS-CLÉS INTERDITS : ${orgSettings.banned_keywords?.join(', ') || 'Aucun'}
- ACTIONS BLOQUÉES : ${orgSettings.blocked_actions?.join(', ') || 'Aucune'}
- BUDGET PAR DÉFAUT : ${orgSettings.default_max_per_agent || '1.00'}$ / jour
` : '';

    const openAiApiKey = process.env.OPENAI_API_KEY;

    if (!openAiApiKey) {
      // Fallback mock response for demonstration if no API key is present
      console.warn("No OPENAI_API_KEY found. Returning mock Magic Build response.");
      await new Promise(r => setTimeout(r, 1500)); // Simulate delay
      
      const mockArchitecture = isModification ? current_architecture : {
        nodes: [
          { id: "t1", type: "triggerNode", position: { x: 250, y: 0 }, data: { label: "Trigger Simulation", description: "Mode Démo" } },
          { id: "s1", type: "guardrailNode", position: { x: 250, y: 250 }, data: { label: "Verytis Governance", description: "Gouvernance par défaut" } },
          { id: "p1", type: "placeholderNode", position: { x: 250, y: 500 }, data: { label: "LLM DROPZONE" } }
        ],
        edges: [
          { id: "e1", source: "t1", target: "s1", animated: true },
          { id: "e2", source: "s1", target: "p1", animated: true }
        ]
      };

      return NextResponse.json({
        name: isModification ? "Agent Modifié" : "Agent Simulateur (Expert Mode)",
        description: (isModification ? "Mise à jour pour : " : "Simulation d'architecture pour : ") + prompt.substring(0, 30),
        system_prompt: `### ROLE: EXPERT_SIMULATOR\n### GOAL: ${prompt}\n### CONSTRAINTS: Logic for ${isModification ? 'modifying' : 'building'} agent.`,
        architecture: mockArchitecture
      });
    }

    const fullSystemPrompt = `Tu es l'Expert Architecte AI-Ops de Verytis. Ta mission est de concevoir ou de MODIFIER un agent IA industriel complet, sécurisé et inter-connecté.

Tu DOIS impérativement répondre au format JSON valide.

${isModification ? `### MODE MODIFICATION ACTIF
L'utilisateur te fournit une architecture existante (\`current_architecture\`). 
Ta mission est d'étendre, de corriger ou d'adapter cette architecture selon le \`prompt\` de l'utilisateur.

RÈGLES DE MODIFICATION ET PROTECTION :
1. PRÉSERVATION DE LA GOUVERNANCE (CRITIQUE) : Tu ne dois JAMAIS modifier les politiques de sécurité (\`data.policies\`) du nœud \`guardrailNode\` (s1) existant, SAUF si l'utilisateur le demande explicitement dans son prompt (ex: "change le budget", "bloque le mot X"). Si le prompt ne mentionne pas la sécurité ou le budget, recopie l'objet \`policies\` tel quel.
2. ANALYSE L'EXISTANT : Regarde les nœuds (\`nodes\`) et les liens (\`edges\`) existants.
3. ÉVOLUTION : Ajoute les outils demandés, modifie le \`system_prompt\` de l'agent central (p1) pour inclure les nouvelles capacités.
4. PRÉSERVATION DES IDS : Garde les IDs (t1, s1, p1) pour assurer la continuité.
5. PRÉSENCE OBLIGATOIRE : Un nœud \`guardrailNode\` (Verytis Shield) doit TOUJOURS être présent entre le Trigger et l'Agent central.
6. RETOUR COMPLET : Tu DOIS renvoyer l'architecture COMPLÈTE (nœuds existants + modifiés + nouveaux).` : `### MODE CRÉATION ACTIF
Conçois un nouvel agent de zéro.`}

### MISSIONS GÉNÉRALES
1. ANALYSE : Identifie le Trigger, le Bouclier Verytis (Shield), et crée une structure LOGIQUE de nœuds Outils/Agents.
2. STRUCTURE EN ÉTOILE (HUB-AND-SPOKE) OBLIGATOIRE : Le 'Cerveau Central' (p1) est le Pivot.
   - INTERDICTION FORMELLE : Aucun \`toolNode\` ne doit être connecté à un autre \`toolNode\`.
   - CONNEXIONS : Toutes les arêtes (\`edges\`) des outils doivent avoir \`source: "p1"\`. C'est le LLM qui orchestre et appelle chaque outil individuellement.
3. LOGIQUE GLOBALE : Trigger -> Shield -> LLM Hub -> [Tools en etoile].
4. TRIGGERS NATIFS VERYTIS : Le declencheur est TOUJOURS natif a Verytis. Jamais de Zapier/Make. Le trigger_type DOIT etre 'webhook', 'schedule' ou 'app_event'. Si le type est 'app_event', tu DOIS inclure un champ 'event_source' dans les data du noeud (ex: 'twitch.stream_offline', 'salesforce.opportunity_created') selon l'agent. Si webhook, nomme le label "Verytis Webhook Inbound". Si restriction IP, ajoute requires_ip_whitelist: true dans security.
5. FICHE DE POSTE MATRICIELLE : Tu DOIS rédiger un 'system_prompt' professionnel et exhaustif (min 20 lignes). C'est le cerveau de l'agent.
6. CONNECTIVITÉ & DATA BRIDGES : 
   - Toutes les intégrations (Slack, HubSpot, LinkedIn, GitHub) se connectent via un TOKEN ou une CLÉ API (MVP No-OAuth).
   - MÉDATA D'AUTH : Chaque \`toolNode\` DOIT inclure un objet \`auth_requirement\`. Pour les outils EXTERNES (API, DB), utilise : \`type\` (bearer_token, api_key, connection_string, webhook_url), \`label\` et \`placeholder\`.
   - COMPÉTENCES IA INTERNES : Si l'outil est purement analytique ou textuel (ex: Analyse de sentiment, Calculateur, Traducteur, Résumé, Classificateur) et ne requiert AUCUNE API externe, utilise \`auth_requirement: { "type": "none" }\`. Cela affichera le nœud avec un design violet "Compétence IA" distinct.
   - DÉCOUVERTE PROACTIVE : Si l'utilisateur mentionne la lecture ou l'analyse de données (ex: "Mes ventes", "Ma DB clients"), tu DOIS créer un nœud \`toolNode\` de type "Passerelle de Données" (ex: PostgreSQL, Google Sheets) avec le \`logoDomain\` approprié.
7. RÔLES ET DESCRIPTIONS DÉTAILLÉES : Chaque nœud (Trigger, Shield, Agent, Tool) DOIT avoir une \`description\` précise expliquant son rôle EXACT dans le processus.
8. NOMMAGE PROFESSIONNEL : Donne des noms explicites aux nœuds (ex: "Gouvernance Budget LinkedIn"). Par défaut, utilise "Verytis Governance" pour le Shield.
9. GOUVERNANCE SUR-MESURE : Le Shield (\`guardrailNode\`) NE DOIT PAS être générique. Tu DOIS remplir les \`policies\` intelligemment selon le rôle de l'agent.
${mandatoryGovernance}
10. PROMPT : Utilise le Chain-of-Thought pour détailler comment l'agent doit utiliser chaque outil.

### ARCHITECTURE VERTICALE
- Alignement vertical (X=250).
- Trigger (Y=0) -> Shield (Y=250) -> LLM Node (Y=500) -> Tools (Y=750+).

### SCHEMA JSON ATTENDU
{
  "name": "Nom de l'agent",
  "description": "Valeur ajoutée métier",
  "system_prompt": "DESCRIPTION DE POSTE DÉTAILLÉE (min 20 lignes)",
  "architecture": {
    "nodes": [
      { "id": "t1", "type": "triggerNode", "position": { "x": 250, "y": 0 }, "data": { "label": "Trigger", "description": "EXPLICATION CONCRÈTE ICI" } },
      { "id": "s1", "type": "guardrailNode", "position": { "x": 250, "y": 250 }, "data": { "label": "Shield", "description": "EXPLICATION CONCRÈTE ICI" } },
      { "id": "p1", "type": "placeholderNode", "position": { "x": 250, "y": 500 }, "data": { "label": "Agent", "description": "EXPLICATION CONCRÈTE ICI" } },
      { "id": "tool1", "type": "toolNode", "position": { "x": 50, "y": 750 }, "data": { "label": "Outil", "description": "EXPLICATION CONCRÈTE ICI", "logoDomain": "..." } }
    ],
    "edges": [ ... ]
  }
}

### RÈGLES D'AUTO-MAPPING
- **TRIGGER MANDATORY**: Le flux DOIT commencer par un \`triggerNode\` à (Y=0).
- **AGENT CENTRAL**: Le bloc central (\`placeholderNode\` ou \`llmNode\`) représente l'intelligence.
- **DESCRIPTIONS OBLIGATOIRES**: CHAQUE nœud DOIT avoir un champ \`description\` renseigné.
- **STRICT TOOL LIMIT**: N'ajoute QUE les outils explicitement mentionnés ou strictement nécessaires.
- **Universal Icons**: Fournis toujours \`logoDomain\` (ex: \`slack.com\`) pour chaque outil.

### MISSION DESCRIPTIVE CRITIQUE (OBLIGATOIRE)
Pour CHAQUE nœud sans exception (Trigger, Shield, LLM, Tool), tu DOIS fournir une \`description\` concrète et métier expliquant son utilité.
- Interdit : "Description par défaut", "Nœud d'outil", "Agent Verytis".
- Obligatoire : Explique ce que fait l'application précisément dans CE flux.
  - Ex (Slack) : "Notifie automatiquement le canal #dev avec le rapport de faille de sécurité détecté."
  - Ex (Trigger) : "Webhook entrant qui reçoit les métriques de performance du serveur toutes les heures."
  - Ex (Shield) : "Applique une politique de sécurité stricte interdisant l'accès aux données de facturation.";`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: fullSystemPrompt },
          { role: 'user', content: `PROMPT: ${prompt}${isModification ? `\n\nARCHITECTURE ACTUELLE:\n${JSON.stringify(current_architecture, null, 2)}` : ''}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error Details:', JSON.stringify(errorData, null, 2));
      return NextResponse.json({
        error: 'Failed to generate agent configuration',
        details: errorData.error?.message || 'Unknown OpenAI error'
      }, { status: response.status });
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    console.log("[MAGIC_BUILD_RAW_RESPONSE]", rawContent);

    const generatedConfig = JSON.parse(rawContent);

    return NextResponse.json(generatedConfig);

  } catch (error) {
    console.error('Magic Build API Error:', error);
    return NextResponse.json({ error: 'Internal server error while building agent' }, { status: 500 });
  }
}
