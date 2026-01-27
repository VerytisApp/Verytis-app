import { useState } from 'react';
import { Shield, FileText, Slack, Users, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import { Card, Button, PlatformIcon } from '../ui';
import { MOCK_CHANNELS, MOCK_CHANNEL_MEMBERS } from '../../data/mockData';

const AuditDocumentation = () => {
    const [reportType, setReportType] = useState('Full Channel Audit');
    const [platform, setPlatform] = useState('Slack');
    const [selectedChannels, setSelectedChannels] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);

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

                    <Card className="p-5 bg-slate-900 text-white border-slate-800">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-slate-800 rounded-md text-slate-300 border border-slate-700">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wide">Scope Summary</h4>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px]">
                                    <ul className="space-y-1.5 text-slate-400">
                                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500" /> Channel messages (Authorized Only)</li>
                                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500" /> Decision markers & tags</li>
                                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500" /> Member-filtered extraction</li>
                                    </ul>
                                    <ul className="space-y-1.5 text-slate-400">
                                        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-rose-500" /> Private DMs (Excluded)</li>
                                        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-rose-500" /> Unauthorized channels</li>
                                        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-rose-500" /> Email data</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 w-32">
                                <Button variant="primary" className="bg-white text-slate-900 hover:bg-slate-100 border-transparent w-full">Export PDF</Button>
                                <Button variant="secondary" className="bg-transparent text-white border-slate-700 hover:bg-slate-800 hover:text-white w-full">Export CSV</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AuditDocumentation;
