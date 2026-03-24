import React from 'react';
import { Sparkles } from 'lucide-react';
import TargetingList from './TargetingList';

const GitHubConfig = ({ node, theme, metadata, targets, isLoadingTargets, search, setSearch, onUpdate, detectedBrand }) => {
    const config = node.data.config || {};
    const isAuto = config.repo_name === 'auto';

    return (
        <div className="space-y-6">
            <div className={`flex items-center justify-between p-3 ${theme?.bg || 'bg-slate-600'} rounded-2xl shadow-lg`}>
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white/20 rounded-xl shadow-inner">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Mode Automatique</span>
                        <span className="text-[9px] text-white/70 font-bold italic opacity-80">L'Agent choisit la cible</span>
                    </div>
                </div>
                <button
                    onClick={() => {
                        const nextRepo = isAuto ? '' : 'auto';
                        onUpdate('config', { ...config, repo_name: nextRepo });
                    }}
                    className={`w-10 h-5 rounded-full transition-all duration-300 relative border-2 ${isAuto ? 'bg-white border-white' : 'bg-black/20 border-black/10 hover:bg-black/30'}`}
                >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${isAuto ? `translate-x-5 ${theme?.bg || 'bg-slate-600'}` : 'translate-x-0.5 bg-white/70'}`} />
                </button>
            </div>

            {!isAuto && (
                <>
                    <div className="space-y-4 p-4 bg-slate-900/[0.03] rounded-2xl border border-slate-200 shadow-sm transition-all">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">Dépôt GitHub (Repository)</label>
                            <select
                                value={config.repo_name || ''}
                                onChange={e => onUpdate('config', { ...config, repo_name: e.target.value })}
                                className="w-full text-xs font-bold px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 shadow-sm transition-all"
                            >
                                <option value="">Sélectionner un dépôt...</option>
                                {metadata.repos.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                            <p className="text-[9px] text-slate-400 mt-1 italic">Les Issues seront ouvertes sur ce dépôt spécifique.</p>
                        </div>
                    </div>

                    <TargetingList 
                        targets={targets}
                        isLoading={isLoadingTargets}
                        search={search}
                        setSearch={setSearch}
                        selectedTargets={config.targets}
                        onToggle={(target) => {
                            const current = config.targets || [];
                            const exists = current.find(t => t.id === target.id);
                            const next = exists 
                                ? current.filter(t => t.id !== target.id)
                                : [{ id: target.id, name: target.name }];
                            onUpdate('config', { ...config, targets: next });
                        }}
                        detectedBrand={detectedBrand}
                    />
                </>
            )}
        </div>
    );
};

export default GitHubConfig;
