'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Link as LinkIcon,
    ChevronDown,
    ChevronRight,
    Search,
    Filter,
    Fingerprint,
    Server,
    Settings,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui';

const extendedMockLedger = [
    {
        id: 1, timestamp: '2026-02-21 15:42:10', mission: 'Resolve PR #142 (auth_hotfix)', status: 'Completed', statusBadge: 'text-emerald-700 bg-emerald-50 border-emerald-200', steps: '6 steps', validator: 'Approved by Tychique', validatorStatus: 'approved', hash: '0x8f4d...3a1c',
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
        id: 2, timestamp: '2026-02-21 15:39:15', mission: 'Audit & Monitor High CPU Alert', status: 'Pending', statusBadge: 'text-amber-700 bg-amber-50 border-amber-200', steps: '3 steps', validator: 'Pending Approval', validatorStatus: 'pending', hash: '0x3c2a...0b41', trace: [
            { step: 'DATADOG_QUERY', time: '15:38:00', msg: 'Checked CPU utilization on prod-cluster-A', tokens: '↑ 100 | ↓ 450', isAction: true, color: 'text-orange-600 bg-orange-50 border-orange-200' },
            { step: 'THINKING', time: '15:38:15', msg: 'Evaluating runaway processes in Redis cache', tokens: '↑ 1.8k | ↓ 450' },
            { step: 'CODE_PUSH', time: '15:39:15', msg: 'Proposing configuration change to reduce CPU load', tokens: '↑ 3.2k | ↓ 800', isAction: true, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' }
        ]
    },
    {
        id: 3, timestamp: '2026-02-21 14:10:45', mission: 'Weekly Dependencies Update', status: 'Completed', statusBadge: 'text-emerald-700 bg-emerald-50 border-emerald-200', steps: '2 steps', validator: 'Auto-Approved (Rule: Dependencies)', validatorStatus: 'auto', hash: '0x1a9e...77df', trace: [
            { step: 'GITHUB_READ', time: '14:05:00', msg: 'Checked package.json for outdated dependencies', tokens: '↑ 150 | ↓ 800', isAction: true, color: 'text-slate-600 bg-slate-100 border-slate-200' },
            { step: 'GITHUB_COMMIT', time: '14:10:45', msg: 'Updated lodash and Next.js versions', tokens: '↑ 1.5k | ↓ 400', isAction: true, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' }
        ]
    },
    {
        id: 4, timestamp: '2026-02-21 12:05:22', mission: 'Daily Security Scan Report', status: 'Completed', statusBadge: 'text-emerald-700 bg-emerald-50 border-emerald-200', steps: '2 steps', validator: 'Auto-Approved (Rule: Notification)', validatorStatus: 'auto', hash: '0x88bb...1c2d', trace: [
            { step: 'DATADOG_QUERY', time: '12:00:00', msg: 'Gathered security events from last 24h', tokens: '↑ 200 | ↓ 1.2k', isAction: true, color: 'text-orange-600 bg-orange-50 border-orange-200' },
            { step: 'SLACK_MESSAGE', time: '12:05:22', msg: 'Dispatched security summary to #general', tokens: '↑ 500 | ↓ 50', isAction: true, color: 'text-purple-600 bg-purple-50 border-purple-200' }
        ]
    }
];

export default function AgentLogsDeepDive({ params }) {
    const router = useRouter();
    const [expandedRow, setExpandedRow] = useState(null);

    const toggleRow = (id) => setExpandedRow(expandedRow === id ? null : id);

    const renderValidatorBadge = (status, text) => {
        if (status === 'approved') return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" />{text}</span>;
        if (status === 'pending') return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><Clock className="w-3 h-3" />{text}</span>;
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200"><Settings className="w-3 h-3" />{text}</span>;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 p-6 max-w-7xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => router.push(`/agents/${params.agentId}`)}
                className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Agent Dashboard
            </button>

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-5 border-b border-slate-200">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <LinkIcon className="w-8 h-8 text-slate-700" />
                        Comprehensive Audit Trail
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Immutable ledger of all agent activities, tool calls, and human approvals.
                    </p>
                </div>

                {/* Search & Filter Mock */}
                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search hash, context..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <button className="px-3 py-2 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                </div>
            </header>

            {/* Content */}
            <Card className="overflow-hidden mt-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-400 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
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
                            {extendedMockLedger.map((log) => (
                                <React.Fragment key={log.id}>
                                    <tr
                                        className={`hover:bg-slate-50 transition-colors ${log.trace ? 'cursor-pointer' : ''} ${expandedRow === log.id ? 'bg-slate-50/50' : ''}`}
                                        onClick={() => log.trace && toggleRow(log.id)}
                                    >
                                        <td className="px-6 py-4">
                                            {log.trace ? (
                                                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                                    {expandedRow === log.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                </button>
                                            ) : (
                                                <span className="w-4 h-4 block"></span>
                                            )}
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
    );
}
