import React from 'react';
import { Clock, Database, User, Globe, Hash, CheckCircle2 } from 'lucide-react';

const TargetingList = ({ 
    targets, 
    isLoading, 
    search, 
    setSearch, 
    selectedTargets, 
    onToggle, 
    detectedBrand 
}) => {
    return (
        <div className="space-y-4">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Filtrer les cibles..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                />
            </div>

            <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-2xl bg-slate-50/50 p-2 space-y-4 shadow-inner">
                {isLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-40">
                        <Clock className="w-8 h-8 animate-spin text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Chargement...</span>
                    </div>
                ) : targets.length === 0 ? (
                    <div className="py-10 text-center flex flex-col items-center gap-3">
                        <Database className="w-8 h-8 text-slate-300" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Aucun résultat</span>
                    </div>
                ) : (
                    Object.entries(
                        targets.reduce((acc, t) => {
                            let group = 'Dépôts & Canaux';
                            if (detectedBrand === 'slack') group = (t.is_im || t.is_mpim || t.is_user) ? 'Messages Directs (DM)' : 'Canaux';
                            if (detectedBrand === 'shopify') group = 'Boutiques Shopify';
                            if (!acc[group]) acc[group] = [];
                            acc[group].push(t);
                            return acc;
                        }, {})
                    ).map(([groupName, groupItems]) => (
                        <div key={groupName} className="space-y-1.5">
                            <div className="px-2 pb-1 flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">{groupName}</span>
                                <div className="h-px flex-1 bg-slate-200/50" />
                            </div>
                            {groupItems.map(target => {
                                const isSelected = selectedTargets?.some(t => t.id === target.id);
                                return (
                                    <button
                                        key={target.id}
                                        onClick={() => onToggle(target)}
                                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all border ${isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 'hover:bg-white border-transparent'}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {target.is_im ? <User className="w-3.5 h-3.5" /> : detectedBrand === 'shopify' ? <Globe className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
                                            </div>
                                            <span className={`text-[11px] truncate font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-600'}`}>{target.name}</span>
                                        </div>
                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TargetingList;
