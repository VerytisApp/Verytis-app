import React from 'react';
import { 
    Video, Sparkles, Layout, Type, Music, Hash,
    Zap, Activity, Share2, Monitor, Smartphone,
    ChevronRight, Check, AlertCircle, Play, TrendingUp, FileText, User
} from 'lucide-react';

const TikTokConfig = ({ node, theme, metadata, onUpdate }) => {
    const config = node.data.config || {};
    const activeTab = config.active_tab || 'montage';
    const isAuto = config.is_auto || false;

    const templates = [
        { id: 'viral', label: 'Viral Hook', desc: 'Accroches percutantes & transitions rapides', icon: Zap },
        { id: 'storytelling', label: 'Storytelling', desc: 'Narration immersive & progressive', icon: Video },
        { id: 'minimal', label: 'Raw Content', desc: 'Contenu brut et authentique', icon: Monitor },
    ];

    const handleUpdate = (updates) => {
        onUpdate('config', { ...config, ...updates });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className={`flex items-center justify-between p-3 bg-slate-900 rounded-2xl shadow-lg`}>
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
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${isAuto ? 'translate-x-5 bg-slate-900' : 'translate-x-0.5 bg-white/70'}`} />
                </button>
            </div>

            {/* User Profile Hook - Positioned below Mode Automatique */}
            {metadata?.user && (
                <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="relative">
                        <img 
                            src={metadata.user.avatar_url || `https://www.google.com/s2/favicons?domain=tiktok.com&sz=128`} 
                            alt={metadata.user.display_name} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-50 shadow-sm"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden p-0.5">
                            <img 
                                src="https://www.google.com/s2/favicons?domain=tiktok.com&sz=64" 
                                alt="TikTok" 
                                className="w-full h-full rounded-full"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[11px] font-black text-slate-900 truncate tracking-tight">{metadata.user.display_name}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Compte Connecté</span>
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                    </div>
                </div>
            )}

            {!isAuto && (
                <>
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">
                    Statut de Publication
                </label>
                <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/50">
                    <button
                        onClick={() => handleUpdate({ post_status: 'draft' })}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-extrabold transition-all duration-300 ${config.post_status !== 'publish' ? 'bg-white shadow-xl text-amber-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <FileText className={`w-3.5 h-3.5 ${config.post_status !== 'publish' ? 'text-amber-500' : 'text-slate-400'}`} /> BROUILLON
                    </button>
                    <button
                        onClick={() => handleUpdate({ post_status: 'publish' })}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-extrabold transition-all duration-300 ${config.post_status === 'publish' ? 'bg-white shadow-xl text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Share2 className={`w-3.5 h-3.5 ${config.post_status === 'publish' ? 'text-emerald-500' : 'text-slate-400'}`} /> PUBLIER
                    </button>
                </div>
            </div>

            {/* Privacy Level - Only show if not draft */}
            {config.post_status === 'publish' && (
                <div className="space-y-3 animate-in fade-in duration-300">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">
                        Confidentialité par défaut
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'PUBLIC', label: 'Public', icon: Layout },
                            { id: 'MUTUAL_FOLLOW_FRIENDS', label: 'Amis', icon: User },
                            { id: 'SELF_ONLY', label: 'Privé', icon: Monitor }
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => handleUpdate({ privacy_level: opt.id })}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${config.privacy_level === opt.id || (!config.privacy_level && opt.id === 'PUBLIC') ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
                            >
                                <opt.icon className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Editing Options */}
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">
                    Autorisations & CTAs
                </label>
                <div className="grid grid-cols-1 gap-2">
                    {[
                        { id: 'allow_comments', label: 'Autoriser les Commentaires', icon: Type },
                        { id: 'allow_duet', label: 'Autoriser les Duos (Duet)', icon: Music },
                        { id: 'allow_stitch', label: 'Autoriser les Collages (Stitch)', icon: Hash }
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => handleUpdate({ [opt.id]: config[opt.id] === undefined ? true : !config[opt.id] })}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${config[opt.id] !== false ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${config[opt.id] !== false ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                                    <opt.icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-800">{opt.label}</span>
                            </div>
                            <div className={`w-10 h-5 rounded-full border-2 transition-all relative ${config[opt.id] !== false ? 'bg-blue-600 border-blue-600' : 'bg-slate-200 border-slate-200'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${config[opt.id] !== false ? 'left-5' : 'left-0.5'}`} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider">Note sur les brouillons</span>
                </div>
                <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                    Les vidéos envoyées en <b>Brouillon</b> apparaîtront dans votre application TikTok mobile pour une vérification manuelle avant publication réelle.
                </p>
            </div>
        </>
    )}
</div>
    );
};

export default TikTokConfig;
