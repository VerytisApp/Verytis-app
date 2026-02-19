
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Layers, ArrowLeft, RefreshCw, GitBranch, Hash, Search } from 'lucide-react';
import { Card, PlatformIcon, Button } from '@/components/ui';

export default function TimelineResourceList() {
    const router = useRouter();
    const { provider } = useParams(); // 'github' or 'slack'

    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchResources = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/resources/list');
                if (res.ok) {
                    const data = await res.json();
                    const allResources = data.resources || [];
                    // Filter according to the provider in URL
                    const filtered = allResources.filter(r => r.platform?.toLowerCase() === provider?.toLowerCase());
                    setResources(filtered);
                }
            } catch (e) {
                console.error("Failed to fetch resources", e);
            } finally {
                setLoading(false);
            }
        };

        if (provider) {
            fetchResources();
        }
    }, [provider]);

    const filteredResources = resources.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const resourceTypeMap = {
        github: 'repository',
        slack: 'channel',
        trello: 'board'
    };
    const resourceType = resourceTypeMap[provider?.toLowerCase()] || 'resource';
    const pluralResourceType = resourceType === 'repository' ? 'repositories' : `${resourceType}s`;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-in fade-in">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mb-3"></div>
                <p className="text-xs font-medium">Loading {provider} resources...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-w-5xl mx-auto px-4 pb-12">

            {/* Header */}
            <div className="flex items-center justify-between py-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/timeline')}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <PlatformIcon platform={provider} className="w-6 h-6" />
                            <h1 className="text-2xl font-bold capitalize text-slate-900">{provider} Resources</h1>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Select a {resourceType} to view its timeline
                        </p>
                    </div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder={`Search ${pluralResourceType}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                />
            </div>

            {/* Grid */}
            {filteredResources.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-500 font-medium">No resources found matching "{searchTerm}"</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredResources.map(resource => (
                        <Card
                            key={resource.id}
                            onClick={() => router.push(`/timeline/${provider}/${resource.id}`)}
                            className="p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${provider === 'github' ? 'bg-slate-900 text-white' :
                                        provider === 'trello' ? 'bg-blue-50 text-blue-600' :
                                            'bg-white border border-slate-100'
                                    }`}>
                                    {provider === 'github' ? (
                                        <GitBranch className="w-5 h-5" />
                                    ) : provider === 'trello' ? (
                                        <Layers className="w-5 h-5" /> /* Trello Board Icon */
                                    ) : (
                                        <Hash className="w-5 h-5 text-slate-400" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-slate-900 truncate leading-tight mb-1" title={resource.name}>
                                        {resource.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border capitalize ${resource.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : 'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                            {resource.status}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {resource.numMembers} {provider === 'github' ? 'Contributors' : 'Members'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                                <span>Last active {new Date(resource.lastActive).toLocaleDateString()}</span>
                                <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Timeline &rarr;
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
