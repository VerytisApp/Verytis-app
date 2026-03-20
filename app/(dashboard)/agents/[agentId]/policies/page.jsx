'use client';

import React, { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
    ChevronRight, ShieldCheck, DollarSign, Ban, Database,
    Clock, Cpu, Settings, ArrowLeft, Save, CheckCircle2
} from 'lucide-react';
import { Card, Button } from '@/components/ui';

const fetcher = (url) => fetch(url).then(r => r.json());

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
                    <button onClick={() => removeTag(tag)} className="text-blue-400 hover:text-rose-500 transition-colors ml-0.5">×</button>
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

export default function AgentPoliciesPage({ params }) {
    const { agentId } = React.use(params);
    const { data, error, isLoading, mutate } = useSWR(`/api/agents/${agentId}`, fetcher);
    const agent = data?.agent;

    const DEFAULT = {
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
    };

    const [policies, setPolicies] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Initialize policies once agent loads
    React.useEffect(() => {
        if (agent && !policies) {
            setPolicies({ ...DEFAULT, ...(agent.policies || {}) });
        }
    }, [agent]);

    const update = (field, value) => {
        setPolicies(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const save = async () => {
        setSaving(true);
        try {
            await fetch(`/api/agents/${agentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ policies })
            });
            mutate();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error('Failed to save:', e);
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) return <div className="p-12 text-center text-slate-500 font-medium">Loading...</div>;
    if (error || !agent) return <div className="p-12 text-center text-rose-500 font-medium">Agent not found.</div>;
    if (!policies) return null;



    return (
        <div className="min-h-screen bg-slate-50 p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 font-mono">
                    <Link href="/agents" className="hover:text-blue-600 transition-colors">Agents</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link href={`/agents/${agentId}`} className="hover:text-blue-600 transition-colors">{agent.name}</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-blue-600">Policies</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {agent.name} <span className="text-slate-400 font-normal">/ policies</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={`/agents/${agentId}`}>
                            <Button variant="ghost" icon={ArrowLeft}>Back</Button>
                        </Link>
                        <button
                            onClick={save}
                            disabled={saving}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-sm ${saved
                                ? 'bg-emerald-600 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                } disabled:opacity-50`}
                        >
                            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Policies</>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">

                {/* ── 2. Budget Limits ─────────────────────────────── */}
                <section>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-blue-500" /> budget_limits
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <NumField label="daily_max_usd" value={policies.budget_daily_max} onChange={v => update('budget_daily_max', v)} placeholder="null" hint="$ per 24h window" step={0.01} />
                        <NumField label="per_request_max_usd" value={policies.budget_per_request_max} onChange={v => update('budget_per_request_max', v)} placeholder="null" hint="$ per single API call" step={0.01} />
                    </div>
                </section>

                <hr className="border-slate-200" />

                {/* ── 3. Action Restrictions ───────────────────────── */}
                <section>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono flex items-center gap-2">
                        <Ban className="w-3.5 h-3.5 text-blue-500" /> action_restrictions
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">blocked_actions</label>
                            <TagInput tags={policies.blocked_actions} onChange={v => update('blocked_actions', v)} placeholder="DELETE, DROP_TABLE" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">require_approval</label>
                            <TagInput tags={policies.require_approval} onChange={v => update('require_approval', v)} placeholder="DEPLOY, WRITE_PROD" />
                        </div>
                    </div>
                </section>

                <hr className="border-slate-200" />

                {/* ── 4. Data Access ───────────────────────────────── */}
                <section>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-blue-500" /> data_access
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">allowed_scopes</label>
                            <TagInput tags={policies.allowed_scopes} onChange={v => update('allowed_scopes', v)} placeholder="PUBLIC, MARKETING" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">forbidden_keywords</label>
                            <TagInput tags={policies.forbidden_keywords} onChange={v => update('forbidden_keywords', v)} placeholder="SALARY, PASSWORD, SSN" />
                        </div>
                    </div>
                </section>

                <hr className="border-slate-200" />

                {/* ── 5. Time Fencing ──────────────────────────────── */}
                <section>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-blue-500" /> time_fencing
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                        <NumField label="max_consecutive_failures" value={policies.max_consecutive_failures} onChange={v => update('max_consecutive_failures', v)} placeholder="3" hint="auto-suspend threshold" />
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">active_hours_start</label>
                            <input
                                type="time"
                                value={policies.active_hours_start || ''}
                                onChange={e => update('active_hours_start', e.target.value || null)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">active_hours_end</label>
                            <input
                                type="time"
                                value={policies.active_hours_end || ''}
                                onChange={e => update('active_hours_end', e.target.value || null)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                            />
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">null = 24/7</p>
                        </div>
                    </div>
                </section>

                <hr className="border-slate-200" />

                {/* ── 6. AI Output Controls ────────────────────────── */}
                <section className="pb-12">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-blue-500" /> output_control
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <NumField label="min_confidence" value={policies.min_confidence_score} onChange={v => update('min_confidence_score', v)} placeholder="0.80" hint="0.0 → 1.0" step={0.01} min={0} max={1} />
                        <NumField label="max_tokens" value={policies.max_tokens_per_action} onChange={v => update('max_tokens_per_action', v)} placeholder="4096" hint="per action cap" />
                        <NumField label="max_retries" value={policies.max_retries} onChange={v => update('max_retries', v)} placeholder="5" hint="loop prevention" />
                        <NumField label="rate_limit_per_min" value={policies.rate_limit_per_min} onChange={v => update('rate_limit_per_min', v)} placeholder="100" hint="requests/min" />
                    </div>
                </section>
            </div>
        </div>
    );
}
