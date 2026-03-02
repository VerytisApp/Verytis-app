'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Blocks, Key, Plus, Github, Box, Settings2, Trash2, X, CheckCircle2 } from 'lucide-react';
import { Card, Button, SkeletonSettingsItem } from '@/components/ui';

const fetcher = (url) => fetch(url).then(res => res.json());

const DEFAULT_PROVIDERS = [
    { id: 'openai', name: 'OpenAI', domain: 'openai.com', status: 'Not Configured', tokenPreview: '' },
    { id: 'anthropic', name: 'Anthropic Claude', domain: 'anthropic.com', status: 'Not Configured', tokenPreview: '' },
    { id: 'github', name: 'GitHub Enterprise', domain: 'github.com', status: 'Not Configured', tokenPreview: '' },
    { id: 'slack', name: 'Slack', domain: 'slack.com', status: 'Not Configured', tokenPreview: '' },
];

export default function IntegrationsSettings() {
    const { data, isLoading, mutate } = useSWR('/api/settings', fetcher);

    const [providers, setProviders] = useState(DEFAULT_PROVIDERS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeProvider, setActiveProvider] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form fields for modal
    const [modalApiKey, setModalApiKey] = useState('');
    const [modalProviderName, setModalProviderName] = useState('');
    const [modalEndpoint, setModalEndpoint] = useState('');

    useEffect(() => {
        if (data?.settings?.providers?.length > 0) {
            // Merge DB providers with defaults to ensure all base options exist
            const dbProviders = data.settings.providers;
            const merged = DEFAULT_PROVIDERS.map(dp => {
                const found = dbProviders.find(p => p.id === dp.id);
                return found || dp;
            });
            // Add any custom providers from DB that aren't in defaults
            dbProviders.forEach(dbP => {
                if (!merged.find(m => m.id === dbP.id)) merged.push(dbP);
            });
            setProviders(merged);
        }
    }, [data]);

    const handleOpenModal = (provider = null) => {
        setActiveProvider(provider);
        setModalApiKey('');
        setModalProviderName(provider ? provider.name : '');
        setModalEndpoint(provider ? `https://api.${provider.domain}/v1` : '');
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let updatedProviders = [...providers];
            const newPreview = modalApiKey.length > 8
                ? `${modalApiKey.substring(0, 4)}...${modalApiKey.substring(modalApiKey.length - 4)}`
                : '...';

            if (activeProvider) {
                // Update existing
                updatedProviders = updatedProviders.map(p =>
                    p.id === activeProvider.id
                        ? { ...p, status: 'Connected', tokenPreview: newPreview, rawToken: modalApiKey }
                        : p
                );
            } else {
                // Add custom (Simplified)
                const newId = modalProviderName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                const domainMatch = modalEndpoint.match(/https?:\/\/(?:api\.)?([^/]+)/);
                const domain = domainMatch ? domainMatch[1] : 'example.com';
                updatedProviders.push({
                    id: newId,
                    name: modalProviderName,
                    domain: domain,
                    status: 'Connected',
                    tokenPreview: newPreview,
                    rawToken: modalApiKey
                });
            }

            // Save to API
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ providers: updatedProviders })
            });

            if (!res.ok) throw new Error('Failed to save integration');

            setProviders(updatedProviders);
            await mutate(); // Refresh UI cleanly
            setIsModalOpen(false);
            alert('Integration secret secured and saved!');
        } catch (err) {
            console.error(err);
            alert('Failed to save integration.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SkeletonSettingsItem />
            <SkeletonSettingsItem />
        </div>
    );


    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="pb-2 border-b border-slate-100 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Blocks className="w-6 h-6 text-indigo-600" />
                        Integrations & Providers
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage global API keys and secrets for external LLMs and developer tools.
                    </p>
                </div>
                <Button variant="primary" icon={Plus} onClick={() => handleOpenModal(null)}>Add Integration</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((p) => (
                    <Card key={p.id} className="p-5 flex flex-col relative overflow-hidden group hover:border-blue-200 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                                <img src={`https://www.google.com/s2/favicons?domain=${p.domain}&sz=128`} alt={p.name} className="w-6 h-6 object-contain" />
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${p.status === 'Connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                {p.status}
                            </span>
                        </div>

                        <h3 className="font-bold text-slate-900 mb-1">{p.name}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                            Agent requests are routed to {p.domain} via the secure Verytis Gateway.
                        </p>

                        <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                            {p.status === 'Connected' ? (
                                <>
                                    <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-md border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <Key className="w-3.5 h-3.5 text-slate-400" />
                                            <code className="text-xs font-mono text-slate-700">{p.tokenPreview}</code>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" className="flex-1 text-xs py-1.5 h-auto" onClick={() => handleOpenModal(p)}>Configure Endpoint</Button>
                                    </div>
                                </>
                            ) : (
                                <Button variant="secondary" className="w-full text-xs h-9 border-dashed border-2 bg-slate-50 hover:bg-slate-100 text-slate-500" onClick={() => handleOpenModal(p)}>
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Secure Key
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="p-6 bg-blue-50/50 border-blue-100">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Settings2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Zero-Trust Vault</h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
                            All provider secrets are encrypted using AES-256-GCM before being stored in the database. Verytis agents never have direct access to these raw credentials—they interact strictly through the Proxy Gateway which injects the tokens securely at runtime.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Config Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                {activeProvider ? (
                                    <>
                                        <img src={`https://www.google.com/s2/favicons?domain=${activeProvider.domain}&sz=128`} className="w-5 h-5" />
                                        Configure {activeProvider.name}
                                    </>
                                ) : (
                                    <>
                                        <Blocks className="w-5 h-5 text-indigo-600" />
                                        Add Custom Integration
                                    </>
                                )}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {!activeProvider && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Provider Name</label>
                                    <input
                                        type="text"
                                        value={modalProviderName}
                                        onChange={e => setModalProviderName(e.target.value)}
                                        placeholder="e.g. HuggingFace"
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">API Endpoint URL (Optional)</label>
                                <input
                                    type="url"
                                    placeholder="https://api..."
                                    value={modalEndpoint}
                                    onChange={e => setModalEndpoint(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-slate-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex justify-between">
                                    <span>Secure API Key</span>
                                    {activeProvider?.status === 'Connected' && <span className="text-emerald-600 flex items-center gap-1 text-[10px] uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Encrypted in Vault</span>}
                                </label>
                                <input
                                    type="password"
                                    value={modalApiKey}
                                    onChange={e => setModalApiKey(e.target.value)}
                                    placeholder={activeProvider?.status === 'Connected' ? '••••••••••••••••••••••••' : 'sk-...'}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono"
                                />
                                <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                                    <Key className="w-3.5 h-3.5" /> Key will be encrypted via AES-256-GCM.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Encrypting & Saving...' : 'Save Configuration'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
