'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Shield, FileText, Download, Hash, Mail, Link as LinkIcon, Plus, MoreHorizontal, Trash2, Users, MoreVertical } from 'lucide-react';
import { Card, Button, StatusBadge, PlatformIcon, ToggleSwitch, Modal } from '../ui';
import { SCOPES_CONFIG } from '../../data/mockData'; // Keeping general config

const TeamDetail = ({ userRole }) => {
    const { teamId } = useParams();
    const router = useRouter();

    const [team, setTeam] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modals State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isLinkChannelModalOpen, setIsLinkChannelModalOpen] = useState(false);

    // Data State
    const [availableUsers, setAvailableUsers] = useState([]);
    const [availableChannels, setAvailableChannels] = useState([]);

    // Form States
    const [selectedRole, setSelectedRole] = useState('Member');
    const [selectedScopes, setSelectedScopes] = useState([]);

    // Dropdowns
    const [activeMemberDropdown, setActiveMemberDropdown] = useState(null);
    const [activeChannelDropdown, setActiveChannelDropdown] = useState(null);

    // Fetch Team Data
    useEffect(() => {
        const fetchAllData = async () => {
            if (!teamId) return;
            setIsLoading(true);
            try {
                const [teamRes, usersRes, channelsRes] = await Promise.all([
                    fetch(`/api/teams/${teamId}`),
                    fetch('/api/users'),
                    fetch('/api/resources/list')
                ]);

                if (teamRes.ok) {
                    const data = await teamRes.json();
                    setTeam(data.team);
                    setSelectedScopes(data.team.scopes || []);
                } else {
                    if (teamRes.status === 404) setError('Team not found');
                    else setError('Failed to load team data');
                    return;
                }

                if (usersRes.ok) {
                    const data = await usersRes.json();
                    setAvailableUsers(data.users || []);
                }

                if (channelsRes.ok) {
                    const data = await channelsRes.json();
                    setAvailableChannels((data.resources || []).filter(r => r.type === 'channel'));
                }
            } catch (err) {
                console.error("Error loading data:", err);
                setError('An unexpected error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [teamId]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeMemberDropdown && !event.target.closest('.member-action-menu')) {
                setActiveMemberDropdown(null);
            }
            if (activeChannelDropdown && !event.target.closest('.channel-action-menu')) {
                setActiveChannelDropdown(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeMemberDropdown, activeChannelDropdown]);

    const handleUpdateTeam = async (updates) => {
        try {
            const res = await fetch(`/api/teams/${teamId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                const { team: updatedTeam } = await res.json();
                setTeam(prev => ({ ...prev, ...updatedTeam }));
                setIsEditModalOpen(false);
            }
        } catch (e) {
            alert('Failed to update team');
        }
    };

    const handleAddMember = async (userId) => {
        try {
            const res = await fetch(`/api/teams/${teamId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: 'Member' })
            });
            if (res.ok) {
                const { member } = await res.json();
                // We need to fetch the full user details to add to state, or just reload team data.
                // Reloading is safer to get populated fields.
                const user = availableUsers.find(u => u.id === userId);
                setTeam(prev => ({
                    ...prev,
                    members: [...prev.members, { ...user, role: 'Member', joined_at: new Date().toISOString() }]
                }));
                setIsAddUserModalOpen(false);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to add member');
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            const res = await fetch(`/api/teams/${teamId}/members?userId=${userId}`, { method: 'DELETE' });
            if (res.ok) {
                setTeam(prev => ({ ...prev, members: prev.members.filter(m => m.id !== userId) }));
            }
        } catch (e) {
            alert('Failed to remove member');
        }
    };

    const handleLinkChannel = async (channelId) => {
        try {
            const res = await fetch(`/api/teams/${teamId}/channels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelId })
            });
            if (res.ok) {
                const channel = availableChannels.find(c => c.id === channelId);
                setTeam(prev => ({
                    ...prev,
                    channels: [...prev.channels, { ...channel }]
                }));
                setIsLinkChannelModalOpen(false);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to link channel');
        }
    };

    const handleUnlinkChannel = async (channelId) => {
        if (!confirm('Are you sure you want to unlink this channel?')) return;
        try {
            const res = await fetch(`/api/teams/${teamId}/channels?channelId=${channelId}`, { method: 'DELETE' });
            if (res.ok) {
                setTeam(prev => ({ ...prev, channels: prev.channels.filter(c => c.id !== channelId) }));
            }
        } catch (e) {
            alert('Failed to unlink channel');
        }
    };

    if (isLoading) {
        return <div className="p-12 text-center text-slate-500">Loading team details...</div>;
    }

    if (error || !team) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">{error || 'Team not found'}</p>
                <Link href="/teams" className="text-blue-600 hover:underline mt-2 inline-block">Back to Teams</Link>
            </div>
        );
    }

    const isManagerOfTeam = userRole === 'Manager' && team.name.includes('Engineering'); // Mock check
    const canManageTeam = userRole === 'Admin' || isManagerOfTeam;

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <Link href="/teams" className="cursor-pointer hover:text-slate-900 transition-colors">Teams</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-900">{team.name}</span>
                </div>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">{team.name}</h1>
                        <p className="text-slate-600 max-w-2xl text-sm leading-relaxed mb-4">{team.description}</p>
                        <div className="flex items-center gap-3">
                            <StatusBadge status={team.status || 'Active'} />
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium border bg-slate-50 border-slate-200 text-slate-600">{team.type}</span>
                        </div>
                    </div>
                    {canManageTeam && <Button variant="primary" onClick={() => setIsEditModalOpen(true)}>Edit Settings</Button>}
                </div>
            </div>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit ${team.name}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Team Name</label>
                        <input id="edit-name" type="text" defaultValue={team.name} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                        <textarea id="edit-desc" defaultValue={team.description} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm h-24" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                        <select id="edit-status" defaultValue={team.status} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                            <option value="Active">Active</option>
                            <option value="Archived">Archived</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button variant="primary" onClick={() => {
                            const name = document.getElementById('edit-name').value;
                            const description = document.getElementById('edit-desc').value;
                            const status = document.getElementById('edit-status').value;
                            handleUpdateTeam({ name, description, status });
                        }}>Save Changes</Button>
                    </div>
                </div>
            </Modal>

            {/* Stats Cards */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    Governance Summary
                </h4>
                <div className={`grid ${userRole === 'Member' ? 'grid-cols-3' : 'grid-cols-4'} gap-8`}>
                    <div>
                        <span className="block text-2xl font-bold text-slate-900 tracking-tight">{team.stats?.managers || 0}</span>
                        <span className="text-[11px] text-slate-500 font-medium">Team Managers</span>
                    </div>
                    <div>
                        <span className="block text-2xl font-bold text-slate-900 tracking-tight">{team.stats?.channels || 0}</span>
                        <span className="text-[11px] text-slate-500 font-medium">Linked Channels</span>
                    </div>
                    <div>
                        <span className="block text-2xl font-bold text-slate-900 tracking-tight">{team.stats?.members || 0}</span>
                        <span className="text-[11px] text-slate-500 font-medium">Total Members</span>
                    </div>
                    {canManageTeam && (
                        <div>
                            <div className="flex gap-1.5 mt-1">
                                {selectedScopes.map(scopeTitle => (
                                    <div key={scopeTitle} className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 shadow-sm" title={scopeTitle}>
                                        {scopeTitle === 'audit' && <Hash className="w-4 h-4" />}
                                        {scopeTitle === 'docs' && <FileText className="w-4 h-4" />}
                                        {scopeTitle === 'Email Audit' && <Mail className="w-4 h-4" />}
                                        {scopeTitle === 'export' && <Download className="w-4 h-4" />}
                                    </div>
                                ))}
                                {selectedScopes.length === 0 && <span className="text-[11px] text-slate-400">No active scopes</span>}
                            </div>
                            <span className="block text-[11px] text-slate-500 font-medium mt-2">Active Scopes</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Roster / Members */}
                <Card className="flex flex-col h-full border-slate-200">
                    <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">Roster</h3>
                        {canManageTeam && <Button variant="secondary" className="h-7 text-[10px] px-2.5" icon={Plus} onClick={() => setIsAddUserModalOpen(true)}>Add User</Button>}
                    </div>

                    <Modal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} title="Add User to Team">
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500">Search and select users to add to this team.</p>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                                    onChange={(e) => {
                                        const userId = e.target.value;
                                        if (userId) {
                                            handleAddMember(userId);
                                        }
                                    }}
                                >
                                    <option value="">Select a user...</option>
                                    {availableUsers
                                        .filter(u => !team.members?.some(m => m.id === u.id)) // Exclude existing members
                                        .map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                        ))}
                                </select>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button variant="ghost" onClick={() => setIsAddUserModalOpen(false)}>Cancel</Button>
                            </div>
                        </div>
                    </Modal>

                    <div className="p-0">
                        <table className="w-full text-xs text-left">
                            <tbody className="divide-y divide-slate-100">
                                {team.members?.length > 0 ? team.members.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50/50">
                                        <td className="px-5 py-3 w-10">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt="" className="w-7 h-7 rounded-full" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold border border-slate-200">{user.name.charAt(0)}</div>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="font-medium text-slate-900">{user.name}</div>
                                            <div className="text-[10px] text-slate-500">{user.email}</div>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${user.role === 'lead' ? 'text-blue-700 bg-blue-50 border-blue-100' : 'text-slate-500 bg-slate-50 border-slate-100'}`}>
                                                    {user.role === 'lead' ? 'Manager' : 'Member'}
                                                </span>
                                                {canManageTeam && (
                                                    <div className="relative member-action-menu">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveMemberDropdown(activeMemberDropdown === user.id ? null : user.id);
                                                            }}
                                                            className={`p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ${activeMemberDropdown === user.id ? 'bg-slate-100 text-slate-900' : ''}`}
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                        {activeMemberDropdown === user.id && (
                                                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                                                <div className="py-1">
                                                                    <button className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                                        <Users className="w-3.5 h-3.5 text-slate-400" /> Change Role
                                                                    </button>
                                                                    <div className="h-px bg-slate-100 my-1"></div>
                                                                    <button onClick={() => handleRemoveMember(user.id)} className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                                                                        <Trash2 className="w-3.5 h-3.5" /> Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="px-5 py-8 text-center text-slate-400">No members in this team yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <div className="space-y-6">
                    {/* Liinked Channels */}
                    <Card>
                        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">Linked Channels</h3>
                            {canManageTeam && <Button variant="secondary" className="h-7 text-[10px] px-2.5" icon={LinkIcon} onClick={() => setIsLinkChannelModalOpen(true)}>Link</Button>}
                        </div>

                        <Modal isOpen={isLinkChannelModalOpen} onClose={() => setIsLinkChannelModalOpen(false)} title="Link Channel">
                            <div className="space-y-4">
                                <p className="text-sm text-slate-500">Connect a Slack or Teams channel to this team.</p>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select Channel</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                                        onChange={(e) => {
                                            const channelId = e.target.value;
                                            if (channelId) {
                                                handleLinkChannel(channelId);
                                            }
                                        }}
                                    >
                                        <option value="">Select a channel...</option>
                                        {availableChannels
                                            .filter(c => !team.channels?.some(tc => tc.id === c.id)) // Exclude linked channels
                                            .map(c => (
                                                <option key={c.id} value={c.id}>{c.name} ({c.platform})</option>
                                            ))}
                                    </select>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button variant="ghost" onClick={() => setIsLinkChannelModalOpen(false)}>Cancel</Button>
                                </div>
                            </div>
                        </Modal>

                        {team.channels?.length > 0 ? team.channels.map(channel => (
                            <div key={channel.id} className="flex items-center justify-between px-5 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group">
                                <Link href={`/channels/${channel.id}`} className="flex items-center gap-3">
                                    <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                                        <PlatformIcon platform={channel.platform} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{channel.name}</div>
                                        <div className="text-[10px] text-slate-500">Public Channel</div>
                                    </div>
                                </Link>
                                <div className="flex items-center gap-3">
                                    <div className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">{channel.decisionsConfig || 0} Decisions</div>
                                    {canManageTeam && (
                                        <div className="relative channel-action-menu">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveChannelDropdown(activeChannelDropdown === channel.id ? null : channel.id);
                                                }}
                                                className={`p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors ${activeChannelDropdown === channel.id ? 'bg-slate-200 text-slate-900' : 'opacity-0 group-hover:opacity-100'}`}
                                            >
                                                <MoreVertical className="w-3.5 h-3.5" />
                                            </button>
                                            {activeChannelDropdown === channel.id && (
                                                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                                    <div className="py-1">
                                                        <button onClick={() => handleUnlinkChannel(channel.id)} className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                                                            <Trash2 className="w-3.5 h-3.5" /> Unlink
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="p-5 text-center text-slate-400 text-xs">No channels linked yet.</div>
                        )}
                    </Card>

                    <Card>
                        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                                {canManageTeam ? 'Audit Scope' : 'Latest Activity'}
                            </h3>
                        </div>
                        <div className="p-5 space-y-4">
                            {!canManageTeam ? (
                                // For Members: Show Mini Timeline / Activity
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded border border-slate-100 text-center">
                                        <p className="text-xs text-slate-500">Recent activity will appear here.</p>
                                    </div>
                                    <div className="pt-2">
                                        <Link href="/timeline" className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wide">View Full Timeline &rarr;</Link>
                                    </div>
                                </div>
                            ) : (
                                // For Admins/Managers: Show Audit Configuration
                                SCOPES_CONFIG.map((scope, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 text-slate-400">
                                                {idx === 0 && <Hash className="w-4 h-4" />}
                                                {idx === 1 && <FileText className="w-4 h-4" />}
                                                {idx === 2 && <Mail className="w-4 h-4" />}
                                                {idx === 3 && <Download className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900">{scope.title}</div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">{scope.desc}</div>
                                            </div>
                                        </div>
                                        <ToggleSwitch
                                            enabled={selectedScopes.includes(scope.title)}
                                            disabled={userRole === 'Manager'}
                                            onClick={() => {
                                                if (selectedScopes.includes(scope.title)) {
                                                    setSelectedScopes(prev => prev.filter(s => s !== scope.title));
                                                } else {
                                                    setSelectedScopes(prev => [...prev, scope.title]);
                                                }
                                                // TODO: Persist scope changes to DB
                                            }}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div >
    );
};

export default TeamDetail;
