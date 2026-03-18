import { orchestrateAPIRequest, generateFinalSystemPrompt, APP_GUIDELINES_LIBRARY } from '../lib/orchestrator.js';

const mockUserIntegrations = [
    { provider: 'slack', connected: true },
    { provider: 'github', connected: false },
    // trello missing
];

console.log('--- TEST 1: System Prompt Generation (GitHub Configured but Disconnected) ---');
const prompt = generateFinalSystemPrompt(mockUserIntegrations);
console.log('Available Integrations:', JSON.stringify(prompt.available_integrations, null, 2));
console.log('\n--- TEST 2: OAuth Directives Check ---');
console.log('Auth Directive:', prompt.system_override.directive_auth);
console.log('Token Mgmt Directive:', prompt.system_override.directive_token_mgmt);
if (prompt.system_override.directive_token_mgmt.includes('refresh_token')) {
    console.log('✅ PASS: OAuth token management directives found.');
} else {
    console.error('❌ FAIL: OAuth directives missing or incomplete.');
}
console.log('Guidelines Injected for GitHub:', !!prompt.api_specific_guidelines.github);
if (prompt.api_specific_guidelines.github) {
    console.log('✅ PASS: GitHub guidelines injected because it is configured.');
} else {
    console.error('❌ FAIL: GitHub guidelines should be injected even if not connected.');
}

console.log('\n--- TEST 3: Orchestration (Slack - Connected) ---');
try {
    const res = orchestrateAPIRequest('Post a slack message', mockUserIntegrations);
    console.log('Result:', res.endpoint);
    console.log('✅ PASS: Slack orchestrated.');
} catch (e) {
    console.error('Error:', e.message);
}

console.log('\n--- TEST 3: Orchestration (GitHub - Configured but Disconnected) ---');
try {
    orchestrateAPIRequest('Create github issue', mockUserIntegrations);
} catch (e) {
    console.log('✅ Expected Error (Action Blocked):', e.message);
}

console.log('\n--- TEST 4: Orchestration (Trello - Not Configured) ---');
try {
    orchestrateAPIRequest('Show trello boards', mockUserIntegrations);
} catch (e) {
    console.log('✅ Expected Error (Not Configured):', e.message);
}
