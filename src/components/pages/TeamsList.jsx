import { useState, useRef, useEffect } from 'react';
import { Plus, MoreHorizontal, Shield, FileText, Download, Pencil, Users, Archive, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Button, Modal } from '../ui';
import { MOCK_TEAMS, MOCK_USERS, MOCK_CHANNELS, SCOPES_CONFIG } from '../../data/mockData';

const TeamsList = ({ userRole }) => {
    const [teams, setTeams] = useState(MOCK_TEAMS);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [modalConfig, setModalConfig] = useState({ type: null, team: null });
    const [showAddMember, setShowAddMember] = useState(false);

    // Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const [teamFormData, setTeamFormData] = useState({
        name: '', description: '', type: 'Operational', members: [], scopes: [], channels: []
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown && !event.target.closest('.action-menu')) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeDropdown]);

    const handleAction = (type, team) => {
        setActiveDropdown(null);
        if (type === 'archive') {
            setTeams(teams.map(t => t.id === team.id ? { ...t, status: 'Archived' } : t));
        } else if (type === 'delete') {
            setModalConfig({ type: 'delete', team });
        } else {
            setModalConfig({ type, team });
        }
    };

    const confirmDelete = () => {
        setTeams(teams.filter(t => t.id !== modalConfig.team.id));
        setModalConfig({ type: null, team: null });
    };

    // Logic to determine role in a specific team (Mocking)
    const getTeamRole = (teamName) => {
        if (userRole === 'Admin') return 'Admin';
        if (userRole === 'Member') return 'Member';
        // For Manager (David Chen)
        if (teamName === 'Engineering & Product') return 'Manager';
        if (teamName === 'Finance & Legal') return 'Member';
        return 'None';
    };

    // Filter teams for Member and Manager view
    const displayedTeams = userRole === 'Admin' ? teams :
        userRole === 'Manager' ? teams.filter(t => t.name === 'Engineering & Product' || t.name === 'Finance & Legal') :
            teams.filter(t => t.name === 'Finance & Legal'); // Member

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Teams</h1>
                    <p className="text-slate-500 mt-1 text-xs font-medium">
                        {userRole === 'Member'
                            ? 'Overview of teams where you have active membership.'
                            : userRole === 'Manager'
                                ? 'Manage your assigned teams and memberships.'
                                : 'Structure your organization to strictly control audit visibility.'}
                    </p>
                </div>
                {userRole === 'Admin' && (
                    <Button variant="primary" icon={Plus} onClick={() => {
                        setModalConfig({ type: 'create', team: {} });
                        setCurrentStep(1);
                        setTeamFormData({ name: '', description: '', type: 'Operational', members: [], scopes: [], channels: [] });
                    }}>Create Team</Button>
                )}
            </header>
            <Card className="overflow-hidden shadow-sm min-h-[400px]">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 uppercase tracking-wide">Team Name</th>
                            <th className="px-6 py-3 uppercase tracking-wide">Type</th>
                            <th className="px-6 py-3 uppercase tracking-wide">Channels</th>
                            <th className="px-6 py-3 uppercase tracking-wide">Members</th>
                            {userRole !== 'Admin' && <th className="px-6 py-3 uppercase tracking-wide">Role</th>}
                            <th className="px-6 py-3 uppercase tracking-wide">
                                {userRole === 'Member' ? 'Status' : 'Audit Scope'}
                            </th>
                            <th className="px-6 py-3 uppercase tracking-wide">Created</th>
                            {userRole !== 'Member' && <th className="px-6 py-3 text-right uppercase tracking-wide">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {displayedTeams.map(team => {
                            const role = getTeamRole(team.name);
                            return (
                                <tr key={team.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <Link
                                            to={`/teams/${team.id}`}
                                            className="block cursor-pointer"
                                        >
                                            <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{team.name}</span>
                                            <p className="text-slate-500 mt-0.5 truncate max-w-xs">{team.description}</p>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${team.status === 'Archived' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                            {team.status === 'Archived' ? 'Archived' : team.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-600">{team.channels}</td>
                                    <td className="px-6 py-4 font-mono text-slate-600">{team.members}</td>

                                    {/* Role Column */}
                                    {userRole !== 'Admin' && (
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${role === 'Manager'
                                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                {role || 'Member'}
                                            </span>
                                        </td>
                                    )}

                                    <td className="px-6 py-4">
                                        {userRole === 'Member' ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                                                Active
                                            </span>
                                        ) : role === 'Member' && userRole === 'Manager' ? (
                                            // Manager viewing a team as Member -> Crosses
                                            <div className="flex gap-2 opacity-50 pl-1">
                                                <X className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                                                <X className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                                                <X className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                                            </div>
                                        ) : (
                                            <div className="flex gap-1.5">
                                                {team.scopes.map(scope => (
                                                    <div key={scope} className="p-1 rounded bg-blue-50 border border-blue-100 text-blue-600" title={scope}>
                                                        {scope === 'audit' && <Shield className="w-3 h-3" />}
                                                        {scope === 'docs' && <FileText className="w-3 h-3" />}
                                                        {scope === 'export' && <Download className="w-3 h-3" />}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{new Date(team.created).toLocaleDateString()}</td>

                                    {userRole !== 'Member' && (
                                        <td className="px-6 py-4 text-right relative action-menu">
                                            {(role === 'Manager' || role === 'Admin') && (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveDropdown(activeDropdown === team.id ? null : team.id);
                                                        }}
                                                        className={`text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded ${activeDropdown === team.id ? 'bg-slate-100 text-slate-900' : ''}`}
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                    {activeDropdown === team.id && (
                                                        <div className="absolute right-8 top-8 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                                            <div className="py-1">
                                                                <button onClick={() => handleAction('edit', team)} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                                    <Pencil className="w-3.5 h-3.5 text-slate-400" /> Edit Team
                                                                </button>
                                                                <button onClick={() => handleAction('members', team)} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                                    <Users className="w-3.5 h-3.5 text-slate-400" /> Manage Members
                                                                </button>
                                                                <button onClick={() => handleAction('archive', team)} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                                    <Archive className="w-3.5 h-3.5 text-slate-400" /> {team.status === 'Archived' ? 'Unarchive' : 'Archive Team'}
                                                                </button>
                                                                {userRole === 'Admin' && (
                                                                    <>
                                                                        <div className="h-px bg-slate-100 my-1"></div>
                                                                        <button onClick={() => handleAction('delete', team)} className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                                                                            <Trash2 className="w-3.5 h-3.5" /> Delete Team
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Card>

            {/* Edit / Create Modal */}
            <Modal
                isOpen={modalConfig.type === 'edit' || modalConfig.type === 'create'}
                onClose={() => setModalConfig({ type: null, team: null })}
                title={modalConfig.type === 'create' ? `Create New Team (Step ${currentStep}/3)` : `Edit ${modalConfig.team?.name}`}
                maxWidth={modalConfig.type === 'create' ? "max-w-2xl" : "max-w-lg"}
            >
                {modalConfig.type === 'create' ? (
                    <div className="space-y-6">
                        {/* Step Indicator */}
                        <div className="flex items-center justify-between px-2 mb-4">
                            <div className={`h-1 flex-1 rounded-full ${currentStep >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                            <div className="w-2"></div>
                            <div className={`h-1 flex-1 rounded-full ${currentStep >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                            <div className="w-2"></div>
                            <div className={`h-1 flex-1 rounded-full ${currentStep >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                        </div>

                        {/* Step 1: Basic Info */}
                        {currentStep === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Team Name</label>
                                    <input
                                        type="text"
                                        value={teamFormData.name}
                                        onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                                        placeholder="e.g. Finance & Legal"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Team Type</label>
                                    <select
                                        value={teamFormData.type}
                                        onChange={(e) => setTeamFormData({ ...teamFormData, type: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                                    >
                                        <option value="Operational">Operational</option>
                                        <option value="Governance">Governance</option>
                                        <option value="Project">Project</option>
                                        <option value="R&D">R&D</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                                    <textarea
                                        value={teamFormData.description}
                                        onChange={(e) => setTeamFormData({ ...teamFormData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm h-24"
                                        placeholder="Briefly describe the team's purpose..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Members & Scopes */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs font-semibold text-slate-700">Add Members</label>
                                        <span className="text-[10px] text-slate-400">{teamFormData.members.length} selected</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                                            onChange={(e) => {
                                                if (e.target.value && !teamFormData.members.find(m => m.id === parseInt(e.target.value))) {
                                                    const user = MOCK_USERS.find(u => u.id === parseInt(e.target.value));
                                                    setTeamFormData({
                                                        ...teamFormData,
                                                        members: [...teamFormData.members, { ...user, role: 'Member' }] // Default role Member
                                                    });
                                                }
                                                e.target.value = "";
                                            }}
                                        >
                                            <option value="">Select a user to add...</option>
                                            {MOCK_USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="border border-slate-200 rounded-md max-h-32 overflow-y-auto bg-slate-50 min-h-[80px] p-2 space-y-1">
                                        {teamFormData.members.length === 0 ? (
                                            <p className="text-[11px] text-slate-400 text-center py-4">No members added yet.</p>
                                        ) : teamFormData.members.map(member => (
                                            <div key={member.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-100 shadow-sm">
                                                <span>{member.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={member.role}
                                                        onChange={(e) => {
                                                            setTeamFormData({
                                                                ...teamFormData,
                                                                members: teamFormData.members.map(m => m.id === member.id ? { ...m, role: e.target.value } : m)
                                                            });
                                                        }}
                                                        className="text-[10px] py-0.5 px-1 border border-slate-200 rounded"
                                                    >
                                                        <option value="Member">Member</option>
                                                        <option value="Manager">Manager</option>
                                                    </select>
                                                    <button
                                                        onClick={() => setTeamFormData({ ...teamFormData, members: teamFormData.members.filter(m => m.id !== member.id) })}
                                                        className="text-slate-400 hover:text-rose-600"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-semibold text-slate-700">Manager Scope</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {SCOPES_CONFIG.map((scope, idx) => (
                                            <label key={idx} className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${teamFormData.scopes.includes(scope.title) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    checked={teamFormData.scopes.includes(scope.title)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setTeamFormData({ ...teamFormData, scopes: [...teamFormData.scopes, scope.title] });
                                                        else setTeamFormData({ ...teamFormData, scopes: teamFormData.scopes.filter(s => s !== scope.title) });
                                                    }}
                                                />
                                                <div>
                                                    <div className="text-[11px] font-bold text-slate-900">{scope.title}</div>
                                                    <div className="text-[9px] text-slate-500 leading-tight">{scope.desc}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Link Channels */}
                        {currentStep === 3 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <p className="text-xs text-slate-500">Select channels to link to this team. Decisions made in these channels will be audited.</p>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto border border-slate-200 rounded-md">
                                    {MOCK_CHANNELS.map(channel => (
                                        <label key={channel.id} className={`flex items-center justify-between p-3 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 ${teamFormData.channels.includes(channel.id) ? 'bg-blue-50/50' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    checked={teamFormData.channels.includes(channel.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setTeamFormData({ ...teamFormData, channels: [...teamFormData.channels, channel.id] });
                                                        else setTeamFormData({ ...teamFormData, channels: teamFormData.channels.filter(id => id !== channel.id) });
                                                    }}
                                                />
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900">{channel.name}</div>
                                                    <div className="text-[10px] text-slate-500 capitalize">{channel.platform} • Public Channel</div>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-4 border-t border-slate-100">
                            {currentStep > 1 ? (
                                <Button variant="ghost" onClick={() => setCurrentStep(curr => curr - 1)}>Back</Button>
                            ) : (
                                <Button variant="ghost" onClick={() => setModalConfig({ type: null, team: null })}>Cancel</Button>
                            )}

                            {currentStep < 3 ? (
                                <Button variant="primary" onClick={() => setCurrentStep(curr => curr + 1)} disabled={currentStep === 1 && !teamFormData.name}>Next Step</Button>
                            ) : (
                                <Button variant="primary" onClick={() => {
                                    // Submit logic (mock)
                                    setModalConfig({ type: null, team: null });
                                    // Here we would normally add the team to the list
                                }}>Create Team</Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Team Name</label>
                            <input type="text" defaultValue={modalConfig.team?.name} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" placeholder="e.g. Finance & Legal" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                            <textarea defaultValue={modalConfig.team?.description} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm h-24" placeholder="Briefly describe the team's purpose..." />
                        </div>
                        <div className="flex justify-end pt-4 gap-2">
                            <Button variant="ghost" onClick={() => setModalConfig({ type: null, team: null })}>Cancel</Button>
                            <Button variant="primary" onClick={() => setModalConfig({ type: null, team: null })}>
                                Save Changes
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Manage Members Modal */}
            <Modal
                isOpen={modalConfig.type === 'members'}
                onClose={() => setModalConfig({ type: null, team: null })}
                title={`Members: ${modalConfig.team?.name}`}
            >
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <input type="text" placeholder="Search members..." className="px-3 py-1.5 border border-slate-300 rounded-md text-xs w-64" />
                        <Button variant="secondary" icon={Plus} className="h-8" onClick={() => setShowAddMember(true)}>Add Member</Button>
                    </div>

                    {showAddMember && (
                        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-2">Select User to Add</label>
                            <div className="flex gap-2">
                                <select className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-xs">
                                    <option>Select a user...</option>
                                    {MOCK_USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                <Button variant="primary" className="h-8" onClick={() => setShowAddMember(false)}>Add</Button>
                                <Button variant="ghost" className="h-8" onClick={() => setShowAddMember(false)}>Cancel</Button>
                            </div>
                        </div>
                    )}
                    <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                        <table className="w-full text-xs text-left">
                            <tbody className="divide-y divide-slate-100">
                                {MOCK_USERS.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 font-medium text-slate-900">{user.name}</td>
                                        <td className="px-4 py-2 text-slate-500">{user.email}</td>
                                        <td className="px-4 py-2 text-right">
                                            <button className="text-slate-400 hover:text-rose-600 transition-colors font-medium">Remove</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button variant="primary" onClick={() => setModalConfig({ type: null, team: null })}>Done</Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={modalConfig.type === 'delete'}
                onClose={() => setModalConfig({ type: null, team: null })}
                title="Delete Team"
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    <div className="bg-rose-50 text-rose-800 p-3 rounded-lg text-sm border border-rose-100">
                        Warning: This action cannot be undone. All channels and data associated with this team will be permanently deleted.
                    </div>
                    <p className="text-sm text-slate-600">
                        Are you sure you want to delete <strong>{modalConfig.team?.name}</strong>?
                    </p>
                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="secondary" onClick={() => setModalConfig({ type: null, team: null })}>Cancel</Button>
                        <Button variant="danger" onClick={confirmDelete}>Delete Team</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TeamsList;
