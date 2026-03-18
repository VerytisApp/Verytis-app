import React, { useState } from 'react';
import useSWR from 'swr';
import { Bot, Shield, Zap, Info, Library, Clock, ChevronRight, Loader2, Sparkles, Database, Trash2, ChevronLeft, LayoutPanelLeft, Box, Plus, Settings2 } from 'lucide-react';
import { useSWRConfig } from 'swr';
import { useToast } from '@/components/ui/Toast';
import { useRole } from '@/lib/providers';

const fetcher = (url) => fetch(url).then(r => r.json());

export default function Sidebar({ onSelectDraft, onNewAgent, activeAgentId, hideNewAgent, hideHistory }) {
    const { currentUser } = useRole();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null);
    const { data, isLoading } = useSWR('/api/agents', fetcher);
    const { mutate } = useSWRConfig();
    const { showToast } = useToast();

    // Filtrage STRICT : uniquement les vrais brouillons (is_draft ET status !== 'active')
    const drafts = data?.agents?.filter(a => a.is_draft === true && a.status !== 'active') || [];

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
            {!hideNewAgent && (
                <div className={`p-4 border-b border-slate-100 ${isCollapsed ? 'px-2' : ''}`}>
                    <button
                        onClick={onNewAgent}
                        className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all active:scale-95 group/new`}
                    >
                        <Plus className="w-5 h-5 group-hover/new:rotate-90 transition-transform duration-300" />
                        {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">Nouvel Agent</span>}
                    </button>
                </div>
            )}

            {/* Header Historique - Hidden when collapsed or when hideHistory is true */}
            {!isCollapsed && !hideHistory && (
                <div className="px-6 py-4 border-b border-slate-50">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <h2 className="text-[11px] font-black uppercase tracking-widest">Historique</h2>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Vos brouillon en cours</p>
                </div>
            )}

            {/* Historique area - Only show map when NOT collapsed and NOT hidden */}
            <div className={`flex-1 overflow-y-auto p-4 flex flex-col ${isCollapsed ? 'items-center overflow-hidden' : ''}`}>
                {!isCollapsed && !hideHistory && (
                    <div className="space-y-2 flex-1 w-full">
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
                                    className={`w-full text-left border border-slate-100 bg-white rounded-xl hover:border-blue-300 hover:shadow-md transition-all group relative overflow-hidden cursor-pointer p-3`}
                                >
                                    <div className={`absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity ${activeAgentId === draft.id ? 'opacity-100' : ''}`} />
                                    
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold text-slate-900 text-xs line-clamp-1 pr-6 ${activeAgentId === draft.id ? 'text-blue-600' : ''}`}>
                                            {draft.name || 'Agent sans nom'}
                                        </h4>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => handleDeleteDraft(e, draft.id)}
                                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Supprimer le brouillon"
                                            >
                                                {isDeleting === draft.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            </button>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-500 line-clamp-1 mb-2 font-medium italic">
                                        {draft.description || 'Pas de description'}
                                    </p>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.3)]"></div>
                                            <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Draft</span>
                                        </div>
                                        <span className="text-[9px] text-slate-400 font-bold">
                                            {draft.updated_at
                                                ? (() => {
                                                    const d = new Date(draft.updated_at);
                                                    const dd = String(d.getDate()).padStart(2, '0');
                                                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                                                    const yyyy = d.getFullYear();
                                                    const hh = String(d.getHours()).padStart(2, '0');
                                                    const min = String(d.getMinutes()).padStart(2, '0');
                                                    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
                                                })()
                                                : '—'
                                            }
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                
                {isCollapsed && (
                    <div className="flex-1" />
                )}
            </div>

            {/* Helper Footer */}
            <div className={`p-4 bg-slate-50 border-t border-slate-200 mt-auto ${isCollapsed ? 'p-2 flex justify-center items-center' : ''}`}>
                <div className="flex items-start gap-2">
                    <Info className={`text-blue-500 shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4 mt-0.5'}`} />
                    {!isCollapsed && (
                        <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                            Vos brouillons sont sauvegardés automatiquement.
                        </p>
                    )}
                </div>
            </div>
        </aside>
    );
}
