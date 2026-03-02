'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Building2, Globe, Clock, UploadCloud, Building } from 'lucide-react';
import { Card, Button, SkeletonSettingsItem } from '@/components/ui';

const fetcher = (url) => fetch(url).then(res => res.json());

export default function WorkspaceSettings() {
    const { data, error, isLoading, mutate } = useSWR('/api/settings', fetcher);

    const [formData, setFormData] = useState({
        workspace_name: 'Verytis AI-Ops',
        display_language: 'English (US)',
        timezone: 'UTC'
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (data?.settings) {
            setFormData({
                workspace_name: data.settings.workspace_name || 'Verytis AI-Ops',
                display_language: data.settings.display_language || 'English (US)',
                timezone: data.settings.timezone || 'UTC'
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
            if (!res.ok) throw new Error('Failed to save settings');
            await mutate(); // Refresh SWR cache
            alert('Workspace settings saved successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to save workspace settings.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SkeletonSettingsItem />
            <SkeletonSettingsItem />
        </div>
    );
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="pb-2 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-indigo-600" />
                    Workspace Preferences
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    Manage your organization's identity, branding, and regional settings.
                </p>
            </div>

            <Card className="p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-500" />
                    General Information
                </h3>

                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5" /> Workspace Name
                        </label>
                        <input
                            type="text"
                            value={formData.workspace_name}
                            onChange={e => setFormData({ ...formData, workspace_name: e.target.value })}
                            className="w-full max-w-md bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Localization & Time
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Display Language</label>
                        <select
                            value={formData.display_language}
                            onChange={e => setFormData({ ...formData, display_language: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                            <option>English (US)</option>
                            <option>Français (FR)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Timezone (Logs & Audit)</label>
                        <select
                            value={formData.timezone}
                            onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                            <option>UTC (Coordinated Universal Time)</option>
                            <option>America/New_York (EST)</option>
                            <option>America/Chicago (CST)</option>
                            <option>America/Los_Angeles (PST)</option>
                            <option>Europe/Paris (GMT+1)</option>
                        </select>
                    </div>
                </div>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Workspace Changes'}
                </Button>
            </div>
        </div>
    );
}
