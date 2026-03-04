import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, Check, AlertCircle, Key, Save, Loader2, ExternalLink, Brain, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const ToolNode = ({ data, isConnectable }) => {
    const { showToast } = useToast();
    const [showInput, setShowInput] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [tempKey, setTempKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const label = data.label || 'Action / Integration';
    const description = data.description || '';
    const authRecord = data.auth_requirement || {
        type: 'api_key',
        label: 'Clé API / Token',
        placeholder: 'Collez Token / Clé API...'
    };

    // ─── Internal Skill Detection ──────────────────────────────
    // If auth_requirement.type is 'none', this is a built-in AI skill
    // that requires no external API key.
    const isInternalSkill = authRecord.type === 'none';

    // Dynamic Branding Logic
    const toolMapping = {
        'lemlist': 'lemlist.com',
        'hubspot': 'hubspot.com',
        'salesforce': 'salesforce.com',
        'notion': 'notion.so',
        'airtable': 'airtable.com',
        'github': 'github.com',
        'linkedin': 'linkedin.com',
        'slack': 'slack.com',
        'scrap': 'scrapingbee.com',
        'analyzer': 'google.com',
        'search': 'google.com',
        'openai': 'openai.com',
        'postgres': 'postgresql.org',
        'mongodb': 'mongodb.com',
        'mysql': 'mysql.com',
        'firebase.google': 'firebase.google.com',
        'supabase': 'supabase.com',
        'sql': 'postgresql.org',
    };

    const getDomain = () => {
        if (data.logoDomain) return data.logoDomain;
        const combined = (label + ' ' + description).toLowerCase();
        for (const [key, domain] of Object.entries(toolMapping)) {
            if (combined.includes(key)) return domain;
        }
        return null;
    };

    const domain = getDomain();
    const providerName = domain ? domain.split('.')[0] : 'tool';
    const isGlobalConnected = data.connectedProviders?.some(p => p.domain === domain && p.status === 'Connected');
    const isConnected = isGlobalConnected || isSynced || isInternalSkill;

    // Categorization for specialized messaging
    const dataBridgeProviders = ['postgresql.org', 'mongodb.com', 'mysql.com', 'firebase.google.com', 'supabase.com', 'google.com/sheets'];
    const isDataBridge = dataBridgeProviders.includes(domain);

    const handleSyncKey = async () => {
        if (!tempKey.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/settings/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: providerName, apiKey: tempKey, scope: 'workspace' })
            });

            if (res.ok) {
                setIsSynced(true);
                setShowInput(false);
                showToast({
                    title: 'Vault Mis à Jour',
                    message: `L'intégration ${providerName} est configurée pour tout le Workspace.`,
                    type: 'success'
                });
                if (data.onChange) data.onChange('apiKey', tempKey);
            } else {
                showToast({ title: 'Erreur', message: 'Impossible de sauvegarder dans le Vault.', type: 'error' });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Visual Theming ─────────────────────────────────────────
    // Internal Skills: purple/indigo theme
    // External Connected: emerald theme
    // External Pending: red theme
    // Default: slate/blue
    const getContainerClass = () => {
        if (isInternalSkill) return 'border-indigo-400 bg-indigo-50/20';
        if (!isConnected && domain) return 'border-red-500 bg-red-50/30';
        if (isConnected) return 'border-emerald-500 bg-emerald-50/10';
        return 'border-slate-200 hover:border-blue-400';
    };

    const getHeaderBgClass = () => {
        if (isInternalSkill) return 'bg-gradient-to-b from-indigo-50 to-violet-50/30';
        if (!isConnected && domain) return 'bg-red-50';
        if (isConnected) return 'bg-emerald-50/20';
        return 'bg-blue-50/20';
    };

    const getStatusColor = () => {
        if (isInternalSkill) return 'text-indigo-600/50';
        if (!isConnected && domain) return 'text-red-600/50';
        if (isConnected) return 'text-emerald-600/50';
        return 'text-blue-600/50';
    };

    const getStatusLabel = () => {
        if (isInternalSkill) return 'Compétence IA';
        if (isConnected) return 'Connecté (Vault)';
        if (!domain) return 'Tool Node';
        return 'En attente de clé';
    };

    return (
        <div className={`bg-white border-2 rounded-2xl shadow-sm hover:shadow-xl transition-all group overflow-hidden min-w-[240px] ${getContainerClass()}`}>
            {/* Header */}
            <div className={`p-4 flex flex-col items-center gap-3 border-b ${isInternalSkill ? 'border-indigo-100' : 'border-slate-100'} ${getHeaderBgClass()}`}>
                <div className={`p-3 rounded-2xl transition-all group-hover:scale-110 duration-300 flex items-center justify-center ${isInternalSkill
                        ? 'bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 w-16 h-16'
                        : domain
                            ? 'bg-white shadow-md border border-slate-100 w-16 h-16 overflow-hidden'
                            : 'bg-blue-100 text-blue-600'
                    }`}>
                    {isInternalSkill ? (
                        <Brain className="w-8 h-8 text-indigo-600" />
                    ) : domain ? (
                        <img
                            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
                            alt={label}
                            className={`w-10 h-10 object-contain ${!isConnected ? 'grayscale-[0.5]' : ''}`}
                        />
                    ) : (
                        <Box className="w-8 h-8 fill-blue-600" />
                    )}
                    {isConnected && !isInternalSkill && (
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white p-1 rounded-bl-lg shadow-sm">
                            <Check className="w-3 h-3" />
                        </div>
                    )}
                    {isInternalSkill && (
                        <div className="absolute top-0 right-0 bg-indigo-500 text-white p-1 rounded-bl-lg shadow-sm">
                            <Sparkles className="w-3 h-3" />
                        </div>
                    )}
                </div>
                <div className="text-center">
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${getStatusColor()}`}>
                        {getStatusLabel()}
                    </div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-1 px-4 tracking-tight">
                        {label}
                    </div>
                </div>
            </div>

            {/* Content / Interaction */}
            <div className="px-5 py-4 space-y-3">
                {isInternalSkill ? (
                    /* ─── Internal Skill: No config needed badge ─── */
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                        <span className="text-[10px] font-bold text-indigo-700 tracking-tight">
                            🧠 Aucune configuration requise
                        </span>
                    </div>
                ) : (
                    /* ─── External Tool: Connection status + key input ─── */
                    <>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                                <span className={`text-[10px] font-bold tracking-tight ${isConnected ? 'text-emerald-600' : 'text-slate-500'}`}>
                                    {isConnected ? 'Opérationnel' : 'Non configuré'}
                                </span>
                            </div>
                            {isConnected && (
                                <button
                                    onClick={() => setShowInput(!showInput)}
                                    className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    {showInput ? 'Annuler' : 'Modifier'}
                                </button>
                            )}
                        </div>

                        {/* Key Input Zone (only for external tools) */}
                        {(!isConnected || showInput) && domain && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{authRecord.label}</span>
                                </div>
                                <div className="relative group/input">
                                    <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                    {authRecord.type === 'connection_string' ? (
                                        <textarea
                                            placeholder={authRecord.placeholder}
                                            value={tempKey}
                                            onChange={(e) => setTempKey(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-8 pr-8 text-[10px] font-mono outline-none focus:border-blue-500 transition-all shadow-inner placeholder:text-slate-300 resize-none h-16"
                                        />
                                    ) : (
                                        <input
                                            type="password"
                                            placeholder={authRecord.placeholder}
                                            value={tempKey}
                                            onChange={(e) => setTempKey(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 pl-8 pr-8 text-[10px] font-mono outline-none focus:border-blue-500 transition-all shadow-inner placeholder:text-slate-300"
                                        />
                                    )}
                                    {tempKey.trim() && (
                                        <button
                                            onClick={handleSyncKey}
                                            disabled={isSaving}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all active:scale-95 shadow-md"
                                        >
                                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
                className={`w-3 h-3 border-2 border-white rounded-full ${isInternalSkill ? 'bg-indigo-500' : 'bg-blue-600'}`}
            />

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className={`w-3 h-3 border-2 border-white rounded-full transition-colors ${isInternalSkill ? 'bg-indigo-400 hover:bg-indigo-600' : 'bg-blue-400 hover:bg-blue-600'}`}
            />
        </div>
    );
};

export default memo(ToolNode);
