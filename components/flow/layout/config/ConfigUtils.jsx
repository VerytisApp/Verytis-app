import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

// ────────────────────────────────────────────────────────────────
// Reusable Tag Input (for config panel)
// ────────────────────────────────────────────────────────────────
export const PanelTagInput = ({ tags = [], mandatoryTags = [], onChange, placeholder }) => {
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
export const PanelNumField = ({ label, value, onChange, placeholder, hint, step, min, max }) => (
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
