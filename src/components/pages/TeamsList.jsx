import { useState, useRef, useEffect } from 'react';
import { Plus, MoreHorizontal, Shield, FileText, Download, Pencil, Users, Archive, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Button, Modal } from '../ui';
import { MOCK_TEAMS, MOCK_USERS } from '../../data/mockData';

const TeamsList = () => {
    const [teams, setTeams] = useState(MOCK_TEAMS);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [modalConfig, setModalConfig] = useState({ type: null, team: null });
    const [showAddMember, setShowAddMember] = useState(false);

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

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Teams</h1>
                    <p className="text-slate-500 mt-1 text-xs font-medium">Structure your organization to strictly control audit visibility.</p>
                </div>
                <Button variant="primary" icon={Plus} onClick={() => setModalConfig({ type: 'create', team: {} })}>Create Team</Button>
            </header>
            <Card className="overflow-hidden shadow-sm min-h-[400px]">
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
                        {teams.map(team => (
                            <tr key={team.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <Link to={`/teams/${team.id}`} className="block">
                                        <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{team.name}</span>
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
                                <td className="px-6 py-4 text-right relative action-menu">
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
                                                <div className="h-px bg-slate-100 my-1"></div>
                                                <button onClick={() => handleAction('delete', team)} className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete Team
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            {/* Edit / Create Modal */}
            <Modal
                isOpen={modalConfig.type === 'edit' || modalConfig.type === 'create'}
                onClose={() => setModalConfig({ type: null, team: null })}
                title={modalConfig.type === 'create' ? 'Create New Team' : `Edit ${modalConfig.team?.name}`}
            >
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
                            {modalConfig.type === 'create' ? 'Create Team' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
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
