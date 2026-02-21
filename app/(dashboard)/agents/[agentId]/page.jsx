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
    Fingerprint
} from 'lucide-react';
import { Card, Button, StatusBadge } from '@/components/ui';

const mockAuditLedger = [
    {
        id: 1,
        timestamp: '2026-02-21 15:42:10',
        mission: 'Resolve PR #142 (auth_hotfix)',
        status: 'Completed',
        statusBadge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        steps: '6 steps',
        validator: 'Approved by Tychique',
        validatorStatus: 'approved',
        hash: '0x8f4d...3a1c',
        trace: [
            { step: 'THINKING', time: '15:40:02', msg: 'Analyzing Jira Issue SEC-42 requirements...', tokens: '↑ 1.2k | ↓ 200' },
            { step: 'JIRA_READ', time: '15:40:04', msg: 'Fetched issue details from Jira', tokens: '↑ 150 | ↓ 900', isAction: true, color: 'text-blue-600 bg-blue-50 border-blue-200' },
            { step: 'TOOL_CALL', time: '15:40:05', msg: 'Fetching repository verytis/core-engine', tokens: '↑ 200 | ↓ 1500' },
            { step: 'ERROR', time: '15:40:10', msg: 'GitHub API Rate Limit Exceeded (429)', tokens: '↑ 100 | ↓ 50', isError: true },
            { step: 'GITHUB_COMMIT', time: '15:42:05', msg: 'Successfully committed fix to auth_controller.js', tokens: '↑ 2.4k | ↓ 500', isAction: true, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
            { step: 'SLACK_MESSAGE', time: '15:42:10', msg: 'Notified #dev-team-alerts', tokens: '↑ 200 | ↓ 50', isAction: true, color: 'text-purple-600 bg-purple-50 border-purple-200' }
        ]
    },
    {
        id: 2,
        timestamp: '2026-02-21 15:39:15',
        mission: 'Audit & Monitor High CPU Alert',
        status: 'Pending',
        statusBadge: 'text-amber-700 bg-amber-50 border-amber-200',
        steps: '3 steps',
        validator: 'Pending Approval',
        validatorStatus: 'pending',
        hash: '0x3c2a...0b41',
        trace: [
            { step: 'DATADOG_QUERY', time: '15:38:00', msg: 'Checked CPU utilization on prod-cluster-A', tokens: '↑ 100 | ↓ 450', isAction: true, color: 'text-orange-600 bg-orange-50 border-orange-200' },
            { step: 'THINKING', time: '15:38:15', msg: 'Evaluating runaway processes in Redis cache', tokens: '↑ 1.8k | ↓ 450' },
            { step: 'CODE_PUSH', time: '15:39:15', msg: 'Proposing configuration change to reduce CPU load', tokens: '↑ 3.2k | ↓ 800', isAction: true, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' }
        ]
    }
];

const mockModels = [
    { id: 1, name: 'claude-3-haiku', missions: '980', cost: '$0.01', success: '95%', best: true },
    { id: 2, name: 'gpt-4o', missions: '210', cost: '$0.08', success: '96%', best: false },
    { id: 3, name: 'llama-3-70b', missions: '50', cost: '$0.03', success: '82%', best: false },
];

export default function AgentGovernancePage({ params }) {
    const router = useRouter();
    const [expandedRow, setExpandedRow] = useState(null);
    const agentName = "Auto-PR-Reviewer";

    const toggleRow = (id) => {
        if (expandedRow === id) {
            setExpandedRow(null);
        } else {
            setExpandedRow(id);
        }
    };

    const renderValidatorBadge = (status, text) => {
        if (status === 'approved') return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" />{text}</span>;
        if (status === 'pending') return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><Clock className="w-3 h-3" />{text}</span>;
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200"><Settings className="w-3 h-3" />{text}</span>;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 p-6 max-w-7xl mx-auto">
            {/* Header Mirroring Stack Detail Page */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    <Link href="/agents" className="cursor-pointer hover:text-slate-900 transition-colors">Agents</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-900">{agentName}</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-indigo-600" />
                            {agentName}
                        </h1>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="secondary" icon={FileText}>
                            Export Legal Audit Trail
                        </Button>
                        <Button variant="danger" icon={ShieldAlert}>
                            Suspend Agent (Kill Switch)
                        </Button>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                    <span className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100/80 border border-slate-200 px-2.5 py-1 rounded">
                        <Fingerprint className="w-3.5 h-3.5" />
                        Identity: Verified AI
                    </span>
                    <span className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100/80 border border-slate-200 px-2.5 py-1 rounded">
                        <Server className="w-3.5 h-3.5" />
                        Storage: WORM Secured
                    </span>
                    <StatusBadge status="active" />
                </div>
            </div>

            {/* Section KPI - Gouvernance & Risque */}
            <div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-slate-700" />
                        Governance & Risk Controls
                    </h2>
                    <Link href={`/agents/${params.agentId}/governance`} className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors group">
                        View full report <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-5 flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-3">
                            <Users className="w-4 h-4 text-amber-500" />
                            Human Override Rate
                        </div>
                        <div>
                            <div className="flex items-end gap-2 text-2xl font-bold text-slate-900">
                                14.2%
                                <span className="text-emerald-500 text-sm font-bold block mb-1">↓</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wide">Actions corrigées ou rejetées</p>
                        </div>
                    </Card>

                    <Card className="p-5 flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-3">
                            <Ban className="w-4 h-4 text-rose-500" />
                            Compliance Incidents
                        </div>
                        <div>
                            <div className="flex items-end gap-2 text-2xl font-bold text-slate-900">
                                0
                                <span className="text-sm font-bold text-emerald-500 mb-1 block">+0%</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wide">Tentatives de bypass refusées</p>
                        </div>
                    </Card>

                    <Card className="p-5 flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-3">
                            <Globe className="w-4 h-4 text-indigo-500" />
                            Blast Radius
                        </div>
                        <div>
                            <div className="text-lg font-bold text-slate-900 leading-tight">GitHub, Slack, Jira</div>
                            <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-wide">Applications impactées (7j)</p>
                        </div>
                    </Card>

                    <Card className="p-5 flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-3">
                            <Settings className="w-4 h-4 text-blue-500" />
                            Autonomy Index
                        </div>
                        <div>
                            <div className="flex items-end gap-2 text-2xl font-bold text-slate-900">
                                85%
                                <span className="text-emerald-500 text-sm font-bold block mb-1">↑</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wide">Tasks approved without supervision</p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Efficiency Benchmarking & ROI */}
            <div className="pt-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-slate-700" />
                        Efficiency Benchmarking & ROI
                    </h2>
                    <Link href={`/agents/${params.agentId}/efficiency`} className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors group">
                        View all metrics <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Performance Cards Container */}
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="p-5">
                            <div className="text-sm font-semibold text-slate-600 mb-3">First-Shot Success</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-slate-900">82%</span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wide">+15%</span>
                            </div>
                            <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5">
                                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '82%' }}></div>
                            </div>
                        </Card>

                        <Card className="p-5">
                            <div className="text-sm font-semibold text-slate-600 mb-3">Cost per Mission</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-slate-900">$0.45</span>
                                <span className="text-sm font-semibold text-slate-400">/ task</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-wide">Basé sur 1,240 runs</p>
                        </Card>

                        <Card className="p-5">
                            <div className="text-sm font-semibold text-slate-600 mb-3">Execution Velocity</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-slate-900">4.2s</span>
                                <span className="text-sm font-semibold text-slate-400">/ task</span>
                            </div>
                            <p className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold mt-2 px-1.5 py-0.5 rounded uppercase tracking-wide inline-block">2x plus rapide</p>
                        </Card>
                    </div>

                    {/* Model Performance History Table */}
                    <Card className="lg:col-span-1 flex flex-col">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">Model Performance</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-white text-slate-400 border-b border-slate-100 uppercase tracking-wider text-[9px]">
                                    <tr>
                                        <th className="px-4 py-2 font-bold">Model</th>
                                        <th className="px-4 py-2 font-bold text-right">Runs</th>
                                        <th className="px-4 py-2 font-bold text-right">Cost</th>
                                        <th className="px-4 py-2 font-bold text-right">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {mockModels.map((m) => (
                                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-2.5 font-mono text-[10px] flex items-center gap-1.5">
                                                {m.best && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                                <span className={m.best ? 'font-bold text-slate-900' : 'text-slate-600'}>{m.name}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-medium">{m.missions}</td>
                                            <td className="px-4 py-2.5 text-right font-mono text-[10px] text-slate-600">{m.cost}</td>
                                            <td className="px-4 py-2.5 text-right">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${m.best ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>{m.success}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Immutable Activity Ledger */}
            <div className="pt-4 pb-12">
                <Card>
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <LinkIcon className="w-5 h-5 text-indigo-600" />
                                Cross-Platform Chain of Actions
                            </h3>
                            <p className="text-xs font-medium text-slate-500 mt-1">
                                Maker-Checker Immutable Audit Trail proving Human-AI compliance. <span className="font-semibold text-slate-600">Showing 5 most recent actions.</span>
                            </p>
                        </div>
                        <Link href={`/agents/${params.agentId}/logs`} className="shrink-0 flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors group">
                            View full audit trail <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-white text-slate-400 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3.5 w-8"></th>
                                    <th className="px-6 py-3.5">Timestamp</th>
                                    <th className="px-6 py-3.5">Mission / Objective</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5">Human Validator (Checker)</th>
                                    <th className="px-6 py-3.5">Audit Hash</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                                {mockAuditLedger.map((log) => (
                                    <React.Fragment key={log.id}>
                                        <tr
                                            className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedRow === log.id ? 'bg-slate-50/50' : ''}`}
                                            onClick={() => toggleRow(log.id)}
                                        >
                                            <td className="px-6 py-4">
                                                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                                    {expandedRow === log.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                                {log.timestamp}
                                            </td>
                                            <td className="px-6 py-4 text-[13px] text-slate-900 font-bold">
                                                {log.mission} <span className="text-[10px] text-slate-400 font-medium ml-2">{log.steps}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wide border ${log.statusBadge}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {renderValidatorBadge(log.validatorStatus, log.validator)}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono">
                                                <a href="#" className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer group" onClick={(e) => e.stopPropagation()}>
                                                    <Fingerprint className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                                                    {log.hash}
                                                </a>
                                            </td>
                                        </tr>

                                        {/* Expanded Row Content */}
                                        {expandedRow === log.id && log.trace && (
                                            <tr className="bg-slate-50/50">
                                                <td colSpan="6" className="px-0 py-0 overflow-hidden">
                                                    <div className="px-14 py-4 m-4 bg-white border border-slate-200 rounded-lg shadow-sm animate-in slide-in-from-top-2 duration-200">
                                                        <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                            <Server className="w-3.5 h-3.5 text-blue-500" />
                                                            Execution Trace Log
                                                        </h4>

                                                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                                                            {log.trace.map((step, idx) => (
                                                                <div key={idx} className="relative pl-6">
                                                                    <div className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full ${step.isError ? 'bg-rose-500 ring-4 ring-rose-50' : step.isAction ? 'bg-indigo-400 ring-4 ring-indigo-50' : 'bg-slate-300 ring-4 ring-slate-50'}`}></div>

                                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${step.isError ? 'bg-rose-100 text-rose-700' : step.isAction ? step.color : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                                                    {step.step}
                                                                                </span>
                                                                                <span className="text-[10px] font-mono text-slate-400">{step.time}</span>
                                                                            </div>
                                                                            <p className={`text-xs ${step.isError ? 'text-rose-600 font-medium' : step.isAction ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                                                                                {step.msg}
                                                                            </p>
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            <div className="bg-slate-50 border border-slate-100 px-2 py-1 rounded text-[10px] font-mono text-slate-500 whitespace-nowrap">
                                                                                {step.tokens}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
