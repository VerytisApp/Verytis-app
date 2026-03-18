'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Search, Filter, Plus, ChevronRight, X, MoreVertical, Trash2, Users, Activity, Settings, Bot, ShieldAlert, Copy, Cpu, RefreshCw, Layers, CheckCircle2, Clock, Check, FileCode2, Sparkles, Loader2, ArrowRight } from 'lucide-react';
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
                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeLanguage === 'python' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Python
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveLanguage('node')}
                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeLanguage === 'node' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
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
    const router = useRouter();
    const { showToast } = useToast();
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Store new agent to display API key once
    const [newAgentResult, setNewAgentResult] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

    // Magic Builder State
    const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);
    const [magicPrompt, setMagicPrompt] = useState('');
    const [editingAgent, setEditingAgent] = useState(null); // { id, name }
    const [isGenerating, setIsGenerating] = useState(false);

    const { data, error, isLoading, mutate } = useSWR('/api/agents', fetcher);
    const allAgents = data?.agents || [];
    const deployedAgents = allAgents.filter(a => !a.is_draft);

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

    const handleMagicBuild = () => {
        // Redirection vers l'expérience unifiée avec contexte
        const baseUrl = '/builder?openMagic=true';
        const idParam = editingAgent ? `&id=${editingAgent.id}` : '';
        const promptParam = magicPrompt.trim() ? `&prompt=${encodeURIComponent(magicPrompt)}` : '';
        
        window.location.href = `${baseUrl}${idParam}${promptParam}`;
    };

    const getToolIcons = (visualConfig) => {
        if (!visualConfig || !visualConfig.nodes) return [];
        const toolNodes = visualConfig.nodes.filter(n => n.type === 'toolNode');
        const icons = toolNodes.map(node => {
            const label = (node.data?.label || '').toLowerCase();
            const desc = (node.data?.description || '').toLowerCase();
            const combined = (label + ' ' + desc);
            const toolMapping = {
                'slack': 'slack.com', 'github': 'github.com', 'trello': 'trello.com',
                'hubspot': 'hubspot.com', 'linkedin': 'linkedin.com', 'notion': 'notion.so',
                'lemlist': 'lemlist.com', 'airtable': 'airtable.com', 'salesforce': 'salesforce.com',
                'openai': 'openai.com', 'google': 'google.com', 'sheets': 'google.com',
                'postgres': 'postgresql.org', 'supabase': 'supabase.com', 'mongodb': 'mongodb.com'
            };
            for (const [key, domain] of Object.entries(toolMapping)) {
                if (combined.includes(key)) return domain;
            }
            return node.data?.logoDomain || null;
        }).filter(Boolean);
        return [...new Set(icons)];
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
            ) : deployedAgents.length === 0 ? (
                <EmptyState
                    title="No Agents Registered"
                    description="You have not registered any AI Agents yet. Start monitoring your autonomous agents by creating your first identity."
                    icon={Bot}
                    actionText="Register New Agent"
                    onAction={() => setIsRegisterModalOpen(true)}
                />
            ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {deployedAgents.map(agent => (
                        <div key={agent.id} className="relative group pt-4">
                            {/* Floating Header Pill - EXACT Register Page Look */}
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.15em] px-5 py-2 rounded-full shadow-lg whitespace-nowrap z-30 group-hover:bg-blue-600 transition-colors duration-300">
                                {agent.name}
                            </div>

                             {/* Main Card Container */}
                             <div 
                                 onClick={() => router.push(`/agents/${agent.id}`)}
                                 className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-4 pt-8 flex flex-col items-center relative z-20 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                             >
                                 
                                 {/* 1. VERYTIS SUPERVISOR BLOCK */}
                                 <div className="bg-gradient-to-b from-white to-blue-50/50 rounded-2xl border-2 border-blue-400/30 shadow-sm p-3 w-full flex flex-col items-center relative overflow-hidden mb-2">
                                     <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-400/10 blur-xl"></div>
                                     <div className="flex items-center gap-2 mb-3 z-10 w-full justify-center">
                                         <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                             {/* Logo or placeholder cube */}
                                             <div className="bg-slate-50 w-full h-full flex items-center justify-center">
                                                 <Bot className="w-4 h-4 text-blue-500" strokeWidth={2.5} />
                                             </div>
                                         </div>
                                         <div className="flex flex-col">
                                             <span className="font-black text-[10px] text-blue-800 tracking-wider leading-none uppercase">VERYTIS</span>
                                             <span className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase tracking-tighter">AI Supervisor</span>
                                         </div>
                                     </div>
                                     
                                     {/* Small Guardrail/Status Pills */}
                                     <div className="w-full flex gap-1.5 justify-center z-10">
                                         <div className="bg-white rounded-lg border border-blue-100 px-2 py-1 flex items-center justify-center gap-1 shadow-sm flex-1">
                                             <ShieldAlert size={10} className="text-blue-500" />
                                             <span className="text-[8px] font-black text-blue-700 uppercase tracking-tighter">SECURED</span>
                                         </div>
                                         <div className="bg-white rounded-lg border border-blue-100 px-2 py-1 flex items-center justify-center gap-1 shadow-sm flex-1">
                                             <Activity size={10} className="text-blue-500" />
                                             <span className="text-[8px] font-black text-blue-700 uppercase tracking-tighter">LIVE</span>
                                         </div>
                                     </div>
                                 </div>

                                 <ArrowRight size={16} className="text-slate-200 rotate-90 my-1 shrink-0" />

                                 {/* 2. DIGITAL BRAIN BLOCK */}
                                 <div className="flex items-center justify-center gap-3 bg-slate-900 text-white pl-3 pr-5 py-3 rounded-2xl shadow-lg w-full relative overflow-hidden mb-2 shrink-0">
                                     <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 blur-xl rounded-full"></div>
                                     <div className="w-8 h-8 bg-white shadow-sm rounded-xl flex items-center justify-center relative z-10 shrink-0">
                                         <img src={`https://www.google.com/s2/favicons?domain=openai.com&sz=64`} className="w-4 h-4" alt="LLM" />
                                     </div>
                                     <div className="flex flex-col relative z-10 text-left flex-1 min-w-0">
                                         <span className="font-black text-[11px] leading-tight truncate uppercase tracking-tight">{agent.model || 'GPT-4o'}</span>
                                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Digital Brain</span>
                                     </div>
                                 </div>

                                 <ArrowRight size={16} className="text-slate-200 rotate-90 my-1 shrink-0" />

                                 {/* 3. WORKSTATION BLOCK (Replaces Telemetry) */}
                                 <div className="flex flex-col gap-2 w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 shadow-inner relative mt-auto min-h-[75px] justify-center">
                                     <div className="absolute top-2.5 left-0 w-full flex justify-center">
                                         <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.25em]">Workstation</span>
                                     </div>
                                     <div className="flex items-center justify-center gap-2.5 mt-2">
                                         {getToolIcons(agent.visual_config).length > 0 ? (
                                             getToolIcons(agent.visual_config).slice(0, 4).map((domain, idx) => (
                                                 <div key={idx} className="w-8 h-8 rounded-xl bg-white shadow-md border border-slate-100 flex items-center justify-center p-1.5 transition-all hover:scale-110 hover:rotate-3">
                                                     <img 
                                                         src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} 
                                                         className="w-5 h-5 object-contain"
                                                         alt={domain}
                                                     />
                                                 </div>
                                             ))
                                         ) : (
                                             <div className="flex items-center gap-1.5 opacity-20 py-2">
                                                 <Layers size={12} className="text-slate-400" />
                                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Standalone</span>
                                             </div>
                                         )}
                                     </div>
                                 </div>

                                 {/* Actions Menu on Hover */}
                                 <div 
                                     onClick={(e) => e.stopPropagation()}
                                     className="absolute inset-x-0 bottom-[-10px] flex justify-center gap-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-30"
                                 >
                                     <Link href={`/agents/${agent.id}?tab=builder`} onClick={(e) => e.stopPropagation()}>
                                         <button className="p-2 bg-white border border-slate-200 text-blue-600 rounded-xl shadow-xl hover:bg-blue-50" title="Visual Builder">
                                             <Sparkles className="w-4 h-4" />
                                         </button>
                                     </Link>
                                     <Link href={`/agents/${agent.id}`} onClick={(e) => e.stopPropagation()}>
                                         <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-xl hover:bg-blue-700">
                                             Logs
                                         </button>
                                     </Link>
                                     {userRole === 'Admin' && (
                                         <button 
                                             onClick={(e) => {
                                                 e.stopPropagation();
                                                 setDeleteTarget({ id: agent.id, name: agent.name });
                                             }}
                                             className="p-2 bg-white border border-slate-200 text-rose-500 rounded-xl shadow-xl hover:bg-rose-50"
                                         >
                                             <Trash2 className="w-4 h-4" />
                                         </button>
                                     )}
                                 </div>
                             </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Magic Build Modal */}
            <Modal
                isOpen={isMagicModalOpen}
                onClose={() => {
                    setIsMagicModalOpen(false);
                    setEditingAgent(null);
                    setMagicPrompt('');
                }}
                title={
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                            {editingAgent ? `Magic Edit: ${editingAgent.name}` : 'Magic Agent Builder'}
                        </span>
                    </div>
                }
                maxWidth="max-w-3xl"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-900">
                        <p><strong>{editingAgent ? 'IA Modification' : 'Text-to-Agent'} :</strong> {editingAgent ? `Décrivez les modifications que vous souhaitez apporter à l'agent ${editingAgent.name}.` : "Décrivez l'agent autonome dont vous avez besoin. L'IA de Verytis va générer sa configuration, son prompt système et ses politiques de sécurité (Guardrails) de façon automatisée."}</p>
                    </div>

                    <div>
                        <textarea
                            rows={5}
                            placeholder={editingAgent ? `Ex: Ajoute un outil Slack pour notifier l'équipe, ou modifie le budget quotidien à 50$...` : "Ex: Je veux un agent pour lire les Pull Requests GitHub de mon équipe, détecter les failles de sécurité, avec un budget max de 50$ et l'interdiction de voir les mots de passe..."}
                            value={magicPrompt}
                            onChange={(e) => setMagicPrompt(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none shadow-inner"
                        />
                    </div>

                    <div className="flex justify-end pt-2 gap-3">
                        <Button variant="ghost" type="button" onClick={() => setIsMagicModalOpen(false)} disabled={isGenerating}>Annuler</Button>
                        <button
                            onClick={handleMagicBuild}
                            disabled={isGenerating || !magicPrompt.trim()}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Génération en cours...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    {editingAgent ? 'Modifier la configuration' : 'Créer la configuration'} (Magic Build)
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Registration Modal */}
            <Modal
                isOpen={isRegisterModalOpen}
                onClose={closeRegisterModal}
                title="Register AI Agent"
                maxWidth="max-w-3xl"
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
                    'Remove the agent\'s API access keys immediately',
                    'Permanently remove the agent from active service',
                ]}
                confirmLabel="Delete Agent"
                variant="danger"
            />
        </div>
    );
}
