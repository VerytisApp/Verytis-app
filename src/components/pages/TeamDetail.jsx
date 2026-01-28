import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Shield, FileText, Download, Hash, Mail, Link as LinkIcon, Plus } from 'lucide-react';
import { Card, Button, StatusBadge, PlatformIcon, ToggleSwitch, Modal } from '../ui';
import { MOCK_TEAMS, MOCK_USERS, MOCK_CHANNELS, SCOPES_CONFIG } from '../../data/mockData';

const TeamDetail = () => {
    const { teamId } = useParams();
    const team = MOCK_TEAMS.find(t => t.id.toString() === teamId);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isLinkChannelModalOpen, setIsLinkChannelModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState('Member');
    const [selectedScopes, setSelectedScopes] = useState([]);

    if (!team) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">Team not found</p>
                <Link to="/teams" className="text-indigo-600 hover:underline mt-2 inline-block">Back to Teams</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <Link to="/teams" className="cursor-pointer hover:text-slate-900 transition-colors">Teams</Link>
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
                    <Button variant="primary" onClick={() => setIsEditModalOpen(true)}>Edit Settings</Button>
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
                <div className="grid grid-cols-4 gap-8">
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
                    <div>
                        <div className="flex gap-1.5 mt-1">
                            {team.scopes.map(scope => (
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
                        <Button variant="secondary" className="h-7 text-[10px] px-2.5" icon={Plus} onClick={() => setIsAddUserModalOpen(true)}>Add User</Button>
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
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                >
                                    <option value="Member">Member</option>
                                    <option value="Manager">Manager</option>
                                </select>
                            </div>

                            {selectedRole === 'Manager' && (
                                <div className="mt-2 bg-slate-50 p-3 rounded-md border border-slate-200">
                                    <label className="block text-xs font-semibold text-slate-700 mb-2">Access Scopes</label>
                                    <div className="space-y-2">
                                        {SCOPES_CONFIG.map((scope, idx) => (
                                            <label key={idx} className="flex items-start gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={selectedScopes.includes(scope.title)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedScopes([...selectedScopes, scope.title]);
                                                        } else {
                                                            setSelectedScopes(selectedScopes.filter(s => s !== scope.title));
                                                        }
                                                    }}
                                                />
                                                <div>
                                                    <div className="text-xs font-medium text-slate-900 group-hover:text-indigo-700">{scope.title}</div>
                                                    <div className="text-[10px] text-slate-500">{scope.desc}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
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
                            <Button variant="secondary" className="h-7 text-[10px] px-2.5" icon={LinkIcon} onClick={() => setIsLinkChannelModalOpen(true)}>Link</Button>
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
                            <Link to={`/channels/${channel.id}`} key={channel.id} className="flex items-center justify-between px-5 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
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
                            </Link>
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
        </div >
    );
};

export default TeamDetail;
