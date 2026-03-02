import { Bot, Code, DollarSign, Users } from 'lucide-react';

export const agents = [
  {
    id: 'support-l1',
    name: 'Support L1',
    icon: Bot,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    description: 'Agent de support client de premier niveau. Formé sur votre base de connaissances interne. Répond aux questions fréquentes et escalade si nécessaire.',
    features: ['🛡️ Bloque les données sensibles (SSN)', '💰 Limite de $50/jour'],
    capabilities: [
      'Recherche des solutions dans la base documentaire',
      'Répond aux tickets via l\'intégration Zendesk',
      'Escalade les requêtes critiques aux équipes humaines'
    ],
    category: 'Support Client',
    author: 'Verytis',
    is_verified: true,
    policies: [
      { label: 'Budget Max', value: '50$/mois' },
      { label: "Taux d'hallucination max", value: '5%' },
      { label: 'Scrubber RGPD', value: 'Activé' }
    ],
    codeSnippets: {
      python: `from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

system_prompt = """
Tu es un agent de support client de premier niveau. 
Formé sur notre base de connaissances interne. 
Réponds aux questions fréquentes et escalade si nécessaire.
"""

def generate_support_response(user_query, context_docs):
    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.3, # Faible créativité pour rester précis
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "system", "content": f"Contexte RAG:\\n{context_docs}"},
            {"role": "user", "content": user_query}
        ]
    )
    return response.choices[0].message.content

# Exemple d'appel
print(generate_support_response("Comment réinitialiser mon mot de passe ?", "Doc: Allez dans paramètres..."))`,
      node: `import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = \`
Tu es un agent de support client de premier niveau. 
Formé sur notre base de connaissances interne. 
Réponds aux questions fréquentes et escalade si nécessaire.
\`;

async function generateSupportResponse(userQuery, contextDocs) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3, // Faible créativité pour rester précis
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: \`Contexte RAG:\\n\${contextDocs}\` },
      { role: 'user', content: userQuery },
    ],
  });

  return response.choices[0].message.content;
}

// Exemple d'appel
generateSupportResponse("Comment réinitialiser mon mot de passe ?", "Doc: Allez dans paramètres...").then(console.log);`
    }
  },
  {
    id: 'github-pr',
    name: 'GitHub PR Reviewer',
    icon: Code,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    description: 'Analyseur de code automatisé. Scanne les Pull Requests pour détecter les failles de sécurité, les bugs potentiels et vérifier les conventions de code.',
    features: ['🛡️ Bloque le code non sécurisé', '⏱️ Rate Limit: 100/min'],
    capabilities: [
      'Analyse les modifications de code dans les Pull Requests',
      'Détecte les failles de sécurité et bugs potentiels',
      'Vérifie le respect des conventions de code'
    ],
    category: 'DevSecOps',
    author: 'Verytis',
    is_verified: true,
    policies: [
      { label: 'Budget Max', value: '200$/mois' },
      { label: 'Accès Code Source', value: 'Lecture Seule' },
      { label: 'Validation Humaine', value: 'Requise pour Merge' }
    ],
    codeSnippets: {
      python: `from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

system_prompt = """
Tu es un analyseur de code automatisé (DevSecOps). 
Scanne les Pull Requests pour détecter les failles de sécurité, 
les bugs potentiels et vérifier les conventions de code.
Réponds au format Markdown avec le fichier et la ligne concernée.
"""

def analyze_pull_request(git_diff):
    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.1,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Voici le diff de la PR:\\n{git_diff}"}
        ]
    )
    return response.choices[0].message.content`,
      node: `import OpenAI from 'openai';

const openai = new OpenAI();
const systemPrompt = \`
Tu es un analyseur de code automatisé (DevSecOps). 
Scanne les Pull Requests pour détecter les failles de sécurité, 
les bugs potentiels et vérifier les conventions de code.
Réponds au format Markdown avec le fichier et la ligne concernée.
\`;

async function analyzePullRequest(gitDiff) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.1,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: \`Voici le diff de la PR:\\n\${gitDiff}\` },
    ],
  });
  return response.choices[0].message.content;
}`
    }
  },
  {
    id: 'finops-watcher',
    name: 'FinOps Watcher',
    icon: DollarSign,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    description: "Surveille la consommation d'API des autres agents et génère des alertes en cas de dépassement de budget. Optimise les coûts cloud et LLM.",
    features: ['🛡️ Bloque si budget dépassé', '💰 Limite de $10/mois'],
    capabilities: [
      'Surveille en temps réel la consommation d\'API et LLMs',
      'Détecte les anomalies de facturation et suggère des optimisations',
      'Alerte et bloque de façon autonome en cas de dépassement'
    ],
    category: 'FinOps',
    author: 'Verytis',
    is_verified: true,
    policies: [
      { label: 'Budget Max', value: '10$/mois' },
      { label: 'Alertes Slack', value: 'Temps Réel' },
      { label: 'Action Auto', value: 'Désactivation si dépassement' }
    ],
    codeSnippets: {
      python: `from openai import OpenAI

client = OpenAI()

system_prompt = """
Tu es un agent FinOps. Tu analyses la consommation des APIs et des LLMs.
Détecte les anomalies de budget et recommande des optimisations de coûts.
Génère une alerte JSON structurée si le seuil est dépassé.
"""

def check_billing_anomaly(billing_data):
    response = client.chat.completions.create(
        model="gpt-4o-mini", # Modèle plus léger pour des batchs fréquents
        response_format={ "type": "json_object" },
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Analyse ces données: {billing_data}"}
        ]
    )
    return response.choices[0].message.content`,
      node: `import OpenAI from 'openai';

const openai = new OpenAI();

const systemPrompt = \`
Tu es un agent FinOps. Tu analyses la consommation des APIs et des LLMs.
Détecte les anomalies de budget et recommande des optimisations de coûts.
Génère une alerte JSON structurée si le seuil est dépassé.
\`;

async function checkBillingAnomaly(billingData) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: \`Analyse ces données: \${JSON.stringify(billingData)}\` },
    ],
  });
  return JSON.parse(response.choices[0].message.content);
}`
    }
  },
  {
    id: 'hr-onboarding',
    name: 'HR Onboarding Buddy',
    icon: Users,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
    description: "Accompagne les nouveaux employés lors de leur première semaine. Répond aux questions RH et guide à travers les documents de l'entreprise.",
    features: ['Notion Integration', 'Slack Bot', 'Document Q&A'],
    capabilities: [
      'Accueillle les nouveaux collaborateurs via Slack',
      'Retrouve et explique les documents RH (mutuelle, congés)',
      'Guide pas-à-pas à travers la culture d\'entreprise'
    ],
    category: 'RH',
    author: 'Community User',
    is_verified: false,
    policies: [
      { label: 'Budget Max', value: '20$/mois' },
      { label: 'Accès Données', value: 'Public Interne Uniquement' }
    ],
    codeSnippets: {
      python: `from openai import OpenAI

client = OpenAI()

system_prompt = """
Tu es l'accompagnateur RH (HR Onboarding Buddy) pour les nouvelles recrues.
Sois amical, chaleureux et professionnel.
Réponds aux questions sur les congés, le matériel, ou la culture d'entreprise
en te basant uniquement sur le contexte Notion fourni.
"""

def onboarding_chat(employee_name, query, notion_context):
    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.7, # Plus chaleureux et créatif
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "system", "content": f"Contexte de l'entreprise: {notion_context}"},
            {"role": "user", "content": f"Bonjour je suis {employee_name}, {query}"}
        ]
    )
    return response.choices[0].message.content`,
      node: `import OpenAI from 'openai';

const openai = new OpenAI();
const systemPrompt = \`
Tu es l'accompagnateur RH (HR Onboarding Buddy) pour les nouvelles recrues.
Sois amical, chaleureux et professionnel.
Réponds aux questions sur les congés, le matériel, ou la culture d'entreprise
en te basant uniquement sur le contexte Notion fourni.
\`;

async function onboardingChat(employeeName, query, notionContext) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: \`Contexte de l'entreprise: \${notionContext}\` },
      { role: 'user', content: \`Bonjour je suis \${employeeName}, \${query}\` },
    ],
  });
  return response.choices[0].message.content;
}`
    }
  }
];
