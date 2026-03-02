'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Shield, CreditCard, Bell, Key, Building2, Lock, Blocks, Smartphone } from 'lucide-react';
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
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Author Pseudo (Library)</label>
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

                                <div className="space-y-4 pt-6 border-t border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Advanced Security</h3>

                                    <div className="flex flex-col gap-4">
                                        {/* 2FA Toggle Block */}
                                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${is2FAEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {is2FAEnabled ? <Shield className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900">Two-Factor Authentication (SMS)</h4>
                                                    <p className="text-xs text-slate-500">Protect your account with a verification code sent to your phone via Twilio.</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                                <span className={`flex items-center gap-1.5 px-2.5 py-1 ${is2FAEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'} text-[10px] font-bold uppercase tracking-wider rounded-md`}>
                                                    {is2FAEnabled ? 'Active' : 'Disabled'}
                                                </span>

                                                {is2FAEnabled ? (
                                                    <button onClick={handleDisable2FA} className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 text-xs font-bold rounded hover:bg-rose-50 transition-colors">
                                                        Disable 2FA
                                                    </button>
                                                ) : (
                                                    <button onClick={handleEnable2FA} disabled={isSending2FA || isVerifying2FA} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded hover:bg-slate-50 transition-colors disabled:opacity-50">
                                                        {isSending2FA ? 'Sending SMS...' : 'Enable 2FA'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Verification Form */}
                                        {isVerifying2FA && !is2FAEnabled && (
                                            <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-xl animate-in slide-in-from-top-2">
                                                <h4 className="text-sm font-bold text-indigo-900 mb-2">Verify Your Phone Number</h4>
                                                <p className="text-xs text-indigo-700 mb-4">We've sent a 6-digit verification code via Twilio SMS to <span className="font-bold">{phone}</span>.</p>

                                                <div className="flex gap-2 max-w-sm">
                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        placeholder="000000"
                                                        value={twoFaCode}
                                                        onChange={e => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                                                        className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm text-center tracking-[0.5em] font-mono text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                    />
                                                    <button
                                                        onClick={handleVerify2FA}
                                                        disabled={isConfirming2FA || twoFaCode.length !== 6}
                                                        className="px-4 py-2 bg-indigo-600 border border-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {isConfirming2FA ? 'Verifying...' : 'Verify'}
                                                    </button>
                                                    <button
                                                        onClick={() => { setIsVerifying2FA(false); setTwoFaCode(''); }}
                                                        className="px-3 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
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
                            <div className="animate-in fade-in">
                                <AdminSecuritySettings />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
