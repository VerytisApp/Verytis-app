import { useState } from 'react';
import { Shield, FileCheck, FileText, CheckSquare, Square, Download, Mail, Table, FileSpreadsheet } from 'lucide-react';
import { Card, Button, StatusBadge, Modal } from '../ui';
import { MOCK_CONNECTED_ACCOUNTS, MOCK_EMAIL_METADATA } from '../../data/mockData';

const EmailAudit = () => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [exportModal, setExportModal] = useState({ type: null, isOpen: false });

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
                                <Button variant="primary" icon={FileText} className="w-full justify-center" onClick={() => setExportModal({ type: 'pdf', isOpen: true })}>Export PDF</Button>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="secondary" className="justify-center" onClick={() => setExportModal({ type: 'csv', isOpen: true })}>CSV</Button>
                                    <Button variant="secondary" className="justify-center" onClick={() => setExportModal({ type: 'xls', isOpen: true })}>XLS</Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* Email Metadata PDF Modal */}
            <Modal
                isOpen={exportModal.type === 'pdf' && exportModal.isOpen}
                onClose={() => setExportModal({ type: null, isOpen: false })}
                title="Export Email Log Report"
                maxWidth="max-w-4xl"
            >
                <div className="space-y-6">
                    <div className="flex gap-6">
                        <div className="w-64 space-y-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                <div className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">Report Scope</div>
                                <div className="space-y-2 text-xs text-slate-600">
                                    <div className="flex justify-between">
                                        <span>Users Selected:</span>
                                        <span className="font-bold text-slate-900">{selectedIds.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Data Type:</span>
                                        <span className="font-bold text-slate-900">Metadata Only</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Format:</span>
                                        <span className="font-bold text-slate-900">PDF</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Include Fields</label>
                                <div className="space-y-2">
                                    {['Sender', 'Recipients', 'Sent Date', 'Subject', 'Message ID', 'Open Status', 'Reply Status'].map(field => (
                                        <label key={field} className="flex items-center gap-2 text-xs text-slate-600">
                                            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                            {field}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Document Preview</span>
                                <span className="text-[10px] text-slate-400">Page 1 of 12</span>
                            </div>
                            <div className="p-6">
                                <div className="mb-6 flex items-center justify-between border-b-2 border-slate-900 pb-4">
                                    <div>
                                        <h1 className="text-xl font-bold text-slate-900">Email Metadata Log</h1>
                                        <p className="text-xs text-slate-500">Confidential Audit Record</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-slate-900">REF-AUD-2023-1027</div>
                                        <div className="text-[10px] text-slate-500">{new Date().toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {MOCK_EMAIL_METADATA.slice(0, 3).map((email, idx) => (
                                        <div key={idx} className="border border-slate-200 rounded p-3 text-xs">
                                            <div className="grid grid-cols-2 gap-y-1 mb-2">
                                                <div className="flex gap-2"><span className="text-slate-500 w-16">Sender:</span> <span className="font-mono text-slate-900">{email.sender}</span></div>
                                                <div className="flex gap-2"><span className="text-slate-500 w-16">Date:</span> <span className="font-mono text-slate-900">{new Date(email.sentAt).toLocaleString()}</span></div>
                                                <div className="flex gap-2 col-span-2"><span className="text-slate-500 w-16">Subject:</span> <span className="font-medium text-slate-900">{email.subject}</span></div>
                                                <div className="flex gap-2 col-span-2"><span className="text-slate-500 w-16">Message ID:</span> <span className="font-mono text-slate-400">{email.messageId}</span></div>
                                            </div>
                                            <div className="pt-2 border-t border-slate-100 flex gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${email.openStatus === 'opened' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                                    <span className="text-[10px] uppercase font-bold text-slate-600">{email.openStatus}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${email.replyStatus === 'replied' ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                                                    <span className="text-[10px] uppercase font-bold text-slate-600">{email.replyStatus}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="text-center text-[10px] text-slate-400 italic mt-4">... more records in generated file</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button variant="primary" icon={Download}>Download Report</Button>
                    </div>
                </div>
            </Modal>

            {/* CSV/XLS Export Modal */}
            <Modal
                isOpen={(exportModal.type === 'csv' || exportModal.type === 'xls') && exportModal.isOpen}
                onClose={() => setExportModal({ type: null, isOpen: false })}
                title={`Export ${exportModal.type === 'csv' ? 'CSV' : 'Excel'} Data`}
                maxWidth="max-w-5xl"
            >
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-lg overflow-hidden shadow-lg border border-slate-800">
                        <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {exportModal.type === 'csv' ? <Table className="w-4 h-4 text-emerald-400" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
                                <span className="text-xs font-bold text-white uppercase tracking-wide">Data Preview</span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-slate-700 text-[10px] text-slate-300 font-mono">
                                {exportModal.type === 'csv' ? 'metadata_export.csv' : 'metadata_audit.xlsx'}
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-medium border-b border-slate-700">Message ID</th>
                                        <th className="px-4 py-3 font-medium border-b border-slate-700">Timestamp</th>
                                        <th className="px-4 py-3 font-medium border-b border-slate-700">Sender</th>
                                        <th className="px-4 py-3 font-medium border-b border-slate-700">Recipients</th>
                                        <th className="px-4 py-3 font-medium border-b border-slate-700">Subject</th>
                                        <th className="px-4 py-3 font-medium border-b border-slate-700">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-slate-300">
                                    {MOCK_EMAIL_METADATA.slice(0, 5).map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-2 font-mono text-[10px] text-slate-500">{row.messageId}</td>
                                            <td className="px-4 py-2 font-mono text-[10px]">{row.sentAt.replace('T', ' ')}</td>
                                            <td className="px-4 py-2">{row.sender}</td>
                                            <td className="px-4 py-2 truncate max-w-[150px]">{row.recipients.join(', ')}</td>
                                            <td className="px-4 py-2 truncate max-w-[200px] text-white">{row.subject}</td>
                                            <td className="px-4 py-2">
                                                <div className="flex gap-2">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${row.openStatus === 'opened' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>{row.openStatus}</span>
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${row.replyStatus === 'replied' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>{row.replyStatus}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-4 py-2 bg-slate-800/50 text-[10px] text-slate-500 text-center border-t border-slate-800">
                            Showing 5 of {MOCK_EMAIL_METADATA.length} records
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="text-xs text-slate-500">
                            Exporting <strong className="text-slate-900">{selectedIds.length} users</strong> metadata scope.
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setExportModal({ type: null, isOpen: false })}>Cancel</Button>
                            <Button variant="primary" icon={Download} className={exportModal.type === 'xls' ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600' : ''}>
                                Download {exportModal.type === 'csv' ? 'CSV' : 'Excel'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div >
    );
};

export default EmailAudit;
