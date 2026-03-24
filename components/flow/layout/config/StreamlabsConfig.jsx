import React from 'react';
import { 
    Video, Sparkles, Layout, Type, Music, 
    Zap, Activity, Share2, Monitor, Smartphone,
    ChevronRight, Check, AlertCircle, Play
} from 'lucide-react';

const StreamlabsConfig = ({ node, theme, metadata, onUpdate }) => {
    const config = node.data.config || {};
    const activeTab = config.active_tab || 'montage';
    const isAuto = config.is_auto || false;

    const templates = [
        { id: 'viral', label: 'Viral Flow', desc: 'Transitions rapides & punchy', icon: Zap },
        { id: 'cinematic', label: 'Cinematic', desc: 'Flous et ambiance immersive', icon: Video },
        { id: 'minimal', label: 'Clean Cut', desc: 'Focus sur le contenu brut', icon: Monitor },
    ];

    const handleUpdate = (updates) => {
        onUpdate('config', { ...config, ...updates });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className={`flex items-center justify-between p-3 ${theme?.bg || 'bg-slate-600'} rounded-2xl shadow-lg`}>
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white/20 rounded-xl shadow-inner">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Mode Automatique</span>
                        <span className="text-[9px] text-white/70 font-bold italic opacity-80">L'Agent choisit la configuration</span>
                    </div>
                </div>
                <button
                    onClick={() => {
                        onUpdate('config', { ...config, is_auto: !isAuto });
                    }}
                    className={`w-10 h-5 rounded-full transition-all duration-300 relative border-2 ${isAuto ? 'bg-white border-white' : 'bg-black/20 border-black/10 hover:bg-black/30'}`}
                >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${isAuto ? `translate-x-5 ${theme?.bg || 'bg-slate-600'}` : 'translate-x-0.5 bg-white/70'}`} />
                </button>
            </div>

            {!isAuto && (
                <>
            {/* Action Type Switcher */}
            <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">
                    Cible de l'Outil
                </label>
                <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/50">
                    <button
                        onClick={() => handleUpdate({ active_tab: 'montage' })}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-extrabold transition-all duration-300 ${activeTab === 'montage' ? 'bg-white shadow-xl text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Video className={`w-3.5 h-3.5 ${activeTab === 'montage' ? 'text-blue-500' : 'text-slate-400'}`} /> MONTAGE
                    </button>
                    <button
                        onClick={() => handleUpdate({ active_tab: 'features' })}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-extrabold transition-all duration-300 ${activeTab === 'features' ? 'bg-white shadow-xl text-rose-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Zap className={`w-3.5 h-3.5 ${activeTab === 'features' ? 'text-rose-500' : 'text-slate-400'}`} /> FONCTIONS
                    </button>
                </div>
            </div>

            {activeTab === 'montage' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                    {/* Format Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">
                            Format de Sortie
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleUpdate({ format: '9:16' })}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${config.format === '9:16' ? 'bg-blue-50 border-blue-400 text-blue-600 shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}
                            >
                                <Smartphone className="w-6 h-6" />
                                <span className="text-[10px] font-black">SHORTS (9:16)</span>
                            </button>
                            <button
                                onClick={() => handleUpdate({ format: '16:9' })}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${config.format === '16:9' ? 'bg-blue-50 border-blue-400 text-blue-600 shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}
                            >
                                <Monitor className="w-6 h-6" />
                                <span className="text-[10px] font-black">STD (16:9)</span>
                            </button>
                        </div>
                    </div>

                    {/* Template Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">
                            Template Visuel
                        </label>
                        <div className="space-y-2">
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => handleUpdate({ template: t.id })}
                                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${config.template === t.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${config.template === t.id ? 'bg-white/10' : 'bg-slate-50'}`}>
                                            <t.icon className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[11px] font-black uppercase tracking-tight">{t.label}</p>
                                            <p className={`text-[9px] ${config.template === t.id ? 'text-white/60' : 'text-slate-400'}`}>{t.desc}</p>
                                        </div>
                                    </div>
                                    {config.template === t.id && <Check className="w-4 h-4 text-blue-400" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Editing Options */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">
                            Options de Montage
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { id: 'auto_caption', label: 'Sous-titres IA', icon: Type },
                                { id: 'auto_music', label: 'Musique Dynamique', icon: Music },
                                { id: 'smart_crop', label: 'Smart Face-Crop', icon: Layout }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleUpdate({ [opt.id]: !config[opt.id] })}
                                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${config[opt.id] ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${config[opt.id] ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                                            <opt.icon className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-800">{opt.label}</span>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full border-2 transition-all relative ${config[opt.id] ? 'bg-blue-600 border-blue-600' : 'bg-slate-200 border-slate-200'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${config[opt.id] ? 'left-5' : 'left-0.5'}`} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="space-y-4">
                        {[
                            { 
                                id: 'virality', 
                                title: 'Scoring de Viralité', 
                                desc: 'Estime le potentiel viral de chaque clip généré.',
                                icon: Activity,
                                color: 'rose'
                            },
                            { 
                                id: 'multi_sync', 
                                title: 'Sync Multi-Plateforme', 
                                desc: 'Prépare l\'export pour TikTok, Reels et Shorts.',
                                icon: Share2,
                                color: 'blue'
                            }
                        ].map(feature => (
                            <button
                                key={feature.id}
                                onClick={() => handleUpdate({ [`feat_${feature.id}`]: !config[`feat_${feature.id}`] })}
                                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${config[`feat_${feature.id}`] ? `border-${feature.color}-500 bg-${feature.color}-50/30` : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                        >
                            <div className="flex gap-4">
                                <div className={`p-3 rounded-xl ${config[`feat_${feature.id}`] ? `bg-${feature.color}-500 text-white shadow-lg shadow-${feature.color}-500/20` : 'bg-slate-50 text-slate-400'}`}>
                                    <feature.icon className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className={`text-[11px] font-black uppercase tracking-tight ${config[`feat_${feature.id}`] ? `text-${feature.color}-700` : 'text-slate-900'}`}>{feature.title}</p>
                                    <p className="text-[10px] text-slate-500 font-medium leading-tight">{feature.desc}</p>
                                </div>
                            </div>
                        </button>
                        ))}
                    </div>
                </div>
            )}
                </>
            )}

        </div>
    );
};

export default StreamlabsConfig;


