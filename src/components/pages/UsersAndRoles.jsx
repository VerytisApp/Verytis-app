import { Plus, Upload, MoreVertical } from 'lucide-react';
import { Card, Button, StatusBadge } from '../ui';
import { MOCK_USERS } from '../../data/mockData';

const UsersAndRoles = () => (
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
        <Card className="overflow-hidden">
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
                    {MOCK_USERS.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-3.5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
                                        {user.initials}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">{user.name}</div>
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
                            <td className="px-6 py-3.5 text-right">
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical className="w-4 h-4 text-slate-400" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    </div>
);

export default UsersAndRoles;
