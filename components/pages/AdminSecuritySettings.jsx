'use client';

import { useState, useEffect } from 'react';
import { Shield, Smartphone, Key, Copy, RefreshCw, CheckCircle2, X } from 'lucide-react';
import { Card, Button } from '../ui';
import { useRole } from '@/lib/providers';
import { createClient } from '@/lib/supabase/client';

export default function AdminSecuritySettings({
    is2FAEnabled,
    handleEnable2FA,
    handleDisable2FA,
    isSending2FA,
    isVerifying2FA,
    twoFaCode,
    setTwoFaCode,
    handleVerify2FA,
    isConfirming2FA,
    phone,
    setIsVerifying2FA
}) {
    const { currentRole } = useRole();
    const supabase = createClient();
    const [apiKey, setApiKey] = useState('Loading...');
    const [isCopied, setIsCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedKey, setGeneratedKey] = useState(null);
    const [lastReset, setLastReset] = useState('Never');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [resetStatus, setResetStatus] = useState({ message: '', type: null });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.settings?.verytis_api_key) {
                    const suffix = data.settings.verytis_api_key.slice(-4);
                    setApiKey(`vrts_live_***************************${suffix}`);
                } else {
                    setApiKey('Not configured');
                }
            } catch (error) {
                setApiKey('Not configured');
            }
        };

        const fetchUserMeta = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (user.last_sign_in_at) {
                    const date = new Date(user.last_sign_in_at);
                    setLastReset(date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }));
                }
            }
        };

        if (currentRole === 'Admin') {
            fetchSettings();
            fetchUserMeta();
        }
    }, [currentRole]);

    const handleResetPassword = async () => {
        setIsUpdatingPassword(true);
        setResetStatus({ message: '', type: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) throw new Error("User email not found");

            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
            });
            
            if (error) throw error;
            
            setResetStatus({ message: 'Reset link sent to your email!', type: 'success' });
        } catch (error) {
            setResetStatus({ message: error.message || 'Failed to send reset link.', type: 'error' });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const generateNewKey = async () => {
        if (window.confirm("Are you sure you want to generate a new Global API Key?")) {
            setIsGenerating(true);
            try {
                const fullKey = `vrts_live_${Math.random().toString(36).substring(2, 15)}`;
                const res = await fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ verytis_api_key: fullKey })
                });
                if (res.ok) {
                    setGeneratedKey(fullKey);
                    setApiKey(`vrts_live_***************************${fullKey.slice(-4)}`);
                }
            } finally {
                setIsGenerating(false);
            }
        }
    };

    if (currentRole !== 'Admin') return null;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="pb-2 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-blue-600" />
                    Security & Access Control
                </h2>
                <p className="text-sm text-slate-500 mt-1">Manage authentication methods, credentials, and platform keys.</p>
            </div>

            {/* 1. Account Password */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Key className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900">Account Password</h4>
                            <p className="text-xs text-slate-500">Last updated: <span className="text-slate-900 font-medium">{lastReset}</span></p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
                            <span className="text-sm text-slate-500 font-medium truncate">
                                Send a secure reset link to your email
                            </span>
                            <Button 
                                variant="primary"
                                className="h-9 px-6 shadow-sm"
                                onClick={handleResetPassword}
                                disabled={isUpdatingPassword}
                            >
                                {isUpdatingPassword ? 'Sending...' : 'Send Link'}
                            </Button>
                        </div>
                    </div>
                    
                    {resetStatus.message && (
                        <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
                            resetStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                            {resetStatus.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            {resetStatus.message}
                        </div>
                    )}
                </div>
            </Card>

            {/* 2. Two-Factor Authentication */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${is2FAEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900">Two-Factor Authentication (SMS)</h4>
                            <p className="text-xs text-slate-500">Secure your account with multi-factor verification.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${is2FAEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {is2FAEnabled ? 'Active' : 'Disabled'}
                        </span>
                        {is2FAEnabled ? (
                            <Button variant="danger" className="h-8" onClick={handleDisable2FA}>Disable</Button>
                        ) : (
                            <Button variant="primary" className="h-8" onClick={handleEnable2FA} disabled={isSending2FA}>
                                {isSending2FA ? 'Sending...' : 'Enable 2FA'}
                            </Button>
                        )}
                    </div>
                </div>

                {isVerifying2FA && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl animate-in slide-in-from-top-2">
                        <p className="text-xs text-blue-800 mb-3">Code sent to <strong>{phone}</strong></p>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="000000" 
                                value={twoFaCode}
                                onChange={e => setTwoFaCode(e.target.value)}
                                className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm text-center font-mono tracking-widest"
                            />
                            <Button onClick={handleVerify2FA} disabled={isConfirming2FA}>Verify</Button>
                            <Button variant="ghost" onClick={() => setIsVerifying2FA(false)}>Cancel</Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* 3. Platform API Keys (Bottom) */}
            <Card className="p-6 border-blue-100 bg-blue-50/20">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Key className="w-4 h-4 text-blue-600" />
                            Platform API Keys
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Sensitive credentials for SDK and Proxy access.</p>
                    </div>
                    <Button variant="secondary" icon={RefreshCw} onClick={generateNewKey} disabled={isGenerating}>
                        {isGenerating ? 'Rotating...' : 'Rotate Key'}
                    </Button>
                </div>
                <div className="bg-white border border-blue-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                    <code className="text-xs font-mono text-slate-600">{apiKey}</code>
                    <Button variant="ghost" icon={Copy} className="h-8" onClick={() => {
                        navigator.clipboard.writeText(apiKey);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                    }}>
                        {isCopied ? 'Copied' : 'Copy'}
                    </Button>
                </div>
            </Card>

            {/* Modal for rotated key */}
            {generatedKey && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">New Key Generated</h3>
                        <p className="text-sm text-slate-500 mb-4">Copy this key now. It will not be shown again.</p>
                        <div className="bg-slate-100 p-3 rounded-lg font-mono text-xs break-all border border-slate-200 mb-6">
                            {generatedKey}
                        </div>
                        <Button className="w-full" onClick={() => setGeneratedKey(null)}>I've Saved It</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
