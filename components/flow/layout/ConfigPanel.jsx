'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Settings2, X, Sparkles, AlertTriangle, AlertCircle, Database, Clock, Save, CheckCircle2, Shield, Box, ChevronRight, Hash, User, FileText, LayoutDashboard, ListTodo, Github } from 'lucide-react';
import KnowledgeBaseSettings from './KnowledgeBaseSettings';

// ────────────────────────────────────────────────────────────────
// Reusable Tag Input (for config panel)
// ────────────────────────────────────────────────────────────────
const PanelTagInput = ({ tags = [], mandatoryTags = [], onChange, placeholder }) => {
    const [input, setInput] = useState('');
    const addTag = () => {
        const val = input.trim().toUpperCase();
        if (val && !tags.includes(val) && !mandatoryTags.includes(val)) onChange([...tags, val]);
        setInput('');
    };
    return (
        <div className="flex flex-wrap gap-1.5 items-center bg-white border border-slate-200 rounded-xl px-2.5 py-2 min-h-[36px] focus-within:border-rose-300 transition-colors">
            {mandatoryTags.map(tag => (
                <span key={`global-${tag}`} className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-mono font-bold" title="Règle de sécurité globale définie par l'administrateur.">
                    <AlertCircle className="w-2.5 h-2.5" />
                    {tag}
                </span>
            ))}
            {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-0.5 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                    {tag}
                    <button onClick={() => onChange(tags.filter(t => t !== tag))} className="text-rose-400 hover:text-rose-600 ml-0.5 transition-colors">×</button>
                </span>
            ))}
            <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                onBlur={addTag}
                placeholder={tags.length === 0 && mandatoryTags.length === 0 ? placeholder : '+ ajouter'}
                className="flex-1 min-w-[80px] bg-transparent text-[9px] text-slate-700 outline-none placeholder:text-slate-400 font-mono py-0.5"
            />
        </div>
    );
};

// ────────────────────────────────────────────────────────────────
// Numeric field helper
// ────────────────────────────────────────────────────────────────
const PanelNumField = ({ label, value, onChange, placeholder, hint, step, min, max }) => (
    <div>
        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1 font-mono">{label}</label>
        <input
            type="number"
            step={step}
            min={min}
            max={max}
            value={value ?? ''}
            onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
            placeholder={placeholder}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-rose-300 focus:border-rose-300 placeholder:text-slate-400 transition-colors"
        />
        {hint && <p className="text-[9px] text-slate-400 mt-0.5 font-mono">{hint}</p>}
    </div>
);

const DEFAULT_POLICIES = {
    budget_daily_max: null,
    budget_per_request_max: null,
    blocked_actions: [],
    require_approval: [],
    allowed_scopes: [],
    forbidden_keywords: [],
    max_consecutive_failures: 3,
    active_hours_start: null,
    active_hours_end: null,
    min_confidence_score: null,
    max_tokens_per_action: null,
    max_retries: 5,
    rate_limit_per_min: 100,
};

