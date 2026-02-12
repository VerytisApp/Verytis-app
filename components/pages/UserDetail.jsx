'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Shield, FileText, Download, Mail, Activity, GitCommit, CheckCircle, XCircle, Clock, Fingerprint, Globe, Key } from 'lucide-react';
import { Card, Button, StatusBadge, PlatformIcon, ToggleSwitch, Modal } from '../ui';
import { MOCK_USERS, MOCK_TEAMS, MOCK_CHANNELS, MOCK_RECENT_DECISIONS, SCOPES_CONFIG } from '../../data/mockData';

const UserDetail = () => {
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scopeModal, setScopeModal] = useState({ isOpen: false, title: '', teams: [] });

    useEffect(() => {
        const fetchUser = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/users/${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                } else {
                    setError('User not found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load user');
            } finally {
                setIsLoading(false);
            }
        };
        if (userId) fetchUser();
    }, [userId]);

    if (isLoading) return <div className="text-center py-12 text-slate-500">Loading profile...</div>;

    if (error || !user) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">{error || 'User not found'}</p>
                <Link href="/users" className="text-blue-600 hover:underline mt-2 inline-block">Back to Users</Link>
            </div>
        );
    }

    // Mock relationships since data is limited for MVP phase of profile refactor
    const userTeams = MOCK_TEAMS ? MOCK_TEAMS.slice(0, 2) : []; // Fallback if mock removed
    const userChannels = MOCK_CHANNELS ? MOCK_CHANNELS.slice(0, 3) : [];
    const recentDecisions = MOCK_RECENT_DECISIONS ? MOCK_RECENT_DECISIONS.filter(d => d.author === user.initials) : [];

    const handleScopeToggle = async (scopeTitle) => {
        // Placeholder: Implementation would require updating user_permissions or similar table via API
        // For now, optimistic update on local state
        const currentScopes = user.scopes || [];
        const newScopes = currentScopes.includes(scopeTitle)
            ? currentScopes.filter(s => s !== scopeTitle)
            : [...currentScopes, scopeTitle];

        setUser({ ...user, scopes: newScopes });
        // TODO: Call API to persist
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <Link href="/users" className="cursor-pointer hover:text-slate-900 transition-colors">Users</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-900">{user.name}</span>
                </div>

                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xl font-bold text-slate-600 shadow-sm">
                            {user.initials}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">{user.name}</h1>
                            <div className="flex items-center gap-3">
                                <span className="text-slate-500 text-sm font-medium">{user.email}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    user.role === 'Manager' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}>
                                    {user.role}
                                </span>
                                <StatusBadge status={user.status} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Permissions & Scopes */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5" /> Access & Scopes
                            </h3>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Privileges</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded bg-slate-50 border border-slate-100">
                                        <div className="text-sm font-medium text-slate-700">Audit Log Access</div>
                                        <ToggleSwitch enabled={user.role === 'Admin' || user.role === 'Manager'} />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded bg-slate-50 border border-slate-100">
                                        <div className="text-sm font-medium text-slate-700">Manage Teams</div>
                                        <ToggleSwitch enabled={user.role === 'Admin'} />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded bg-slate-50 border border-slate-100">
                                        <div className="text-sm font-medium text-slate-700">Export Compliance Reports</div>
                                        <ToggleSwitch enabled={true} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Scopes</h4>
                                <div className="space-y-2">
                                    {SCOPES_CONFIG.map((scope, idx) => {
                                        const isActive = user.scopes?.includes(scope.title);
                                        const scopeTeams = isActive ? userTeams.filter(t => t.scopes.includes(scope.key)) : [];

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => isActive && setScopeModal({ isOpen: true, title: scope.title, teams: scopeTeams })}
                                                className={`flex items-center justify-between p-2 rounded transition-all ${isActive
                                                    ? 'bg-blue-50/50 border border-blue-100 cursor-pointer hover:bg-blue-50 hover:shadow-sm hover:border-blue-200'
                                                    : 'bg-slate-50 border border-slate-100'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-0.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                                                        {idx === 0 && <Clock className="w-4 h-4" />}
                                                        {idx === 1 && <FileText className="w-4 h-4" />}
                                                        {idx === 2 && <Mail className="w-4 h-4" />}
                                                        {idx === 3 && <Download className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <div className={`text-xs font-bold ${isActive ? 'text-blue-900' : 'text-slate-500'}`}>{scope.title}</div>
                                                        <div className="text-[10px] text-slate-500 mt-0.5">{scope.desc}</div>
                                                    </div>
                                                </div>
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <ToggleSwitch
                                                        enabled={isActive}
                                                        onChange={() => handleScopeToggle(scope.title)}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Scope Details Modal */}
                    <Modal
                        isOpen={scopeModal.isOpen}
                        onClose={() => setScopeModal({ ...scopeModal, isOpen: false })}
                        title={`Active Sources: ${scopeModal.title}`}
                        maxWidth="max-w-sm"
                    >
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600">
                                The <strong>{scopeModal.title}</strong> scope is enabled for this user via the following teams:
                            </p>
                            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                                {scopeModal.teams.length > 0 ? scopeModal.teams.map(team => (
                                    <div key={team.id} className="p-3 flex justify-between items-center group hover:bg-white transition-colors">
                                        <span className="text-xs font-bold text-slate-900">{team.name}</span>
                                        <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">{team.type}</span>
                                    </div>
                                )) : (
                                    <div className="p-4 text-center text-xs text-slate-500 italic">
                                        No specific teams found. Scope may be globally assigned.
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button variant="primary" onClick={() => setScopeModal({ ...scopeModal, isOpen: false })}>Close</Button>
                            </div>
                        </div>
                    </Modal>

                    <Card>
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                                <GitCommit className="w-3.5 h-3.5" /> Recent Decisions
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {recentDecisions.length > 0 ? recentDecisions.map(decision => (
                                <div key={decision.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 p-1 rounded-full ${decision.status === 'Validated' ? 'bg-emerald-100 text-emerald-600' :
                                            decision.status === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                                                'bg-amber-100 text-amber-600'
                                            }`}>
                                            {decision.status === 'Validated' && <CheckCircle className="w-4 h-4" />}
                                            {decision.status === 'Rejected' && <XCircle className="w-4 h-4" />}
                                            {decision.status === 'Pending' && <Clock className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{decision.title}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{decision.type}</span>
                                                <span className="text-[10px] text-slate-400">{decision.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <StatusBadge status={decision.status} />
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-500 text-sm">No recent decisions found.</div>
                            )}
                        </div>
                    </Card>

                    {/* Certified Connections Section */}
                    <Card>
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5 text-emerald-600" /> Certified Connections
                            </h3>
                            {/* Save Button */}
                            {(user.social_temp?.github !== (user.social_profiles?.github || '') || user.social_temp?.trello !== (user.social_profiles?.trello || '')) && (
                                <button
                                    onClick={async () => {
                                        // Simple optimistic update + API call would go here
                                        // For now, we just simulate the save functionality
                                        const updatedSocials = {
                                            github: user.social_temp?.github,
                                            trello: user.social_temp?.trello
                                        };

                                        // In real app: await fetch('/api/users/update-socials', { body: JSON.stringify(updatedSocials) })
                                        // Here we simulate local update
                                        setUser(prev => ({
                                            ...prev,
                                            social_profiles: updatedSocials,
                                            social_temp: updatedSocials // reset temp to match saved
                                        }));
                                        alert("Connections updated! Verify via Webhooks now.");
                                    }}
                                    className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded font-bold hover:bg-emerald-700 transition"
                                >
                                    SAVE CHANGES
                                </button>
                            )}
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-xs text-slate-500 mb-4">
                                Enter your external usernames to certify your actions automatically.
                                <span className="block mt-1 font-medium text-slate-700">No OAuth required. Privacy First.</span>
                            </p>

                            {/* GitHub Input */}
                            <div className="flex items-center gap-4">
                                <PlatformIcon platform="GitHub" />
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">GitHub Username</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. octocat"
                                        className="w-full text-sm border-b border-slate-200 focus:border-blue-500 outline-none py-1 text-slate-900 placeholder:text-slate-300"
                                        value={user.social_temp?.github ?? (user.social_profiles?.github || '')}
                                        onChange={(e) => setUser(prev => ({
                                            ...prev,
                                            social_temp: { ...prev.social_temp, github: e.target.value }
                                        }))}
                                    />
                                </div>
                            </div>

                            {/* Trello Input */}
                            <div className="flex items-center gap-4">
                                <PlatformIcon platform="Trello" />
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Trello Username</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. user123"
                                        className="w-full text-sm border-b border-slate-200 focus:border-blue-500 outline-none py-1 text-slate-900 placeholder:text-slate-300"
                                        value={user.social_temp?.trello ?? (user.social_profiles?.trello || '')}
                                        onChange={(e) => setUser(prev => ({
                                            ...prev,
                                            social_temp: { ...prev.social_temp, trello: e.target.value }
                                        }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                                <Fingerprint className="w-3.5 h-3.5 text-blue-600" /> Passport ID Social Graph
                            </h3>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { name: 'Slack', status: 'Connected', id: 'U-SLK-9921', sync: '1 min ago', color: 'bg-[#4A154B]' },
                                { name: 'Microsoft Teams', status: 'Connected', id: 'U-MSF-5542', sync: '5 mins ago', color: 'bg-[#6264A7]' },
                                { name: 'Outlook', status: 'Revoked', id: 'U-MSF-0012', sync: '3 days ago', color: 'bg-[#0078D4]' },
                                { name: 'Gmail', status: 'Connected', id: 'U-GGL-1120', sync: '2 hours ago', color: 'bg-[#EA4335]' }
                            ].map((app, idx) => (
                                <div key={idx} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all hover:border-blue-200">
                                    {/* Abstract Background Decoration */}
                                    <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-[0.08] group-hover:opacity-[0.15] transition-opacity ${app.color}`}></div>

                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-white transition-colors">
                                            <PlatformIcon platform={app.name} />
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wide ${app.status === 'Connected' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${app.status === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                            {app.status}
                                        </div>
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{app.name}</h4>
                                            {app.status === 'Connected' && <Shield className="w-3 h-3 text-slate-300" />}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono bg-slate-50 w-fit px-1.5 py-0.5 rounded border border-slate-100">
                                            <Key className="w-3 h-3 text-slate-400" />
                                            {app.id}
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-2 border-t border-slate-50 flex justify-between items-center relative z-10">
                                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-medium">
                                            <Globe className="w-3 h-3" />
                                            Auth Scopes: Read
                                        </div>
                                        <span className="text-[9px] text-slate-400">{app.sync}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Teams & Channels */}
                <div className="space-y-6">
                    <Card>
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">Assigned Teams</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {userTeams.map(team => (
                                <Link key={team.id} href={`/teams/${team.id}`} className="block p-4 hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{team.name}</span>
                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{team.type}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{team.description}</p>
                                </Link>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">Channel Access</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {userChannels.map(channel => (
                                <div key={channel.id} className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                                            <PlatformIcon platform={channel.platform} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-900">{channel.name}</div>
                                            <div className={`text-[10px] ${channel.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>{channel.status}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-0 overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5" /> Recent Activity
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {[
                                { action: 'Exported Compliance Report', time: '2 mins ago', icon: Download, color: 'text-blue-500 bg-blue-50' },
                                { action: 'Imported 15 users via CSV', time: '1 hour ago', icon: FileText, color: 'text-emerald-500 bg-emerald-50' },
                                { action: 'Generated Decision Audit (PDF)', time: '3 hours ago', icon: Download, color: 'text-blue-500 bg-blue-50' },
                                { action: 'Updated Channel Permissions', time: 'Yesterday', icon: Shield, color: 'text-amber-500 bg-amber-50' },
                            ].map((item, idx) => (
                                <div key={idx} className="p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                                    <div className={`p-1.5 rounded ${item.color}`}>
                                        <item.icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-medium text-slate-800">{item.action}</div>
                                        <div className="text-[10px] text-slate-400">{item.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default UserDetail;
