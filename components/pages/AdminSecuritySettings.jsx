'use client';

import { useState, useEffect } from 'react';
import { Download, Shield, Server, Box, Fingerprint, Key, Copy, RefreshCw, Globe, X, CheckCircle2 } from 'lucide-react';
import { Card, Button } from '../ui';
import { useRole } from '@/lib/providers';

export default function AdminSecuritySettings() {
    const { currentRole } = useRole();
    const [securityLogs, setSecurityLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [apiKey, setApiKey] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedKey, setGeneratedKey] = useState(null);
    const generateNewKey = async () => {
        if (window.confirm("Are you sure you want to generate a new Global API Key? The old one will be revoked immediately.")) {
            setIsGenerating(true);
            try {
                const fullKey = `vrts_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

                const res = await fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ verytis_api_key: fullKey })
                });

                if (res.ok) {
                    const suffix = fullKey.slice(-4);
                    setGeneratedKey(fullKey);
                    setApiKey(`vrts_live_***************************${suffix}`);
                } else {
                    console.error('Failed to update API key');
                }
            } catch (error) {
                console.error('Error updating key:', error);
            } finally {
                setIsGenerating(false);
            }
        }
    };

    const handleCopy = () => {
        if (apiKey && apiKey !== 'Not configured' && !apiKey.includes('Loading')) {
            navigator.clipboard.writeText(apiKey);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleCopyGenerated = () => {
        if (generatedKey) {
            navigator.clipboard.writeText(generatedKey);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };


    useEffect(() => {
        // Fetch real security logs from the database
        const fetchLogs = async () => {
            try {
                // Fetch general activity logs and map to the format
                const res = await fetch('/api/activity');
                const data = await res.json();
                if (data.events) {
                    const formattedLogs = data.events
                        .map(log => ({
                            id: log.id,
                            timestamp: new Date(log.timestamp).toLocaleString(),
                            actor: log.actor || 'System',
                            action: log.action,
                            target: log.target || 'N/A',
                            status: 'SUCCESS'
                        }));

                    setSecurityLogs(formattedLogs);
                }
            } catch (error) {
                console.error("Failed to fetch security logs:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchSettings = async () => {
            setIsLoadingSettings(true);
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.settings && data.settings.verytis_api_key) {
                    const suffix = data.settings.verytis_api_key.slice(-4);
                    setApiKey(`vrts_live_***************************${suffix}`);
                } else {
                    setApiKey('Not configured');
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
                setApiKey('Not configured');
            } finally {
                setIsLoadingSettings(false);
            }
        };

        if (currentRole === 'Admin') {
            fetchLogs();
            fetchSettings();
        }
    }, [currentRole]);


    if (currentRole !== 'Admin') {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-rose-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
                <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">
                    You do not have the necessary privileges to view the Security & Governance Center. This area is strictly restricted to Administrators.
                </p>
            </div>
        );
    }

    // Helper for badge colors
    const getActionColor = (action) => {
        if (!action) return 'bg-slate-50 text-slate-700 border-slate-200';
        if (action.includes('REGISTERED') || action.includes('CONNECTED') || action.includes('APPROVED')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (action.includes('REMOVED') || action.includes('REVOKED') || action.includes('DELETED')) return 'bg-rose-50 text-rose-700 border-rose-200';
        if (action.includes('UPGRADED')) return 'bg-amber-50 text-amber-700 border-amber-200';
        return 'bg-blue-50 text-blue-700 border-blue-200'; // Default
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">

            {/* Header section replicating the screenshot style */}
            <div className="pb-2 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-indigo-600" />
                    Security & Governance Center
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    Global overview of telemetry, access rules, and immutable audit logs.
                </p>
                <div className="flex gap-3 mt-4">
                    <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded text-xs font-semibold shadow-sm">
                        <Shield className="w-3.5 h-3.5" />
                        AES-256-GCM Encryption
                    </div>
                </div>
            </div>

            {/* Global API Key */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <Key className="w-4 h-4 text-slate-500" />
                        Platform API Keys (VERYTIS_API_KEY)
                    </h3>
                    <Button
                        variant="secondary"
                        className="h-8 text-[10px]"
                        icon={RefreshCw}
                        onClick={generateNewKey}
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'Generating...' : 'Generate New Key'}
                    </Button>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                    Authenticates the SDK Proxy Gateway. Treat this as a sensitive production credential.
                </p>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Global Key</div>
                        <code className="text-sm font-mono text-slate-700 select-none">{apiKey}</code>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" icon={Copy} className="h-9 px-3 text-xs" onClick={handleCopy}>
                            {isCopied ? 'Copied' : 'Copy'}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Change Password */}
            <Card className="p-6">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-slate-500" />
                    Change Account Password
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                    Regularly update your password to maintain account security. You will be logged out of other devices.
                </p>

                <div className="max-w-md space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Current Password</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">New Password</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                    </div>
                    <div className="pt-2">
                        <Button className="w-full sm:w-auto">Update Password</Button>
                    </div>
                </div>
            </Card>

            {/* Modal for Newly Generated Key */}
            {generatedKey && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-emerald-50/50">
                            <h3 className="font-bold text-emerald-700 flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                New Key Generated
                            </h3>
                            <button onClick={() => setGeneratedKey(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Your new <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-700">VERYTIS_API_KEY</code> is ready. For security reasons, <strong>you will not be able to see it again</strong> after closing this window.
                            </p>
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                                <code className="text-sm font-mono text-slate-900 break-all select-all mr-4">{generatedKey}</code>
                            </div>
                            <Button
                                variant={isCopied ? 'primary' : 'secondary'}
                                className={`w-full ${isCopied ? 'bg-emerald-600 hover:bg-emerald-700 border-transparent text-white' : ''}`}
                                icon={isCopied ? CheckCircle2 : Copy}
                                onClick={handleCopyGenerated}
                            >
                                {isCopied ? 'Copied to clipboard!' : 'Copy to Clipboard'}
                            </Button>
                        </div>
                        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                            <Button onClick={() => setGeneratedKey(null)}>I've safely copied it</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
