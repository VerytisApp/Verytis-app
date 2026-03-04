import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const openAiApiKey = process.env.OPENAI_API_KEY;

    if (!openAiApiKey) {
      // Fallback mock response for demonstration if no API key is present
      console.warn("No OPENAI_API_KEY found. Returning mock Magic Build response.");
      await new Promise(r => setTimeout(r, 1500)); // Simulate delay
      return NextResponse.json({
        name: "Agent Simulateur (Expert Mode)",
        description: "Simulation d'architecture haute performance pour : " + prompt.substring(0, 30),
        system_prompt: `### ROLE: EXPERT_SIMULATOR\n### GOAL: ${prompt}\n### CONSTRAINTS: Simulation logic for high-performance data processing.`,
        architecture: {
          nodes: [
            { id: "t1", type: "triggerNode", position: { x: 250, y: 0 }, data: { label: "Trigger Simulation", description: "Mode Démo" } },
            {
              id: "s1",
              type: "guardrailNode",
              position: { x: 250, y: 250 },
              data: {
                label: "Verytis Governance",
                policies: {
                  daily_max_usd: 50.00,
                  per_request_max_usd: 5.00,
                  blocked_actions: ["DELETE_USER", "DROP_DATABASE"],
                  require_approval: ["WRITE_TO_PROD", "EXPORT_SENSITIVE_DATA"],
                  forbidden_keywords: ["SALARY", "PASSWORD", "SSN"],
                  max_consecutive_failures: 5,
                  min_confidence: 0.85
                }
              }
            },
            { id: "p1", type: "placeholderNode", position: { x: 250, y: 500 }, data: { label: "LLM DROPZONE" } }
          ],
          edges: [
            { id: "e1", source: "t1", target: "s1", animated: true },
            { id: "e2", source: "s1", target: "p1", animated: true }
          ]
        }
      });
    }

    const systemPrompt = `Tu es l'Expert Architecte AI-Ops de Verytis. Ta mission est de concevoir un agent IA industriel complet, sécurisé et inter-connecté.

Tu DOIS impérativement répondre au format JSON valide.

### MISSIONS
1. ANALYSE : Identifie le Trigger, le Bouclier Verytis (Shield), et crée une structure LOGIQUE de nœuds Outils/Agents.
2.   - STRUCTURE EN ÉTOILE (HUB-AND-SPOKE) OBLIGATOIRE : Le 'Cerveau Central' (p1) est le Pivot.
   - INTERDICTION FORMELLE : Aucun \`toolNode\` ne doit être connecté à un autre \`toolNode\`.
   - CONNEXIONS : Toutes les arêtes (\`edges\`) des outils doivent avoir \`source: "p1"\`. C'est le LLM qui orchestre et appelle chaque outil individuellement.
3. LOGIQUE GLOBALE : Trigger -> Shield -> LLM Hub -> [Tools en étoile].
4. FICHE DE POSTE MATRICIELLE : Tu DOIS rédiger un 'system_prompt' professionnel et exhaustif (min 20 lignes). C'est le cerveau de l'agent.
5. CONNECTIVITÉ & DATA BRIDGES : 
   - Toutes les intégrations (Slack, HubSpot, LinkedIn, GitHub) se connectent via un TOKEN ou une CLÉ API (MVP No-OAuth).
   - MÉDATA D'AUTH : Chaque \`toolNode\` DOIT inclure un objet \`auth_requirement\`. Pour les outils EXTERNES (API, DB), utilise : \`type\` (bearer_token, api_key, connection_string, webhook_url), \`label\` et \`placeholder\`.
   - COMPÉTENCES IA INTERNES : Si l'outil est purement analytique ou textuel (ex: Analyse de sentiment, Calculateur, Traducteur, Résumé, Classificateur) et ne requiert AUCUNE API externe, utilise \`auth_requirement: { "type": "none" }\`. Cela affichera le nœud avec un design violet "Compétence IA" distinct.
   - DÉCOUVERTE PROACTIVE : Si l'utilisateur mentionne la lecture ou l'analyse de données (ex: "Mes ventes", "Ma DB clients"), tu DOIS créer un nœud \`toolNode\` de type "Passerelle de Données" (ex: PostgreSQL, Google Sheets) avec le \`logoDomain\` approprié.
6. RÔLES ET DESCRIPTIONS DÉTAILLÉES : Chaque nœud (Trigger, Shield, Agent, Tool) DOIT avoir une \`description\` précise expliquant son rôle EXACT dans le processus (ex: pour un nœud Slack: "Notifie l'équipe sur le canal #leads-ops dès qu'une opportunité SaaS est détectée").
7. NOMMAGE PROFESSIONNEL : Donne des noms explicites aux nœuds (ex: "Gouvernance Budget LinkedIn"). Par défaut, utilise "Verytis Governance" pour le Shield.
6. GOUVERNANCE SUR-MESURE : Le Shield (\`guardrailNode\`) NE DOIT PAS être générique. Tu DOIS remplir les \`policies\` (budget_daily_max, forbidden_words, etc.) intelligemment selon le rôle de l'agent (ex: SSN, PASSWORD pour un agent RH).
7. PROMPT : Utilise le Chain-of-Thought pour détailler comment l'agent doit utiliser chaque outil.

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
      { "id": "t1", "type": "triggerNode", "position": { "x": 250, "y": 0 }, "data": { "label": "Nom du Trigger", "description": "Rôle exact du trigger dans le flux" } },
      {
        "id": "s1", "type": "guardrailNode", "position": { "x": 250, "y": 250 },
        "data": {
          "label": "Verytis Governance",
          "description": "Applique les politiques de sécurité et budget de l'agent",
          "policies": {
            "budget_daily_max": 25.0,
            "budget_per_request_max": 2.0,
            "forbidden_keywords": ["SSN", "PASSWORD", "SECRET"],
            "blocked_actions": ["DELETE", "DROP_DATABASE"],
            "require_approval": ["WRITE_PROD", "EXPORT_DATA"],
            "allowed_scopes": ["PUBLIC", "INTERNAL"],
            "max_consecutive_failures": 3,
            "rate_limit_per_min": 60
          }
        }
      },
      { "id": "p1", "type": "placeholderNode", "position": { "x": 250, "y": 500 }, "data": { "label": "LLM DROPZONE", "description": "Cerveau central : orchestre les outils et génère les réponses" } },
      { "id": "tool1", "type": "toolNode", "position": { "x": 50, "y": 750 }, "data": { "label": "Nom de l'outil externe", "description": "Action via API externe", "logoDomain": "slack.com", "auth_requirement": { "type": "bearer_token", "label": "Slack Bot Token", "placeholder": "xoxb-..." } } },
      { "id": "tool2", "type": "toolNode", "position": { "x": 450, "y": 750 }, "data": { "label": "Analyseur de Texte", "description": "Analyse le contenu et extrait les insights clés", "auth_requirement": { "type": "none" } } }
    ],
    "edges": [
      { "id": "e1", "source": "t1", "target": "s1", "animated": true },
      { "id": "e2", "source": "s1", "target": "p1", "animated": true },
      { "id": "e3", "source": "p1", "target": "tool1", "animated": true },
      { "id": "e4", "source": "p1", "target": "tool2", "animated": true }
    ]
  }
}

### RÈGLES D'AUTO-MAPPING
- **TRIGGER MANDATORY**: Le flux DOIT commencer par un \`triggerNode\` à (Y=0). Il DOIT avoir une \`description\`.
- **AGENT CENTRAL**: Le bloc central (\`placeholderNode\` ou \`llmNode\`) représente l'intelligence. Tu DOIS mettre le 'system_prompt' dans sa data ET une \`description\` claire.
- **GOUVERNANCE SUR-MESURE**: Le Shield DOIT contenir des \`policies\` adaptées au contexte métier. Utilise TOUJOURS \`forbidden_keywords\` (jamais \`forbidden_words\`).
- **DESCRIPTIONS OBLIGATOIRES**: CHAQUE nœud (triggerNode, guardrailNode, placeholderNode, toolNode) DOIT avoir un champ \`description\` renseigné.
- **STRICT TOOL LIMIT**: N'ajoute QUE les outils explicitement mentionnés.
- **Universal Icons**: Fournis toujours \`logoDomain\` (ex: \`slack.com\`) pour chaque outil.
- **Typographie**: Utilise exclusivement **Verytis** (et non Verity's).

### REGLE DE CONTEXTE ET VARIABLES
- **EXTRACTION** : Si l'utilisateur mentionne un lien personnel (ex: Calendly), un nom d'entreprise, un e-mail ou toute donnee specifique, tu DOIS l'inclure TEL QUEL dans le champ system_prompt.
- **PLACEHOLDERS** : Si l'utilisateur fait reference a une information personnelle MAIS ne la fournit PAS (ex: "envoie mon lien de rendez-vous", "contacte mon equipe"), tu DOIS inserer un texte a trous explicite en MAJUSCULES entre crochets directement dans le system_prompt. Exemples : [URL_CALENDLY_A_REMPLIR], [NOM_DE_VOTRE_ENTREPRISE], [VOTRE_EMAIL], [LIEN_LINKEDIN_PROFIL], [NOM_DU_CANAL_SLACK].
- **VISIBILITE** : Ces placeholders indiquent visuellement a l'utilisateur qu'il doit configurer ces champs avant de deployer l'agent.
- **NE PAS INVENTER** : N'invente JAMAIS de fausses URLs, de faux emails ou de fausses donnees. Utilise TOUJOURS un placeholder si l'information n'est pas fournie.`;


    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
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
