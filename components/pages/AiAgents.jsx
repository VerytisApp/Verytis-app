'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Search, Filter, Plus, ChevronRight, X, MoreVertical, Trash2, Users, Activity, Settings, Bot, ShieldAlert, Copy, Cpu, RefreshCw, Layers, CheckCircle2, Clock, Check, FileCode2 } from 'lucide-react';
import { Card, Button, StatusBadge, PlatformIcon, Modal, EmptyState, SkeletonAgentCard } from '../ui';
import ArchiveConfirmModal from '../ui/ArchiveConfirmModal';
import { useToast } from '../ui/Toast';

const fetcher = (url) => fetch(url).then(r => r.json());

const SDKSnippet = ({ agentId }) => {
    const [activeLanguage, setActiveLanguage] = useState('python');
    const [isCopiedCode, setIsCopiedCode] = useState(false);

    const snippets = {
        python: `import os
import requests

# Call the AI Gateway
def log_ai_action():
    response = requests.post(
        'https://gateway.verytis.com/v1/chat',
        headers={
            'Authorization': f"Bearer {os.getenv('VERYTIS_API_KEY')}",
            'x-verytis-agent-id': '${agentId}',
            'x-verytis-provider': 'openai',
            'Content-Type': 'application/json'
        },
        json={
            "messages": [
                { "role": "user", "content": "Analyze the database schema for vulnerabilities." }
            ]
        }
    )
    
    result = response.json()
    print('Response from Gateway:', result)`,

        node: `// 1. Install node-fetch or use native fetch
const fetch = require('node-fetch');

// 2. Call the AI Gateway
async function logAiAction() {
  const response = await fetch('https://gateway.verytis.com/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.VERYTIS_API_KEY}\`,
      'x-verytis-agent-id': '${agentId}',
      'x-verytis-provider': 'openai',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [
        { role: "user", content: "Analyze the database schema for vulnerabilities." }
      ]
    })
  });
  
  const result = await response.json();
  console.log('Response from Gateway:', result);
}`
    };

    const currentCode = snippets[activeLanguage];

    const handleCopy = () => {
        navigator.clipboard.writeText(currentCode);
        setIsCopiedCode(true);
        setTimeout(() => setIsCopiedCode(false), 2000);
    };

    return (
        <Card className="overflow-hidden border-slate-200 shadow-sm mt-4">
            <div className="bg-slate-900 px-4 pt-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 pb-2 sm:pb-0">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs ring-1 ring-blue-500/50">
                        <FileCode2 className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Code de Raccordement</h3>
                </div>

                <div className="flex items-center gap-2 pb-2 sm:pb-0">
                    <div className="flex items-center bg-slate-800 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setActiveLanguage('python')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${activeLanguage === 'python' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Python
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveLanguage('node')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${activeLanguage === 'node' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Node.js
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors ml-2"
                    >
                        {isCopiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{isCopiedCode ? 'Copié' : 'Copier'}</span>
                    </button>
                </div>
            </div >

            <div className="bg-[#0D1117] p-4 overflow-x-auto custom-scrollbar max-h-[300px] overflow-y-auto">
                <pre className="text-xs font-mono leading-relaxed text-slate-300 whitespace-pre-wrap">
                    <code>{currentCode}</code>
                </pre>
            </div>
        </Card >
    );
};

export default function AiAgents({ userRole }) {
    const { showToast } = useToast();
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Store new agent to display API key once
    const [newAgentResult, setNewAgentResult] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

    const { data, error, isLoading, mutate } = useSWR('/api/agents', fetcher);
    const agents = data?.agents || [];

    const handleDeleteAgent = async (agentId) => {
        console.log('🗑️ Deleting agent:', agentId);
        try {
            const res = await fetch(`/api/agents/${agentId}`, { method: 'DELETE' });
            if (res.ok) {
                console.log('✅ Agent deleted successfully');
                showToast({
                    title: 'Agent Deleted',
                    message: 'The agent has been permanently archived.',
                    type: 'success'
                });
                // Force a full revalidation from server
                await mutate();
            } else {
                const err = await res.json();
                console.error('❌ Delete failed:', err);
                showToast({
                    title: 'Deletion Failed',
                    message: err.error || err.message || 'Could not delete agent.',
                    type: 'error'
                });
            }
        } catch (err) {
            console.error('💥 Delete error:', err);
            alert('An error occurred during deletion');
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/agents/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            if (res.ok) {
                setNewAgentResult(result);
                mutate(); // refresh agents list
            } else {
                alert(result.error || 'Failed to register agent');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeRegisterModal = () => {
        setIsRegisterModalOpen(false);
        setFormData({ name: '', description: '' });
        setNewAgentResult(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 p-6">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Bot className="w-6 h-6 text-blue-600" />
                        AI Agents Telemetry
                    </h1>
                    <p className="text-slate-500 mt-1 text-xs font-medium">Register autonomous agents and monitor their API costs and token consumption.</p>
                </div>
                <div className="relative group">
                    <Button
                        variant="primary"
                        icon={Plus}
                        onClick={() => setIsRegisterModalOpen(true)}
                        disabled={userRole === 'Member'}
                    >
                        Register New Agent
                    </Button>
                    {userRole === 'Member' && (
                        <div className="absolute -top-8 right-0 hidden group-hover:block bg-slate-900 text-white text-[9px] p-2 rounded shadow-xl z-50 whitespace-nowrap font-bold">
                            Admin Role Required
                        </div>
                    )}
                </div>
            </header>

            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => <SkeletonAgentCard key={i} />)}
                </div>
            ) : error ? (
                <Card className="p-12 text-center text-rose-500 flex flex-col items-center">
                    <ShieldAlert className="w-8 h-8 mb-2" />
                    Failed to load AI Agents
                </Card>
            ) : agents.length === 0 ? (
                <EmptyState
                    title="No Agents Registered"
                    description="You have not registered any AI Agents yet. Start monitoring your autonomous agents by creating your first identity."
                    icon={Bot}
                    actionText="Register New Agent"
                    onAction={() => setIsRegisterModalOpen(true)}
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {agents.map(agent => (
                        <Card key={agent.id} className="overflow-hidden flex flex-col h-[400px]">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors">
                                        <Link href={`/agents/${agent.id}`}>{agent.name}</Link>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">{agent.description || 'No description provided'}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2">
                                        {userRole === 'Admin' || userRole === 'Manager' ? (
                                            <button
                                                onClick={() => setDeleteTarget({ id: agent.id, name: agent.name })}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Agent"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <div className="p-1.5 text-slate-300 cursor-not-allowed" title="Admin/Manager required to delete">
                                                <Trash2 className="w-4 h-4" />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            {agent.telemetry?.length > 0 ? (
                                                <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    <span className="text-[10px] font-semibold text-slate-600">Connected</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                    <span className="text-[10px] font-semibold text-slate-600">Not connected</span>
                                                </div>
                                            )}
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${agent.status?.toLowerCase() === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                {agent.status?.toLowerCase() === 'active' ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AGENT STATS BAR */}
                            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-600">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <Cpu className="w-3 h-3 text-indigo-500" />
                                        <span>Model: <span className="text-slate-900">{agent.model || 'Unknown'}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Activity className="w-3 h-3 text-emerald-500" />
                                        <span>Avg Cost: <span className="text-slate-900">${agent.avg_cost || '0.00'}</span></span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>Last Active: <span className="text-slate-900">{agent.last_activity ? new Date(agent.last_activity).toLocaleTimeString() : 'N/A'}</span></span>
                                </div>
                            </div>

                            {/* NEW KPI GRID */}
                            <div className="flex-1 p-5 lg:p-6 bg-white flex flex-col justify-center gap-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Spend</span>
                                        <span className="text-xl font-bold text-slate-900">${agent.avg_cost || "45.20"}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Requests</span>
                                        <span className="text-xl font-bold text-slate-900">1,240</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Success Rate</span>
                                        <span className="text-xl font-bold text-slate-900">98.5%</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 mt-2 h-[44px] justify-end">
                                    {agent.budget_limit ? (
                                        <>
                                            <div className="flex justify-between items-end text-[10px] font-bold">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-500 uppercase tracking-wider">Budget Consumed</span>
                                                    <span className="text-slate-400 font-medium">${agent.current_spend} / ${agent.budget_limit} limit</span>
                                                </div>
                                                <span className="text-slate-900">{Math.round((agent.current_spend / agent.budget_limit) * 100)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (agent.current_spend / agent.budget_limit) * 100)}%` }}></div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-between bg-slate-50 border border-dashed border-slate-200 rounded-md p-2">
                                            <span className="text-[10px] font-medium text-slate-500 italic">No budget limit set</span>
                                            <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-100 px-2 py-1 rounded transition-colors shadow-sm">
                                                + Set limit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center mt-auto">
                                <Link href={`/agents/${agent.id}`} className="w-full">
                                    <Button variant="secondary" className="w-full text-sm font-medium">Gérer & Voir les Logs</Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Registration Modal */}
            <Modal
                isOpen={isRegisterModalOpen}
                onClose={closeRegisterModal}
                title="Register AI Agent"
                maxWidth="max-w-2xl"
            >
                {newAgentResult ? (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex gap-3 items-start">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-sm">Agent Registered Successfully</h4>
                                <p className="text-sm mt-2 leading-relaxed text-emerald-900 bg-emerald-100/50 p-2.5 rounded border border-emerald-200/50">
                                    ⚠️ <strong>IMPORTANT:</strong> Please copy your Agent ID immediately. For security reasons, <strong>it will not be shown again anywhere in the dashboard</strong>.
                                </p>

                                <div className="mt-3 flex items-center gap-2">
                                    <code className="flex-1 bg-white border border-emerald-300 rounded px-2 py-1 text-sm font-mono text-emerald-900 break-all">
                                        {newAgentResult.agentId}
                                    </code>
                                    <Button variant="secondary" icon={Copy} className="!py-1.5" onClick={() => navigator.clipboard.writeText(newAgentResult.agentId)}>Copy</Button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-slate-100 pt-4">
                            <h4 className="font-bold text-sm text-slate-900 mb-1">How to route through the Gateway</h4>
                            <p className="text-xs text-slate-500 mb-2">Use the snippet below to start routing your agent's requests through the Universal Zero-Trust Gateway.</p>
                            <SDKSnippet agentId={newAgentResult.agentId} />
                            <p className="text-[10px] text-slate-500 mt-2 italic">Note: Votre VERYTIS_API_KEY globale est disponible dans la section Settings &gt; Security.</p>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button variant="primary" onClick={closeRegisterModal}>I have saved the ID</Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-md mb-4 text-xs text-blue-800 flex items-start gap-2">
                            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <p>Registering an agent creates a secure identity for telemetry logging through the Universal Zero-Trust Gateway. The Agent ID generated should be kept secret and injected into the agent's environment variables. <strong className="block mt-1">⚠️ It will only be displayed once upon creation.</strong></p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Agent Name <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Code Review Agent"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                            <input
                                type="text"
                                placeholder="e.g. Scans PRs and detects vulnerabilities"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>

                        <div className="flex justify-end pt-4 gap-2">
                            <Button variant="ghost" type="button" onClick={closeRegisterModal} disabled={isSubmitting}>Cancel</Button>
                            <Button variant="primary" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Generating Identity...' : 'Generate Agent ID'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            <ArchiveConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => handleDeleteAgent(deleteTarget?.id)}
                title="Delete Agent"
                subtitle={deleteTarget?.name ? `"${deleteTarget.name}" will be permanently removed` : ''}
                details={[
                    'Retain aggregated cost and token usage history for billing',
                    'Remove the agent\'s API access keys immediately',
                    'Permanently remove the agent from active service',
                ]}
                confirmLabel="Delete Agent"
                variant="danger"
            />
        </div>
    );
}
