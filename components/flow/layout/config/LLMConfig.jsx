import React from 'react';
import { Sparkles } from 'lucide-react';

const LLMConfig = ({ data, models, theme, onDraftChange, onSaveText, onInstantChange }) => {
    return (
        <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.color}`}>Cerveau & Personnalité</h3>
                <div className={`h-px flex-1 ml-4 ${theme.bg} opacity-10`} />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-900 uppercase">Modèle IA</label>
                <select
                    value={data.model || ''}
                    onChange={e => onInstantChange('model', e.target.value)}
                    className="w-full text-xs font-bold px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 shadow-sm transition-all"
                >
                    <option value="">Sélectionner un modèle...</option>
                    {models.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-900 uppercase flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Instructions Systèmes (Prompt)
                </label>
                <textarea
                    rows={8}
                    value={data.system_prompt || ''}
                    onChange={e => onDraftChange('system_prompt', e.target.value)}
                    onBlur={() => onSaveText('system_prompt')}
                    className="w-full text-[11px] leading-relaxed font-mono px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all resize-none shadow-inner"
                    placeholder="Décrivez comment l'agent doit se comporter..."
                />
            </div>
        </div>
    );
};

export default LLMConfig;
