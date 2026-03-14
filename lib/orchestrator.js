/**
 * Verytis API Orchestrator
 * Expert-level API Orchestration for Verytis App.
 * 
 * GOLDEN RULE: Only applications with configured integrations are accessible.
 * OAuth UX: NO manual API keys. Everything is managed via secure "Connect with..." button.
 * TOKENS: Access (short-lived) & Refresh (back-end managed) are invisible to user.
 * FAILSAFE: Automatic 401 recovery.
 */

/**
 * 1. Dictionnaire de Guidelines (Statique)
 */
export const APP_GUIDELINES_LIBRARY = {
    slack: {
        base_url: "https://slack.com/api/",
        auth_style: "OAuth 2.0 (Bearer Token)",
        instruction: "Utilise les méthodes standards de Slack (chat.*, conversations.*, reactions.*, users.*). Le payload est en JSON."
    },
    github: {
        base_url: "https://api.github.com/",
        auth_style: "OAuth 2.0 (Token)",
        instruction: "Respecte le format repos/{owner}/{repo}/issues. Pour les variables {owner}, utilise les valeurs du contexte."
    },
    trello: {
        base_url: "https://api.trello.com/1/",
        auth_style: "OAuth 2.0 / App Token Managed",
        instruction: "Focus sur cards et lists. Envoie le path après le /1/."
    }
};

/**
 * 2. Injection dans le System Prompt
 * Construit l'objet JSON final pour le System Prompt de l'IA.
 */
export function generateFinalSystemPrompt(userIntegrations) {
    const integrationsWithStatus = userIntegrations.map(integ => ({
        provider: integ.provider,
        auth_method: "OAuth 2.0 (Bouton Connecter)",
        connected: !!integ.connected
    }));

    const configuredAppNames = integrationsWithStatus.map(i => i.provider);
    
    return {
        role: "Verytis API Orchestrator",
        system_override: {
            statut: "TRANSITION COMPLÈTE VERS OAUTH 2.0 ET RESTRICTION D'ACCÈS",
            directive_auth: "L'utilisateur ne fournit plus JAMAIS de clés API manuellement. Tout se passe via l'interface sécurisée de l'app.",
            directive_token_mgmt: "La gestion des access_token et refresh_token est invisible. Si tu rencontres une erreur 401 (Unauthorized), notifie simplement : 'Renouvellement de l'accès en cours...' et retente l'action.",
            directive_security: "Si une app est listée comme 'connected: false', suggère à l'utilisateur de 'Re-cliquer sur le bouton Se Connecter dans les paramètres'. Ne demande jamais de jeton."
        },
        available_integrations: integrationsWithStatus,
        api_specific_guidelines: integrationsWithStatus
            .filter(i => APP_GUIDELINES_LIBRARY[i.provider])
            .reduce((acc, i) => {
                acc[i.provider] = APP_GUIDELINES_LIBRARY[i.provider];
                return acc;
            }, {}),
        output_instructions: "Génère 'app_name', 'http_method', 'endpoint', et 'payload'. En cas de 401, déclenche la routine de rafraîchissement automatique."
    };
}

/**
 * Translates user intentions into dynamic API requests.
 */
export function orchestrateAPIRequest(intent, userIntegrations) {
    const intentLower = intent.toLowerCase();
    let targetApp = null;
    
    if (intentLower.includes('slack')) targetApp = 'slack';
    else if (intentLower.includes('github')) targetApp = 'github';
    else if (intentLower.includes('trello')) targetApp = 'trello';

    if (!targetApp) return null;

    const integration = userIntegrations.find(i => i.provider === targetApp);
    if (!integration) {
        throw new Error(`L'intégration pour ${targetApp} n'est pas configurée. Veuillez l'ajouter dans l'espace Verytis.`);
    }

    if (!integration.connected) {
        throw new Error(`L'intégration ${targetApp} n'est pas connectée via OAuth. Veuillez cliquer sur 'Connecter' dans vos paramètres.`);
    }

    // Logic remains focused on outputting parameters for the gateway to inject tokens
    if (targetApp === 'slack' && intentLower.includes('message')) {
        return {
            app_name: 'slack',
            http_method: 'POST',
            endpoint: 'chat.postMessage',
            payload: { channel: 'C12345', text: intent }
        };
    }

    if (targetApp === 'github' && intentLower.includes('issue')) {
        return {
            app_name: 'github',
            http_method: 'POST',
            endpoint: 'repos/{owner}/{repo}/issues',
            payload: { title: 'New Issue', body: intent }
        };
    }

    return null;
}
