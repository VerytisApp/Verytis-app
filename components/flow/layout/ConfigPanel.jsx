'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Settings2, X, Sparkles, AlertTriangle, AlertCircle, Database, Clock, Save, CheckCircle2, Shield, Box, ChevronRight, Hash, User, Key, FileText, LayoutDashboard, ListTodo, Github } from 'lucide-react';
import KnowledgeBaseSettings from './KnowledgeBaseSettings';
import LLMConfig from './config/LLMConfig';
import KnowledgeConfig from './config/KnowledgeConfig';
import SlackConfig from './config/SlackConfig';
import TrelloConfig from './config/TrelloConfig';
import GitHubConfig from './config/GitHubConfig';
import ShopifyConfig from './config/ShopifyConfig';
import StripeConfig from './config/StripeConfig';
import GoogleWorkspaceConfig from './config/GoogleWorkspaceConfig';
import YouTubeConfig from './config/YouTubeConfig';
import StreamlabsConfig from './config/StreamlabsConfig';
import TikTokConfig from './config/TikTokConfig';
import GovernanceConfig from './config/GovernanceConfig';
import TargetingList from './config/TargetingList';
import { PanelTagInput, PanelNumField } from './config/ConfigUtils';
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

const FALLBACK_MODELS = [
    { id: 'gpt-4o', name: 'GPT-4o (Universal Fallback)' },
    { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
];

export default function ConfigPanel({ selectedNode, orgSettings, agentId, orgId, onUpdateNode, onUpdate, onClose, onDelete }) {
    const [draftData, setDraftData] = useState({});
    
    // Stable Ref for node data to prevent loop-inducing useEffect dependencies
    const nodeRef = React.useRef(selectedNode);
    useEffect(() => { nodeRef.current = selectedNode; }, [selectedNode]);

    const handleInstantChange = useCallback((field, value) => {
        const node = nodeRef.current;
        if (!node) return;
        
        // Update local draft for UI consistency
        setDraftData(prev => ({ ...prev, [field]: value }));
        
        const newData = { ...node.data, [field]: value };
        if (onUpdateNode) {
            onUpdateNode(node.id, newData);
        } else if (onUpdate) {
            onUpdate(newData);
        }
    }, [onUpdateNode, onUpdate]);

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
        verytis: [
            { id: 'gpt-4o', name: 'VerytisAI (Standard)' },
            { id: 'gpt-4o-mini', name: 'VerytisAI Mini' }
        ],
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
        ],
        ollama: [
            { id: 'llama3.1', name: 'Llama 3.1 8B' },
            { id: 'llama3.1:70b', name: 'Llama 3.1 70B' },
            { id: 'mistral', name: 'Mistral' }
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
        } else if (brand === 'verytis' || rawLabel_low.includes('verytis')) {
            brand = 'verytis_ai';
        } else if (brand === 'ollama' || brand === 'llama3' || rawLabel_low.includes('ollama') || rawLabel_low.includes('llama')) {
            brand = 'ollama';
        } else if (!brand || brand === 'custom' || brand === 'llm') {
            if (rawLabel_low.includes('github') || (selectedNode.data?.logoDomain || '').includes('github')) brand = 'github';
            else if (rawLabel_low.includes('slack') || (selectedNode.data?.logoDomain || '').includes('slack')) brand = 'slack';
            else if (rawLabel_low.includes('trello') || (selectedNode.data?.logoDomain || '').includes('trello')) brand = 'trello';
            else if (rawLabel_low.includes('notion')) brand = 'notion';
            else if (rawLabel_low.includes('shopify')) brand = 'shopify';
            else if (rawLabel_low.includes('openai')) brand = 'openai';
            else if (rawLabel_low.includes('anthropic')) brand = 'anthropic';
            else if (rawLabel_low.includes('stripe')) brand = 'stripe';
            else if (rawLabel_low.includes('youtube')) brand = 'youtube';
            else if (rawLabel_low.includes('streamlabs') || rawLabel_low.includes('stream labs')) brand = 'streamlabs';
            else if (rawLabel_low.includes('tiktok')) brand = 'tiktok';
            else if (rawLabel_low.includes('google') || 
                     rawLabel_low.includes('workspace') || 
                     rawLabel_low.includes('drive') || 
                     rawLabel_low.includes('calendar') || 
                     rawLabel_low.includes('agenda') ||
                     rawLabel_low.includes('gmail') ||
                     rawLabel_low.includes('mail') ||
                     rawLabel_low.includes('email') ||
                     rawProvider_low === 'google' ||
                     rawProvider_low === 'gmail' ||
                     rawProvider_low === 'drive' ||
                     rawProvider_low === 'calendar' ||
                     (selectedNode.data?.logoDomain || '').includes('google')) brand = 'google_workspace';
        }
        return brand;
    }, [selectedNode, isGuardrail]);
    
    const isConnected = useMemo(() => {
        if (!selectedNode || isGuardrail || isLLM || isKnowledge) return true;
        if (!detectedBrand) return true; // Default to showing if no specific brand detected (generic tools)
        
        const providers = selectedNode.data?.connectedProviders || [];
        return providers.some(p => {
            if (p.status !== 'Connected') return false;
            
            const pId = (p.provider || p.id || '').toLowerCase();
            const pDomain = (p.domain || '').toLowerCase();
            
            // Flexible matching (same as ToolNode and Builder)
            const isGoogleMatch = (detectedBrand === 'google_workspace' || detectedBrand === 'google') && 
                                  (pId.includes('google') || pId.includes('workspace') || pDomain.includes('google'));
            const isMatch = isGoogleMatch || pId.includes(detectedBrand) || pDomain.includes(detectedBrand);
            
            return isMatch;
        });
    }, [selectedNode, isGuardrail, isLLM, isKnowledge, detectedBrand]);

    const availableModels = useMemo(() => {
        if (!isLLM || !selectedNode) return [];
        let brand = detectedBrand === 'llm' ? 'openai' : detectedBrand;
        if (brand === 'verytis_ai') brand = 'verytis';
        return LLM_MODELS_BY_PROVIDER[brand] || FALLBACK_MODELS;
    }, [detectedBrand, isLLM, selectedNode?.id]);

    const [metadata, setMetadata] = useState({ boards: [], lists: [], repos: [] });
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

    // Fetch Metadata for Trello/GitHub
    useEffect(() => {
        if (selectedNode?.type !== 'toolNode') return;
        
        async function loadMetadata() {
            setIsLoadingMetadata(true);
            try {
                if (detectedBrand === 'trello') {
                    const res = await fetch('/api/integrations/trello/metadata');
                    const data = await res.json();
                    if (res.ok) setMetadata(prev => ({ ...prev, boards: data.items || [] }));
                    
                    if (selectedNode.data.config?.board_id && selectedNode.data.config?.board_id !== 'auto') {
                        const lRes = await fetch(`/api/integrations/trello/metadata?boardId=${selectedNode.data.config.board_id}`);
                        const lData = await lRes.json();
                        if (lRes.ok) setMetadata(prev => ({ ...prev, lists: lData.items || [] }));
                    } else if (selectedNode.data.config?.board_id === 'auto') {
                        setMetadata(prev => ({ ...prev, lists: [] }));
                    }
                } else if (detectedBrand === 'github') {
                    const res = await fetch('/api/integrations/github/metadata');
                    const data = await res.json();
                    if (res.ok) setMetadata(prev => ({ ...prev, repos: data.items || [] }));
                } else if (detectedBrand === 'google_workspace') {
                    const lowLabel = (selectedNode.data?.label || '').toLowerCase();
                    const isDrive = lowLabel.includes('drive') || lowLabel.includes('fichier') || lowLabel.includes('stockage');
                    const isCalendar = lowLabel.includes('calendar') || lowLabel.includes('agenda') || lowLabel.includes('calendrier');
                    
                    let endpoint = null;
                    if (isDrive) endpoint = '/api/integrations/google/metadata?type=drive_folders';
                    else if (isCalendar) endpoint = '/api/integrations/google/metadata?type=calendars';

                    if (endpoint) {
                        const res = await fetch(endpoint);
                        const data = await res.json();
                        if (res.ok) setMetadata(prev => ({ ...prev, google_items: data || [] }));
                    }
                } else if (detectedBrand === 'youtube') {
                    const res = await fetch('/api/integrations/youtube/metadata');
                    const data = await res.json();
                    if (res.ok) setMetadata(prev => ({ ...prev, channels: data.items || [] }));
                } else if (detectedBrand === 'streamlabs') {
                    const res = await fetch('/api/integrations/streamlabs/metadata');
                    const data = await res.json();
                    if (res.ok) setMetadata(prev => ({ ...prev, streamlabs_user: data.user || null, recent_donations: data.recent_donations || [] }));
                } else if (detectedBrand === 'tiktok') {
                    const res = await fetch('/api/integrations/tiktok/metadata');
                    const data = await res.json();
                    if (res.ok) setMetadata(prev => ({ ...prev, tiktok_user: data.user || null }));
                }
            } catch (err) {
                console.error('Failed to load tool metadata:', err);
            } finally {
                setIsLoadingMetadata(false);
            }
        }
        
        loadMetadata();

        // ─── RENAME DOCK ───
        if (selectedNode?.data?.label === 'Slack Notification') {
            handleInstantChange('label', 'Slack API');
        }
    }, [selectedNode?.id, detectedBrand, selectedNode?.data?.connectedProviders]);

    const handleBoardChange = async (boardId) => {
        handleInstantChange('config', { ...selectedNode.data.config, board_id: boardId, list_id: '' });
        setIsLoadingMetadata(true);
        try {
            if (boardId === 'auto') {
                setMetadata(prev => ({ ...prev, lists: [] }));
                handleInstantChange('config', { ...selectedNode.data.config, board_id: boardId, list_id: 'auto' });
            } else {
                const res = await fetch(`/api/integrations/trello/metadata?boardId=${boardId}`);
                const data = await res.json();
                if (res.ok) setMetadata(prev => ({ ...prev, lists: data.items || [] }));
            }
        } finally {
            setIsLoadingMetadata(false);
        }
    };



    // Auto-select model if empty or invalid
    useEffect(() => {
        if (isLLM && availableModels.length > 0 && selectedNode) {
            const currentModel = draftData.model;
            const isValid = availableModels.some(m => m.id === currentModel);
            
            if (!currentModel || !isValid) {
                const defaultModel = availableModels[0].id;
                handleInstantChange('model', defaultModel);
            }
        }
    }, [selectedNode?.id, detectedBrand, availableModels, isLLM, draftData.model]);

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
            setAvailableTargets([]); // Fix: CLEAR TARGETS WHEN CHANGING NODE
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
            // Shopify
            else if (provider === 'shopify') {
                url = `/api/shopify/stores`;
            }

            if (url) {
                const res = await fetch(url);
                const data = await res.json();
                if (res.ok) {
                    let list = data.channels || data.repositories || data.boards || data.lists || data.issues || data.projects || data.stores || [];

                    console.log(`[ConfigPanel] Fetched ${list.length} targets for ${provider} (${type})`);
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

    // ── TARGET FILTERING LOGIC ──────────────────────────────────
    const filteredTargets = useMemo(() => {
        if (!selectedNode) return [];
        return availableTargets.filter(t => {
            const name = (t.name || '').toLowerCase();
            const search = searchTarget.toLowerCase();
            if (!name.includes(search)) return false;

            if (detectedBrand === 'slack') {
                const targetType = selectedNode?.data?.config?.target_type || 'channel';
                const isUser = t.is_im || t.is_mpim || t.is_user;
                if (targetType === 'user') return isUser;
                if (targetType === 'channel') return !isUser;
            }
            return true;
        });
    }, [availableTargets, detectedBrand, searchTarget, selectedNode?.data?.config?.target_type]);

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

    const brandThemes = {
        slack: { name: 'SLACK', color: 'text-[#4A154B]', bg: 'bg-[#4A154B]', lightBg: 'bg-[#4A154B]/5', border: 'border-[#4A154B]/20', domain: 'slack.com', targets: 'Canaux & DMs' },
        github: { name: 'GITHUB', color: 'text-slate-900', bg: 'bg-slate-900', lightBg: 'bg-slate-900/5', border: 'border-slate-900/20', domain: 'github.com', targets: 'Répertoires' },
        trello: { name: 'TRELLO', color: 'text-[#0052CC]', bg: 'bg-[#0052CC]', lightBg: 'bg-[#0052CC]/5', border: 'border-[#0052CC]/20', domain: 'trello.com', targets: 'Tableaux' },
        notion: { name: 'NOTION', color: 'text-slate-800', bg: 'bg-slate-800', lightBg: 'bg-slate-800/5', border: 'border-slate-800/20', domain: 'notion.so', targets: 'Pages' },
        verytis: { name: 'VERYTIS', color: 'text-rose-600', bg: 'bg-rose-600', lightBg: 'bg-rose-600/5', border: 'border-rose-600/20', logo: '/verytis-governance-logo.png' },
        openai: { name: 'OPENAI', color: 'text-[#10a37f]', bg: 'bg-[#10a37f]', lightBg: 'bg-[#10a37f]/5', border: 'border-[#10a37f]/20', domain: 'openai.com' },
        verytis_ai: { name: 'VERYTIS AI', color: 'text-blue-600', bg: 'bg-blue-600', lightBg: 'bg-blue-600/5', border: 'border-blue-600/20', logo: '/verytis-governance-logo.png' },
        ollama: { name: 'OLLAMA', color: 'text-slate-600', bg: 'bg-slate-600', lightBg: 'bg-slate-600/5', border: 'border-slate-600/20', domain: 'ollama.com' },
        anthropic: { name: 'ANTHROPIC', color: 'text-[#D97757]', bg: 'bg-[#D97757]', lightBg: 'bg-[#D97757]/5', border: 'border-[#D97757]/20', domain: 'anthropic.com' },
        google: { name: 'GOOGLE WORKSPACE', color: 'text-[#4285F4]', bg: 'bg-[#4285F4]', lightBg: 'bg-[#4285F4]/5', border: 'border-[#4285F4]/20', domain: 'gemini.google.com' },
        google_workspace: { name: 'GOOGLE WORKSPACE', color: 'text-[#4285F4]', bg: 'bg-[#4285F4]', lightBg: 'bg-[#4285F4]/5', border: 'border-[#4285F4]/20', logo: '/logos/google.svg', domain: 'workspace.google.com', targets: 'Dossiers/Agendas' },
        shopify: { name: 'SHOPIFY', color: 'text-[#008060]', bg: 'bg-[#008060]', lightBg: 'bg-[#008060]/5', border: 'border-[#008060]/20', domain: 'shopify.com', targets: 'Boutiques' },
        stripe: { name: 'STRIPE', color: 'text-[#635BFF]', bg: 'bg-[#635BFF]', lightBg: 'bg-[#635BFF]/5', border: 'border-[#635BFF]/20', domain: 'stripe.com', targets: 'Séquences IA' },
        youtube: { name: 'YOUTUBE', color: 'text-[#FF0000]', bg: 'bg-[#FF0000]', lightBg: 'bg-[#FF0000]/5', border: 'border-[#FF0000]/20', domain: 'youtube.com', targets: 'Chaînes' },
        streamlabs: { name: 'STREAMLABS', color: 'text-[#80F5D2]', bg: 'bg-[#09161D]', lightBg: 'bg-[#80F5D2]/5', border: 'border-[#80F5D2]/20', domain: 'streamlabs.com', targets: 'Alertes' },
        tiktok: { name: 'TIKTOK', color: 'text-[#FE2C55]', bg: 'bg-[#010101]', lightBg: 'bg-[#FE2C55]/5', border: 'border-[#FE2C55]/20', domain: 'tiktok.com', targets: 'Vidéos' },
        knowledge: { name: 'KNOWLEDGE', color: 'text-blue-600', bg: 'bg-blue-600', lightBg: 'bg-blue-50', border: 'border-blue-100', domain: 'database.verytis.com', targets: 'Sources' },
    };

    const activeTheme = useMemo(() => {
        const base = brandThemes[detectedBrand] || { name: 'CONFIGURATION', color: 'text-blue-600', bg: 'bg-blue-600', lightBg: 'bg-blue-50', border: 'border-blue-100', targets: 'Cibles' };
        
        if (detectedBrand === 'slack') {
            const targetType = selectedNode?.data?.config?.target_type || 'channel';
            return { ...base, targets: targetType === 'user' ? 'Messages Directs (DM)' : 'Canaux Publics/Privés' };
        }
        
        return base;
    }, [detectedBrand, selectedNode?.data?.config?.target_type]);

    if (!selectedNode) return null;

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
                            {isConnected && !isGuardrail && !isLLM && !isKnowledge && (
                                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-lg border border-slate-100">
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">{selectedNode.data.label || 'Intégration'}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{activeTheme.name} API</p>
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

                    {/* LLM / Brain Section */}
                    {isLLM && (
                        <LLMConfig 
                            data={draftData}
                            models={availableModels}
                            theme={activeTheme}
                            onDraftChange={handleDraftChange}
                            onSaveText={handleSaveText}
                            onInstantChange={handleInstantChange}
                        />
                    )}

                    {/* Knowledge Base Section */}
                    {isKnowledge && (
                        <KnowledgeConfig 
                            agentId={agentId}
                            orgId={orgId}
                            data={draftData}
                            onUpdate={handleInstantChange}
                        />
                    )}

                    {isTool && (
                        <div className="space-y-6">
                            {!isConnected ? (
                                <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in-95 duration-300">
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-amber-200 flex items-center justify-center">
                                        <Key className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black text-amber-900 uppercase tracking-tight">Connexion Requise</h4>
                                        <p className="text-[10px] text-amber-600 font-medium leading-relaxed">
                                            Autorisez Verytis à accéder à votre compte {activeTheme.name} pour configurer cet Agent.
                                        </p>
                                    </div>
                                    <div className="w-full pt-2">
                                        <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest italic">
                                            Cliquez sur "Connecter" dans le bloc central
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                            {detectedBrand === 'slack' && (
                                <SlackConfig 
                                    node={selectedNode}
                                    theme={activeTheme}
                                    targets={filteredTargets}
                                    isLoading={isLoadingTargets}
                                    search={searchTarget}
                                    setSearch={setSearchTarget}
                                    onUpdate={handleInstantChange}
                                    detectedBrand={detectedBrand}
                                />
                            )}

                            {detectedBrand === 'trello' && (
                                <TrelloConfig 
                                    node={selectedNode}
                                    theme={activeTheme}
                                    metadata={metadata}
                                    isLoadingMetadata={isLoadingMetadata}
                                    targets={filteredTargets}
                                    isLoadingTargets={isLoadingTargets}
                                    search={searchTarget}
                                    setSearch={setSearchTarget}
                                    onUpdate={handleInstantChange}
                                    onBoardChange={handleBoardChange}
                                    detectedBrand={detectedBrand}
                                />
                            )}

                            {detectedBrand === 'github' && (
                                <GitHubConfig 
                                    node={selectedNode}
                                    theme={activeTheme}
                                    metadata={metadata}
                                    targets={filteredTargets}
                                    isLoadingTargets={isLoadingTargets}
                                    search={searchTarget}
                                    setSearch={setSearchTarget}
                                    onUpdate={handleInstantChange}
                                    detectedBrand={detectedBrand}
                                />
                            )}

                            {detectedBrand === 'google_workspace' && (
                                <GoogleWorkspaceConfig 
                                    node={selectedNode}
                                    theme={activeTheme}
                                    metadata={metadata}
                                    isLoadingMetadata={isLoadingMetadata}
                                    onUpdate={handleInstantChange}
                                />
                            )}

                            {detectedBrand === 'stripe' && (
                                <StripeConfig 
                                    node={selectedNode}
                                    theme={activeTheme}
                                    onUpdate={handleInstantChange}
                                />
                            )}

                            {detectedBrand === 'shopify' && (
                                <ShopifyConfig 
                                    node={selectedNode}
                                    theme={activeTheme}
                                />
                            )}

                            {detectedBrand === 'youtube' && (
                                <YouTubeConfig 
                                    node={selectedNode}
                                    theme={activeTheme}
                                    metadata={metadata}
                                    onUpdate={handleInstantChange}
                                />
                            )}

                            {detectedBrand === 'streamlabs' && (
                                <StreamlabsConfig 
                                    node={selectedNode}
                                    theme={activeTheme}
                                    metadata={{ user: metadata.streamlabs_user, recent_donations: metadata.recent_donations }}
                                    onUpdate={handleInstantChange}
                                />
                            )}

                            {detectedBrand === 'tiktok' && (
                                <TikTokConfig 
                                    node={selectedNode}
                                    theme={activeTheme}
                                    metadata={{ user: metadata.tiktok_user }}
                                    onUpdate={handleInstantChange}
                                />
                            )}

                            {/* Fallback for other tools (e.g. Notion) */}
                            {!['slack', 'trello', 'github', 'shopify', 'google_workspace', 'stripe', 'youtube', 'streamlabs', 'tiktok'].includes(detectedBrand) && (
                                <TargetingList 
                                    targets={filteredTargets}
                                    isLoading={isLoadingTargets}
                                    search={searchTarget}
                                    setSearch={setSearchTarget}
                                    selectedTargets={selectedNode.data.config?.targets}
                                    onToggle={(target) => {
                                        const config = selectedNode.data.config || {};
                                        const current = config.targets || [];
                                        const exists = current.find(t => t.id === target.id);
                                        const next = exists 
                                            ? current.filter(t => t.id !== target.id)
                                            : [{ id: target.id, name: target.name }];
                                        handleInstantChange('config', { ...config, targets: next });
                                    }}
                                    detectedBrand={detectedBrand}
                                />
                            )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Hybrid Mode Description at the bottom of targeting */}
                    {isTool && !['shopify', 'stripe'].includes(detectedBrand) && (
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Ciblage Intelligent</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                Par défaut, si aucune source n'est sélectionnée ou si le mode <span className="text-blue-600 font-bold">Auto</span> est activé, l'Agent utilisera ses outils de recherche pour identifier dynamiquement la destination la plus pertinente (Canal Slack, Liste Trello, etc) en fonction du contexte de la requête.
                            </p>
                        </div>
                    )}

                    {/* Governance Section (for Guardrail nodes) */}
                    {isGuardrail && (
                        <GovernanceConfig 
                            policies={policies}
                            orgSettings={orgSettings}
                            policiesSaved={policiesSaved}
                            onPolicyUpdate={handlePolicyUpdate}
                            onSavePolicies={handleSavePolicies}
                        />
                    )}
                </div>
            </div>
        </aside>
    );
}
