
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Activity, Plus } from 'lucide-react';
import { Card, PlatformIcon, Button } from '@/components/ui';

export default function TimelineIntegrationList() {
    const router = useRouter();
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(true);
    // State for Active Timelines (persisted in localStorage)
    const [activeTimelines, setActiveTimelines] = useState([]);
    const [isClient, setIsClient] = useState(false);
    const [showConnectModal, setShowConnectModal] = useState(false);

    useEffect(() => {
        const fetchIntegrations = async () => {
            try {
                const res = await fetch('/api/integrations');
                if (res.ok) {
                    const data = await res.json();
                    setIntegrations(data.integrations || []);
                }
            } catch (e) {
                console.error("Failed to fetch integrations", e);
            } finally {
                setLoading(false);
            }
        };
        fetchIntegrations();
    }, []);

    useEffect(() => {
        setIsClient(true);
        const stored = localStorage.getItem('timeline_preferences');
        if (stored) {
            setActiveTimelines(JSON.parse(stored));
        } else {
            // Default: github and slack if available
            setActiveTimelines(['github', 'slack']);
        }
    }, []);

    const toggleTimeline = (provider) => {
        let newTimelines;
        if (activeTimelines.includes(provider)) {
            newTimelines = activeTimelines.filter(t => t !== provider);
        } else {
            newTimelines = [...activeTimelines, provider];
        }
        setActiveTimelines(newTimelines);
        localStorage.setItem('timeline_preferences', JSON.stringify(newTimelines));
        setShowConnectModal(false);
    };

    if (loading || !isClient) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-in fade-in">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mb-3"></div>
                <p className="text-xs font-medium">Loading timeline...</p>
            </div>
        );
    }

    // Identify which integrations are connected
    const connectedProviders = integrations.map(i => i.provider);

    // Determine accessible tools (Not just connected, but supported by our UI)
    const supportedTools = ['github', 'slack', 'trello'];

    // Visible timelines are those in activeTimelines AND connected
    const visibleIntegrations = integrations.filter(i => activeTimelines.includes(i.provider) && supportedTools.includes(i.provider));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {/* Modal Overlay */}
            {showConnectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4 animate-in zoom-in-95 duration-200 border border-slate-200 ring-1 ring-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Add Timeline</h2>
                            <button onClick={() => setShowConnectModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="sr-only">Close</span>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {supportedTools.map(tool => {
                                const isConnected = connectedProviders.includes(tool);
                                const isActive = activeTimelines.includes(tool);
                                const integration = integrations.find(i => i.provider === tool);

                                return (
                                    <button
                                        key={tool}
                                        onClick={() => {
                                            if (isConnected && !isActive) {
                                                toggleTimeline(tool);
                                            } else if (!isConnected) {
                                                router.push('/settings/integrations');
                                            }
                                        }}
                                        disabled={isActive && isConnected}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${isActive && isConnected
                                            ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
                                            : 'hover:border-blue-300 hover:bg-blue-50/50 border-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-slate-100' : 'bg-white border border-slate-100'}`}>
                                                <PlatformIcon platform={tool} className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 capitalize">{tool === 'github' ? 'GitHub' : tool}</div>
                                                <div className="text-xs text-slate-500">
                                                    {isConnected
                                                        ? (isActive ? 'Already added' : 'Connected • Click to add')
                                                        : 'Not connected'}
                                                </div>
                                            </div>
                                        </div>
                                        {isConnected && !isActive && (
                                            <Plus className="w-5 h-5 text-blue-500" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <header className="text-center max-w-2xl mx-auto py-12">
                <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Activity className="w-6 h-6 text-slate-400" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Timeline</h1>
                <p className="text-slate-500 mt-2 text-sm">Select an integration to view its activity stream.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto px-4">
                {visibleIntegrations.map(integration => (
                    <Card
                        key={integration.id}
                        /* Remove Trello logic from onClick if route not ready, assuming it is */
                        onClick={() => router.push(`/timeline/${integration.provider}`)}
                        className="p-6 hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <PlatformIcon platform={integration.provider} className="w-24 h-24" />
                        </div>

                        <div className="flex flex-col h-full relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <PlatformIcon platform={integration.provider} className="w-7 h-7" />
                            </div>

                            <div className="flex justify-between items-start mb-1">
                                <h3 className="text-lg font-bold text-slate-900 capitalize">
                                    {integration.provider === 'github' ? 'GitHub' : integration.provider}
                                </h3>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTimeline(integration.provider);
                                    }}
                                    className="text-slate-300 hover:text-red-500 transition-colors p-1 -mr-2 -mt-2"
                                    title="Remove from view"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <p className="text-xs text-slate-500 font-medium mb-4">
                                {integration.provider === 'github' ? 'Repositories & Commits' : integration.provider === 'slack' ? 'Channels & Conversations' : 'Boards & Cards'}
                            </p>

                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                    Active
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium group-hover:text-blue-500 transition-colors">
                                    View Resources &rarr;
                                </span>
                            </div>
                        </div>
                    </Card>
                ))}

                {/* Add New Integration Card */}
                <button
                    onClick={() => setShowConnectModal(true)}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all group min-h-[200px]"
                >
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                        <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold">Connect New App</span>
                </button>
            </div>
        </div>
    );
}
