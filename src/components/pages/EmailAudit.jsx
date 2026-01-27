import { useState } from 'react';
import { Shield, FileCheck, FileText, CheckSquare, Square } from 'lucide-react';
import { Card, Button, StatusBadge } from '../ui';
import { MOCK_CONNECTED_ACCOUNTS } from '../../data/mockData';

const EmailAudit = () => {
    const [selectedIds, setSelectedIds] = useState([]);

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === MOCK_CONNECTED_ACCOUNTS.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(MOCK_CONNECTED_ACCOUNTS.map(a => a.id));
        }
    };

    const isAllSelected = selectedIds.length === MOCK_CONNECTED_ACCOUNTS.length;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Email Metadata Audit</h1>
                <p className="text-slate-500 mt-1 text-xs font-medium">Review connected corporate email accounts.</p>
            </header>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 items-start">
                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">Privacy Scope</h4>
                    <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">This view displays only connected corporate email accounts. No content is collected.</p>
                </div>
            </div>
            <div className="flex gap-6">
                <div className="flex-1">
                    <Card className="overflow-hidden">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 w-8">
                                        <button onClick={handleSelectAll} className="text-slate-400 hover:text-slate-600">
                                            {isAllSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 uppercase tracking-wide">Employee</th>
                                    <th className="px-6 py-3 uppercase tracking-wide">Role</th>
                                    <th className="px-6 py-3 uppercase tracking-wide">Department</th>
                                    <th className="px-6 py-3 uppercase tracking-wide">Email</th>
                                    <th className="px-6 py-3 uppercase tracking-wide">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {MOCK_CONNECTED_ACCOUNTS.map(account => (
                                    <tr key={account.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(account.id) ? 'bg-blue-50/30' : ''}`}>
                                        <td className="px-6 py-3">
                                            <button onClick={() => handleSelectOne(account.id)} className={`text-slate-400 hover:text-slate-600 ${selectedIds.includes(account.id) ? 'text-blue-600' : ''}`}>
                                                {selectedIds.includes(account.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-3 font-medium text-slate-900">{account.firstName} {account.lastName}</td>
                                        <td className="px-6 py-3 text-slate-600">{account.title}</td>
                                        <td className="px-6 py-3 text-slate-600">{account.department}</td>
                                        <td className="px-6 py-3 text-slate-600 font-mono">{account.email}</td>
                                        <td className="px-6 py-3"><StatusBadge status={account.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
                {selectedIds.length > 0 && (
                    <div className="w-72 animate-in slide-in-from-right-4 fade-in duration-300">
                        <Card className="p-4 sticky top-6 border-blue-100 shadow-sm bg-white">
                            <div className="flex items-center gap-2 mb-3 text-blue-700">
                                <FileCheck className="w-4 h-4" />
                                <h3 className="font-bold text-xs uppercase tracking-wide">Export Context</h3>
                            </div>
                            <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                                Export metadata for the <strong>{selectedIds.length}</strong> selected users. Content is strictly excluded.
                            </p>
                            <div className="space-y-3">
                                <Button variant="primary" icon={FileText} className="w-full justify-center">Export PDF</Button>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="secondary" className="justify-center">CSV</Button>
                                    <Button variant="secondary" className="justify-center">XLS</Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailAudit;
