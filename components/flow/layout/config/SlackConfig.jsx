import React from 'react';
import { Hash, User, Sparkles } from 'lucide-react';
import TargetingList from './TargetingList';

const SlackConfig = ({ node, theme, targets, isLoading, search, setSearch, onUpdate, detectedBrand }) => {
    const config = node.data.config || {};
    const isAuto = config.targets?.some(t => t.id === 'auto');

    return (
        <div className="space-y-6">
            <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Type de cible</label>
                <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/50">
                    <button
                        onClick={() => onUpdate('config', { ...config, target_type: 'channel' })}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-extrabold transition-all duration-300 ${config.target_type !== 'user' ? 'bg-white shadow-xl text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Hash className={`w-3.5 h-3.5 ${config.target_type !== 'user' ? 'text-blue-500' : 'text-slate-400'}`} /> CANAUX
                    </button>
                    <button
                        onClick={() => onUpdate('config', { ...config, target_type: 'user' })}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-extrabold transition-all duration-300 ${config.target_type === 'user' ? 'bg-white shadow-xl text-rose-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <User className={`w-3.5 h-3.5 ${config.target_type === 'user' ? 'text-rose-500' : 'text-slate-400'}`} /> UTILISATEURS
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white/20 rounded-xl">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Mode Automatique</span>
                        <span className="text-[9px] text-blue-100 font-bold italic opacity-80">L'Agent choisit la cible</span>
                    </div>
                </div>
                <button
                    onClick={() => {
                        const next = isAuto ? [] : [{ id: 'auto', name: '✨ Automatique' }];
                        onUpdate('config', { ...config, targets: next });
                    }}
                    className={`w-10 h-5 rounded-full transition-all duration-300 relative border-2 ${isAuto ? 'bg-white border-white' : 'bg-blue-700 border-blue-500'}`}
                >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${isAuto ? 'translate-x-5 bg-blue-600' : 'translate-x-0.5 bg-blue-200'}`} />
                </button>
            </div>

            {!isAuto && (
                <div className="space-y-4">
                    <div className="flex flex-col gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Mode Fil de Discussion</span>
                            </div>
                            <button
                                onClick={() => onUpdate('config', { ...config, thread_mode: !config.thread_mode })}
                                className={`w-10 h-5 rounded-full transition-all duration-300 relative border-2 ${config.thread_mode ? 'bg-blue-600 border-blue-600' : 'bg-slate-200 border-slate-200 hover:bg-slate-300'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm ${config.thread_mode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                        <p className="text-[9px] text-blue-900/60 leading-relaxed font-medium">
                            Activez ceci pour que l'agent réponde dans le fil (thread) au lieu de poster un nouveau message.
                        </p>
                    </div>

                    <TargetingList 
                        theme={theme}
                        targets={targets}
                        isLoading={isLoading}
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
                </div>
            )}
        </div>
    );
};

export default SlackConfig;
