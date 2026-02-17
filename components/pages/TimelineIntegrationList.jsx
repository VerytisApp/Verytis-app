
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Activity, Plus } from 'lucide-react';
import { Card, PlatformIcon, Button } from '@/components/ui';

export default function TimelineIntegrationList() {
    const router = useRouter();
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-in fade-in">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mb-3"></div>
                <p className="text-xs font-medium">Loading integrations...</p>
            </div>
        );
    }

    // Filter only integrations that we support in timeline (GitHub, Slack)
    // Actually the API already filters for connected ones, but let's be safe visually if we add others later.
    const timelineIntegrations = integrations.filter(i => ['github', 'slack'].includes(i.provider));

    if (timelineIntegrations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Layers className="w-8 h-8 text-slate-300" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">No Integrations Connected</h1>
                <p className="text-slate-500 text-sm mb-8">
                    Connect apps like GitHub or Slack to see their activity timeline here.
                </p>
                <Button onClick={() => router.push('/settings/integrations')}>
                    Go to Settings
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="text-center max-w-2xl mx-auto py-12">
                <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Activity className="w-6 h-6 text-slate-400" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Timeline</h1>
                <p className="text-slate-500 mt-2 text-sm">Select an integration to view its activity stream.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto px-4">
                {timelineIntegrations.map(integration => (
                    <Card
                        key={integration.id}
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

                            <h3 className="text-lg font-bold text-slate-900 capitalize mb-1">
                                {integration.provider === 'github' ? 'GitHub' : 'Slack'}
                            </h3>

                            <p className="text-xs text-slate-500 font-medium mb-4">
                                {integration.provider === 'github' ? 'Repositories & Commits' : 'Channels & Conversations'}
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
                    onClick={() => router.push('/settings/integrations')}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all group"
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
