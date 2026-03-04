'use client';

import React, { useState, useMemo } from 'react';
import { Bot, Shield, Code, DollarSign, ArrowRight, Zap, CheckCircle2, Search, Users, Copy, Check, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui';

import Link from 'next/link';
import useSWR from 'swr';
import { agents as staticFallbackAgents } from '@/lib/data/agents';

const fetcher = (url) => fetch(url).then(r => r.json());

// Dynamic Icon Mapper
const IconMapper = ({ name, className }) => {
    const icons = {
        Bot, Shield, Code, DollarSign, Zap, Users, CheckCircle2
    };
    const IconComponent = icons[name] || Bot;
    return <IconComponent className={className} />;
};

export default function LibraryPage() {
    // ---- State ----
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Tous');
    const [activeTab, setActiveTab] = useState('verytis'); // 'verytis' | 'community'
    const [activeSort, setActiveSort] = useState('recent'); // 'recent' | 'popular' | 'alpha'

    const categories = ['Tous', 'Support Client', 'DevSecOps', 'FinOps', 'Ventes', 'RH'];

    // ---- Fetch Data ----
    const { data, error, isLoading } = useSWR('/api/library', fetcher);
    // If table doesn't exist yet or is empty, fallback to the mock data for UX
    const dbAgents = data?.agents?.length > 0 ? data.agents : staticFallbackAgents;

    // ---- Filtering Logic ----
    const filteredAgents = useMemo(() => {
        return dbAgents.filter(agent => {
            // 1. Source Toggle Filter
            const matchesTab = activeTab === 'verytis' ? agent.is_verified : !agent.is_verified;
            if (!matchesTab) return false;

            // 2. Category Filter
            const matchesCategory = activeCategory === 'Tous' || agent.category === activeCategory;
            if (!matchesCategory) return false;

            // 3. Search Filter (by Name, Description OR Author Pseudo)
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = agent.name.toLowerCase().includes(searchLower) ||
                (agent.description && agent.description.toLowerCase().includes(searchLower)) ||
                (agent.author && agent.author.toLowerCase().includes(searchLower));

            return matchesSearch;
        }).sort((a, b) => {
            // Apply sorting logic
            if (activeSort === 'popular') {
                return (b.likes || 0) - (a.likes || 0);
            } else if (activeSort === 'alpha') {
                return a.name.localeCompare(b.name);
            } else {
                // 'recent' by default
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            }
        });
    }, [searchQuery, activeCategory, activeTab, activeSort, dbAgents]);

    // ---- Handlers ----
    // Modal-related handlers removed as per instruction.

    return (
        <div className="min-h-screen bg-slate-50 p-6 animate-in fade-in duration-300">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header (Simplified & Modernized) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            <Zap className="w-8 h-8 text-blue-600" />
                            Verytis Hub
                        </h1>
                        <p className="text-slate-500 max-w-2xl text-sm">
                            Découvrez et déployez des agents IA pré-configurés avec des règles de gouvernance strictes.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                        <Link href="/library/publish" className="w-full sm:w-auto">
                            <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all active:scale-95 w-full sm:w-auto">
                                <Bot className="w-5 h-5" />
                                + Publier un Agent
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">

                {/* Top Row: Tabs & Search */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">

                    {/* Source Toggle Tabs */}
                    <div className="flex p-1 bg-slate-100/80 rounded-lg w-full lg:w-auto overflow-x-auto custom-scrollbar shrink-0">
                        <button
                            onClick={() => setActiveTab('verytis')}
                            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap ${activeTab === 'verytis'
                                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            <Shield className={`w-4 h-4 ${activeTab === 'verytis' ? 'text-blue-600' : ''}`} />
                            Certifiés Verytis
                        </button>
                        <button
                            onClick={() => setActiveTab('community')}
                            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap ${activeTab === 'community'
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Communauté
                        </button>
                    </div>

                    {/* Search Bar & Sort Dropdown */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-80 shrink-0">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher par nom, mot-clé, pseudo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-900"
                            />
                        </div>
                        <select
                            value={activeSort}
                            onChange={(e) => setActiveSort(e.target.value)}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-medium cursor-pointer shrink-0"
                        >
                            <option value="recent">Plus récents</option>
                            <option value="popular">Plus populaires</option>
                            <option value="alpha">A-Z</option>
                        </select>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="pt-2 border-t border-slate-100">
                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${activeCategory === category
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="py-20 text-center animate-in fade-in">
                    <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">Chargement du Hub...</h3>
                </div>
            ) : filteredAgents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {filteredAgents.map((agent) => (
                        <div key={agent.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full overflow-hidden group">

                            {/* Card Header */}
                            <div className="p-6 border-b border-slate-100 flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex justify-center items-center shrink-0 ${agent.bgColor || 'bg-slate-100'} group-hover:scale-110 transition-transform`}>
                                    <IconMapper name={agent.icon_name || agent.icon?.name} className={`w-6 h-6 ${agent.color || 'text-slate-600'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-900 text-lg truncate" title={agent.name}>{agent.name}</h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                                            {agent.category}
                                        </span>
                                        {/* Likes */}
                                        {agent.likes !== undefined && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                                                {agent.likes}
                                            </span>
                                        )}
                                        {/* Author Badge */}
                                        <span className={`flex items-center gap-1 text-[10px] font-medium ${agent.is_verified ? 'text-blue-600' : 'text-slate-500'}`}>
                                            Par {agent.author}
                                            {agent.is_verified && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 flex-1 flex flex-col">
                                <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3" title={agent.description}>
                                    {agent.description}
                                </p>

                                {/* Capabilities (actions summary) */}
                                <div className="mt-auto space-y-2">
                                    {agent.capabilities?.slice(0, 2).map((capability, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-500">
                                            <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                            <span className="truncate" title={capability}>{capability}</span>
                                        </div>
                                    ))}
                                    {agent.capabilities?.length > 2 && (
                                        <div className="text-[10px] text-slate-400 italic pl-3">+ {agent.capabilities.length - 2} autres actions</div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                                <Link
                                    href={`/library/${agent.id}`}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all hover:text-blue-600 group/btn"
                                >
                                    Voir les détails
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                        </div>
                    ))}
                </div>
            ) : (
                /* Empty State */
                <div className="py-20 text-center animate-in fade-in">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Aucun agent trouvé</h3>
                    <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                        Essayez de modifier vos filtres ou termes de recherche pour trouver l'agent qu'il vous faut.
                    </p>
                </div>
            )}

        </div>
    );
}
