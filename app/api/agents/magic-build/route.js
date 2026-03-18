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
   - AUCUN LABEL SUR LES ARÊTES : Ne mets JAMAIS de texte ou de "label" sur les arêtes (edges). Les traits doivent être propres et sans texte (exit les "Governance Check", etc).
3. LOGIQUE GLOBALE ET HIÉRARCHIE DE SÉCURITÉ (INVIOLABLE) :
   - L'AXE DE CONTRÔLE : t1 (Trigger) -> s1 (Shield) -> p1 (LLM Hub). C'est la ligne rouge.
   - L'ENRICHISSEMENT : k1 (Savoir) se connecte uniquement à p1 (LLM Hub).
   - INTERDICTIONS CRITIQUES : 
     * JAMAIS de lien direct Trigger (t1) -> LLM (p1).
     * JAMAIS de lien Trigger (t1) -> Savoir (k1). Le savoir n'est pas un point de passage, c'est une source de données pour le LLM.
     * Le Shield (s1) est l'unique point d'entrée sécurisé pour le cerveau (p1).
4. TRIGGERS NATIFS VERYTIS (SCHEMA OBLIGATOIRE) : Le déclencheur DOIT être natif à Verytis. Jamais de Zapier/Make. Le trigger_type DOIT être l'une de ces valeurs : 'app', 'webhook', ou 'scheduled'.
   - Si trigger_type est 'app' : inclure 'provider' (ex: 'gmail', 'slack', 'github', 'stripe', 'trello', 'hubspot', 'salesforce', 'notion', 'google', 'linear') ET 'event_name' (ex: 'email_received', 'push', 'payment_succeeded') dans les data du nœud.
   - Si trigger_type est 'webhook' : nomme le label "Verytis Webhook Inbound". Si restriction IP, ajoute requires_ip_whitelist: true dans security.
   - Si trigger_type est 'scheduled' : inclure 'cron_expression' (ex: '0 8 * * *') dans les data.
   - INTERDIT : Ne jamais mettre de 'api_key', 'token', 'credentials' dans le nœud Trigger. L'authentification passe par OAuth (connection_id).
   - Ajouter TOUJOURS 'governance_linked: true' et 'schema_linked: true' dans les data du triggerNode pour signifier que le flux passe par Verytis Gouvernance et Schéma.
   - SCHEMA JSON pour le trigger : { "id": "t1", "type": "triggerNode", "data": { "trigger_type": "app|webhook|scheduled", "provider": "gmail|slack|null", "event_name": "email_received|null", "governance_linked": true, "schema_linked": true } }
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

### GÉOMÉTRIE DE PLACEMENT STRICTE (ANTI-CHEVAUCHEMENT)
1. LA COLONNE VERTÉBRALE (X=250) : Aligne impérativement Trigger (Y=0), Shield (Y=300) et LLM (p1) (Y=600).
2. LE SATELLITE SAVOIR (k1) : Place-le IMPÉRATIVEMENT à DROITE du LLM (p1). Coordonnées recommandées : X=700, Y=600. Ne le place JAMAIS sur le chemin vertical ou entre le Shield et le LLM.
3. L'ÉVENTAIL DES OUTILS (Y=900+) : Répartis les outils horizontalement pour qu'ils respirent (min 400px d'écart).
   - 1 outil : X=250
   - 2 outils : X=-150 et X=650
   - 3 outils : X=-450, X=250, X=950
### SCHEMA JSON ATTENDU (EXEMPLE COMPLET)
{
  "name": "Nom de l'agent",
  "description": "Valeur ajoutée métier",
  "system_prompt": "DESCRIPTION DE POSTE DÉTAILLÉE (min 20 lignes)",
  "architecture": {
    "nodes": [
      { "id": "t1", "type": "triggerNode", "position": { "x": 250, "y": 0 }, "data": { "label": "Trigger", "description": "Entrée" } },
      { "id": "s1", "type": "guardrailNode", "position": { "x": 250, "y": 300 }, "data": { "label": "Shield", "description": "Contrôle" } },
      { "id": "p1", "type": "placeholderNode", "position": { "x": 250, "y": 600 }, "data": { "label": "Agent", "description": "Cerveau" } },
      { "id": "k1", "type": "knowledgeNode", "position": { "x": 700, "y": 600 }, "data": { "label": "Savoir", "description": "RAG" } },
      { "id": "tool1", "type": "toolNode", "position": { "x": -150, "y": 900 }, "data": { "label": "App", "description": "Action", "logoDomain": "..." } }
    ],
    "edges": [
      { "id": "e-t1-s1", "source": "t1", "target": "s1", "animated": true },
      { "id": "e-s1-p1", "source": "s1", "target": "p1", "animated": true },
      { "id": "e-k1-p1", "source": "k1", "target": "p1", "animated": true },
      { "id": "e-p1-tool1", "source": "p1", "target": "tool1" }
    ]
  }
}

### RÈGLES D'AUTO-MAPPING ET GRAPHES
- **LIEN DE SÉCURITÉ OBLIGATOIRE** : Tu DOIS impérativement créer l'arête reliant le Trigger au Shield (\`t1 -> s1\`). Aucun flux ne doit contourner la gouvernance.
- **TRIGGER MANDATORY**: Le flux DOIT commencer par un \`triggerNode\` à (Y=0).
- **AGENT CENTRAL**: Le bloc central (\`placeholderNode\` ou \`llmNode\`) représente l'intelligence.
- **DESCRIPTIONS OBLIGATOIRES**: CHAQUE nœud DOIT avoir un champ \`description\` renseigné.
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

    // ─── POST-PROCESS: STRIP EDGE LABELS ───
    if (generatedConfig.architecture?.edges) {
      generatedConfig.architecture.edges = generatedConfig.architecture.edges.map(edge => {
        const { label, ...rest } = edge;
        return rest;
      });
    }

    return NextResponse.json(generatedConfig);

  } catch (error) {
    console.error('Magic Build API Error:', error);
    return NextResponse.json({ error: 'Internal server error while building agent' }, { status: 500 });
  }
}
