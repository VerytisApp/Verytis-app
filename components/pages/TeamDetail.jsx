'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Shield, FileText, Download, Hash, Mail, Link as LinkIcon, Plus, MoreHorizontal, Trash2, Users, MoreVertical } from 'lucide-react';
import { Card, Button, StatusBadge, PlatformIcon, ToggleSwitch, Modal } from '../ui';
import { MOCK_TEAMS, MOCK_USERS, MOCK_CHANNELS, SCOPES_CONFIG, MOCK_CHANNEL_ACTIVITY } from '../../data/mockData';

const TeamDetail = ({ userRole }) => {
    const { teamId } = useParams();
    const team = MOCK_TEAMS.find(t => t.id.toString() === teamId);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isLinkChannelModalOpen, setIsLinkChannelModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState('Member');
    const [selectedScopes, setSelectedScopes] = useState(SCOPES_CONFIG.map(s => s.title));
    const [activeMemberDropdown, setActiveMemberDropdown] = useState(null);
    const [activeChannelDropdown, setActiveChannelDropdown] = useState(null);

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

    if (!team) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">Team not found</p>
                <Link href="/teams" className="text-blue-600 hover:underline mt-2 inline-block">Back to Teams</Link>
            </div>
        );
    }

    const isManagerOfTeam = userRole === 'Manager' && team?.name === 'Engineering & Product';
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
                            <StatusBadge status={team.status} />
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium border bg-slate-50 border-slate-200 text-slate-600">{team.type}</span>
                        </div>
                    </div>
                    {canManageTeam && <Button variant="primary" onClick={() => setIsEditModalOpen(true)}>Edit Settings</Button>}
                </div>
            </div>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit ${team.name}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Team Name</label>
                        <input type="text" defaultValue={team.name} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                        <textarea defaultValue={team.description} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm h-24" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                        <select defaultValue={team.status} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                            <option value="Active">Active</option>
                            <option value="Archived">Archived</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button variant="primary" onClick={() => setIsEditModalOpen(false)}>Save Changes</Button>
                    </div>
                </div>
            </Modal>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    Governance Summary
                </h4>
                <div className={`grid ${userRole === 'Member' ? 'grid-cols-3' : 'grid-cols-4'} gap-8`}>
                    <div>
                        <span className="block text-2xl font-bold text-slate-900 tracking-tight">{team.managers}</span>
                        <span className="text-[11px] text-slate-500 font-medium">Team Managers</span>
                    </div>
                    <div>
                        <span className="block text-2xl font-bold text-slate-900 tracking-tight">{team.channels}</span>
                        <span className="text-[11px] text-slate-500 font-medium">Linked Channels</span>
                    </div>
                    <div>
                        <span className="block text-2xl font-bold text-slate-900 tracking-tight">{team.members}</span>
                        <span className="text-[11px] text-slate-500 font-medium">Total Members</span>
                    </div>
                    {canManageTeam && (
                        <div>
                            <div className="flex gap-1.5 mt-1">
                                {selectedScopes.map(scopeTitle => (
                                    <div key={scopeTitle} className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 shadow-sm" title={scopeTitle}>
                                        {scopeTitle === 'Channel Audit' && <Hash className="w-4 h-4" />}
                                        {scopeTitle === 'Documentation Audit' && <FileText className="w-4 h-4" />}
                                        {scopeTitle === 'Email Audit' && <Mail className="w-4 h-4" />}
                                        {scopeTitle === 'Reports & Exports' && <Download className="w-4 h-4" />}
                                    </div>
                                ))}
                            </div>
                            <span className="block text-[11px] text-slate-500 font-medium mt-2">Active Scopes</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="flex flex-col h-full border-slate-200">
                    <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">Roster</h3>
                        {canManageTeam && <Button variant="secondary" className="h-7 text-[10px] px-2.5" icon={Plus} onClick={() => setIsAddUserModalOpen(true)}>Add User</Button>}
                    </div>

                    <Modal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} title="Add User to Team">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Select User</label>
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                                    <option>Select a user...</option>
                                    {MOCK_USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm disabled:bg-slate-100 disabled:text-slate-500"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    disabled={userRole === 'Manager'}
                                >
                                    <option value="Member">Member</option>
                                    {userRole !== 'Manager' && <option value="Manager">Manager</option>}
                                </select>
                            </div>


                            <div className="flex justify-end pt-4">
                                <Button variant="primary" onClick={() => setIsAddUserModalOpen(false)}>Add User</Button>
                            </div>
                        </div>
                    </Modal>

                    <div className="p-0">
                        <table className="w-full text-xs text-left">
                            <tbody className="divide-y divide-slate-100">
                                {MOCK_USERS.filter(u => u.role === 'Admin' || u.role === 'Manager').slice(0, team.managers).map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50/50">
                                        <td className="px-5 py-3 w-10">
                                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">{user.initials}</div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="font-bold text-slate-900">{user.name}</div>
                                            <div className="text-[10px] text-slate-500">{user.email}</div>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <span className="text-[9px] font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Manager</span>
                                                {userRole === 'Admin' && (
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
                                                                        <Users className="w-3.5 h-3.5 text-slate-400" /> Demote to Member
                                                                    </button>
                                                                    <div className="h-px bg-slate-100 my-1"></div>
                                                                    <button className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2">
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
                                ))}
                                {MOCK_USERS.slice(0, 3).map(user => (
                                    <tr key={`mem-${user.id}`} className="hover:bg-slate-50/50">
                                        <td className="px-5 py-3 w-10">
                                            <div className="w-7 h-7 rounded-full bg-white text-slate-500 flex items-center justify-center text-[10px] font-bold border border-slate-200 shadow-sm">{user.initials}</div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="font-medium text-slate-900">{user.name}</div>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <span className="text-[10px] font-medium text-slate-400">Member</span>
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
                                                                    {userRole === 'Admin' && (
                                                                        <>
                                                                            <button className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                                                <Users className="w-3.5 h-3.5 text-slate-400" /> Promote to Manager
                                                                            </button>
                                                                            <div className="h-px bg-slate-100 my-1"></div>
                                                                        </>
                                                                    )}
                                                                    <button className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2">
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
                                ))}
                            </tbody>
                        </table>
                        <div className="p-3 text-center border-t border-slate-100 bg-slate-50/30">
                            <button className="text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-wide">View All Members</button>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">Linked Channels</h3>
                            {canManageTeam && <Button variant="secondary" className="h-7 text-[10px] px-2.5" icon={LinkIcon} onClick={() => setIsLinkChannelModalOpen(true)}>Link</Button>}
                        </div>

                        <Modal isOpen={isLinkChannelModalOpen} onClose={() => setIsLinkChannelModalOpen(false)} title="Link Channel">
                            <div className="space-y-4">
                                <p className="text-sm text-slate-500">Connect a Slack or Teams channel to this team for audit tracking.</p>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Search Channels</label>
                                    <input type="text" placeholder="#channel-name" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button variant="primary" onClick={() => setIsLinkChannelModalOpen(false)}>Link Channel</Button>
                                </div>
                            </div>
                        </Modal>

                        {MOCK_CHANNELS.slice(0, team.channels).map(channel => (
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
                                    <div className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">{channel.decisions} Decisions</div>
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
                                                        <button className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                                                            <Trash2 className="w-3.5 h-3.5" /> Unlink
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
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
                                    {MOCK_CHANNEL_ACTIVITY.slice(0, 3).map(activity => (
                                        <div key={activity.id} className="flex gap-3">
                                            <div className="relative mt-0.5">
                                                <div className="absolute top-2 left-1 -ml-px h-full w-0.5 bg-slate-100"></div>
                                                <div className={`relative flex h-2 w-2 items-center justify-center rounded-full ring-4 ring-white ${activity.type.includes('decision') ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-900">{activity.text}</p>
                                                <p className="text-[10px] text-slate-500">{activity.time} <span className="text-slate-400 font-mono ml-1">(from {activity.sourceChannel})</span></p>
                                            </div>
                                        </div>
                                    ))}
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
                                                    setSelectedScopes(selectedScopes.filter(s => s !== scope.title));
                                                } else {
                                                    setSelectedScopes([...selectedScopes, scope.title]);
                                                }
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
