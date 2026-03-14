import React, { useState, useEffect } from 'react';
import { 
    X, Check, AlertCircle, Github, Slack, Trello, Box,
    ArrowRight, Info, Loader2, ShieldCheck, RefreshCw,
    MessageSquare, List, Layout, Zap, Flame, Activity, Lock, Shield
} from 'lucide-react';
import { useIntegrationData } from '@/hooks/useIntegrationData';
import Skeleton from '@/components/ui/Skeleton';
import { useRole } from '@/lib/providers';
import { createClient } from '@/lib/supabase/client';

export default function IntegrationSidebar({ node, isOpen, onClose, onUpdate }) {
    const { currentUser } = useRole();
    const isPrivileged = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';
    const isAdmin = currentUser?.role === 'Admin';
    if (!isOpen || !node) return null;

    const { data: nodeData } = node;
    const provider = nodeData.label?.toLowerCase().includes('github') ? 'github' : 
                     nodeData.label?.toLowerCase().includes('slack') ? 'slack' : 
                     nodeData.type?.toLowerCase().includes('tool') ? 'tool' : null;
    const isLLM = nodeData.type === 'llmNode';

    const connectedOrg = nodeData.connectedProviders?.find(p => {
        const pDomain = p.domain?.toLowerCase();
        const nodeProvider = provider?.toLowerCase();
        return pDomain?.includes(nodeProvider) && p.status === 'Connected' && !p.is_perso;
    });

    const connectedPerso = nodeData.connectedProviders?.find(p => {
        const pDomain = p.domain?.toLowerCase();
        const nodeProvider = provider?.toLowerCase();
        return pDomain?.includes(nodeProvider) && p.status === 'Connected' && p.is_perso;
    });

    const isConnected = !!(connectedOrg || connectedPerso);
    const [selectedSource, setSelectedSource] = useState(nodeData.config?.source || (connectedOrg ? 'org' : 'perso'));

    console.log(`[SIDEBAR] Node: ${node.id}, Provider: ${provider}, Connected: ${isConnected}, Org: ${!!connectedOrg}, Perso: ${!!connectedPerso}`);

    const { items, subItems, loading, connectionInfo, fetchSubItems } = useIntegrationData(provider, isConnected);

    // Local state for auto-save logic
    const [config, setConfig] = useState(nodeData.config || {});

    // Sync config with node data on open
    useEffect(() => {
        setConfig(nodeData.config || {});
    }, [node.id]);

    // Internal save logic
    const handleUpdate = (key, value) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        onUpdate(node.id, { ...nodeData, config: newConfig });
    };

    const renderHeader = () => (
        <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                        <Settings2Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Configuration</h2>
                </div>
                {isConnected && (
                    <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${selectedSource === 'org' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {selectedSource === 'org' ? '🏢 Team' : '👤 Personnel'}
                    </div>
                )}
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {isConnected ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-bold text-emerald-700 tracking-tight">
                        {selectedSource === 'org' ? 'Source Team Active' : 'Source Personnelle Active'}
                    </span>
                </div>
            ) : (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span className="text-[10px] font-bold text-rose-700 tracking-tight">Configuration requise</span>
                </div>
            )}
        </div>
    );

    const renderGithubConfig = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Github className="w-3 h-3" /> Dépôt à Analyser
                </label>
                {loading ? <Skeleton className="h-10 w-full rounded-xl" /> : (
                    <select 
                        value={config.repo || ''} 
                        onChange={(e) => handleUpdate('repo', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                        <option value="">Sélectionner un dépôt...</option>
                        {items.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                    </select>
                )}
            </div>
            {/* Dual Connection Zones */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sources d'Intégration</h3>
                
                {/* Team Zone */}
                <div className={`p-4 rounded-2xl border-2 transition-all ${selectedSource === 'org' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 bg-white opacity-80'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Shield className={`w-4 h-4 ${connectedOrg ? 'text-blue-600' : 'text-slate-300'}`} />
                            <span className="text-[11px] font-black text-slate-900 uppercase">Team</span>
                        </div>
                        {connectedOrg && (
                            <button 
                                onClick={() => {
                                    setSelectedSource('org');
                                    handleUpdate('source', 'org');
                                }}
                                className={`px-2 py-1 rounded text-[8px] font-bold uppercase ${selectedSource === 'org' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                                {selectedSource === 'org' ? 'Sélectionné' : 'Choisir'}
                            </button>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${connectedOrg ? 'bg-emerald-500 ring-4 ring-emerald-50' : 'bg-slate-200'}`} />
                            <span className="text-[10px] font-bold text-slate-500">{connectedOrg ? 'Opérationnel' : 'Non connecté'}</span>
                        </div>
                        {isAdmin && (
                            <button 
                                onClick={handleReconnect}
                                className="text-[9px] font-black text-blue-600 hover:underline uppercase"
                            >
                                {connectedOrg ? 'Modifier' : 'Connecter'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Personnel Zone */}
                <div className={`p-4 rounded-2xl border-2 transition-all ${selectedSource === 'perso' ? 'border-amber-500 bg-amber-50/30' : 'border-slate-100 bg-white opacity-80'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Box className={`w-4 h-4 ${connectedPerso ? 'text-amber-600' : 'text-slate-300'}`} />
                            <span className="text-[11px] font-black text-slate-900 uppercase">Personnel</span>
                        </div>
                        {connectedPerso && (
                            <button 
                                onClick={() => {
                                    setSelectedSource('perso');
                                    handleUpdate('source', 'perso');
                                }}
                                className={`px-2 py-1 rounded text-[8px] font-bold uppercase ${selectedSource === 'perso' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                                {selectedSource === 'perso' ? 'Sélectionné' : 'Choisir'}
                            </button>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${connectedPerso ? 'bg-emerald-500 ring-4 ring-emerald-50' : 'bg-slate-200'}`} />
                            <span className="text-[10px] font-bold text-slate-500">{connectedPerso ? 'Opérationnel' : 'Non connecté'}</span>
                        </div>
                        <button 
                            onClick={handleReconnect}
                            className="text-[9px] font-black text-amber-600 hover:underline uppercase"
                        >
                            {connectedPerso ? 'Modifier' : 'Connecter'}
                        </button>
                    </div>
                </div>
            </div>
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Périmètre de surveillance</label>
                <div className="grid grid-cols-1 gap-2">
                    {[
                        { id: 'economic', label: 'Économique', desc: 'PR uniquement', icon: Zap },
                        { id: 'standard', label: 'Standard', desc: 'PR + Commits', icon: Activity },
                        { id: 'total', label: 'Total', desc: 'PR, Commits & Issues', icon: Flame }
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => handleUpdate('scope', opt.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${config.scope === opt.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                        >
                            <div className={`p-2 rounded-lg ${config.scope === opt.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                                <opt.icon className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <p className="text-[11px] font-black text-slate-900 leading-tight">{opt.label}</p>
                                <p className="text-[10px] text-slate-500 font-medium">{opt.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderSlackConfig = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" /> Canal de Communication
                </label>
                {loading ? <Skeleton className="h-10 w-full rounded-xl" /> : (
                    <select 
                        value={config.channel || ''} 
                        onChange={(e) => handleUpdate('channel', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                        <option value="">Sélectionner un canal...</option>
                        {items.map(item => <option key={item.id} value={item.id}>#{item.name}</option>)}
                    </select>
                )}
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Urgence des notifications</label>
                <div className="flex flex-col gap-2">
                    {[
                        { id: 'critical', label: 'Critique seulement', color: 'bg-rose-500' },
                        { id: 'important', label: 'Activité importante', color: 'bg-amber-500' },
                        { id: 'full', label: 'Flux complet', color: 'bg-emerald-500' }
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => handleUpdate('urgency', opt.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${config.urgency === opt.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                                <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                            </div>
                            {config.urgency === opt.id && <Check className="w-4 h-4 text-blue-600" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mentions par défaut</label>
                <input 
                    type="text" 
                    placeholder="ex: @channel, @devs" 
                    value={config.mentions || ''}
                    onChange={(e) => handleUpdate('mentions', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>
        </div>
    );

    const renderTrelloConfig = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Layout className="w-3 h-3" /> Tableau (Board)
                </label>
                {loading && !items.length ? <Skeleton className="h-10 w-full rounded-xl" /> : (
                    <select 
                        value={config.board || ''} 
                        onChange={(e) => {
                            handleUpdate('board', e.target.value);
                            fetchSubItems(e.target.value);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                        <option value="">Sélectionner un tableau...</option>
                        {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <List className="w-3 h-3" /> Liste de destination
                </label>
                {loading && config.board ? <Skeleton className="h-10 w-full rounded-xl" /> : (
                    <select 
                        value={config.list || ''} 
                        onChange={(e) => handleUpdate('list', e.target.value)}
                        disabled={!config.board}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                    >
                        <option value="">Sélectionner une liste...</option>
                        {subItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                )}
            </div>

            <div className="pt-4 flex items-center gap-3">
                <button
                    onClick={() => handleUpdate('useAiPriority', !config.useAiPriority)}
                    className={`w-10 h-6 rounded-full transition-all relative ${config.useAiPriority ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.useAiPriority ? 'left-5' : 'left-1'}`} />
                </button>
                <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">Priorité IA</span>
                    <span className="text-[10px] text-slate-500 font-medium">Étiquetage intelligent selon l'urgence</span>
                </div>
            </div>
        </div>
    );

    const renderDisconnectedState = () => (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                {provider === 'github' ? <Github className="w-10 h-10 text-slate-300" /> :
                 provider === 'slack' ? <Slack className="w-10 h-10 text-slate-300" /> :
                 <Trello className="w-10 h-10 text-slate-300" />}
            </div>
            <div className="space-y-2">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Connexion Requise</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    Autorisez Verytis à interagir avec {provider} pour configurer cet agent de manière intelligente.
                </p>
            </div>
            <button 
                onClick={async () => {
                    const supabase = createClient();
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    // Fetch organization_id
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('organization_id')
                        .eq('id', user.id)
                        .single();

                    const orgId = profile?.organization_id;
                    if (!orgId) {
                        alert("Erreur: Organisation non trouvée.");
                        return;
                    }

                    let authUrl = '';
                    if (provider === 'github') {
                        authUrl = `/api/auth/github/login?userId=${user.id}&type=integration&organizationId=${orgId}`;
                    } else if (provider === 'trello') {
                        authUrl = `/api/auth/trello/login?userId=${user.id}&organizationId=${orgId}`;
                    } else if (provider === 'slack') {
                        authUrl = '/api/slack/install'; // Slack handles it internally in its install route
                    }

                    if (authUrl) {
                        const width = 600;
                        const height = 700;
                        const left = window.screenX + (window.outerWidth - width) / 2;
                        const top = window.screenY + (window.outerHeight - height) / 2;
                        window.open(
                            authUrl,
                            `Connecter ${provider}`,
                            `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
                        );
                    }
                }}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-black/10"
            >
                <RefreshCw className="w-4 h-4" /> Reconnecter {provider}
            </button>
        </div>
    );

    return (
        <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 border-l border-slate-100 flex flex-col">
            {renderHeader()}
            
            <div className={`flex-1 overflow-y-auto p-6 ${isLLM && !isAdmin ? 'bg-slate-50' : ''}`}>
                {/* Role Enforcement Warning */}
                {isLLM && !isAdmin && (
                    <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
                        <Lock className="w-5 h-5 text-blue-500 shrink-0" />
                        <div>
                            <p className="text-[10px] font-black text-blue-700 uppercase tracking-tight">Vault Verrouillé</p>
                            <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                                Les clés LLM sont configurées par l'Admin. Vous utilisez la licence d'organisation sécurisée.
                            </p>
                        </div>
                    </div>
                )}

                <div className={(isLLM && !isAdmin) ? 'opacity-40 pointer-events-none grayscale' : ''}>
                    {!isConnected ? renderDisconnectedState() : (
                        provider === 'github' ? renderGithubConfig() :
                        provider === 'slack' ? renderSlackConfig() :
                        provider === 'trello' ? renderTrelloConfig() : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Info className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Node non-intégrable</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <Zap className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter mb-0.5">Auto-Sauvegarde</p>
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                            Vos modifications sont enregistrées instantanément dans le Flow.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const Settings2Icon = (props) => (
    <svg 
        {...props} 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
    </svg>
);
