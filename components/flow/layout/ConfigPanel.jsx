'use client';

import React, { useState, useEffect } from 'react';
import { Settings2, X, Sparkles, AlertTriangle } from 'lucide-react';

export default function ConfigPanel({ selectedNode, onUpdateNode, onClose }) {
    // Local draft state for text intensive fields (Description, Prompt) 
    // to avoid re-render lag while typing.
    const [draftData, setDraftData] = useState({});

    // 100% Instant Reactivity: Listen to provider and model changes from the canvas
    useEffect(() => {
        if (selectedNode) {
            setDraftData(selectedNode.data || {});
        }
    }, [
        selectedNode?.id,
        selectedNode?.data?.provider,
        selectedNode?.data?.model,
        selectedNode?.data?.description,
        selectedNode?.data?.system_prompt
    ]);

    if (!selectedNode) return null;

    // Fast update for select dropdowns
    const handleInstantChange = (field, value) => {
        const newData = { ...selectedNode.data, [field]: value };

        // Sync provider if model changes (extra safety)
        if (field === 'model') {
            const val = value.toLowerCase();
            if (val.includes('claude')) newData.provider = 'anthropic';
            else if (val.includes('gpt') || val.includes('o1')) newData.provider = 'openai';
            else if (val.includes('gemini')) newData.provider = 'google';
            else if (val.includes('custom')) newData.provider = 'custom';
        }

        onUpdateNode(selectedNode.id, newData);
    };

    // Buffered update for text fields
    const handleDraftChange = (field, value) => {
        setDraftData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveText = (field) => {
        if (draftData[field] !== selectedNode.data[field]) {
            onUpdateNode(selectedNode.id, { [field]: draftData[field] });
        }
    };

    const handleNestedChange = (parentField, field, value) => {
        const newParent = { ...(selectedNode.data[parentField] || {}), [field]: value };
        onUpdateNode(selectedNode.id, { [parentField]: newParent });
    };

    // Provider Detection: STRICTLY follow the node's choice
    const provider = selectedNode.data.provider;

    const modelInventory = {
        openai: [
            { id: 'gpt-4o', label: 'GPT-4o (Standard)' },
            { id: 'gpt-4o-mini', label: 'GPT-4o-mini (Rapide)' },
            { id: 'o1', label: 'o1 (Reasoning)' },
            { id: 'o1-mini', label: 'o1-mini' },
            { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
            { id: 'gpt-4', label: 'GPT-4 Legacy' },
            { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
        ],
        anthropic: [
            { id: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
            { id: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' },
            { id: 'claude-3-opus-latest', label: 'Claude 3 Opus' },
            { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet v2' },
            { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Original)' }
        ],
        google: [
            { id: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Exp)' },
            { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
            { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
            { id: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' }
        ],
        custom: [
            { id: 'custom-model', label: 'Custom Model' }
        ]
    };

    const providerConfig = {
        openai: { name: 'OpenAI', color: 'text-emerald-500', border: 'border-emerald-100', bg: 'bg-emerald-50/30' },
        anthropic: { name: 'Anthropic', color: 'text-orange-500', border: 'border-orange-100', bg: 'bg-orange-50/30' },
        google: { name: 'Google Gemini', color: 'text-blue-500', border: 'border-blue-100', bg: 'bg-blue-50/30' },
        custom: { name: 'Custom LLM', color: 'text-purple-500', border: 'border-purple-100', bg: 'bg-purple-50/30' }
    };

    const theme = providerConfig[provider] || { name: 'Configuration', color: 'text-slate-500', border: 'border-slate-100', bg: 'bg-slate-50/50' };

    return (
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full z-10 shadow-xl shrink-0 right-0 top-0 absolute lg:relative animate-in slide-in-from-right-8 duration-200">

            {/* Header: Decided by Visual Node Provider */}
            <div className={`p-4 border-b border-slate-100 flex items-center justify-between ${theme.bg}`}>
                <div className="flex items-center gap-2">
                    <Settings2 className={`w-4 h-4 ${theme.color}`} />
                    <h2 className="text-sm font-black uppercase tracking-tight text-slate-900 border-none">
                        {provider ? `${theme.name} DROPZONE` : 'DROPZONE'}
                    </h2>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* Node Level Info */}
                <div className="space-y-4">
                    <h3 className={`text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2`}>
                        Informations ({selectedNode.type})
                    </h3>

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

                {/* LLM STRICT CONFIG: ONLY shows models for the provider selected on visual node */}
                {(selectedNode.type === 'llmNode' || selectedNode.type === 'placeholderNode') && (
                    <div className="space-y-5 pt-2">
                        <h3 className={`text-[10px] font-bold uppercase tracking-wider ${theme.color} border-b ${theme.border} pb-2`}>
                            Modèle & Intelligence
                        </h3>

                        {/* Exclusive Model Selection based on Visual Provider */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Modèles disponibles ({theme.name})</label>
                            {provider ? (
                                <div className="relative group">
                                    <select
                                        value={selectedNode.data.model || ''}
                                        onChange={e => handleInstantChange('model', e.target.value)}
                                        className="w-full text-xs font-bold px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 appearance-none bg-white cursor-pointer shadow-sm transition-all"
                                    >
                                        <option value="">-- Choisir un modèle --</option>
                                        {(modelInventory[provider] || []).map(m => (
                                            <option key={m.id} value={m.id}>{m.label}</option>
                                        ))}
                                    </select>
                                    <Sparkles className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${theme.color} pointer-events-none transition-colors`} />
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Veuillez d'abord sélectionner un moteur sur le nœud du canvas.</p>
                                </div>
                            )}
                        </div>

                        {/* System Prompt stays manual */}
                        <div className="space-y-1.5 pt-2">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-purple-500" />
                                System Prompt (Personalité IA)
                            </label>
                            <textarea
                                rows={10}
                                value={draftData.system_prompt || ''}
                                onChange={e => handleDraftChange('system_prompt', e.target.value)}
                                onBlur={() => handleSaveText('system_prompt')}
                                placeholder="Ici, définissez la personnalité et les instructions de votre agent..."
                                className="w-full text-[10px] leading-relaxed font-mono px-3 py-3 border border-purple-100 bg-purple-50/10 rounded-xl outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 resize-none shadow-inner"
                            />
                        </div>
                    </div>
                )}

                {/* Guardrail Specific */}
                {selectedNode.type === 'guardrailNode' && (
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 border-b border-rose-100 pb-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Sécurité & Budget</h3>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Seuil de d'alerte ($)</label>
                            <input
                                type="number"
                                value={selectedNode.data.policies?.budget_daily_max || ''}
                                onChange={e => handleNestedChange('policies', 'budget_daily_max', Number(e.target.value))}
                                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-rose-400 shadow-sm"
                            />
                        </div>
                    </div>
                )}
            </div>

            ,StartLine:194,TargetContent:

        </aside>
    );
}
