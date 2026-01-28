import { useState } from 'react';
import { Shield, FileText, Slack, Users, CheckCircle, XCircle, UserCheck, Download, Table, FileSpreadsheet, X } from 'lucide-react';
import { Card, Button, PlatformIcon, Modal } from '../ui';
import { MOCK_CHANNELS, MOCK_CHANNEL_MEMBERS } from '../../data/mockData';

const AuditDocumentation = () => {
    const [reportType, setReportType] = useState('Full Channel Audit');
    const [platform, setPlatform] = useState('Slack');
    const [selectedChannels, setSelectedChannels] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [exportModal, setExportModal] = useState({ type: null, isOpen: false });

    const availableChannels = MOCK_CHANNELS.filter(c => c.platform.toLowerCase() === platform.toLowerCase());

    const handleChannelSelect = (channelName) => {
        if (selectedChannels.includes(channelName)) {
            setSelectedChannels(selectedChannels.filter(c => c !== channelName));
        } else {
            setSelectedChannels([...selectedChannels, channelName]);
        }
    };

    const handleMemberSelect = (memberId) => {
        if (selectedMembers.includes(memberId)) {
            setSelectedMembers(selectedMembers.filter(m => m !== memberId));
        } else {
            setSelectedMembers([...selectedMembers, memberId]);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit Documentation</h1>
                <p className="text-slate-500 mt-1 text-xs font-medium">Generate complete and legally usable audit documents from authorized channels.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-5">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-4">Configuration</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Platform</label>
                                <select
                                    value={platform}
                                    onChange={(e) => { setPlatform(e.target.value); setSelectedChannels([]); }}
                                    className="w-full bg-white border border-slate-200 rounded-md text-xs shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 py-2 px-3 outline-none"
                                >
                                    <option value="Slack">Slack</option>
                                    <option value="Teams">Microsoft Teams</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Report Type</label>
                                <select
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-md text-xs shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 py-2 px-3 outline-none"
                                >
                                    <option>Full Channel Audit</option>
                                    <option>Channel Audit (Time Range)</option>
                                    <option>Channel Audit (Selected Members)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Authorized Channels</label>
                                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-md p-2 bg-slate-50">
                                    {availableChannels.map(channel => (
                                        <div key={channel.id} className="flex items-center gap-2 mb-1.5 last:mb-0">
                                            <input
                                                type="checkbox"
                                                id={`chan-${channel.id}`}
                                                checked={selectedChannels.includes(channel.name)}
                                                onChange={() => handleChannelSelect(channel.name)}
                                                className="rounded text-slate-900 focus:ring-slate-500"
                                            />
                                            <label htmlFor={`chan-${channel.id}`} className="text-xs text-slate-700 cursor-pointer font-medium">{channel.name}</label>
                                        </div>
                                    ))}
                                    {availableChannels.length === 0 && <p className="text-xs text-slate-400 p-1">No channels found.</p>}
                                </div>
                            </div>

                            {reportType === 'Channel Audit (Selected Members)' && (
                                <div className="animate-in fade-in zoom-in-95 duration-200">
                                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Channel Members</label>
                                    <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-md p-2 bg-slate-50">
                                        {MOCK_CHANNEL_MEMBERS.map(member => (
                                            <div key={member.id} className="flex items-center gap-2 mb-1.5 last:mb-0">
                                                <input
                                                    type="checkbox"
                                                    id={`mem-${member.id}`}
                                                    checked={selectedMembers.includes(member.id)}
                                                    onChange={() => handleMemberSelect(member.id)}
                                                    className="rounded text-slate-900 focus:ring-slate-500"
                                                />
                                                <label htmlFor={`mem-${member.id}`} className="text-xs text-slate-700 cursor-pointer flex items-center gap-1 font-medium">
                                                    <UserCheck className="w-3 h-3 text-slate-400" /> {member.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Time Range</label>
                                <select className="w-full bg-white border border-slate-200 rounded-md text-xs shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 py-2 px-3 outline-none">
                                    <option>Last 7 Days</option>
                                    <option>Last 30 Days</option>
                                    <option>Custom Range...</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500 mb-2">
                            <Shield className="w-3 h-3" /> Compliance Notes
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed mb-1">
                            <strong>Data Integrity:</strong> Extracted data reflects original channel history without alteration.
                        </p>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            <strong>Traceability:</strong> Exports include generation timestamp & auditor identity.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card className="flex-1 p-0 overflow-hidden flex flex-col relative">
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                            <span className="px-2 py-1 bg-white/90 backdrop-blur text-[10px] font-bold uppercase text-slate-500 rounded border border-slate-200 shadow-sm">Preview Mode</span>
                        </div>

                        {selectedChannels.length === 0 ? (
                            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 bg-slate-50/50 min-h-[300px]">
                                <FileText className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-xs font-medium uppercase tracking-wide">Select channels to generate preview</p>
                            </div>
                        ) : (
                            <div className="flex-1 p-8 bg-slate-50/30 min-h-[300px]">
                                <div className="max-w-md mx-auto bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden">
                                    <div className="h-1.5 bg-slate-900 w-full"></div>
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                {platform === 'Slack' ? <Slack className="w-8 h-8 text-slate-700" /> : <Users className="w-8 h-8 text-indigo-600" />}
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-lg">Audit Report</h3>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">{new Date().toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-mono text-slate-400">ID: #8821-X</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 border-t border-slate-100 pt-4">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500 font-medium">Scope</span>
                                                <span className="font-bold text-slate-900">{selectedChannels.join(", ")}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500 font-medium">Filter</span>
                                                <span className="font-bold text-slate-900">
                                                    {reportType === 'Channel Audit (Selected Members)'
                                                        ? `${selectedMembers.length} Members`
                                                        : 'Full History'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500 font-medium">Events Found</span>
                                                <span className="font-bold text-emerald-700">~142 Messages</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">SHA-256 Verified</span>
                                        <Button variant="secondary" className="h-6 text-[10px] px-2">Preview PDF</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>

                    <div className="p-5 rounded-xl border border-slate-700 shadow-lg" style={{ backgroundColor: '#0f172a' }}>
                        <div className="flex flex-col lg:flex-row items-start gap-4">
                            <div className="p-2 rounded-md flex-shrink-0" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                                <Shield className="w-5 h-5 text-slate-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wide">Scope Summary</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-[10px]">
                                    <ul className="space-y-1.5 text-slate-400">
                                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Channel messages (Authorized Only)</li>
                                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Decision markers & tags</li>
                                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Member-filtered extraction</li>
                                    </ul>
                                    <ul className="space-y-1.5 text-slate-400">
                                        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-rose-500 flex-shrink-0" /> Private DMs (Excluded)</li>
                                        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-rose-500 flex-shrink-0" /> Unauthorized channels</li>
                                        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-rose-500 flex-shrink-0" /> Email data</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 w-full lg:w-36 flex-shrink-0">
                                <button onClick={() => setExportModal({ type: 'pdf', isOpen: true })} className="px-4 py-2 rounded-lg text-xs font-bold shadow-lg transition-colors hover:opacity-90" style={{ backgroundColor: '#4f46e5', color: 'white' }}>Export PDF</button>
                                <button onClick={() => setExportModal({ type: 'csv', isOpen: true })} className="px-4 py-2 rounded-lg text-xs font-bold shadow-lg transition-colors hover:opacity-90" style={{ backgroundColor: 'white', color: '#0f172a' }}>Export CSV</button>
                                <button onClick={() => setExportModal({ type: 'xls', isOpen: true })} className="px-4 py-2 rounded-lg text-xs font-bold shadow-lg transition-colors hover:opacity-90" style={{ backgroundColor: '#10b981', color: 'white' }}>Export XLS</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PDF Export Modal */}
            <Modal
                isOpen={exportModal.type === 'pdf' && exportModal.isOpen}
                onClose={() => setExportModal({ type: null, isOpen: false })}
                title="Export PDF Report"
                maxWidth="max-w-3xl"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Configuration */}
                        <div className="space-y-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <FileText className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Audit Report PDF</h4>
                                        <p className="text-[10px] text-slate-500">Legally compliant document with digital signature</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Channels</span>
                                        <span className="font-medium text-slate-900">{selectedChannels.length > 0 ? selectedChannels.join(', ') : 'None selected'}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Report Type</span>
                                        <span className="font-medium text-slate-900">{reportType}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500">Estimated Pages</span>
                                        <span className="font-medium text-slate-900">~{Math.max(1, selectedChannels.length * 12)} pages</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Include Sections</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Executive Summary</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Message Timeline</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Decision Markers</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="rounded" /> Member Activity Analysis</label>
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-inner">
                            <div className="bg-slate-900 text-white px-3 py-2 text-[10px] font-bold uppercase tracking-wide">Preview</div>
                            <div className="p-3 space-y-3 max-h-[300px] overflow-y-auto text-xs">
                                {/* Message 1 - Text message */}
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">SJ</div>
                                        <div>
                                            <span className="font-bold text-slate-900">Sarah Jenkins</span>
                                            <span className="text-slate-400 text-[10px] ml-2">#legal-approvals • Oct 27, 2023 10:30 AM</span>
                                        </div>
                                    </div>
                                    <p className="text-slate-700 mb-2">I've reviewed the Q4 budget proposal. The numbers look solid, but we need CFO approval before proceeding with the vendor contracts.</p>
                                    <div className="flex gap-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] border border-amber-100">👍 3</span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] border border-emerald-100">✅ 2</span>
                                    </div>
                                </div>

                                {/* Message 2 - Threaded reply */}
                                <div className="ml-4 border-l-2 border-indigo-200 pl-3">
                                    <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold">DC</div>
                                            <div>
                                                <span className="font-bold text-slate-900 text-[11px]">David Chen</span>
                                                <span className="text-slate-400 text-[10px] ml-2">Reply • 10:45 AM</span>
                                            </div>
                                        </div>
                                        <p className="text-slate-700 text-[11px]">@Sarah Agreed. I'll schedule a meeting with finance for tomorrow. Can you prepare the updated projections?</p>
                                    </div>
                                </div>

                                {/* Message 3 - Decision marker */}
                                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] font-bold">MR</div>
                                        <div>
                                            <span className="font-bold text-slate-900">Michael Ross</span>
                                            <span className="text-slate-400 text-[10px] ml-2">#legal-approvals • Oct 27, 2023 11:15 AM</span>
                                        </div>
                                        <span className="ml-auto px-2 py-0.5 bg-emerald-500 text-white rounded text-[9px] font-bold">DECISION</span>
                                    </div>
                                    <p className="text-slate-700 mb-2">✅ <strong>APPROVED:</strong> Q4 Budget allocation for vendor contracts. Total: $125,000. Effective immediately.</p>
                                    <div className="flex gap-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-emerald-700 rounded text-[10px] border border-emerald-200">🎉 5</span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-emerald-700 rounded text-[10px] border border-emerald-200">✅ 4</span>
                                    </div>
                                </div>

                                {/* Message 4 - Acknowledgement */}
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white text-[10px] font-bold">ER</div>
                                        <div>
                                            <span className="font-bold text-slate-900">Elena Ross</span>
                                            <span className="text-slate-400 text-[10px] ml-2">#procurement-q4 • Oct 27, 2023 11:30 AM</span>
                                        </div>
                                    </div>
                                    <p className="text-slate-700 mb-2">Acknowledged. I'll proceed with the vendor onboarding process. ETA: End of week.</p>
                                    <div className="flex gap-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-100">👀 2</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 gap-2 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setExportModal({ type: null, isOpen: false })}>Cancel</Button>
                        <Button variant="primary" icon={Download}>Generate PDF</Button>
                    </div>
                </div>
            </Modal>

            {/* CSV Export Modal */}
            <Modal
                isOpen={exportModal.type === 'csv' && exportModal.isOpen}
                onClose={() => setExportModal({ type: null, isOpen: false })}
                title="Export CSV Data"
                maxWidth="max-w-4xl"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-slate-200 rounded-lg">
                                        <Table className="w-5 h-5 text-slate-700" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Raw Data Export</h4>
                                        <p className="text-[10px] text-slate-500">Comma-separated values</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Columns</label>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Timestamp</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Author</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Message</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Channel</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Reactions</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="rounded" /> Thread ID</label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Delimiter</label>
                                <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs">
                                    <option>Comma (,)</option>
                                    <option>Semicolon (;)</option>
                                    <option>Tab</option>
                                </select>
                            </div>
                        </div>

                        {/* Data Preview Table */}
                        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-inner">
                            <div className="bg-slate-900 text-white px-3 py-2 text-[10px] font-bold uppercase tracking-wide">Data Preview (5 rows)</div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-[10px]">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-2 py-1.5 text-left font-bold text-slate-600">TIMESTAMP</th>
                                            <th className="px-2 py-1.5 text-left font-bold text-slate-600">AUTHOR</th>
                                            <th className="px-2 py-1.5 text-left font-bold text-slate-600">MESSAGE</th>
                                            <th className="px-2 py-1.5 text-left font-bold text-slate-600">CHANNEL</th>
                                            <th className="px-2 py-1.5 text-left font-bold text-slate-600">REACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-2 py-1.5 font-mono text-slate-600">2023-10-27 10:30:00</td>
                                            <td className="px-2 py-1.5 font-medium">Sarah Jenkins</td>
                                            <td className="px-2 py-1.5 text-slate-700 max-w-[200px] truncate">I've reviewed the Q4 budget proposal...</td>
                                            <td className="px-2 py-1.5 text-slate-600">#legal-approvals</td>
                                            <td className="px-2 py-1.5">👍3, ✅2</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-2 py-1.5 font-mono text-slate-600">2023-10-27 10:45:00</td>
                                            <td className="px-2 py-1.5 font-medium">David Chen</td>
                                            <td className="px-2 py-1.5 text-slate-700 max-w-[200px] truncate">@Sarah Agreed. I'll schedule a meeting...</td>
                                            <td className="px-2 py-1.5 text-slate-600">#legal-approvals</td>
                                            <td className="px-2 py-1.5">—</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 bg-emerald-50/50">
                                            <td className="px-2 py-1.5 font-mono text-slate-600">2023-10-27 11:15:00</td>
                                            <td className="px-2 py-1.5 font-medium">Michael Ross</td>
                                            <td className="px-2 py-1.5 text-slate-700 max-w-[200px] truncate">✅ APPROVED: Q4 Budget allocation...</td>
                                            <td className="px-2 py-1.5 text-slate-600">#legal-approvals</td>
                                            <td className="px-2 py-1.5">🎉5, ✅4</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-2 py-1.5 font-mono text-slate-600">2023-10-27 11:30:00</td>
                                            <td className="px-2 py-1.5 font-medium">Elena Ross</td>
                                            <td className="px-2 py-1.5 text-slate-700 max-w-[200px] truncate">Acknowledged. I'll proceed with vendor...</td>
                                            <td className="px-2 py-1.5 text-slate-600">#procurement-q4</td>
                                            <td className="px-2 py-1.5">👀2</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-2 py-1.5 font-mono text-slate-600">2023-10-27 14:00:00</td>
                                            <td className="px-2 py-1.5 font-medium">Michael Thorne</td>
                                            <td className="px-2 py-1.5 text-slate-700 max-w-[200px] truncate">Contract docs uploaded to SharePoint...</td>
                                            <td className="px-2 py-1.5 text-slate-600">#procurement-q4</td>
                                            <td className="px-2 py-1.5">📎1</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 text-[10px] text-slate-500">
                                Showing 5 of 142 total rows
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 gap-2 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setExportModal({ type: null, isOpen: false })}>Cancel</Button>
                        <Button variant="primary" icon={Download}>Download CSV</Button>
                    </div>
                </div>
            </Modal>

            {/* XLS Export Modal */}
            <Modal
                isOpen={exportModal.type === 'xls' && exportModal.isOpen}
                onClose={() => setExportModal({ type: null, isOpen: false })}
                title="Export Excel Workbook"
                maxWidth="max-w-4xl"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-4">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Excel Workbook</h4>
                                        <p className="text-[10px] text-slate-500">Multi-sheet workbook</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Worksheets</label>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Summary Dashboard</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Messages Data</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Decision Log</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="rounded" /> Member Statistics</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="rounded" /> Pivot Tables</label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Format</label>
                                <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs">
                                    <option>.xlsx (Excel 2007+)</option>
                                    <option>.xls (Excel 97-2003)</option>
                                </select>
                            </div>
                        </div>

                        {/* Excel Preview */}
                        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-inner">
                            <div className="bg-emerald-700 text-white px-3 py-2 text-[10px] font-bold uppercase tracking-wide flex items-center gap-2">
                                <FileSpreadsheet className="w-3.5 h-3.5" /> Workbook Preview
                            </div>

                            {/* Excel Tabs */}
                            <div className="bg-slate-100 border-b border-slate-200 flex text-[10px]">
                                <button className="px-3 py-1.5 bg-white border-r border-slate-200 font-bold text-emerald-700 border-b-2 border-b-emerald-600">Summary</button>
                                <button className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 border-r border-slate-200">Messages</button>
                                <button className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 border-r border-slate-200">Decisions</button>
                            </div>

                            {/* Summary Sheet Preview */}
                            <div className="p-4 space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                                        <div className="text-2xl font-bold text-emerald-700">142</div>
                                        <div className="text-[10px] text-emerald-600 font-medium uppercase">Total Messages</div>
                                    </div>
                                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-center">
                                        <div className="text-2xl font-bold text-indigo-700">8</div>
                                        <div className="text-[10px] text-indigo-600 font-medium uppercase">Decisions</div>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                                        <div className="text-2xl font-bold text-amber-700">4</div>
                                        <div className="text-[10px] text-amber-600 font-medium uppercase">Participants</div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                    <h5 className="text-[10px] font-bold text-slate-700 uppercase mb-2">Reaction Summary</h5>
                                    <div className="grid grid-cols-4 gap-2 text-[10px]">
                                        <div className="flex items-center gap-1"><span>👍</span> <span className="font-mono">24</span></div>
                                        <div className="flex items-center gap-1"><span>✅</span> <span className="font-mono">18</span></div>
                                        <div className="flex items-center gap-1"><span>🎉</span> <span className="font-mono">12</span></div>
                                        <div className="flex items-center gap-1"><span>👀</span> <span className="font-mono">8</span></div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                    <h5 className="text-[10px] font-bold text-slate-700 uppercase mb-2">Top Contributors</h5>
                                    <div className="space-y-1.5 text-[10px]">
                                        <div className="flex justify-between"><span>Sarah Jenkins</span><span className="font-mono text-slate-500">42 msgs</span></div>
                                        <div className="flex justify-between"><span>David Chen</span><span className="font-mono text-slate-500">35 msgs</span></div>
                                        <div className="flex justify-between"><span>Michael Ross</span><span className="font-mono text-slate-500">28 msgs</span></div>
                                        <div className="flex justify-between"><span>Elena Ross</span><span className="font-mono text-slate-500">22 msgs</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 gap-2 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setExportModal({ type: null, isOpen: false })}>Cancel</Button>
                        <Button variant="primary" icon={Download} className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600">Download Excel</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AuditDocumentation;
