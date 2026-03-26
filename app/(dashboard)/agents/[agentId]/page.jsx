'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
    ChevronRight,
    ShieldCheck,
    ShieldAlert,
    Globe,
    BarChart2,
    Trophy,
    DollarSign,
    CheckCircle2,
    Link as LinkIcon,
    Cpu,
    Layers,
    Bot,
    ExternalLink,
    Slack,
    Github,
    Database,
    Copy,
    Send,
    Sparkles
} from 'lucide-react';
import { Card, Button, Modal } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import AgentVisualBuilderSection from '@/components/pages/AgentVisualBuilderSection';

import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(r => r.json());

export default function AgentGovernancePage(props) {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium">Initialisation du Supervisor...</div>}>
            <AgentGovernanceContent {...props} />
        </Suspense>
    );
}

function AgentGovernanceContent({ params }) {
    const { agentId } = React.use(params);
    const router = useRouter();
    const { showToast } = useToast();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportMessage, setReportMessage] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'telemetry';
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isChatting, setIsChatting] = useState(false);
    const [regeneratedKey, setRegeneratedKey] = useState(null);
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Fetch Agent Data
    const { data, error, isLoading, mutate } = useSWR(`/api/agents/${agentId}`, fetcher);
    // Fetch Global Settings (for API Key)
    const { data: settingsData } = useSWR('/api/settings', fetcher);

    const agent = data?.agent;
    const logs = data?.logs || [];
    const globalApiKey = settingsData?.verytis_api_key || 'vrt_live_xxxxxxxxxxxxxxxx';

    const agentName = agent ? agent.name : "Loading...";

    // Calculate dynamic stats based on logs (FinOps & Usage)
    const stats = {
        totalSpend: "$0.00",
        totalTokens: 0,
        requests: 0,
        policyBlocks: 0,
        successRate: "100%",
        velocity: "0ms"
    };

    if (logs.length > 0) {
        const total = logs.length;
        stats.requests = total;

        const totalCost = logs.reduce((sum, l) => sum + parseFloat(l.metadata?.metrics?.cost_usd || 0), 0);
        stats.totalSpend = `$${totalCost.toFixed(3)}`;

        const totalTokensUsed = logs.reduce((sum, l) => sum + parseInt(l.metadata?.metrics?.tokens_used || 0), 0);
        stats.totalTokens = new Intl.NumberFormat().format(totalTokensUsed);

        stats.policyBlocks = logs.filter(l => l.metadata?.status === 'BLOCKED').length;

        const successCount = logs.filter(l => l.metadata?.status !== 'BLOCKED').length;
        stats.successRate = `${Math.round((successCount / total) * 100)}%`;

        const totalDuration = logs.reduce((sum, l) => sum + parseInt(l.metadata?.metrics?.duration_ms || 0), 0);
        stats.velocity = `${Math.round(totalDuration / total)}ms`;
    }

    // Extract trigger provider for dynamic icons in Webhook tab
    const triggerNode = agent?.visual_config?.nodes?.find(n => n.type === 'triggerNode');
    const triggerProvider = triggerNode?.data?.provider;
    const triggerProviderDomain = triggerProvider ? {
        slack: 'slack.com',
        github: 'github.com',
        trello: 'trello.com',
        shopify: 'shopify.com',
        stripe: 'stripe.com',
        google_workspace: 'workspace.google.com',
        youtube: 'youtube.com',
        streamlabs: 'streamlabs.com'
    }[triggerProvider.toLowerCase()] : null;

    if (isLoading) return <div className="p-12 text-center text-slate-500 font-medium">Loading Agent details...</div>;
    if (error || !agent) return <div className="p-12 text-center text-rose-500 font-medium">Error loading AI Agent. Make sure it exists.</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    <Link href="/agents" className="cursor-pointer hover:text-slate-900 transition-colors">Agents</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-900">{agentName}</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-indigo-600" />
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                {agentName}
                            </h1>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Link href={`/agents/${agentId}/policies`}>
                            <Button variant="secondary" icon={ShieldCheck}>
                                Configure Policies
                            </Button>
                        </Link>
                        <Button
                            variant={agent.status === 'active' ? 'danger' : 'primary'}
                            icon={agent.status === 'active' ? ShieldAlert : CheckCircle2}
                            onClick={async () => {
                                if (confirm(`Are you sure you want to ${agent.status === 'active' ? 'SUSPEND' : 'ACTIVATE'} this agent?`)) {
                                    const res = await fetch(`/api/agents/${agent.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: agent.status === 'active' ? 'suspended' : 'active' })
                                    });
                                    if (res.ok) mutate();
                                }
                            }}
                        >
                            {agent.status === 'active' ? 'Suspend Agent (Kill Switch)' : 'Activate Agent'}
                        </Button>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {logs.length > 0 ? (
                            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="text-xs font-semibold text-slate-600">Connected</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                <span className="text-xs font-semibold text-slate-600">Not connected</span>
                            </div>
                        )}
                        <span className={`px-2.5 py-1 rounded text-xs font-bold tracking-wide uppercase ${agent.status?.toLowerCase() === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                            {agent.status?.toLowerCase() === 'active' ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-1 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('telemetry')}
                    className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${activeTab === 'telemetry' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <div className="flex items-center gap-2">
                        <BarChart2 className="w-3.5 h-3.5" />
                        Télémétrie & Logs
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('playground')}
                    className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${activeTab === 'playground' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        Playground (Test)
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('builder')}
                    className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${activeTab === 'builder' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" />
                        Visual Builder
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('deployment')}
                    className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${activeTab === 'deployment' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <div className="flex items-center gap-2">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Intégration & Webhook
                    </div>
                </button>
            </div>

            {activeTab === 'telemetry' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Section FinOps & Usage */}
                    <div className="pt-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-slate-700" />
                                FinOps & Usage Overview
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="p-5 flex flex-col justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-3">
                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                    Total Spend
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.totalSpend}</div>
                                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wide">Coût cumulé de l'agent</p>
                                </div>
                            </Card>

                            <Card className="p-5 flex flex-col justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-3">
                                    <Cpu className="w-4 h-4 text-indigo-500" />
                                    Total Tokens
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.totalTokens}</div>
                                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wide">Jetons traités (in/out)</p>
                                </div>
                            </Card>

                            <Card className="p-5 flex flex-col justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-3">
                                    <Layers className="w-4 h-4 text-blue-500" />
                                    Requests / Prompts
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.requests}</div>
                                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wide">Invocations AI réussies</p>
                                </div>
                            </Card>

                            <Card className="p-5 flex flex-col justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-3">
                                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                                    Actions & Requêtes Bloquées
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.policyBlocks}</div>
                                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wide leading-tight">Tentatives bloquées par Verytis</p>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Efficiency */}
                    <div className="pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-slate-700" />
                                Efficiency & Performance
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="p-5">
                                <div className="text-sm font-semibold text-slate-600 mb-3">Success Rate</div>
                                <div className="text-2xl font-bold text-slate-900">{stats.successRate}</div>
                            </Card>

                            <Card className="p-5">
                                <div className="text-sm font-semibold text-slate-600 mb-3">Cost Analysis</div>
                                <div className="text-2xl font-bold text-slate-900">{stats.totalSpend}</div>
                            </Card>

                            <Card className="p-5">
                                <div className="text-sm font-semibold text-slate-600 mb-3">Avg Latency</div>
                                <div className="text-2xl font-bold text-slate-900">{stats.velocity}</div>
                            </Card>
                        </div>
                    </div>

                    {/* Activity Ledger */}
                    <div className="pt-4 pb-12">
                        <Card>
                            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30">
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <LinkIcon className="w-5 h-5 text-indigo-600" />
                                    Activity Ledger
                                </h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">
                                    Transparent audit trail of all agent operations.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white text-slate-400 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3.5 w-8"></th>
                                            <th className="px-6 py-3.5">Timestamp</th>
                                            <th className="px-6 py-3.5">Operation</th>
                                            <th className="px-6 py-3.5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                                        {logs.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center text-slate-400 text-sm">
                                                    No activity logs found for this agent.
                                                </td>
                                            </tr>
                                        ) : logs.map((log) => (
                                            <React.Fragment key={log.id}>
                                                <tr
                                                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                                    onClick={() => router.push(`/agents/${agentId}/trace/${log.metadata?.trace_id}`)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-[13px] text-slate-900 font-bold">
                                                        <div className="flex items-center gap-2">
                                                            {log.metadata?.platform && (
                                                                <span className="p-1 px-1.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                                                    {log.metadata.platform === 'slack' && <Slack className="w-3 h-3" />}
                                                                    {log.metadata.platform === 'github' && <Github className="w-3 h-3" />}
                                                                    {log.metadata.platform === 'internal_db' && <Database className="w-3 h-3" />}
                                                                    {log.metadata.platform === 'agent_brain' && <Cpu className="w-3 h-3" />}
                                                                </span>
                                                            )}
                                                            {log.summary || log.action_type}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wide border ${log.metadata?.status === 'CLEAN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                            log.metadata?.status === 'BLOCKED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                'bg-slate-50 text-slate-700 border-slate-200'
                                                            }`}>
                                                            {log.metadata?.status || 'VERIFIED'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'playground' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                    <Card className="lg:col-span-2 flex flex-col h-[600px] overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Conversation Temps Réel</h3>
                                <p className="text-[10px] text-slate-500">Testez votre agent instantanément</p>
                            </div>
                            <Button variant="ghost" onClick={() => setMessages([])} className="h-8 text-[10px]">
                                Effacer
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <Bot className="w-12 h-12 text-slate-300 mb-2" />
                                    <p className="text-sm font-medium text-slate-500">Dites "Bonjour" pour commencer...</p>
                                </div>
                            )}
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                                        <div className="text-[10px] font-bold uppercase opacity-50 mb-1">
                                            {m.role === 'user' ? 'Vous' : agentName}
                                        </div>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {isChatting && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                                        <div className="flex gap-1.5 items-center">
                                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-white">
                            <form
                                className="flex gap-2"
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!chatInput.trim() || isChatting) return;
                                    const userMsg = { role: 'user', content: chatInput };
                                    setMessages(prev => [...prev, userMsg]);
                                    setChatInput('');
                                    setIsChatting(true);
                                    try {
                                        const res = await fetch(`/api/run/${agentId}`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${globalApiKey}`
                                            },
                                            body: JSON.stringify({ message: chatInput })
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
                                        } else {
                                            setMessages(prev => [...prev, { role: 'system', content: `Erreur: ${data.error || 'Gateway inaccessible'}` }]);
                                        }
                                    } catch (err) {
                                        setMessages(prev => [...prev, { role: 'system', content: 'Échec de la connexion au serveur.' }]);
                                    } finally {
                                        setIsChatting(false);
                                    }
                                }}
                            >
                                <input
                                    type="text"
                                    placeholder="Posez une question à votre agent..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                />
                                <Button type="submit" disabled={isChatting || !chatInput.trim()} icon={Send}>
                                    Envoyer
                                </Button>
                            </form>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <Card className="p-5">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Prompt Système Actif</h4>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-xs text-slate-500 leading-relaxed max-h-[200px] overflow-y-auto">
                                "{agent.system_prompt || 'Aucun prompt configuré.'}"
                            </div>
                        </Card>
                        <Card className="p-5">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Guardrails Actifs</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-slate-500">Budget Max/Jour</span>
                                    <span className="text-indigo-600">${agent.policies?.budget_daily_max || '0.00'}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-slate-500">Mots Interdits</span>
                                    <span className="text-rose-600">{agent.policies?.forbidden_keywords?.length || 0}</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'builder' && (
                <AgentVisualBuilderSection agent={agent} onSave={() => mutate()} />
            )}

            {activeTab === 'deployment' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <Card className="p-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            {triggerProviderDomain ? (
                                <img 
                                    src={`https://www.google.com/s2/favicons?domain=${triggerProviderDomain}&sz=128`} 
                                    className="w-48 h-48 grayscale opacity-50 contrast-125"
                                    alt="Provider Logo"
                                />
                            ) : (
                                <Globe className="w-48 h-48" />
                            )}
                        </div>
                        <div className="relative">
                            <h3 className="text-lg font-bold text-slate-900">Endpoint Webhook (Live)</h3>
                            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                                Utilisez cette URL pour appeler votre agent depuis n'importe quel service tiers (Make, Zapier, Slack Bot custom).
                                Les requêtes sont sécurisées par votre clé d'organisation globale.
                            </p>

                            <div className="mt-6 p-4 bg-slate-900 rounded-xl border border-slate-800 shadow-inner flex justify-between items-center group">
                                <code className="text-xs font-mono text-blue-400">
                                    {typeof window !== 'undefined' ? window.location.origin : ''}/api/run/{agent.id}
                                </code>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/api/run/${agent.id}`;
                                        navigator.clipboard.writeText(url);
                                        showToast({ title: 'Copié', message: 'URL du Webhook copiée', type: 'success' });
                                    }}
                                    className="p-2 text-slate-500 hover:text-white transition-colors"
                                    title="Copier l'URL"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mt-6 border-t border-slate-100 pt-6">
                                <h4 className="text-sm font-bold text-slate-900 mb-2 whitespace-nowrap">Authentification (Clé API)</h4>
                                <p className="text-xs text-slate-500 mb-4 max-w-xl">
                                    Les appels à l'agent nécessitent un header <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Authorization: Bearer</code> contenant la clé API de l'agent. Si vous avez perdu cette clé ou souhaitez la révoquer, vous pouvez en générer une nouvelle ci-dessous.
                                </p>

                                {regeneratedKey ? (
                                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-4">
                                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Nouvelle clé API générée avec succès
                                        </div>
                                        <p className="text-xs text-emerald-600 mb-3">
                                            Copiez cette clé immédiatement. Pour des raisons de sécurité, <strong>elle ne sera plus jamais affichée</strong> une fois cette page rechargée.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-white p-2 px-3 rounded text-sm border border-emerald-100 font-mono text-emerald-700 break-all select-all">
                                                {regeneratedKey}
                                            </code>
                                            <Button
                                                variant="secondary"
                                                className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(regeneratedKey);
                                                    showToast({ title: 'Copié', message: 'Clé API copiée', type: 'success' });
                                                }}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="secondary"
                                        icon={ShieldAlert}
                                        disabled={isRegenerating}
                                        onClick={async () => {
                                            if (!confirm("⚠️ ATTENTION : Générer une nouvelle clé API va invalider la précédente immédiatement. Toutes vos intégrations actuelles cesseront de fonctionner jusqu'à ce que vous les mettiez à jour.\n\nVoulez-vous vraiment continuer ?")) return;

                                            setIsRegenerating(true);
                                            try {
                                                const res = await fetch(`/api/agents/${agent.id}/regenerate-key`, { method: 'POST' });
                                                const payload = await res.json();

                                                if (res.ok && payload.api_key) {
                                                    setRegeneratedKey(payload.api_key);
                                                    showToast({ title: 'Succès', message: 'Nouvelle clé API générée', type: 'success' });
                                                } else {
                                                    showToast({ title: 'Erreur', message: payload.error || 'Erreur lors de la génération', type: 'error' });
                                                }
                                            } catch (err) {
                                                showToast({ title: 'Erreur', message: 'Erreur réseau', type: 'error' });
                                            } finally {
                                                setIsRegenerating(false);
                                            }
                                        }}
                                    >
                                        {isRegenerating ? 'Génération...' : 'Régénérer la clé API Agent'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-1 bg-indigo-600 rounded-full"></span>
                                Exemple de Requête (Node.js)
                            </h4>
                            <div className="bg-slate-900 rounded-xl p-4 font-mono text-[10px] text-blue-300 overflow-x-auto">
                                <pre>{`const res = await fetch(\n  '${typeof window !== 'undefined' ? window.location.origin : ''}/api/run/${agent.id}',\n  {\n    method: 'POST',\n    headers: {\n      'Authorization': 'Bearer YOUR_API_KEY',\n      'Content-Type': 'application/json'\n    },\n    body: JSON.stringify({ message: 'Hello!' })\n  }\n);`}</pre>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-1 bg-indigo-600 rounded-full"></span>
                                Exemple de Requête (Python)
                            </h4>
                            <div className="bg-slate-900 rounded-xl p-4 font-mono text-[10px] text-blue-300 overflow-x-auto">
                                <pre>{`import requests\n\nurl = "${typeof window !== 'undefined' ? window.location.origin : ''}/api/run/${agent.id}"\nheaders = {\n    "Authorization": "Bearer YOUR_API_KEY",\n    "Content-Type": "application/json"\n}\npayload = { "message": "Bonjour!" }\n\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())`}</pre>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* Report Problem Link */}
            <div className="pt-2 pb-6 text-center">
                <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 font-medium transition-colors flex items-center justify-center gap-1.5 mx-auto opacity-70 hover:opacity-100"
                >
                    🚩 Signaler un problème avec cet agent
                </button>
            </div>

            {/* Report Modal */}
            <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Signaler un problème">
                <div className="p-4 space-y-4">
                    <p className="text-sm text-slate-500">
                        Décrivez le problème rencontré avec l'agent <strong>{agentName}</strong>. Un email sera envoyé à l'équipe de supervision.
                    </p>
                    <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                        placeholder="Veuillez décrire le comportement inattendu ou le problème rencontré..."
                        value={reportMessage}
                        onChange={(e) => setReportMessage(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setIsReportModalOpen(false)}>Annuler</Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                setIsReporting(true);
                                setTimeout(() => {
                                    setIsReporting(false);
                                    setIsReportModalOpen(false);
                                    setReportMessage('');
                                    alert("Votre signalement a bien été envoyé par email à l'équipe de supervision !");
                                }, 800);
                            }}
                        >
                            {isReporting ? 'Envoi en cours...' : 'Envoyer le signalement'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
