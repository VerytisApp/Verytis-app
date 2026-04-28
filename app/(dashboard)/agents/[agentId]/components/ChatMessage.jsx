'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Bot, 
    UserCircle, 
    CheckCircle2, 
    X, 
    Check, 
    Sparkles, 
    Cpu 
} from 'lucide-react';
import HitlActionCard from './HitlActionCard';

const getProviderIcon = (targetField) => {
    if (!targetField) return null;
    const field = targetField.toLowerCase();
    if (field.includes('slack')) return '/logos/slack.svg';
    if (field.includes('youtube')) return '/logos/youtube.svg';
    if (field.includes('github')) return '/logos/github.svg';
    if (field.includes('trello')) return '/logos/trello.svg';
    if (field.includes('stripe')) return '/logos/stripe.svg';
    if (field.includes('shopify')) return '/logos/shopify.svg';
    // Fallback générique si besoin
    return null; 
};

export default function ChatMessage({ 
    m, 
    i, 
    isLastInGroup, 
    isFirstInGroup, 
    isGrouped, 
    agentName, 
    resolvedActions, 
    executeAction, 
    actionSelectionsRef 
}) {
    const isUser = m.role === 'user';
    const isBot = m.role === 'assistant';
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            layout
            className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-6' : 'mt-1'}`}
        >
            {isBot && !isGrouped(i) && (
                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-lg shadow-slate-200 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                </div>
            )}
            {isBot && isGrouped(i) && <div className="w-8 flex-shrink-0" />}

            <div className={`max-w-[85%] group relative ${isUser ? 'text-right' : 'text-left'}`}>
                {!isGrouped(i) && (
                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 text-slate-400 ${isUser ? 'mr-1' : 'ml-1'}`}>
                        {isUser ? 'Propriétaire' : agentName}
                    </div>
                )}
                
                <div className={`
                    inline-block px-5 py-3.5 text-[13px] leading-relaxed transition-all relative
                    ${isUser 
                        ? 'bg-blue-600 text-white shadow-blue-500/10 shadow-lg font-medium' 
                        : 'bg-white border border-slate-100 text-slate-800 font-medium shadow-sm'
                    }
                    ${isFirstInGroup && isUser ? 'rounded-2xl rounded-tr-none' : ''}
                    ${isFirstInGroup && isBot ? 'rounded-2xl rounded-tl-none' : ''}
                    ${!isFirstInGroup && !isLastInGroup ? 'rounded-2xl' : ''}
                    ${isLastInGroup && !isFirstInGroup ? 'rounded-2xl' : ''}
                    ${!isFirstInGroup ? 'rounded-2xl' : ''}
                `}>
                    <div className="whitespace-pre-wrap">
                        {m.content
                            .replace(/\[SIGNAL: (?:ACTION_)?CONFIRMED\].*/, 'Je confirme ce paramétrage.')
                            .replace(/\[SIGNAL: REFUSED\].*/, 'J\'annule cette opération.')
                            .replace(/\*\*/g, '')
                            .replace(/###\s*/g, '')}
                    </div>

                    {m.action_payload && (() => {
                        const resolved = resolvedActions[m.id] || resolvedActions[i];
                        
                        // ─── RESOLVED MODE: show summary card ───
                        if (resolved) {
                            return (
                                <div className="mt-4 p-5 bg-white/60 backdrop-blur-xl border border-white/80 rounded-[24px] shadow-md text-left animate-in fade-in duration-300 relative overflow-hidden">
                                    <div className={`absolute inset-0 opacity-5 ${resolved.confirmed ? 'bg-green-500' : 'bg-slate-400'}`} />
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                            resolved.confirmed ? 'bg-emerald-100' : 'bg-slate-100'
                                        }`}>
                                            {resolved.confirmed 
                                                ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                : <X className="w-4 h-4 text-slate-400" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                                                resolved.confirmed ? 'text-emerald-600' : 'text-slate-400'
                                            }`}>
                                                {resolved.confirmed ? '✅ Déployé' : '❌ Annulé'}
                                            </div>
                                            <div className="text-[12px] font-bold text-slate-700 truncate">{m.action_payload.label || m.action_payload.change_detected}</div>
                                            {resolved.confirmed && resolved.value && resolved.value !== '✨ Automatique' && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {resolved.value.split(', ').map(v => (
                                                        <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-[11px] font-bold">
                                                            <Check className="w-2.5 h-2.5" /> {v}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {resolved.confirmed && resolved.value === '✨ Automatique' && (
                                                <div className="mt-2">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg text-[11px] font-bold">
                                                        <Sparkles className="w-2.5 h-2.5" /> Mode Automatique
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // ─── ACTIVE MODE: show modular data-driven card ───
                        return (
                            <HitlActionCard 
                                payload={m.action_payload}
                                onExecute={executeAction}
                                index={i}
                                actionRef={actionSelectionsRef}
                                messageId={m.id}
                                iconUrl={getProviderIcon(m.action_payload.target_field)}
                            />
                        );
                    })()}
                </div>
            </div>

            {isUser && !isGrouped(i) && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-100 mt-1">
                    <UserCircle className="w-5 h-5 text-white" />
                </div>
            )}
            {isUser && isGrouped(i) && <div className="w-8 flex-shrink-0" />}
        </motion.div>
    );
}
