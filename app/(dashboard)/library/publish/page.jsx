'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Send, Shield, Zap, Info, Terminal, Settings2,
    Ban, Database, Clock, Cpu, DollarSign
} from 'lucide-react';
import { Card, Button } from '@/components/ui';

// ─── Tag Input ────────────────────────────────────────────
const TagInput = ({ tags = [], onChange, placeholder }) => {
    const [input, setInput] = useState('');

    const addTag = () => {
        const val = input.trim().toUpperCase();
        if (val && !tags.includes(val)) onChange([...tags, val]);
        setInput('');
    };

    const removeTag = (tag) => onChange(tags.filter(t => t !== tag));

    return (
        <div className="flex flex-wrap gap-1.5 items-center bg-white border border-slate-200 rounded-md px-2.5 py-2 min-h-[36px]">
            {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-blue-400 hover:text-rose-500 transition-colors ml-0.5">×</button>
                </span>
            ))}
            <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                onBlur={addTag}
                placeholder={tags.length === 0 ? placeholder : '+ add'}
                className="flex-1 min-w-[80px] bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400 font-mono py-0.5"
            />
        </div>
    );
};

// ─── Number Field ─────────────────────────────────────────
const NumField = ({ label, value, onChange, placeholder, hint, step, min, max }) => (
    <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">{label}</label>
        <input
            type="number"
            step={step}
            min={min}
            max={max}
            value={value ?? ''}
            onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400"
        />
        {hint && <p className="text-[10px] text-slate-400 mt-1 font-mono">{hint}</p>}
    </div>
);

