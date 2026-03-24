import React, { useState, useEffect } from 'react';
import { Youtube, ListVideo, Lock, Eye, EyeOff, Check, AlertCircle, Sparkles } from 'lucide-react';

const YouTubeConfig = ({ node, theme, metadata, onUpdate }) => {
    const config = node.data.config || {};
    const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
    const [playlists, setPlaylists] = useState(metadata.playlists || []);
    const isAuto = config.channel_id === 'auto';

    // Load playlists when channel changes
    useEffect(() => {
        if (config.channel_id && config.channel_id !== 'auto') {
            loadPlaylists(config.channel_id);
        } else {
            setPlaylists([]);
        }
    }, [config.channel_id]);

    const loadPlaylists = async (channelId) => {
        setIsLoadingPlaylists(true);
        try {
            const res = await fetch(`/api/integrations/youtube/metadata?channelId=${channelId}`);
            const data = await res.json();
            if (res.ok) {
                setPlaylists(data.items || []);
            }
        } catch (err) {
            console.error('Failed to load YouTube playlists:', err);
        } finally {
            setIsLoadingPlaylists(false);
        }
    };

    const handleChannelChange = (channelId) => {
        onUpdate('config', { ...config, channel_id: channelId, playlist_id: '' });
    };

    const handlePrivacyChange = (privacy) => {
        onUpdate('config', { ...config, privacy: privacy });
    };

    const privacyOptions = [
        { id: 'public', label: 'Public', icon: Eye, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { id: 'unlisted', label: 'Non répertorié', icon: EyeOff, color: 'text-amber-500', bg: 'bg-amber-50' },
        { id: 'private', label: 'Privé', icon: Lock, color: 'text-slate-500', bg: 'bg-slate-50' }
    ];

    const channels = metadata.channels || [];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                        const nextChannel = isAuto ? '' : 'auto';
                        const nextPlaylist = isAuto ? '' : 'auto';
                        onUpdate('config', { ...config, channel_id: nextChannel, playlist_id: nextPlaylist });
                    }}
                    className={`w-10 h-5 rounded-full transition-all duration-300 relative border-2 ${isAuto ? 'bg-white border-white' : 'bg-black/20 border-black/10 hover:bg-black/30'}`}
                >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${isAuto ? `translate-x-5 ${theme?.bg || 'bg-slate-600'}` : 'translate-x-0.5 bg-white/70'}`} />
                </button>
            </div>

            {!isAuto && (
                <>
                    {/* 1. SELECT CHANNEL */}
                    <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">
                    Select Channel
                </label>
                <div className="grid grid-cols-1 gap-2">
                    {channels.length > 0 ? (
                        channels.map((channel) => (
                            <button
                                key={channel.value}
                                onClick={() => handleChannelChange(channel.value)}
                                className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${
                                    config.channel_id === channel.value
                                        ? 'bg-red-50 border-red-200 shadow-md ring-1 ring-red-100'
                                        : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm overflow-hidden bg-slate-100 flex-shrink-0">
                                        {channel.thumbnail ? (
                                            <img 
                                                src={channel.thumbnail} 
                                                alt={channel.label} 
                                                referrerPolicy="no-referrer"
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-500">
                                                <Youtube className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col text-left min-w-0">
                                        <span className="text-[13px] font-bold text-slate-800 truncate">{channel.label}</span>
                                        <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                            Compte Connecté
                                        </span>
                                    </div>
                                </div>
                                {config.channel_id === channel.value && (
                                    <div className="bg-red-500 rounded-full p-1 shadow-sm">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 opacity-60">
                            <AlertCircle className="w-6 h-6 text-slate-300" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Aucune chaîne trouvée</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. SELECT DESTINATION (PLAYLISTS) */}
            <div className={`space-y-3 transition-all duration-500 ${!config.channel_id ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">
                    Select Destination
                </label>
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors">
                        <ListVideo className="w-4 h-4" />
                    </div>
                    <select
                        value={config.playlist_id || ''}
                        onChange={e => onUpdate('config', { ...config, playlist_id: e.target.value })}
                        disabled={!config.channel_id || isLoadingPlaylists}
                        className="w-full text-xs font-bold pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-red-50 focus:border-red-400 shadow-sm transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Sélectionner une Playlist...</option>
                        {playlists.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                </div>
                    {isLoadingPlaylists && (
                        <div className="flex items-center gap-2 px-1 text-[9px] text-red-500 font-bold italic animate-pulse">
                            <div className="w-1 h-1 rounded-full bg-red-500" />
                            Chargement des playlists...
                        </div>
                    )}
                </div>
                </>
            )}

            {/* 3. PRIVACY SETTINGS */}
            <div className={`space-y-3 transition-all duration-500 ${!config.channel_id ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">
                    Privacy Settings
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {privacyOptions.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => handlePrivacyChange(opt.id)}
                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all duration-300 ${
                                config.privacy === opt.id
                                    ? `bg-white border-red-500 shadow-lg ring-1 ring-red-50`
                                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-slate-300'
                            }`}
                        >
                            <opt.icon className={`w-4 h-4 ${config.privacy === opt.id ? opt.color : 'text-slate-400'}`} />
                            <span className={`text-[9px] font-black uppercase tracking-tighter ${config.privacy === opt.id ? 'text-slate-900' : 'text-slate-400'}`}>
                                {opt.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default YouTubeConfig;
