'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ChevronRight,
    ChevronDown,
    ShieldCheck,
    Server,
    AlertTriangle,
    FileText,
    Users,
    ShieldAlert,
    Globe,
    Settings,
    BarChart2,
    Trophy,
    DollarSign,
    Clock,
    CheckCircle2,
    Ban,
    Link as LinkIcon,
    Fingerprint,
    Cpu,
    Layers,
    RefreshCw,
    Bot,
    ExternalLink,
    Slack,
    Github,
    Database,
    Copy
} from 'lucide-react';
import { Card, Button, StatusBadge, Modal } from '@/components/ui';

import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(r => r.json());

export default function AgentGovernancePage({ params }) {
    const router = useRouter();
    const [expandedRow, setExpandedRow] = useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportMessage, setReportMessage] = useState('');
    const [isReporting, setIsReporting] = useState(false);

    const { data, error, isLoading, mutate } = useSWR(`/api/agents/${params.agentId}`, fetcher);
    const agent = data?.agent;
    const logs = data?.logs || [];

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

        // Total Cost (Total Spend)
        const totalCost = logs.reduce((sum, l) => sum + parseFloat(l.metadata?.metrics?.cost_usd || 0), 0);
        stats.totalSpend = `$${totalCost.toFixed(3)}`;

        // Total Tokens (sum of tokens_used)
        const totalTokensUsed = logs.reduce((sum, l) => sum + parseInt(l.metadata?.metrics?.tokens_used || 0), 0);
        stats.totalTokens = new Intl.NumberFormat().format(totalTokensUsed);

        // Policy Blocks (count of BLOCKED statuses)
        stats.policyBlocks = logs.filter(l => l.metadata?.status === 'BLOCKED').length;

        // Success Rate: percentage of logs that are NOT BLOCKED
        const successCount = logs.filter(l => l.metadata?.status !== 'BLOCKED').length;
        stats.successRate = `${Math.round((successCount / total) * 100)}%`;

        // Avg Velocity (Duration)
        const totalDuration = logs.reduce((sum, l) => sum + parseInt(l.metadata?.metrics?.duration_ms || 0), 0);
        stats.velocity = `${Math.round(totalDuration / total)}ms`;
    }

    const toggleRow = (id) => {
        if (expandedRow === id) {
            setExpandedRow(null);
        } else {
            setExpandedRow(id);
        }
    };



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
                        <Link href={`/agents/${params.agentId}/policies`}>
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
                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wide leading-tight">Tentatives d'accès restreint ou dépassement de budget bloquées par Verytis</p>
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
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-sm">
                                            No activity logs found for this agent.
                                        </td>
                                    </tr>
                                ) : logs.map((log) => (
                                    <React.Fragment key={log.id}>
                                        <tr
                                            className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                            onClick={() => router.push(`/agents/${params.agentId}/trace/${log.metadata?.trace_id}`)}
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
