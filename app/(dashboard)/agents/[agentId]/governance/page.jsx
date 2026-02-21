'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    ShieldCheck,
    AlertTriangle,
    ShieldBan,
    Users,
    Key,
    Lock,
    FileText
} from 'lucide-react';
import { Card, Button, StatusBadge } from '@/components/ui';

const mockComplianceRules = [
    { id: 1, name: 'Require Human Approval for Production Deploys', status: 'Enforced', incidents: 0 },
    { id: 2, name: 'Read-Only Access to Financial Data', status: 'Enforced', incidents: 2 },
    { id: 3, name: 'Maximum Token Limit per Request (8k)', status: 'Enforced', incidents: 14 },
    { id: 4, name: 'Block PII Data Exfiltration', status: 'Enforced', incidents: 0 },
];

export default function AgentGovernanceDeepDive({ params }) {
    const router = useRouter();

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
                        <AlertTriangle className="w-8 h-8 text-amber-500" />
                        Governance & Risk Report
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Detailed compliance metrics, access controls, and boundary enforcement logs for this agent.
                    </p>
                </div>
                <Button variant="secondary" icon={FileText}>
                    Export SOC2 Compliance Report
                </Button>
            </header>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

                {/* Left Column: Security Posture */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-5">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-slate-500" />
                            Security Posture
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-sm text-slate-600">Data Encryption</span>
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">AES-256 (At Rest)</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-sm text-slate-600">Network Isolation</span>
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">VPC Peering Active</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-sm text-slate-600">IAM Role</span>
                                <span className="text-xs font-mono text-slate-500">arn:aws:iam::agent-runner</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Key className="w-4 h-4 text-slate-500" />
                            Active Vault Credentials
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-100">
                                <div className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm">
                                    <svg className="w-4 h-4 text-slate-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                </div>
                                <div className="text-sm font-medium text-slate-700">GitHub App Token</div>
                            </div>
                            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-100">
                                <div className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm">
                                    <svg className="w-4 h-4 text-slate-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12.001 0C5.375 0 0 5.373 0 12c0 6.629 5.375 12 12.001 12 6.628 0 12-5.371 12-12 0-6.627-5.372-12-12-12zm-3.09 17.5v-3.5H5.42v3.5H3.09v-11h2.33v3.5h3.491v-3.5h2.33v11H8.911zm11.999 0h-2.33v-3.5h-3.49v3.5h-2.331v-11h2.331v3.5h3.49v-3.5h2.33v11z" /></svg>
                                </div>
                                <div className="text-sm font-medium text-slate-700">Jira API Key</div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Rules & Violations */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <ShieldBan className="w-4 h-4 text-rose-500" />
                                Boundary Rules Enforcement
                            </h3>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3">Rule Definition</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Violations (30d)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                                    {mockComplianceRules.map((rule) => (
                                        <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">{rule.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    {rule.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-mono text-sm ${rule.incidents > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                                                    {rule.incidents}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Card className="p-5">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-500" />
                            Recent Human Overrides
                        </h3>
                        <div className="text-center py-8 text-slate-500 text-sm">
                            <p>No recent human overrides recorded in the last 7 days.</p>
                            <p className="mt-1 text-xs text-slate-400">The agent is operating within acceptable confidence thresholds.</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