export default function PublishAgentPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        category: 'Support Client',
        description: '',
        function1: '',
        function2: '',
        function3: '',
        function3: '',
        sourceCodes: {
            'Python': '',
            'Node.js': '',
            'Go': '',
            'cURL': ''
        },
        budget_daily_max: null,
        budget_per_request_max: null,
        blocked_actions: [],
        require_approval: [],
        max_retries: 5,
        rate_limit_per_min: 100,
        allowed_scopes: [],
        forbidden_keywords: [],
        max_consecutive_failures: 3,
        active_hours_start: null,
        active_hours_end: null,
        min_confidence_score: null,
        max_tokens_per_action: null,
    });

    const updatePolicy = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState('Python');

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: at least one language must have code
        const hasCode = Object.values(formData.sourceCodes).some(code => code.trim() !== '');
        if (!hasCode) {
            alert('Veuillez fournir le code source pour au moins un langage.');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/library/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                router.push('/library');
            } else {
                const err = await res.json();
                alert('Erreur lors de la publication: ' + err.error);
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error(error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 animate-in fade-in duration-300">
            <div className="max-w-3xl mx-auto">

                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Retour
                </button>

                {/* header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Publier un Agent</h1>
                    <p className="text-slate-500">Partagez votre configuration d'agent avec la communauté Verytis.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 pb-20">

                    {/* Section 1: Basic Info */}
                    <Card className="p-6 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-slate-900">Informations Générales</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nom de l'Agent</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Analyste Financier GPT"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catégorie</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option>Support Client</option>
                                    <option>DevSecOps</option>
                                    <option>FinOps</option>
                                    <option>Ventes</option>
                                    <option>RH</option>
                                </select>
                            </div>
                            <div className="col-span-full space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description Courte</label>
                                <textarea
                                    required
                                    rows={2}
                                    placeholder="Décrivez en une phrase le rôle de cet agent..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="col-span-full space-y-3 mt-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fonctions clés de l'agent (3 Max)</label>
                                <input type="text" required placeholder="Fonction 1 (obligatoire)" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={formData.function1} onChange={e => setFormData({ ...formData, function1: e.target.value })} />
                                <input type="text" required placeholder="Fonction 2 (obligatoire)" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={formData.function2} onChange={e => setFormData({ ...formData, function2: e.target.value })} />
                                <input type="text" required placeholder="Fonction 3 (obligatoire)" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={formData.function3} onChange={e => setFormData({ ...formData, function3: e.target.value })} />
                            </div>
                        </div>
                    </Card>

                    {/* Section 2: Agent Logic (Code Source Only) */}
                    <Card className="p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                    <Terminal className="w-4 h-4 text-indigo-600" />
                                </div>
                                <h3 className="font-bold text-slate-900">Code Source de l'Agent</h3>
                            </div>

                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {['Python', 'Node.js', 'Go', 'cURL'].map(lang => (
                                    <button
                                        key={lang}
                                        type="button"
                                        onClick={() => setActiveLanguage(lang)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeLanguage === lang ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'} relative`}
                                    >
                                        {lang}
                                        {formData.sourceCodes[lang]?.trim() && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <textarea
                                rows={12}
                                placeholder={`Collez votre code source ${activeLanguage} ici... (optionnel si un autre langage est rempli)`}
                                className="w-full px-4 py-3 bg-[#0F172A] text-slate-300 font-mono text-sm border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                value={formData.sourceCodes[activeLanguage]}
                                onChange={e => setFormData({
                                    ...formData,
                                    sourceCodes: {
                                        ...formData.sourceCodes,
                                        [activeLanguage]: e.target.value
                                    }
                                })}
                            />
                            <p className="text-[10px] text-slate-400 italic mt-2">Seuls les langages complétés seront publiés. Au moins un est requis.</p>
                        </div>
                    </Card>

                    {/* Section 3: Governance Defaults */}
                    <Card className="p-6 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <Shield className="w-4 h-4 text-emerald-600" />
                            </div>
                            <h3 className="font-bold text-slate-900">Gouvernance (Limites Suggérées)</h3>
                        </div>

                        <div className="space-y-6 pt-2">

                            {/* ── 1. Budget Limits ─────────────────────────────── */}
                            <section>
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono flex items-center gap-2">
                                    <DollarSign className="w-3.5 h-3.5 text-blue-500" /> budget_limits
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <NumField label="daily_max_usd" value={formData.budget_daily_max} onChange={v => updatePolicy('budget_daily_max', v)} placeholder="null" hint="$ per 24h window" step={0.01} />
                                    <NumField label="per_request_max_usd" value={formData.budget_per_request_max} onChange={v => updatePolicy('budget_per_request_max', v)} placeholder="null" hint="$ per single API call" step={0.01} />
                                </div>
                            </section>

                            <hr className="border-slate-100" />

                            {/* ── 2. Action Restrictions ───────────────────────── */}
                            <section>
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono flex items-center gap-2">
                                    <Ban className="w-3.5 h-3.5 text-blue-500" /> action_restrictions
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">blocked_actions</label>
                                        <TagInput tags={formData.blocked_actions} onChange={v => updatePolicy('blocked_actions', v)} placeholder="DELETE, DROP_TABLE" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">require_approval</label>
                                        <TagInput tags={formData.require_approval} onChange={v => updatePolicy('require_approval', v)} placeholder="DEPLOY, WRITE_PROD" />
                                    </div>
                                </div>
                            </section>

                            <hr className="border-slate-100" />

                            {/* ── 3. Data Access ───────────────────────────────── */}
                            <section>
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono flex items-center gap-2">
                                    <Database className="w-3.5 h-3.5 text-blue-500" /> data_access
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">allowed_scopes</label>
                                        <TagInput tags={formData.allowed_scopes} onChange={v => updatePolicy('allowed_scopes', v)} placeholder="PUBLIC, MARKETING" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">forbidden_keywords</label>
                                        <TagInput tags={formData.forbidden_keywords} onChange={v => updatePolicy('forbidden_keywords', v)} placeholder="SALARY, PASSWORD, SSN" />
                                    </div>
                                </div>
                            </section>

                            <hr className="border-slate-100" />

                            {/* ── 4. Time Fencing ──────────────────────────────── */}
                            <section>
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-blue-500" /> time_fencing
                                </h2>
                                <div className="grid grid-cols-3 gap-4">
                                    <NumField label="max_consecutive_failures" value={formData.max_consecutive_failures} onChange={v => updatePolicy('max_consecutive_failures', v)} placeholder="3" hint="auto-suspend threshold" />
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">active_hours_start</label>
                                        <input
                                            type="time"
                                            value={formData.active_hours_start || ''}
                                            onChange={e => updatePolicy('active_hours_start', e.target.value || null)}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">active_hours_end</label>
                                        <input
                                            type="time"
                                            value={formData.active_hours_end || ''}
                                            onChange={e => updatePolicy('active_hours_end', e.target.value || null)}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1 font-mono">null = 24/7</p>
                                    </div>
                                </div>
                            </section>

                            <hr className="border-slate-100" />

                            {/* ── 5. AI Output Controls ────────────────────────── */}
                            <section>
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono flex items-center gap-2">
                                    <Cpu className="w-3.5 h-3.5 text-blue-500" /> output_control
                                </h2>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <NumField label="min_confidence" value={formData.min_confidence_score} onChange={v => updatePolicy('min_confidence_score', v)} placeholder="0.80" hint="0.0 → 1.0" step={0.01} min={0} max={1} />
                                    <NumField label="max_tokens" value={formData.max_tokens_per_action} onChange={v => updatePolicy('max_tokens_per_action', v)} placeholder="4096" hint="per action cap" />
                                    <NumField label="max_retries" value={formData.max_retries} onChange={v => updatePolicy('max_retries', v)} placeholder="5" hint="loop prevention" />
                                    <NumField label="rate_limit_per_min" value={formData.rate_limit_per_min} onChange={v => updatePolicy('rate_limit_per_min', v)} placeholder="100" hint="requests/min" />
                                </div>
                            </section>

                        </div>
                    </Card>

                    {/* Submit Section */}
                    <div className="flex items-center justify-end gap-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => router.back()}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 px-8"
                        >
                            {isSubmitting ? 'Publication...' : 'Publier l\'Agent'}
                            {!isSubmitting && <Send className="w-4 h-4 ml-2" />}
                        </Button>
                    </div>

                </form>

            </div>
        </div>
    );
}
