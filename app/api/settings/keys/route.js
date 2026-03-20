import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/encryption';

export async function POST(req) {
    try {
        const { provider, apiKey } = await req.json();

        if (!provider || !apiKey) {
            return NextResponse.json({ error: 'Provider and API Key are required' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Fetch current settings
        const { data: settings, error: fetchError } = await supabase
            .from('organization_settings')
            .select('providers')
            .eq('id', 'default')
            .single();

        if (fetchError) throw fetchError;

        let providers = settings?.providers || [];
        const providerId = provider.toLowerCase();

        // Detailed mapping for professional naming and correct domains (logos)
        const providerMetadata = {
            'openai': { id: 'openai', name: 'OpenAI', domain: 'openai.com' },
            'gpt-4o': { id: 'openai', name: 'OpenAI', domain: 'openai.com' },
            'gpt-4': { id: 'openai', name: 'OpenAI', domain: 'openai.com' },
            'anthropic': { id: 'anthropic', name: 'Anthropic Claude', domain: 'anthropic.com' },
            'claude': { id: 'anthropic', name: 'Anthropic Claude', domain: 'anthropic.com' },
            'slack': { id: 'slack', name: 'Slack', domain: 'slack.com' },
            'github': { id: 'github', name: 'GitHub', domain: 'github.com' }
        };

        const meta = providerMetadata[providerId] || {
            id: providerId,
            name: providerId.charAt(0).toUpperCase() + providerId.slice(1),
            domain: `${providerId}.com`
        };

        // 2. Prepare new provider object
        const newPreview = apiKey.length > 8
            ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
            : '...';

        const encryptedToken = encrypt(apiKey);

        const providerData = {
            ...meta,
            status: 'Connected',
            tokenPreview: newPreview,
            encryptedToken: encryptedToken,
            updated_at: new Date().toISOString()
        };

        // 3. Update or Add to matching provider
        const finalId = meta.id;
        const existingIndex = providers.findIndex(p => p.id === finalId);
        if (existingIndex > -1) {
            providers[existingIndex] = { ...providers[existingIndex], ...providerData };
        } else {
            providers.push(providerData);
        }

        // 4. Save back to DB
        const { error: updateError } = await supabase
            .from('organization_settings')
            .update({ providers })
            .eq('id', 'default');

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, message: `Clé API pour ${provider} synchronisée avec la zone intégration.` });

    } catch (error) {
        console.error('API Key Sync Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
