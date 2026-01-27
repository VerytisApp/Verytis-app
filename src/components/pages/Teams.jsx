import { useState } from 'react';
import { Plus, ChevronRight, MoreHorizontal, Shield, FileText, Download, Hash, Mail, Link as LinkIcon } from 'lucide-react';
import { Card, Button, StatusBadge, PlatformIcon, ToggleSwitch } from '../ui';
import { MOCK_TEAMS, MOCK_USERS, MOCK_CHANNELS, SCOPES_CONFIG } from '../../data/mockData';

const Teams = () => {
    const [view, setView] = useState('list');
    const [selectedTeam, setSelectedTeam] = useState(null);

    const openTeamDetail = (team) => {
        setSelectedTeam(team);
        setView('detail');
    };

    const backToList = () => {
        setSelectedTeam(null);
        setView('list');
    };

    if (view === 'list') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Teams</h1>
                        <p className="text-slate-500 mt-1 text-xs font-medium">Structure your organization to strictly control audit visibility.</p>
                    </div>
                    <Button variant="primary" icon={Plus}>Create Team</Button>
                </header>
                <Card className="overflow-hidden shadow-sm">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 uppercase tracking-wide">Team Name</th>
                                <th className="px-6 py-3 uppercase tracking-wide">Type</th>
                                <th className="px-6 py-3 uppercase tracking-wide">Channels</th>
                                <th className="px-6 py-3 uppercase tracking-wide">Members</th>
                                <th className="px-6 py-3 uppercase tracking-wide">Audit Scope</th>
                                <th className="px-6 py-3 uppercase tracking-wide">Created</th>
                                <th className="px-6 py-3 text-right uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {MOCK_TEAMS.map(team => (
                                <tr key={team.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => openTeamDetail(team)}>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{team.name}</span>
                                        <p className="text-slate-500 mt-0.5 truncate max-w-xs">{team.description}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                            {team.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-600">{team.channels}</td>
                                    <td className="px-6 py-4 font-mono text-slate-600">{team.members}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1.5">
                                            {team.scopes.map(scope => (
                                                <div key={scope} className="p-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-600" title={scope}>
                                                    {scope === 'audit' && <Shield className="w-3 h-3" />}
                                                    {scope === 'docs' && <FileText className="w-3 h-3" />}
                                                    {scope === 'export' && <Download className="w-3 h-3" />}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{new Date(team.created).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <button className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        );
    }

    if (view === 'detail' && selectedTeam) {
        return (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <span className="cursor-pointer hover:text-slate-900 transition-colors" onClick={backToList}>Teams</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-slate-900">{selectedTeam.name}</span>
                    </div>

                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">{selectedTeam.name}</h1>
                            <p className="text-slate-600 max-w-2xl text-sm leading-relaxed mb-4">{selectedTeam.description}</p>
                            <div className="flex items-center gap-3">
                                <StatusBadge status={selectedTeam.status} />
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium border bg-slate-50 border-slate-200 text-slate-600">{selectedTeam.type}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary">Archive</Button>
                            <Button variant="primary">Edit Settings</Button>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        Governance Summary
                    </h4>
                    <div className="grid grid-cols-4 gap-8">
                        <div>
                            <span className="block text-2xl font-bold text-slate-900 tracking-tight">{selectedTeam.managers}</span>
                            <span className="text-[11px] text-slate-500 font-medium">Team Managers</span>
                        </div>
                        <div>
                            <span className="block text-2xl font-bold text-slate-900 tracking-tight">{selectedTeam.channels}</span>
                            <span className="text-[11px] text-slate-500 font-medium">Linked Channels</span>
                        </div>
                        <div>
                            <span className="block text-2xl font-bold text-slate-900 tracking-tight">{selectedTeam.members}</span>
                            <span className="text-[11px] text-slate-500 font-medium">Total Members</span>
                        </div>
                        <div>
                            <div className="flex gap-1.5 mt-1">
                                {selectedTeam.scopes.map(scope => (
                                    <div key={scope} className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 shadow-sm">
                                        {scope === 'audit' && <Shield className="w-4 h-4" />}
                                        {scope === 'docs' && <FileText className="w-4 h-4" />}
                                        {scope === 'export' && <Download className="w-4 h-4" />}
                                    </div>
                                ))}
                            </div>
                            <span className="block text-[11px] text-slate-500 font-medium mt-2">Active Scopes</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="flex flex-col h-full border-slate-200">
                        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">Roster</h3>
                            <Button variant="secondary" className="h-7 text-[10px] px-2.5" icon={Plus}>Add User</Button>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-xs text-left">
                                <tbody className="divide-y divide-slate-100">
                                    {MOCK_USERS.filter(u => u.role === 'Admin' || u.role === 'Manager').slice(0, selectedTeam.managers).map(user => (
                                        <tr key={user.id} className="hover:bg-slate-50/50">
                                            <td className="px-5 py-3 w-10">
                                                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">{user.initials}</div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="font-bold text-slate-900">{user.name}</div>
                                                <div className="text-[10px] text-slate-500">{user.email}</div>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span className="text-[9px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Manager</span>
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
                                                <span className="text-[10px] font-medium text-slate-400">Member</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-3 text-center border-t border-slate-100 bg-slate-50/30">
                                <button className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wide">View All Members</button>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">Linked Channels</h3>
                                <Button variant="secondary" className="h-7 text-[10px] px-2.5" icon={LinkIcon}>Link</Button>
                            </div>
                            {MOCK_CHANNELS.slice(0, selectedTeam.channels).map(channel => (
                                <div key={channel.id} className="flex items-center justify-between px-5 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                                            <PlatformIcon platform={channel.platform} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-900">{channel.name}</div>
                                            <div className="text-[10px] text-slate-500">Public Channel</div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">{channel.decisions} Decisions</div>
                                </div>
                            ))}
                        </Card>

                        <Card>
                            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">Audit Configuration</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                {SCOPES_CONFIG.map((scope, idx) => (
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
                                        <ToggleSwitch enabled={true} />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default Teams;