export default function ConfigPanel({ selectedNode, orgSettings, agentId, orgId, onUpdateNode, onUpdate, onClose, onDelete }) {
    const [draftData, setDraftData] = useState({});
    const [policies, setPolicies] = useState(DEFAULT_POLICIES);
    const [policiesSaved, setPoliciesSaved] = useState(false);
    const [placeholderValues, setPlaceholderValues] = useState({});
    const [availableTargets, setAvailableTargets] = useState([]);
    const [isLoadingTargets, setIsLoadingTargets] = useState(false);
    const [searchTarget, setSearchTarget] = useState('');
    const [navigationStack, setNavigationStack] = useState([]);

    const detectedPlaceholders = useMemo(() => {
        const prompt = draftData.system_prompt || '';
        const matches = prompt.match(/\[([A-Z][A-Z0-9_]+)\]/g) || [];
        return [...new Set(matches)].map(m => m.slice(1, -1));
    }, [draftData.system_prompt]);

    const hasPlaceholders = detectedPlaceholders.length > 0;

    const LLM_MODELS_BY_PROVIDER = useMemo(() => ({
        openai: [
            { id: 'gpt-4o', name: 'GPT-4o (Standard)' },
            { id: 'o1-preview', name: 'o1-preview' },
            { id: 'o1-mini', name: 'o1-mini' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini' }
        ],
        anthropic: [
            { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
            { id: 'claude-3-opus-latest', name: 'Claude 3 Opus' },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
        ],
        google: [
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
        ]
    }), []);

    // ── BRANDING LOGIC ──────────────────────────────────────────
    const isGuardrail = selectedNode?.type === 'guardrailNode';
    const isLLM = selectedNode?.type === 'llmNode' || selectedNode?.type === 'placeholderNode';
    const isTool = selectedNode?.type === 'toolNode';
    const isKnowledge = selectedNode?.type === 'knowledgeNode';
    const isTrigger = selectedNode?.type === 'triggerNode';

    const detectedBrand = useMemo(() => {
        if (!selectedNode) return null;
        const rawLabel_low = (selectedNode.data?.label || '').toLowerCase();
        const rawProvider_low = (selectedNode.data?.provider || '').toLowerCase();
        let brand = rawProvider_low;
        
        if (isGuardrail) {
            brand = 'verytis';
        } else if (!brand || brand === 'custom' || brand === 'llm') {
            if (rawLabel_low.includes('github') || (selectedNode.data?.logoDomain || '').includes('github')) brand = 'github';
            else if (rawLabel_low.includes('slack') || (selectedNode.data?.logoDomain || '').includes('slack')) brand = 'slack';
            else if (rawLabel_low.includes('trello') || (selectedNode.data?.logoDomain || '').includes('trello')) brand = 'trello';
            else if (rawLabel_low.includes('notion')) brand = 'notion';
            else if (rawLabel_low.includes('openai')) brand = 'openai';
            else if (rawLabel_low.includes('anthropic')) brand = 'anthropic';
            else if (rawLabel_low.includes('google')) brand = 'google';
        }
        return brand;
    }, [selectedNode, isGuardrail]);

    const availableModels = useMemo(() => {
        if (!isLLM || !selectedNode) return [];
        const brand = detectedBrand === 'llm' ? 'openai' : detectedBrand;
        return LLM_MODELS_BY_PROVIDER[brand] || [
            { id: 'gpt-4o', name: 'GPT-4o (Universal Fallback)' },
            { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
        ];
    }, [detectedBrand, isLLM, selectedNode, LLM_MODELS_BY_PROVIDER]);

    const handleInstantChange = useCallback((field, value) => {
        if (!selectedNode) return;
        const newData = { ...selectedNode.data, [field]: value };
        if (onUpdateNode) {
            onUpdateNode(selectedNode.id, newData);
        } else if (onUpdate) {
            onUpdate(newData);
        }
    }, [selectedNode, onUpdateNode, onUpdate]);

    // Auto-select model if empty or invalid
    useEffect(() => {
        if (isLLM && availableModels.length > 0 && selectedNode) {
            const currentModel = draftData.model;
            const isValid = availableModels.some(m => m.id === currentModel);
            
            if (!currentModel || !isValid) {
                const defaultModel = availableModels[0].id;
                console.log(`[ConfigPanel] Auto-selecting model for ${detectedBrand}: ${defaultModel}`);
                handleInstantChange('model', defaultModel);
            }
        }
    }, [selectedNode?.id, detectedBrand, availableModels, isLLM, draftData.model, handleInstantChange]);

    useEffect(() => {
        if (selectedNode) {
            setDraftData(selectedNode.data || {});
            const rawPolicies = selectedNode.data?.policies || {};
            setPolicies({
                ...DEFAULT_POLICIES,
                ...rawPolicies,
                forbidden_keywords: rawPolicies.forbidden_keywords?.length
                    ? rawPolicies.forbidden_keywords
                    : (rawPolicies.forbidden_words || DEFAULT_POLICIES.forbidden_keywords),
            });
            setPoliciesSaved(false);
            setNavigationStack([]); 
            setSearchTarget('');
        }
    }, [selectedNode?.id]);

    const fetchTargets = useCallback(async (provider, type, parent = null) => {
        if (!provider || !type) return;
        setIsLoadingTargets(true);
        try {
            let url = '';
            // Trello
            if (provider === 'trello') {
                if (!parent) url = `/api/trello/boards?type=${type}`;
                else if (parent.type === 'board') url = `/api/trello/lists?type=${type}&boardId=${parent.id}`;
                else if (parent.type === 'list') url = `/api/trello/cards?type=${type}&listId=${parent.id}`;
            } 
            // GitHub
            else if (provider === 'github') {
                if (!parent) url = `/api/github/repositories?type=${type}`;
                else if (parent.type === 'repo' && parent.subType === 'issues') url = `/api/github/issues?type=${type}&repo=${parent.id}`;
                else if (parent.type === 'repo' && parent.subType === 'projects') url = `/api/github/projects?type=${type}&repo=${parent.id}`;
            }
            // Slack
            else if (provider === 'slack') {
                url = `/api/slack/channels?type=${type}`;
            }

            if (url) {
                const res = await fetch(url);
                const data = await res.json();
                if (res.ok) {
                    const list = data.channels || data.repositories || data.boards || data.lists || data.issues || data.projects || [];
                    setAvailableTargets(list);
                } else {
                    console.error(`[ConfigPanel] Fetch failed: ${res.status}`, data);
                }
            } else {
                setAvailableTargets([]);
            }
        } catch (e) {
            console.error('Error fetching targets:', e);
        } finally {
            setIsLoadingTargets(false);
        }
    }, []);

    const persistAgentResource = useCallback(async ({ provider, connectionType, externalId, name, resourceType, metadata, selected }) => {
        if (!agentId) return;
        try {
            const method = selected ? 'POST' : 'DELETE';
            await fetch(`/api/agents/${agentId}/resources`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    connection_type: connectionType,
                    // optional: if nodes start carrying it later
                    connection_id: selectedNode?.data?.connection_id || null,
                    external_id: externalId,
                    name,
                    resource_type: resourceType,
                    metadata
                })
            });
        } catch (e) {
            console.error('[ConfigPanel] Failed to persist agent resource', e);
        }
    }, [agentId, selectedNode?.data?.connection_id, selectedNode]);

    useEffect(() => {
        if (selectedNode?.type === 'toolNode') {
            const rawLabel = (selectedNode.data.label || '').toLowerCase();
            const rawProvider = (selectedNode.data.provider || '').toLowerCase();
            const logoDomain = (selectedNode.data.logoDomain || '').toLowerCase();
            
            let dp = rawProvider;
            if (!dp || dp === 'custom') {
                if (rawLabel.includes('github') || logoDomain.includes('github')) dp = 'github';
                else if (rawLabel.includes('slack') || logoDomain.includes('slack')) dp = 'slack';
                else if (rawLabel.includes('trello') || logoDomain.includes('trello')) dp = 'trello';
                else if (rawLabel.includes('notion')) dp = 'notion';
                else if (selectedNode.type === 'knowledgeNode') dp = 'knowledge';
            }
            
            const source = selectedNode.data.config?.source || 'team';
            const currentLevel = navigationStack[navigationStack.length - 1] || null;
            
            if (dp && dp !== 'custom') {
                fetchTargets(dp, source, currentLevel);
            }
        }
    }, [selectedNode?.id, selectedNode?.data?.config?.source, selectedNode?.data?.provider, selectedNode?.data?.label, selectedNode?.data?.logoDomain, navigationStack, fetchTargets]);

    const handleDraftChange = useCallback((field, value) => {
        setDraftData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSaveText = useCallback((field) => {
        if (selectedNode && draftData[field] !== selectedNode.data[field]) {
            onUpdateNode(selectedNode.id, { [field]: draftData[field] });
        }
    }, [selectedNode, draftData, onUpdateNode]);

    const handleApplyPlaceholders = useCallback(() => {
        if (!selectedNode) return;
        let prompt = draftData.system_prompt || '';
        for (const [key, val] of Object.entries(placeholderValues)) {
            if (val && val.trim()) prompt = prompt.replaceAll(`[${key}]`, val.trim());
        }
        setDraftData(prev => ({ ...prev, system_prompt: prompt }));
        onUpdateNode(selectedNode.id, { system_prompt: prompt });
        setPlaceholderValues({});
    }, [selectedNode, draftData.system_prompt, placeholderValues, onUpdateNode]);

    const handlePolicyUpdate = useCallback((field, value) => {
        setPolicies(prev => ({ ...prev, [field]: value }));
        setPoliciesSaved(false);
    }, []);

    const handleSavePolicies = useCallback(() => {
        if (selectedNode) {
            onUpdateNode(selectedNode.id, { policies });
            setPoliciesSaved(true);
            setTimeout(() => setPoliciesSaved(false), 2000);
        }
    }, [selectedNode, policies, onUpdateNode]);

    if (!selectedNode) return null;

    const brandThemes = {
        slack: { name: 'SLACK', color: 'text-[#4A154B]', bg: 'bg-[#4A154B]', lightBg: 'bg-[#4A154B]/5', border: 'border-[#4A154B]/20', domain: 'slack.com', targets: 'Canaux & DMs' },
        github: { name: 'GITHUB', color: 'text-slate-900', bg: 'bg-slate-900', lightBg: 'bg-slate-900/5', border: 'border-slate-900/20', domain: 'github.com', targets: 'Répertoires' },
        trello: { name: 'TRELLO', color: 'text-[#0052CC]', bg: 'bg-[#0052CC]', lightBg: 'bg-[#0052CC]/5', border: 'border-[#0052CC]/20', domain: 'trello.com', targets: 'Tableaux' },
        notion: { name: 'NOTION', color: 'text-slate-800', bg: 'bg-slate-800', lightBg: 'bg-slate-800/5', border: 'border-slate-800/20', domain: 'notion.so', targets: 'Pages' },
        verytis: { name: 'VERYTIS', color: 'text-rose-600', bg: 'bg-rose-600', lightBg: 'bg-rose-600/5', border: 'border-rose-600/20', logo: '/verytis-governance-logo.png' },
        openai: { name: 'OPENAI', color: 'text-[#10a37f]', bg: 'bg-[#10a37f]', lightBg: 'bg-[#10a37f]/5', border: 'border-[#10a37f]/20', domain: 'openai.com' },
        anthropic: { name: 'ANTHROPIC', color: 'text-[#D97757]', bg: 'bg-[#D97757]', lightBg: 'bg-[#D97757]/5', border: 'border-[#D97757]/20', domain: 'anthropic.com' },
        google: { name: 'GOOGLE', color: 'text-[#4285F4]', bg: 'bg-[#4285F4]', lightBg: 'bg-[#4285F4]/5', border: 'border-[#4285F4]/20', domain: 'gemini.google.com' },
        knowledge: { name: 'KNOWLEDGE', color: 'text-blue-600', bg: 'bg-blue-600', lightBg: 'bg-blue-50', border: 'border-blue-100', domain: 'database.verytis.com', targets: 'Sources' },
    };

    const activeTheme = brandThemes[detectedBrand] || { name: 'CONFIGURATION', color: 'text-blue-600', bg: 'bg-blue-600', lightBg: 'bg-blue-50', border: 'border-blue-100', targets: 'Cibles' };

    return (
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full z-10 shadow-xl shrink-0 right-0 top-0 absolute lg:relative animate-in slide-in-from-right-8 duration-200">
            {/* Header */}
            <div className={`p-4 border-b border-slate-100 flex items-center justify-between ${isGuardrail ? 'bg-rose-50/30' : activeTheme.lightBg}`}>
                <div className="flex items-center gap-2">
                    {isGuardrail ? <AlertTriangle className="w-4 h-4 text-rose-500" /> : <div className={`w-2 h-2 rounded-full ${activeTheme.bg} animate-pulse shadow-[0_0_8px] shadow-current opacity-70`} />}
                    <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isGuardrail ? 'text-rose-900' : 'text-slate-900'}`}>
                        {isGuardrail ? 'Verytis Governance' : isTool ? `${activeTheme.name} INTEGRATION` : 'AGENT CONFIG'}
                    </h2>
                </div>
                <div className="flex items-center gap-1.5">
                    {hasPlaceholders && (
                        <div className="relative" title={`${detectedPlaceholders.length} variable(s) à configurer`}>
                            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"><AlertCircle className="w-3 h-3 text-white" /></div>
                        </div>
                    )}
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-white/50 rounded-lg transition-all"><X className="w-4 h-4" /></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pb-12">
                {/* ── Brand Banner (Premium Tool/Governance Header) ────────── */}
                {(isTool || isGuardrail) && (activeTheme.domain || activeTheme.logo) && (
                    <div className="relative px-5 pt-8 pb-6 flex flex-col items-center text-center overflow-hidden border-b border-slate-100">
                        <div className={`absolute top-0 inset-x-0 h-1 ${activeTheme.bg} opacity-20`} />
                        <div className="relative mb-4 group">
                            <div className={`absolute -inset-4 rounded-full ${activeTheme.bg} opacity-5 blur-xl group-hover:opacity-10 transition-opacity`} />
                            <div className={`w-20 h-20 bg-white rounded-3xl shadow-2xl border ${activeTheme.border} flex items-center justify-center overflow-hidden p-4`}>
                                <img 
                                    src={activeTheme.logo || `https://www.google.com/s2/favicons?domain=${activeTheme.domain}&sz=128`} 
                                    alt={activeTheme.name} 
                                    className="w-12 h-12 object-contain" 
                                />
                            </div>
                            {selectedNode.data.connectedProviders?.some(p => (p.provider === detectedBrand || p.id === detectedBrand) && p.status === 'Connected') && (
                                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-lg border border-slate-100">
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">{selectedNode.data.label || 'Intégration'}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{activeTheme.name} API NODE</p>
                        </div>
                    </div>
                )}

                <div className="px-5 space-y-6">
                    {/* Node Info */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">INFORMATIONS</h3>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Description / Rôle</label>
                            <textarea
                                rows={3}
                                value={draftData.description || ''}
                                onChange={e => handleDraftChange('description', e.target.value)}
                                onBlur={() => handleSaveText('description')}
                                className="w-full text-[11px] px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none font-medium text-slate-600 shadow-sm"
                             placeholder="A quoi sert ce bloc ?"
                            />
                        </div>
                    </div>

                    {/* 1. LLM / Brain Section */}
                    {isLLM && (
                        <div className="space-y-6 pt-2">
                             <div className="flex items-center justify-between">
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${activeTheme.color}`}>Cerveau &amp; Personnalité</h3>
                                <div className={`h-px flex-1 ml-4 ${activeTheme.bg} opacity-10`} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-900 uppercase">Modèle IA</label>
                                <select
                                    value={draftData.model || ''}
                                    onChange={e => handleInstantChange('model', e.target.value)}
                                    className="w-full text-xs font-bold px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 shadow-sm transition-all"
                                >
                                    <option value="">Sélectionner un modèle...</option>
                                    {availableModels.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-900 uppercase flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-blue-500" /> Instructions Systèmes (Prompt)</label>
                                <textarea
                                    rows={8}
                                    value={draftData.system_prompt || ''}
                                    onChange={e => handleDraftChange('system_prompt', e.target.value)}
                                    onBlur={() => handleSaveText('system_prompt')}
                                    className="w-full text-[11px] leading-relaxed font-mono px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all resize-none shadow-inner"
                                    placeholder="Décrivez comment l'agent doit se comporter..."
                                />
                            </div>
                        </div>
                    )}

                    {/* 2. Knowledge Base Section (Dedicated Node) */}
                    {isKnowledge && (
                        <KnowledgeBaseSettings 
                            agentId={agentId} 
                            orgId={orgId} 
                            knowledge={draftData.knowledge_configuration || {}} 
                            onUpdate={(val) => handleInstantChange('knowledge_configuration', val)}
                        />
                    )}

                    <div className="h-px bg-slate-100/50 mx-1" />


                    {/* Tool Node Config */}
                    {isTool && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center justify-between">
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${activeTheme.color}`}>Configuration &amp; Accès</h3>
                                <div className={`h-px flex-1 ml-4 ${activeTheme.bg} opacity-10`} />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Environnement source</label>
                                <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/50">
                                    <button
                                        onClick={() => handleInstantChange('config', { ...selectedNode.data.config, source: 'team' })}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-extrabold transition-all duration-300 ${selectedNode.data.config?.source !== 'personal' ? 'bg-white shadow-xl text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        <Shield className={`w-3.5 h-3.5 ${selectedNode.data.config?.source !== 'personal' ? 'text-blue-500' : 'text-slate-400'}`} /> TEAM
                                    </button>
                                    <button
                                        onClick={() => handleInstantChange('config', { ...selectedNode.data.config, source: 'personal' })}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-extrabold transition-all duration-300 ${selectedNode.data.config?.source === 'personal' ? 'bg-white shadow-xl text-amber-600' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        <User className={`w-3.5 h-3.5 ${selectedNode.data.config?.source === 'personal' ? 'text-amber-500' : 'text-slate-400'}`} /> PERSO
                                    </button>
                                </div>
                            </div>

                            {/* Targets Section */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <label className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">{activeTheme.targets} ({availableTargets.length})</label>
                                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                                            <span className="text-[9px] text-slate-400 whitespace-nowrap">Source</span>
                                            {navigationStack.map((step, i) => (
                                                <React.Fragment key={i}>
                                                    <ChevronRight className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                                                    <span className="text-[9px] font-bold text-blue-500 whitespace-nowrap bg-blue-50 px-1 rounded">{step.name}</span>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                    {navigationStack.length > 0 && (
                                        <button onClick={() => setNavigationStack(prev => prev.slice(0, -1))} className="shrink-0 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors group"><ChevronRight className="w-3.5 h-3.5 text-slate-600 rotate-180 transition-transform" /></button>
                                    )}
                                </div>

                                {detectedBrand === 'slack' && (
                                    <div className="flex flex-col gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Mode Fil de Discussion</span>
                                            </div>
                                            <button
                                                onClick={() => handleInstantChange('config', { ...selectedNode.data.config, thread_mode: !selectedNode.data.config?.thread_mode })}
                                                className={`w-10 h-5 rounded-full transition-all duration-300 relative border-2 ${selectedNode.data.config?.thread_mode ? 'bg-blue-600 border-blue-600' : 'bg-slate-200 border-slate-200 hover:bg-slate-300'}`}
                                            >
                                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm ${selectedNode.data.config?.thread_mode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-blue-900/60 leading-relaxed font-medium">
                                            Activez ceci pour que l'agent réponde dans le fil (thread) au lieu de poster un nouveau message.
                                        </p>
                                    </div>
                                )}

                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Filtrer les cibles..."
                                        value={searchTarget}
                                        onChange={e => setSearchTarget(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                                    />
                                </div>

                                <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-2xl bg-slate-50/50 p-2 space-y-4 shadow-inner">
                                    {isLoadingTargets ? (
                                        <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-40">
                                            <Clock className="w-8 h-8 animate-spin text-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Chargement...</span>
                                        </div>
                                    ) : availableTargets.filter(t => (t.name || '').toLowerCase().includes(searchTarget.toLowerCase())).length === 0 ? (
                                        <div className="py-10 text-center flex flex-col items-center gap-3">
                                            <Database className="w-8 h-8 text-slate-300" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Aucun résultat</span>
                                            {(detectedBrand === 'github' || detectedBrand === 'slack' || detectedBrand === 'trello') && (
                                                <button
                                                    onClick={async () => {
                                                        const provider = detectedBrand;
                                                        const connectionType = selectedNode?.data?.connection_type === 'personal' ? 'personal' : 'team';
                                                        
                                                        // Reproduire la logique de /settings pour lancer exactement le bon flow
                                                        if (provider === 'github') {
                                                            const width = 600;
                                                            const height = 700;
                                                            const left = (window.screen.width - width) / 2;
                                                            const top = (window.screen.height - height) / 2;

                                                            // Team vs Perso
                                                            if (connectionType === 'team') {
                                                                // Même URL que bouton TEAM CONNECTION
                                                                window.open(
                                                                    `/api/auth/github/install`,
                                                                    'GitHubConnect',
                                                                    `width=${width},height=${height},top=${top},left=${left}`
                                                                );
                                                            } else {
                                                                // Même URL que PERSONAL ACCOUNT CONNECTION
                                                                window.open(
                                                                    `/api/auth/github/login?type=user_link`,
                                                                    'GitHubConnectPersonal',
                                                                    `width=${width},height=${height},top=${top},left=${left}`
                                                                );
                                                            }
                                                        } else if (provider === 'slack') {
                                                            const query = connectionType === 'team'
                                                                ? ''
                                                                : ''; // pour l’instant même flow que settings (install) pour perso
                                                            window.location.href = `/api/slack/install${query}`;
                                                        } else if (provider === 'trello') {
                                                            const width = 600;
                                                            const height = 700;
                                                            const left = (window.screen.width - width) / 2;
                                                            const top = (window.screen.height - height) / 2;
                                                            const base = connectionType === 'team'
                                                                ? '/api/auth/trello/login?type=integration'
                                                                : '/api/auth/trello/login?type=user_link';
                                                            window.open(
                                                                base,
                                                                'TrelloConnect',
                                                                `width=${width},height=${height},top=${top},left=${left}`
                                                            );
                                                        }
                                                    }}
                                                    className="mt-1 px-4 py-2 rounded-2xl bg-slate-900 text-white text-[10px] font-bold tracking-wider uppercase hover:bg-slate-800 shadow-md flex items-center justify-center gap-2"
                                                >
                                                    {/* Logo aligné avec Settings */}
                                                    {detectedBrand === 'github' && (
                                                        <Github className="w-4 h-4" />
                                                    )}
                                                    {detectedBrand === 'slack' && (
                                                        <img
                                                            src="https://www.google.com/s2/favicons?domain=slack.com&sz=128"
                                                            alt="Slack"
                                                            className="w-4 h-4 object-contain"
                                                        />
                                                    )}
                                                    {detectedBrand === 'trello' && (
                                                        <img
                                                            src="https://www.google.com/s2/favicons?domain=trello.com&sz=128"
                                                            alt="Trello"
                                                            className="w-4 h-4 object-contain"
                                                        />
                                                    )}
                                                    {selectedNode?.data?.connection_type === 'personal'
                                                        ? 'PERSONAL ACCOUNT CONNECTION'
                                                        : 'TEAM CONNECTION'}
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        Object.entries(
                                            availableTargets
                                                .filter(t => (t.name || '').toLowerCase().includes(searchTarget.toLowerCase()))
                                                .reduce((acc, t) => {
                                                    let group = 'Général';
                                                    if (detectedBrand === 'slack') group = t.is_im ? 'Messages Directs' : 'Canaux';
                                                    else if (detectedBrand === 'github' && !navigationStack.length) group = 'Dépôts';
                                                    else if (detectedBrand === 'trello' && !navigationStack.length) group = 'Tableaux';
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
                                                    const currentLevel = navigationStack[navigationStack.length - 1];
                                                    const isTerminal = (detectedBrand === 'slack') || (detectedBrand === 'github') || (detectedBrand === 'trello' && currentLevel?.type === 'list');
                                                    const targetIdentifier = `${currentLevel ? currentLevel.id + ':' : ''}${target.id}`;
                                                    const isSelected = selectedNode.data.config?.targets?.some(t => t.id === targetIdentifier);
                                                    
                                                    let icon = <Hash className="w-4 h-4" />;
                                                    let typeLabel = 'Canal';
                                                    if (detectedBrand === 'slack' && target.is_im) { icon = <User className="w-4 h-4" />; typeLabel = 'DM'; }
                                                    else if (detectedBrand === 'github' && !currentLevel) { icon = <Box className="w-4 h-4" />; typeLabel = 'Dépôt'; }
                                                    else if (detectedBrand === 'trello' && !currentLevel) { icon = <LayoutDashboard className="w-4 h-4" />; typeLabel = 'Tableau'; }

                                                    return (
                                                        <button
                                                            key={target.id}
                                                            onClick={() => {
                                                                if (isTerminal) {
                                                                    const current = selectedNode.data.config?.targets || [];
                                                                    const next = isSelected ? current.filter(t => t.id !== targetIdentifier) : [...current, { id: targetIdentifier, name: target.name, type: typeLabel.toLowerCase() }];
                                                                    handleInstantChange('config', { ...selectedNode.data.config, targets: next });

                                                                    // Persist selection for APP triggers (Slack/GitHub/Trello)
                                                                    const provider = detectedBrand;
                                                                    const connectionType = selectedNode.data.config?.source || selectedNode.data.connection_type || 'team';
                                                                    const externalId = detectedBrand === 'github'
                                                                        ? target.name // full_name
                                                                        : target.id;
                                                                    persistAgentResource({
                                                                        provider,
                                                                        connectionType,
                                                                        externalId,
                                                                        name: target.name,
                                                                        resourceType: typeLabel.toLowerCase(),
                                                                        metadata: { targetIdentifier },
                                                                        selected: !isSelected
                                                                    });
                                                                } else {
                                                                    setNavigationStack([...navigationStack, { id: target.id, name: target.name, type: detectedBrand === 'trello' ? (currentLevel?.type === 'board' ? 'list' : 'board') : 'repo' }]);
                                                                    setSearchTarget('');
                                                                }
                                                            }}
                                                            className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl text-left transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' : 'bg-white border border-slate-200/50 text-slate-700 hover:border-blue-300 hover:shadow-md'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>{icon}</div>
                                                                <div>
                                                                    <div className="text-xs font-bold leading-tight truncate max-w-[160px]">{target.name}</div>
                                                                    <div className={`text-[9px] font-bold uppercase tracking-tight opacity-60`}>{typeLabel}</div>
                                                                </div>
                                                            </div>
                                                            {isSelected ? <CheckCircle2 className="w-4 h-4" /> : !isTerminal && <ChevronRight className="w-4 h-4 opacity-30" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}


                    {/* ── Governance Section (for Guardrail nodes) ──── */}
                    {isGuardrail && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600">Politiques de Gouvernance</h3>
                                <div className="h-px flex-1 ml-4 bg-rose-600 opacity-10" />
                            </div>

                            <div className="space-y-6">
                                {/* Finance */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 opacity-50">
                                        <div className="h-px flex-1 bg-rose-600" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-rose-900">Finance & Quotas</span>
                                        <div className="h-px flex-1 bg-rose-600" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <PanelNumField
                                            label="Budget Jour ($)"
                                            value={policies.budget_daily_max}
                                            onChange={val => handlePolicyUpdate('budget_daily_max', val)}
                                            placeholder="Ex: 50"
                                        />
                                        <PanelNumField
                                            label="Budget / Req ($)"
                                            value={policies.budget_per_request_max}
                                            onChange={val => handlePolicyUpdate('budget_per_request_max', val)}
                                            placeholder="Ex: 1"
                                        />
                                    </div>
                                </div>

                                {/* Sécurité */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 opacity-50">
                                        <div className="h-px flex-1 bg-rose-600" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-rose-900">Sécurité & Filtres</span>
                                        <div className="h-px flex-1 bg-rose-600" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Mots-clés interdits</label>
                                        <PanelTagInput
                                            tags={policies.forbidden_keywords}
                                            mandatoryTags={orgSettings?.global_blocked_keywords || []}
                                            onChange={tags => handlePolicyUpdate('forbidden_keywords', tags)}
                                            placeholder="MOT_CLE"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Actions à valider</label>
                                        <PanelTagInput
                                            tags={policies.require_approval}
                                            mandatoryTags={orgSettings?.global_require_approval || []}
                                            onChange={tags => handlePolicyUpdate('require_approval', tags)}
                                            placeholder="ACTION"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Scopes autorisés</label>
                                        <PanelTagInput
                                            tags={policies.allowed_scopes}
                                            onChange={tags => handlePolicyUpdate('allowed_scopes', tags)}
                                            placeholder="SCOPE_API"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Actions bloquées</label>
                                        <PanelTagInput
                                            tags={policies.blocked_actions}
                                            onChange={tags => handlePolicyUpdate('blocked_actions', tags)}
                                            placeholder="BLOCKED_ACTION"
                                        />
                                    </div>
                                </div>

                                {/* Fiabilité */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 opacity-50">
                                        <div className="h-px flex-1 bg-rose-600" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-rose-900">Fiabilité & Performance</span>
                                        <div className="h-px flex-1 bg-rose-600" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <PanelNumField
                                            label="Échecs Max"
                                            value={policies.max_consecutive_failures}
                                            onChange={val => handlePolicyUpdate('max_consecutive_failures', val)}
                                            placeholder="3"
                                        />
                                        <PanelNumField
                                            label="Score Confiance"
                                            value={policies.min_confidence_score}
                                            onChange={val => handlePolicyUpdate('min_confidence_score', val)}
                                            placeholder="0.8"
                                            step="0.1"
                                        />
                                        <PanelNumField
                                            label="Retries Max"
                                            value={policies.max_retries}
                                            onChange={val => handlePolicyUpdate('max_retries', val)}
                                            placeholder="5"
                                        />
                                        <PanelNumField
                                            label="Rate Limit / min"
                                            value={policies.rate_limit_per_min}
                                            onChange={val => handlePolicyUpdate('rate_limit_per_min', val)}
                                            placeholder="100"
                                        />
                                    </div>
                                </div>

                                {/* Planification */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 opacity-50">
                                        <div className="h-px flex-1 bg-rose-600" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-rose-900">Heures d'activité</span>
                                        <div className="h-px flex-1 bg-rose-600" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <PanelNumField
                                            label="Début (HH)"
                                            value={policies.active_hours_start}
                                            onChange={val => handlePolicyUpdate('active_hours_start', val)}
                                            placeholder="08"
                                            min={0}
                                            max={23}
                                        />
                                        <PanelNumField
                                            label="Fin (HH)"
                                            value={policies.active_hours_end}
                                            onChange={val => handlePolicyUpdate('active_hours_end', val)}
                                            placeholder="18"
                                            min={0}
                                            max={23}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleSavePolicies}
                                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${policiesSaved ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-md'}`}
                                >
                                    {policiesSaved ? <><CheckCircle2 className="w-4 h-4" /> Sauvegardé</> : <><Save className="w-4 h-4" /> Appliquer la gouvernance</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
