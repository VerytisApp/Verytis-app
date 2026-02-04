'use client';

import { useState, useEffect } from 'react';
import { Plus, Upload, MoreVertical, Pencil, Key, Ban, Trash2, Mail } from 'lucide-react';
import Link from 'next/link';
import { Card, Button, StatusBadge, Modal } from '../ui';
import { MOCK_USERS } from '../../data/mockData';

const UsersAndRoles = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [modalConfig, setModalConfig] = useState({ type: null, user: null });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Fetch Users
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

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

    // Handlers using API
    const handleUpdateUser = async () => {
        const name = document.getElementById('edit-user-name').value;
        const role = document.getElementById('edit-user-role').value;
        // Email usually can't be changed easily without re-verification in auth systems, skipping for now or assumed readonly for essential ID.

        try {
            const res = await fetch(`/api/users/${modalConfig.user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, role })
            });

            if (res.ok) {
                fetchUsers(); // Refresh list
                setModalConfig({ type: null, user: null });
            } else {
                alert('Failed to update user');
            }
        } catch (e) { console.error(e); alert('Error updating user'); }
    };

    const handleDeactivate = async () => {
        const newStatus = modalConfig.user.status === 'Inactive' ? 'Active' : 'Inactive';
        try {
            const res = await fetch(`/api/users/${modalConfig.user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchUsers();
                setModalConfig({ type: null, user: null });
            }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/users/${modalConfig.user.id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchUsers();
                setModalConfig({ type: null, user: null });
            } else {
                alert('Failed to delete user');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting user');
        }
    };

    const handleInviteUser = async (e) => {
        e.preventDefault();
        const email = document.getElementById('invite-email')?.value;
        const name = document.getElementById('invite-name')?.value;
        const role = document.getElementById('invite-role')?.value;

        if (!email) return;

        setModalConfig(prev => ({ ...prev, inviteStatus: 'sending' }));

        try {
            // Artificial delay to make the "Sending..." state visible and feel processed
            await new Promise(resolve => setTimeout(resolve, 800));

            const res = await fetch('/api/users/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, role })
            });

            if (res.ok) {
                // Determine success, but don't close modal yet. Show success message.
                setModalConfig(prev => ({ ...prev, inviteStatus: 'success' }));
                // We'll fetch users when they close or click "Done" in the success view
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to invite user');
                setModalConfig(prev => ({ ...prev, inviteStatus: 'idle' }));
            }
        } catch (e) {
            console.error(e);
            alert('Error inviting user');
            setModalConfig(prev => ({ ...prev, inviteStatus: 'idle' }));
        }
    };

    const handleResetPassword = () => {
        // Logic to send reset email via Supabase Auth API (requires backend usually)
        // Placeholder
        alert(`Reset link sent to ${modalConfig.user.email} (simulated)`);
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
                    {/* CSV Import Placeholder - keeping simpler for now */}
                    <input
                        type="file"
                        id="csv-upload"
                        className="hidden"
                        accept=".csv"
                        onChange={() => alert("Bulk import via CSV is not yet connected to the backend API.")}
                    />
                    <Button variant="secondary" icon={Upload} onClick={() => document.getElementById('csv-upload').click()}>Import CSV</Button>
                    <Button variant="primary" icon={Plus} onClick={() => setModalConfig({ type: 'invite' })}>Invite User</Button>
                </div>
            </header>
            <Card className="overflow-visible">
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500">Loading users...</div>
                ) : (
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
                                            <Link href={`/users/${user.id}`} className="block">
                                                <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-600 transition-colors">
                                                    {user.initials}
                                                </div>
                                            </Link>
                                            <div>
                                                <Link href={`/users/${user.id}`} className="block font-medium text-slate-900 hover:text-blue-600 transition-colors">
                                                    {user.name}
                                                </Link>
                                                <div className="text-slate-500 text-xs">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : user.role === 'manager' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5 text-slate-600 font-mono text-xs">
                                        {/* Mock channel count for list view if not expensive to join, or just 0 */}
                                        {user.channels || 0} Channels
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
                )}
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
                        <input type="text" id="edit-user-name" defaultValue={modalConfig.user?.name} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                    </div>
                    {/* Accessing email is usually restricted or complex in edit, disabled for now */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Read Only)</label>
                        <input type="email" value={modalConfig.user?.email} disabled className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-100 text-slate-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                        <select id="edit-user-role" defaultValue={modalConfig.user?.role} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="member">Member</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="ghost" onClick={() => setModalConfig({ type: null, user: null })}>Cancel</Button>
                        <Button variant="primary" onClick={handleUpdateUser}>Save Changes</Button>
                    </div>
                </div>
            </Modal>

            {/* Invite User Modal */}
            <Modal
                isOpen={modalConfig.type === 'invite'}
                onClose={() => {
                    setModalConfig({ type: null, user: null });
                    // specific for invite modal to reset state
                    if (modalConfig.inviteStatus) {
                        setModalConfig(prev => ({ ...prev, inviteStatus: 'idle' }));
                    }
                }}
                title={modalConfig.inviteStatus === 'success' ? 'Invitation Sent' : 'Invite New User'}
                maxWidth="max-w-md"
            >
                {modalConfig.inviteStatus === 'success' ? (
                    <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl">✨</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Success!</h3>
                            <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                                An invitation email has been sent to <strong>{document.getElementById('invite-email')?.value}</strong>.
                            </p>
                        </div>
                        <div className="pt-4">
                            <Button variant="primary" onClick={() => {
                                setModalConfig({ type: null, user: null });
                                fetchUsers();
                            }}>Done</Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleInviteUser} className="space-y-5">
                        <div className="flex justify-center -mt-2 mb-6">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center ring-4 ring-blue-50/50">
                                <Mail className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <div className="w-4 h-4 text-slate-400 font-bold flex items-center justify-center text-[10px]">Aa</div>
                                    </div>
                                    <input
                                        type="text"
                                        id="invite-name"
                                        placeholder="e.g. Sarah Jenkins"
                                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        id="invite-email"
                                        required
                                        placeholder="name@company.com"
                                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Assign Role</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Key className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <select
                                        id="invite-role"
                                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none appearance-none"
                                    >
                                        <option value="member">Member (Standard Access)</option>
                                        <option value="manager">Manager (Can manage teams)</option>
                                        <option value="admin">Admin (Full Access)</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                variant="primary"
                                type="submit" // Trigger form submit
                                className="w-full py-2.5 text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                                onClick={() => { }} // Controlled by form
                            >
                                {modalConfig.inviteStatus === 'sending' ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending Invite...
                                    </span>
                                ) : 'Send Invitation Email'}
                            </Button>
                        </div>
                    </form>
                )}
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
