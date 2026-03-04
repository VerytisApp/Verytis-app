import React, { useState } from 'react';
import useSWR from 'swr';
import { Bot, Shield, Zap, Info, Library, Clock, ChevronRight, Loader2, Sparkles, Database, Trash2, ChevronLeft, LayoutPanelLeft, Box, Plus, Settings2 } from 'lucide-react';
import { useSWRConfig } from 'swr';
import { useToast } from '@/components/ui/Toast';

const fetcher = (url) => fetch(url).then(r => r.json());

export default function Sidebar({ onSelectDraft, onNewAgent, activeAgentId }) {
    const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'history'
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null);
    const { data, isLoading } = useSWR('/api/agents', fetcher);
    const { mutate } = useSWRConfig();
    const { showToast } = useToast();

    const drafts = data?.agents?.filter(a => a.is_draft) || [];

    const onDragStart = (event, nodeType, label, description, model) => {
        event.dataTransfer.setData('application/reactflow/type', nodeType);
        event.dataTransfer.setData('application/reactflow/label', label);
        if (description) {
            event.dataTransfer.setData('application/reactflow/description', description);
        }
        if (model) {
            event.dataTransfer.setData('application/reactflow/model', model);
        }
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleDeleteDraft = async (e, id) => {
        e.stopPropagation();
        if (isDeleting) return;

        setIsDeleting(id);
        try {
            const res = await fetch(`/api/agents/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                showToast({
                    title: 'Brouillon supprimé',
                    message: 'Le brouillon a été retiré avec succès.',
                    type: 'success'
                });
                mutate('/api/agents');
                // If the deleted agent was the active one, reset to new agent
                if (activeAgentId === id) {
                    onNewAgent();
                }
            } else {
                showToast({
                    title: 'Erreur',
                    message: 'Impossible de supprimer le brouillon.',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Delete draft error:', error);
            showToast({ title: 'Erreur', message: 'Erreur interne lors de la suppression.', type: 'error' });
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <aside className={`${isCollapsed ? 'w-16' : 'w-72'} bg-white border-r border-slate-200 flex flex-col h-full z-30 shadow-sm relative transition-all duration-300 ease-in-out shrink-0 group/sidebar`}>
            {/* Collapse Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 shadow-md z-50 hover:bg-slate-50 transition-colors text-slate-400 hover:text-blue-600 active:scale-95"
            >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Nouveau Agent Button (ChatGPT style) */}
            <div className={`p-4 border-b border-slate-100 ${isCollapsed ? 'px-2' : ''}`}>
                <button
                    onClick={onNewAgent}
                    className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all active:scale-95 group/new`}
                >
                    <Plus className="w-5 h-5 group-hover/new:rotate-90 transition-transform duration-300" />
                    {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">Nouvel Agent</span>}
                </button>
            </div>

            {/* Sidebar Tabs */}
            <div className={`flex border-b border-slate-100 bg-slate-50/30 p-1 ${isCollapsed ? 'flex-col items-center gap-2' : ''}`}>
                <button
                    onClick={() => {
                        setActiveTab('catalog');
                        if (isCollapsed) setIsCollapsed(false);
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'catalog' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'} ${isCollapsed ? 'w-10 h-10 p-0' : 'flex-1'}`}
                    title="Catalogue"
                >
                    <Database className="w-3.5 h-3.5" />
                    {!isCollapsed && "Outils"}
                </button>
                <button
                    onClick={() => {
                        setActiveTab('history');
                        if (isCollapsed) setIsCollapsed(false);
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'} ${isCollapsed ? 'w-10 h-10 p-0' : 'flex-1'}`}
                    title="Historique"
                >
                    <Clock className="w-3.5 h-3.5" />
                    {!isCollapsed && "Historique"}
                    {!isCollapsed && drafts.length > 0 && (
                        <span className="ml-1 bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full text-[9px]">
                            {drafts.length}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'catalog' ? (
                <div className={`flex-1 overflow-y-auto p-4 flex flex-col gap-8 ${isCollapsed ? 'items-center' : ''}`}>
                    {!isCollapsed && (
                        <div className="pb-2">
                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-tight">Catalogue de Nœuds</h2>
                            <p className="text-[10px] text-slate-500 mt-0.5">Glissez-déposez vers le canvas</p>
                        </div>
                    )}

                    {/* Category: Entry Points */}
                    <div className="space-y-3">
                        {!isCollapsed && <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Déclencheurs (Triggers)</h3>}
                        <div
                            className={`${isCollapsed ? 'p-2 flex items-center justify-center' : 'p-3'} border border-emerald-200 bg-emerald-50/50 rounded-xl cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing group`}
                            onDragStart={(event) => onDragStart(event, 'triggerNode', 'Webhook / API', 'Postez une requête pour démarrer le flow')}
                            draggable
                            title={isCollapsed ? "Webhook Trigger" : ""}
                        >
                            <div className={`flex items-center gap-2 ${isCollapsed ? '' : 'mb-1'}`}>
                                <Zap className={`w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform ${isCollapsed ? 'w-5 h-5' : ''}`} />
                                {!isCollapsed && <span className="font-bold text-slate-900 text-xs">Webhook / POST</span>}
                            </div>
                            {!isCollapsed && <p className="text-[10px] text-slate-500 leading-tight">Démarre le flow via une requête API externe.</p>}
                        </div>
                    </div>

                    {/* Category: AI Agents */}
                    <div className="space-y-3">
                        {!isCollapsed && <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Agents IA</h3>}
                        {/* OpenAI */}
                        <div
                            className={`${isCollapsed ? 'p-2 flex items-center justify-center' : 'p-3'} border border-slate-200 bg-slate-50/50 rounded-xl cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing group mb-2`}
                            onDragStart={(event) => onDragStart(event, 'llmNode', 'Agent OpenAI', 'Analyse et rédaction intelligente.')}
                            draggable
                            title={isCollapsed ? "OpenAI Agent" : ""}
                        >
                            <div className={`flex items-center gap-2 ${isCollapsed ? '' : 'mb-1'}`}>
                                <div className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} rounded bg-white border border-slate-100 flex items-center justify-center p-0.5 shadow-sm overflow-hidden`}>
                                    <img src="https://www.google.com/s2/favicons?domain=openai.com&sz=64" className="w-full h-full object-contain" />
                                </div>
                                {!isCollapsed && <span className="font-bold text-slate-900 text-xs">Agent OpenAI</span>}
                            </div>
                            {!isCollapsed && <p className="text-[10px] text-slate-500 leading-tight">Polyvalent, idéal pour l'analyse et la rédaction.</p>}
                        </div>

                        {/* Anthropic */}
                        <div
                            className={`${isCollapsed ? 'p-2 flex items-center justify-center' : 'p-3'} border border-slate-200 bg-slate-50/50 rounded-xl cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing group`}
                            onDragStart={(event) => onDragStart(event, 'llmNode', 'Agent Anthropic', 'Raisonnement complexe et vision.')}
                            draggable
                            title={isCollapsed ? "Anthropic Agent" : ""}
                        >
                            <div className={`flex items-center gap-2 ${isCollapsed ? '' : 'mb-1'}`}>
                                <div className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} rounded bg-white border border-slate-100 flex items-center justify-center p-0.5 shadow-sm overflow-hidden`}>
                                    <img src="https://www.google.com/s2/favicons?domain=anthropic.com&sz=64" className="w-full h-full object-contain" />
                                </div>
                                {!isCollapsed && <span className="font-bold text-slate-900 text-xs">Agent Anthropic</span>}
                            </div>
                            {!isCollapsed && <p className="text-[10px] text-slate-500 leading-tight">Expert en raisonnement complexe et longues conversations.</p>}
                        </div>
                        {/* Custom LLM */}
                        <div
                            className={`${isCollapsed ? 'p-2 flex items-center justify-center' : 'p-3'} border border-slate-200 bg-slate-50/50 rounded-xl cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing group mt-2`}
                            onDragStart={(event) => onDragStart(event, 'llmNode', 'Custom LLM', 'Connectez votre propre moteur IA via URL.')}
                            draggable
                            title={isCollapsed ? "Custom LLM" : ""}
                        >
                            <div className={`flex items-center gap-2 ${isCollapsed ? '' : 'mb-1'}`}>
                                <div className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} rounded bg-white border border-slate-100 flex items-center justify-center p-0.5 shadow-sm overflow-hidden`}>
                                    <Settings2 className="w-full h-full text-purple-600" />
                                </div>
                                {!isCollapsed && <span className="font-bold text-slate-900 text-xs text-left">Custom LLM</span>}
                            </div>
                            {!isCollapsed && <p className="text-[10px] text-slate-500 leading-tight">Connectez n'importe quel LLM via son point de terminaison HTTP.</p>}
                        </div>
                    </div>

                    {/* Category: Governance & Safety */}
                    <div className="space-y-3">
                        {!isCollapsed && <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gouvernance Verytis</h3>}
                        <div
                            className={`${isCollapsed ? 'p-2 flex items-center justify-center' : 'p-3'} border border-rose-200 bg-rose-50/50 rounded-xl cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing group`}
                            onDragStart={(event) => onDragStart(event, 'guardrailNode', "Verytis Governance", 'Applique les limites de sécurité et de budget')}
                            draggable
                            title={isCollapsed ? "Verytis Governance" : ""}
                        >
                            <div className={`flex items-center gap-2 ${isCollapsed ? '' : 'mb-1'}`}>
                                <div className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} rounded bg-white border border-slate-100 flex items-center justify-center p-0.5 shadow-sm overflow-hidden`}>
                                    <img src="https://www.google.com/s2/favicons?domain=verytis.com&sz=64" className="w-full h-full object-contain" />
                                </div>
                                {!isCollapsed && <span className="font-bold text-slate-900 text-xs">Verytis Governance</span>}
                            </div>
                            {!isCollapsed && <p className="text-[10px] text-slate-500 leading-tight">Bloque les actions interdites et contrôle le budget API.</p>}
                        </div>
                    </div>

                    {/* Category: Tools & Integrations */}
                    <div className="space-y-3">
                        {!isCollapsed && <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outils & Intégrations</h3>}
                        <div
                            className={`${isCollapsed ? 'p-2 flex items-center justify-center' : 'p-3'} border border-blue-200 bg-blue-50/30 rounded-xl cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing group`}
                            onDragStart={(event) => onDragStart(event, 'toolNode', 'External Integration', 'Exécute une action vers un service tiers')}
                            draggable
                            title={isCollapsed ? "Action Tool" : ""}
                        >
                            <div className={`flex items-center gap-2 ${isCollapsed ? '' : 'mb-1'}`}>
                                <Box className={`w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform ${isCollapsed ? 'w-5 h-5' : ''}`} />
                                {!isCollapsed && <span className="font-bold text-slate-900 text-xs">Action / Tool</span>}
                            </div>
                            {!isCollapsed && <p className="text-[10px] text-slate-500 leading-tight">Mise à jour CRM, Envoi d'email, Slack, etc.</p>}
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`flex-1 overflow-y-auto p-4 flex flex-col ${isCollapsed ? 'hidden' : ''}`}>
                    <div className="pb-4">
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-tight">Mes Brouillons</h2>
                        <p className="text-[10px] text-slate-500 mt-0.5">Projets sauvegardés non-déployés</p>
                    </div>

                    <div className="space-y-2 flex-1">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Chargement...</span>
                            </div>
                        ) : drafts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <div className="p-3 bg-white rounded-full shadow-sm">
                                    <Clock className="w-6 h-6 text-slate-300" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500">Aucun brouillon</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Commencez un nouveau design pour le voir ici.</p>
                                </div>
                            </div>
                        ) : (
                            drafts.map((draft) => (
                                <div
                                    key={draft.id}
                                    onClick={() => onSelectDraft(draft)}
                                    className="w-full text-left p-3 border border-slate-100 bg-white rounded-xl hover:border-indigo-300 hover:shadow-md transition-all group relative overflow-hidden cursor-pointer"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-slate-900 text-xs line-clamp-1 pr-6">{draft.name || 'Agent sans nom'}</h4>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => handleDeleteDraft(e, draft.id)}
                                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Supprimer le brouillon"
                                            >
                                                {isDeleting === draft.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            </button>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-500 line-clamp-1 mb-2 font-medium italic">
                                        {draft.description || 'Pas de description'}
                                    </p>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.3)]"></div>
                                            <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Draft Modifié</span>
                                        </div>
                                        <span className="text-[9px] text-slate-400 font-bold">
                                            {new Date(draft.updated_at || new Date()).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Helper Footer */}
            <div className={`p-4 bg-slate-50 border-t border-slate-200 mt-auto ${isCollapsed ? 'p-2 flex justify-center items-center' : ''}`}>
                <div className="flex items-start gap-2">
                    <Info className={`text-blue-500 shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4 mt-0.5'}`} />
                    {!isCollapsed && (
                        <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                            Astuce : Reliez au moins un <strong>Trigger</strong>, un <strong>Agent</strong> et un <strong>Shield</strong> pour déployer.
                        </p>
                    )}
                </div>
            </div>
        </aside >
    );
}
