'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Bell, Mail, ShieldAlert, AlertTriangle, Workflow, Smartphone } from 'lucide-react';
import { Card, Button, SkeletonSettingsItem } from '@/components/ui';

const fetcher = (url) => fetch(url).then(res => res.json());

const DEFAULT_RULES = [
    { id: 'critical', title: 'Critical Security Blocks (Hard Limits)', desc: 'Agent attempted an action blocked by Global Governance policy.', color: 'rose', slack: true, email: true },
    { id: 'budget', title: 'Budget Threshold Passed (90%)', desc: 'Organization is nearing the maximum daily token usage limit.', color: 'amber', slack: true, email: true },
    { id: 'admin', title: 'Admin Audit Log Events', desc: 'New agent registered, policy changed, or global key generated.', color: 'indigo', slack: false, email: true },
];

export default function AlertingSettings() {
    const { data, isLoading, mutate } = useSWR('/api/settings', fetcher);
    // Fetch slack app connection status
    const { data: slackData, isLoading: isLoadingSlack } = useSWR('/api/slack/status', fetcher);

    const [formData, setFormData] = useState({
        security_email: '',
        routing_rules: DEFAULT_RULES
    });

    const [isSaving, setIsSaving] = useState(false);
    const [testStates, setTestStates] = useState({ slack: false, sms: false, email: false });

    useEffect(() => {
        if (data?.settings) {
            setFormData({
                security_email: data.settings.security_email || data.user?.email || '',
                routing_rules: data.settings.routing_rules?.length > 0 ? data.settings.routing_rules : DEFAULT_RULES
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
            if (!res.ok) throw new Error('Failed to save alerting settings');
            await mutate();
            alert('Alerting configuration saved successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to save alerts.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleRuleChannel = (ruleId, channel) => {
        setFormData(prev => ({
            ...prev,
            routing_rules: prev.routing_rules.map(rule =>
                rule.id === ruleId ? { ...rule, [channel]: !rule[channel] } : rule
            )
        }));
    };

    const handleTest = async (channel) => {
        setTestStates(prev => ({ ...prev, [channel]: true }));
        try {
            let endpoint = '';
            let payload = {};

            if (channel === 'slack') {
                if (!slackData?.connected) throw new Error('Slack App is not connected in Integrations');
                endpoint = '/api/alerts/slack';
                payload = { recipientId: data.user.id };
            } else if (channel === 'email') {
                if (!formData.security_email) throw new Error('Email is missing');
                endpoint = '/api/alerts/email';
                payload = { email: formData.security_email };
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Test failed');
            }

            alert(`Test ${channel.toUpperCase()} sent successfully!`);
        } catch (error) {
            console.error(`Test ${channel} error:`, error);
            alert(`Failed to send test: ${error.message}`);
        } finally {
            setTestStates(prev => ({ ...prev, [channel]: false }));
        }
    };

    if (isLoading) return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SkeletonSettingsItem />
            <SkeletonSettingsItem />
        </div>
    );
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="pb-2 border-b border-slate-100 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Bell className="w-6 h-6 text-indigo-600" />
                        Alerts & Incident Response
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Configure how your security and operations teams are notified of critical events.
                    </p>
                </div>
            </div>

            {/* Channels Section */}
            <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-slate-500" />
                    Delivery Channels
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                    {/* Slack */}
                    <Card className="p-5 flex flex-col relative overflow-hidden ring-1 ring-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                                <img src="https://www.google.com/s2/favicons?domain=slack.com&sz=128" alt="Slack" className="w-6 h-6 object-contain" />
                            </div>
                            {slackData?.connected ? (
                                <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-emerald-100/50">Active</span>
                            ) : (
                                <span className="bg-slate-50 text-slate-400 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200">Inactive</span>
                            )}
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">Slack Integration</h4>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[32px]">Native Direct Messages from the Verytis Bot.</p>
                        <div className="mt-auto space-y-3">
                            {isLoadingSlack ? (
                                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-400 animate-pulse">Checking connection...</div>
                            ) : slackData?.connected ? (
                                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900">
                                    <span className="font-medium text-emerald-600">✓ App configured</span>
                                    <p className="text-slate-500 mt-0.5">Alerts will be sent as direct messages.</p>
                                </div>
                            ) : (
                                <div className="w-full bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-xs text-rose-600">
                                    App not connected in Integrations
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button variant="secondary" className="flex-1 text-xs py-1.5 h-auto" onClick={() => handleTest('slack')} disabled={testStates.slack || !slackData?.connected}>
                                    {testStates.slack ? 'Sending...' : 'Test'}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Email */}
                    <Card className="p-5 flex flex-col relative overflow-hidden ring-1 ring-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm flex items-center justify-center shrink-0">
                                <Mail className="w-5 h-5" />
                            </div>
                            {formData.security_email ? (
                                <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-emerald-100/50">Active</span>
                            ) : (
                                <span className="bg-slate-50 text-slate-400 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200">Inactive</span>
                            )}
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">Email Distribution</h4>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[32px]">Send detailed audit reports and daily summaries via email.</p>
                        <div className="mt-auto space-y-3">
                            <input
                                type="email"
                                value={formData.security_email}
                                onChange={e => setFormData({ ...formData, security_email: e.target.value })}
                                placeholder="security@company.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                            />
                            <div className="flex gap-2">
                                <Button variant="secondary" className="flex-1 text-xs py-1.5 h-auto" onClick={() => handleTest('email')} disabled={testStates.email || !formData.security_email}>
                                    {testStates.email ? 'Sending...' : 'Test'}
                                </Button>
                                <Button variant="secondary" className="flex-1 text-xs py-1.5 h-auto" onClick={handleSave} disabled={isSaving}>Update</Button>
                            </div>
                        </div>
                    </Card>

                </div>
            </div>

            {/* Triggers Section */}
            <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-slate-500" />
                    Routing Rules (What to Send & Where)
                </h3>

                <Card className="overflow-hidden border border-slate-200">
                    <div className="divide-y divide-slate-100">
                        {formData.routing_rules.map((rule, idx) => (
                            <div key={rule.id || idx} className="p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-white hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`mt-0.5 w-2 h-2 rounded-full bg-${rule.color}-500 ring-4 ring-${rule.color}-50 shrink-0`} />
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">{rule.title}</h4>
                                        <p className="text-xs text-slate-500 mt-1">{rule.desc}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0 max-w-full xl:max-w-auto justify-start xl:justify-end">
                                    <div
                                        onClick={() => toggleRuleChannel(rule.id, 'slack')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold ${rule.slack ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-400'} cursor-pointer hover:border-indigo-300 transition-colors`}
                                    >
                                        <img src="https://www.google.com/s2/favicons?domain=slack.com&sz=128" alt="Slack" className={`w-3.5 h-3.5 ${!rule.slack && 'grayscale opacity-50'}`} /> <span className="hidden sm:inline">Slack</span>
                                    </div>

                                    <div
                                        onClick={() => toggleRuleChannel(rule.id, 'email')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold ${rule.email ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-400'} cursor-pointer hover:border-indigo-300 transition-colors`}
                                    >
                                        <Mail className={`w-3.5 h-3.5 ${!rule.email && 'opacity-50'}`} /> <span className="hidden sm:inline">Email</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Routing Rules'}
                </Button>
            </div>
        </div>
    );
}
