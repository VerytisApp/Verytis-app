'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Shield, CreditCard, Bell, Key, Building2, Lock, Blocks, Smartphone, Github, CheckCircle2, RefreshCw } from 'lucide-react';
import { useRole } from '@/lib/providers';
import AdminSecuritySettings from '@/components/pages/AdminSecuritySettings';
import WorkspaceSettings from '@/components/pages/settings/WorkspaceSettings';
import IntegrationsSettings from '@/components/pages/settings/IntegrationsSettings';
import AlertingSettings from '@/components/pages/settings/AlertingSettings';
import GlobalGovernanceSettings from '@/components/pages/settings/GlobalGovernanceSettings';

export default function SettingsPage() {
    const { currentUser } = useRole();
    const userRole = currentUser?.role || 'Member';
    const [activeTab, setActiveTab] = useState('account');

    const supabase = createClient();
    const [pseudo, setPseudo] = useState('');
    const [phone, setPhone] = useState('');
    const [isSavingPseudo, setIsSavingPseudo] = useState(false);
    const [isSavingPhone, setIsSavingPhone] = useState(false);
    const [socialLinks, setSocialLinks] = useState({ google: false, github: false });
    const [isConnecting, setIsConnecting] = useState({ google: false, github: false });

    // 2FA States
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [isVerifying2FA, setIsVerifying2FA] = useState(false);
    const [twoFaCode, setTwoFaCode] = useState('');
    const [isSending2FA, setIsSending2FA] = useState(false);
    const [isConfirming2FA, setIsConfirming2FA] = useState(false);

    useEffect(() => {
        // Init from auth metadata
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.pseudo) {
                setPseudo(user.user_metadata.pseudo);
            }
            if (user?.user_metadata?.alert_phone) {
                setPhone(user.user_metadata.alert_phone);
            }
            if (user?.user_metadata?.is_2fa_enabled) {
                setIs2FAEnabled(true);
            }
            if (user?.identities) {
                const providers = user.identities.map(id => id.provider);
                setSocialLinks({
                    google: providers.includes('google'),
                    github: providers.includes('github')
                });
            }
        };
        fetchUserData();
    }, []);

    const handleSavePseudo = async () => {
        setIsSavingPseudo(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { pseudo: pseudo }
            });
            if (error) throw error;
            alert('Pseudo updated successfully!');
        } catch (error) {
            console.error('Error updating pseudo:', error);
            alert('Failed to update pseudo.');
        } finally {
            setIsSavingPseudo(false);
        }
    };

    const handleSavePhone = async () => {
        setIsSavingPhone(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { alert_phone: phone }
            });
            if (error) throw error;
            alert('Phone number updated successfully!');
        } catch (error) {
            console.error('Error updating phone:', error);
            alert('Failed to update phone number.');
        } finally {
            setIsSavingPhone(false);
        }
    };

    const handleEnable2FA = async () => {
        if (!phone) {
            alert('Please save your phone number first before enabling 2FA.');
            return;
        }
        setIsSending2FA(true);
        try {
            const res = await fetch('/api/auth/2fa/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setIsVerifying2FA(true);
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setIsSending2FA(false);
        }
    };

    const handleVerify2FA = async () => {
        setIsConfirming2FA(true);
        try {
            const res = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: twoFaCode })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setIs2FAEnabled(true);
            setIsVerifying2FA(false);
            setTwoFaCode('');
            alert('Two-Factor Authentication is now enabled!');
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setIsConfirming2FA(false);
        }
    };

    const handleDisable2FA = async () => {
        if (confirm("Are you sure you want to disable Two-Factor Authentication?")) {
            const { error } = await supabase.auth.updateUser({ data: { is_2fa_enabled: false } });
            if (!error) setIs2FAEnabled(false);
        }
    };

    const handleConnectProvider = async (provider) => {
        setIsConnecting(prev => ({ ...prev, [provider]: true }));
        try {
            // Using signInWithOAuth which also handles linking if the user is already authenticated
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
            // The browser will redirect, so we don't necessarily need to reset isConnecting
        } catch (error) {
            console.error(`Error connecting ${provider}:`, error);
            alert(`Connection failed: ${error.message || 'Unknown error'}`);
            setIsConnecting(prev => ({ ...prev, [provider]: false }));
        }
    };

    const allTabs = [
        { id: 'account', label: 'Account Profile', icon: User },
        { id: 'workspace', label: 'Workspace Preferences', icon: Building2 },
        { id: 'security', label: 'Security & Access', icon: Shield },
        { id: 'governance', label: 'Global Governance', icon: Lock },
        { id: 'integrations', label: 'Integrations', icon: Blocks },
        { id: 'alerts', label: 'Alerts & Notifications', icon: Bell },
        { id: 'billing', label: 'Billing & Usage', icon: CreditCard },
    ];

    const adminOnlyTabs = ['workspace', 'security', 'governance', 'integrations', 'alerts', 'billing'];
    const tabs = allTabs.filter(tab => !adminOnlyTabs.includes(tab.id) || userRole === 'Admin');

    // Ensure we are not on an admin-only tab if not admin
    if (adminOnlyTabs.includes(activeTab) && userRole !== 'Admin') {
        setActiveTab('account');
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 animate-in fade-in duration-300">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Platform Settings
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Manage your profile, team access, and platform security.
                    </p>
                </header>

                {/* Horizontal Navigation */}
                <div className="overflow-x-auto pb-4 mb-6 border-b border-slate-200 hide-scrollbar scroll-smooth">
                    <nav className="flex items-center gap-2 min-w-max">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-100' : 'text-slate-400'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div>
                    {/* Content Area */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 min-h-[500px]">
                        {activeTab === 'account' && (
                            <div className="space-y-8 animate-in fade-in">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Account Profile</h2>
                                    <p className="text-sm text-slate-500 mt-1">Your basic personal capabilities and status on the platform.</p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-2xl font-bold text-slate-400">
                                        {currentUser?.initials || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{currentUser?.name || 'Loading...'}</h3>
                                        <p className="text-slate-500">{currentUser?.email || 'Loading...'}</p>
                                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                                            Role: {currentUser?.role || 'Member'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-900">Personal & Contact Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
                                            <input type="text" readOnly value={currentUser?.name || ''} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none hover:bg-white focus:bg-white transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email Address</label>
                                            <input type="email" readOnly value={currentUser?.email || ''} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none hover:bg-white focus:bg-white transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Global Author Pseudo</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={pseudo}
                                                    onChange={e => setPseudo(e.target.value)}
                                                    placeholder="Ex: Tychi"
                                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                                <button
                                                    onClick={handleSavePseudo}
                                                    disabled={isSavingPseudo}
                                                    className="px-4 py-2 bg-slate-900 border border-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                                                >
                                                    {isSavingPseudo ? 'Saving...' : 'Save'}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Phone Number (For Alerts)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={e => setPhone(e.target.value)}
                                                    placeholder="+1 (555) 000-0000"
                                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                                <button
                                                    onClick={handleSavePhone}
                                                    disabled={isSavingPhone}
                                                    className="px-4 py-2 bg-slate-900 border border-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                                                >
                                                    {isSavingPhone ? 'Saving...' : 'Save'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Providers Connected Section */}
                                <div className="space-y-4 pt-6 border-t border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        Providers Connected
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Google */}
                                        <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${socialLinks.google ? 'bg-emerald-50/20 border-emerald-100' : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/5 group'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${socialLinks.google ? 'bg-white' : 'bg-slate-200'}`}>
                                                    <img src="https://www.google.com/s2/favicons?domain=google.com" className="w-4 h-4" alt="Google" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">Google</p>
                                                    <p className="text-[10px] text-slate-500">{socialLinks.google ? 'Connected' : 'Not linked'}</p>
                                                </div>
                                            </div>
                                            {socialLinks.google ? (
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                                                    Linked
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={() => !isConnecting.google && handleConnectProvider('google')}
                                                    className={`px-4 py-1.5 border text-[11px] font-bold rounded-full shadow-sm transition-all active:scale-95 flex items-center gap-2 ${
                                                        isConnecting.google 
                                                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-wait' 
                                                        : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                                                    }`}
                                                >
                                                    {isConnecting.google ? (
                                                        <>
                                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                                            Connecting...
                                                        </>
                                                    ) : 'Connect'}
                                                </button>
                                            )}
                                        </div>

                                        {/* GitHub */}
                                        <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${socialLinks.github ? 'bg-indigo-50/20 border-indigo-100' : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/5 group'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${socialLinks.github ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-400'}`}>
                                                    <Github className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">GitHub</p>
                                                    <p className="text-[10px] text-slate-500">{socialLinks.github ? 'Connected' : 'Not linked'}</p>
                                                </div>
                                            </div>
                                            {socialLinks.github ? (
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">
                                                    Linked
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={() => !isConnecting.github && handleConnectProvider('github')}
                                                    className={`px-4 py-1.5 border text-[11px] font-bold rounded-full shadow-sm transition-all active:scale-95 flex items-center gap-2 ${
                                                        isConnecting.github 
                                                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-wait' 
                                                        : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                                                    }`}
                                                >
                                                    {isConnecting.github ? (
                                                        <>
                                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                                            Connecting...
                                                        </>
                                                    ) : 'Connect'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'workspace' && <WorkspaceSettings />}
                        {activeTab === 'integrations' && <IntegrationsSettings />}
                        {activeTab === 'alerts' && <AlertingSettings />}
                        {activeTab === 'governance' && <GlobalGovernanceSettings />}

                        {activeTab === 'billing' && (
                            <div className="space-y-8 animate-in fade-in">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Billing & Usage</h2>
                                    <p className="text-sm text-slate-500 mt-1">Manage your subscription, view active AI agents, and monitor platform limits.</p>
                                </div>

                                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">AI-Ops Standard</h3>
                                            <p className="text-sm text-slate-500 mt-1">Billed $199/month. Next cycle starts on Oct 1st.</p>
                                        </div>
                                        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors">
                                            Manage Subscription
                                        </button>
                                    </div>

                                    <div className="pt-6 border-t border-slate-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-slate-700">Active Agents</span>
                                            <span className="text-sm font-bold text-slate-900">3 / 10</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 rounded-full" style={{ width: '30%' }}></div>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">You are using 3 out of your 10 allotted agents. Upgrade to Enterprise to remove limits.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="animate-in fade-in space-y-8">
                                <AdminSecuritySettings 
                                    is2FAEnabled={is2FAEnabled}
                                    handleEnable2FA={handleEnable2FA}
                                    handleDisable2FA={handleDisable2FA}
                                    isSending2FA={isSending2FA}
                                    isVerifying2FA={isVerifying2FA}
                                    twoFaCode={twoFaCode}
                                    setTwoFaCode={setTwoFaCode}
                                    handleVerify2FA={handleVerify2FA}
                                    isConfirming2FA={isConfirming2FA}
                                    phone={phone}
                                    setIsVerifying2FA={setIsVerifying2FA}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
