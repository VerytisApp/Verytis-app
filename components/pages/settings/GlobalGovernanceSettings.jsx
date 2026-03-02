'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Shield, AlertTriangle, Lock, DollarSign, Database, Ban } from 'lucide-react';
import { Card, Button, SkeletonSettingsItem } from '@/components/ui';

const fetcher = (url) => fetch(url).then(res => res.json());

export default function GlobalGovernanceSettings() {
    const { data, error, isLoading, mutate } = useSWR('/api/settings', fetcher);

    const [formData, setFormData] = useState({
        max_org_spend: 5000,
        default_max_per_agent: 200,
        banned_keywords: ['PASSWORD', 'SOCIAL_SECURITY_NUMBER', 'CREDIT_CARD', 'PRIVATE_KEY'],
        blocked_actions: ['DELETE', 'DROP_TABLE', 'GRANT_ADMIN']
    });

    const [newKeyword, setNewKeyword] = useState('');
    const [newAction, setNewAction] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (data?.settings) {
            setFormData({
                max_org_spend: data.settings.max_org_spend || 5000,
                default_max_per_agent: data.settings.default_max_per_agent || 200,
                banned_keywords: data.settings.banned_keywords?.length > 0 ? data.settings.banned_keywords : ['PASSWORD', 'SOCIAL_SECURITY_NUMBER', 'CREDIT_CARD', 'PRIVATE_KEY'],
                blocked_actions: data.settings.blocked_actions?.length > 0 ? data.settings.blocked_actions : ['DELETE', 'DROP_TABLE', 'GRANT_ADMIN']
            });
        }
    }, [data]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error('Failed to save governance settings');
            await mutate();
            alert('Global governance policies enforced successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to enforce policies.');
        } finally {
            setIsSaving(false);
        }
    };

    const addAction = () => {
        if (!newAction.trim()) return;
        if (!formData.blocked_actions.includes(newAction.trim().toUpperCase())) {
            setFormData({ ...formData, blocked_actions: [...formData.blocked_actions, newAction.trim().toUpperCase()] });
        }
        setNewAction('');
    };

    const removeAction = (actionToRemove) => {
        setFormData({ ...formData, blocked_actions: formData.blocked_actions.filter(a => a !== actionToRemove) });
    };

    const handleKeywordsChange = (e) => {
        const val = e.target.value;
        const arr = val.split(',').map(k => k.trim()).filter(Boolean);
        setFormData({ ...formData, banned_keywords: arr });
    };

    if (isLoading) return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SkeletonSettingsItem />
            <SkeletonSettingsItem />
        </div>
    );
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="pb-2 border-b border-slate-100 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-indigo-600" />
                        Global Governance & Hard Limits
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                        These constraints apply across your entire organization. They override any individual Agent policy.
                        Actions blocked here cannot be permitted by lower-level configurations.
                    </p>
                </div>
            </div>

            <Card className="p-4 bg-amber-50/50 border-amber-200">
                <div className="flex gap-3 text-amber-800">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-medium leading-relaxed">
                        <strong>Warning:</strong> Modifying hard limits may immediately disrupt active agents and internal applications relying on the Proxy Gateway. Proceed with caution.
                    </p>
                </div>
            </Card>

            <div className="space-y-6">
                {/* Global Budget */}
                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        Global Budget Caps (Monthly)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Maximum Organization Spend ($)</label>
                            <input
                                type="number"
                                value={formData.max_org_spend}
                                onChange={e => setFormData({ ...formData, max_org_spend: Number(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Default Max Per Agent ($)</label>
                            <input
                                type="number"
                                value={formData.default_max_per_agent}
                                onChange={e => setFormData({ ...formData, default_max_per_agent: Number(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </Card>

                {/* Data Privacy & Redaction */}
                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
                        <Database className="w-4 h-4 text-blue-600" />
                        Data Privacy & PII Redaction
                    </h3>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Globally Banned Keywords (Comma separated)</label>
                        <textarea
                            value={formData.banned_keywords.join(', ')}
                            onChange={handleKeywordsChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">These fields will be automatically scrubbed by the Gateway tokenizer before reaching external LLMs.</p>
                    </div>
                </Card>

                {/* Restricted Operations */}
                <Card className="p-6 border-rose-100">
                    <h3 className="text-sm font-semibold text-rose-900 flex items-center gap-2 mb-4">
                        <Ban className="w-4 h-4 text-rose-600" />
                        Globally Restricted Operations
                    </h3>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Blocked Action Signatures</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {formData.blocked_actions.map(action => (
                                <span key={action} className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-mono font-bold flex items-center gap-1">
                                    {action}
                                    <button onClick={() => removeAction(action)} className="hover:text-rose-900 border-l border-rose-300 pl-1 ml-1">&times;</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Add restricted action..."
                                value={newAction}
                                onChange={e => setNewAction(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addAction()}
                                className="flex-1 max-w-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <Button variant="secondary" className="py-1.5 border-slate-200" onClick={addAction}>Add</Button>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 text-slate-600">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs font-medium">Synced securely with Gateway DB</span>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Enforcing...' : 'Enforce Policies'}
                </Button>
            </div>
        </div>
    );
}
