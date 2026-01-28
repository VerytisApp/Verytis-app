import { useState, useEffect } from 'react';
import { Plus, Upload, MoreVertical, Pencil, Key, Ban, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Button, StatusBadge, Modal } from '../ui';
import { MOCK_USERS } from '../../data/mockData';

const UsersAndRoles = () => {
    const [users, setUsers] = useState(MOCK_USERS);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [modalConfig, setModalConfig] = useState({ type: null, user: null });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Pagination logic
    const totalPages = Math.ceil(users.length / itemsPerPage);
    const paginatedUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

    const handleAction = (type, user) => {
        setActiveDropdown(null);
        setModalConfig({ type, user });
    };

    const handleUpdateUser = () => {
        // Logic to update user would go here (mock implementation)
        setModalConfig({ type: null, user: null });
    };

    const handleDeactivate = () => {
        setUsers(users.map(u => u.id === modalConfig.user.id ? { ...u, status: 'Inactive' } : u));
        setModalConfig({ type: null, user: null });
    };

    const handleDelete = () => {
        setUsers(users.filter(u => u.id !== modalConfig.user.id));
        setModalConfig({ type: null, user: null });
    };

    const handleResetPassword = () => {
        // Logic to send reset email
        setModalConfig({ type: null, user: null });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Users & Access</h1>
                    <p className="text-slate-500 mt-1 text-xs font-medium">Manage roles, channel visibility and email audit scope.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" icon={Upload}>Import CSV</Button>
                    <Button variant="primary" icon={Plus}>Invite User</Button>
                </div>
            </header>
            <Card className="overflow-visible">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 uppercase tracking-wide">User</th>
                            <th className="px-6 py-3 uppercase tracking-wide">Role</th>
                            <th className="px-6 py-3 uppercase tracking-wide">Auth. Channels</th>
                            <th className="px-6 py-3 uppercase tracking-wide">Email Audit</th>
                            <th className="px-6 py-3 uppercase tracking-wide">Status</th>
                            <th className="px-6 py-3 text-right uppercase tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedUsers.map((user, idx) => (
                            <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <Link to={`/users/${user.id}`} className="block">
                                            <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                                                {user.initials}
                                            </div>
                                        </Link>
                                        <div>
                                            <Link to={`/users/${user.id}`} className="block font-medium text-slate-900 hover:text-indigo-600 transition-colors">
                                                {user.name}
                                            </Link>
                                            <div className="text-slate-500 text-xs">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : user.role === 'Manager' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-3.5 text-slate-600 font-mono text-xs">
                                    {user.channels} Channels
                                </td>
                                <td className="px-6 py-3.5">
                                    {user.auditEnabled ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                            ENABLED
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                            DISABLED
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-3.5">
                                    <StatusBadge status={user.status} />
                                </td>
                                <td className="px-6 py-3.5 text-right relative action-menu">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveDropdown(activeDropdown === user.id ? null : user.id);
                                        }}
                                        className={`h-8 w-8 flex items-center justify-center rounded transition-colors ${activeDropdown === user.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                    {activeDropdown === user.id && (
                                        <div className={`absolute right-8 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200 ${idx >= paginatedUsers.length - 2 ? 'bottom-8 origin-bottom-right' : 'top-8 origin-top-right'}`}>
                                            <div className="py-1">
                                                <button onClick={() => handleAction('edit', user)} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                    <Pencil className="w-3.5 h-3.5 text-slate-400" /> Edit User
                                                </button>
                                                <button onClick={() => handleAction('reset', user)} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                    <Key className="w-3.5 h-3.5 text-slate-400" /> Reset Password
                                                </button>
                                                <div className="h-px bg-slate-100 my-1"></div>
                                                <button onClick={() => handleAction('deactivate', user)} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                    <Ban className="w-3.5 h-3.5 text-slate-400" /> {user.status === 'Inactive' ? 'Activate User' : 'Deactivate User'}
                                                </button>
                                                <button onClick={() => handleAction('delete', user)} className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete User
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

            {/* Edit User Modal */}
            <Modal
                isOpen={modalConfig.type === 'edit'}
                onClose={() => setModalConfig({ type: null, user: null })}
                title={`Edit User: ${modalConfig.user?.name}`}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                        <input type="text" defaultValue={modalConfig.user?.name} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                        <input type="email" defaultValue={modalConfig.user?.email} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                        <select defaultValue={modalConfig.user?.role} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Employee">Employee</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="ghost" onClick={() => setModalConfig({ type: null, user: null })}>Cancel</Button>
                        <Button variant="primary" onClick={handleUpdateUser}>Save Changes</Button>
                    </div>
                </div>
            </Modal>

            {/* Reset Password Modal */}
            <Modal
                isOpen={modalConfig.type === 'reset'}
                onClose={() => setModalConfig({ type: null, user: null })}
                title="Reset Password"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Are you sure you want to send a password reset link to <strong>{modalConfig.user?.email}</strong>?
                    </p>
                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="secondary" onClick={() => setModalConfig({ type: null, user: null })}>Cancel</Button>
                        <Button variant="primary" onClick={handleResetPassword}>Send Reset Link</Button>
                    </div>
                </div>
            </Modal>

            {/* Deactivate User Modal */}
            <Modal
                isOpen={modalConfig.type === 'deactivate'}
                onClose={() => setModalConfig({ type: null, user: null })}
                title={modalConfig.user?.status === 'Inactive' ? 'Activate User' : 'Deactivate User'}
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        {modalConfig.user?.status === 'Inactive'
                            ? <span>Are you sure you want to reactivate access for <strong>{modalConfig.user?.name}</strong>?</span>
                            : <span>Are you sure you want to deactivate <strong>{modalConfig.user?.name}</strong>? They will immediately lose access to the platform.</span>
                        }
                    </p>
                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="secondary" onClick={() => setModalConfig({ type: null, user: null })}>Cancel</Button>
                        <Button variant={modalConfig.user?.status === 'Inactive' ? 'primary' : 'danger'} onClick={handleDeactivate}>
                            {modalConfig.user?.status === 'Inactive' ? 'Activate User' : 'Deactivate User'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete User Modal */}
            <Modal
                isOpen={modalConfig.type === 'delete'}
                onClose={() => setModalConfig({ type: null, user: null })}
                title="Delete User"
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    <div className="bg-rose-50 text-rose-800 p-3 rounded-lg text-sm border border-rose-100">
                        Warning: This action cannot be undone. All audit history associated with this user will be anonymized.
                    </div>
                    <p className="text-sm text-slate-600">
                        Are you sure you want to permanently delete <strong>{modalConfig.user?.name}</strong>?
                    </p>
                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="secondary" onClick={() => setModalConfig({ type: null, user: null })}>Cancel</Button>
                        <Button variant="danger" onClick={handleDelete}>Delete User</Button>
                    </div>
                </div>
            </Modal>    </div>
    );

};

export default UsersAndRoles;
