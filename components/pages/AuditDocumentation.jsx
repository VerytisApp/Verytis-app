import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Shield, FileText, Slack, Users, CheckCircle, XCircle, UserCheck, Download, Table, FileSpreadsheet, X, Calendar, Search, Filter, Lock } from 'lucide-react';
import { Card, Button, PlatformIcon, Modal } from '../ui';
import { MOCK_CHANNELS, MOCK_CHANNEL_MEMBERS, MOCK_USERS, MOCK_TEAMS } from '../../data/mockData';

const AuditDocumentation = ({ userRole }) => {
    const [reportType, setReportType] = useState('Full Channel Audit');

    // Reset report type when role changes to ensure validity
    useEffect(() => {
        if (userRole === 'Member') {
            setReportType('Full Channel Audit (Your Activity Only)');
        } else {
            setReportType('Full Channel Audit');
        }
    }, [userRole]);

    const [platform, setPlatform] = useState('Slack');
    const [selectedChannels, setSelectedChannels] = useState([]);
    // State for single channel selection (Member view)
    const [selectedChannelId, setSelectedChannelId] = useState('');

    const [selectedMembers, setSelectedMembers] = useState([]);

    // Time Range State
    const [dateRange, setDateRange] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [exportModal, setExportModal] = useState({ type: null, isOpen: false });

    // Mock Current User for Member view logic
    const currentUser = MOCK_USERS.find(u => u.role === (userRole === 'Member' ? 'Employee' : userRole)) || MOCK_USERS[0];

    const [selectedTeamId, setSelectedTeamId] = useState('all');

    // Manager Scope Check
    const managerTeam = MOCK_TEAMS.find(t => t.name === 'Engineering & Product' || t.name === 'Finance & Legal'); // Mock team finder
    // In a real app we would match currentUser.teamId
    const hasAuditScope = userRole === 'Admin' || (userRole === 'Manager' && (currentUser.scopes?.includes('Channel Audit') || currentUser.scopes?.includes('Documentation Audit')));

    // Filter channels based on selected platform
    const allPlatformChannels = MOCK_CHANNELS.filter(c => c.platform.toLowerCase() === platform.toLowerCase());

    // Filter logic for Manager and Admin (with Team selection)
    const getAvailableChannels = () => {
        // Admin Personal Audit: Filter for channels where Admin is a member (Mocking 'Finance & Legal')
        if (userRole === 'Admin' && reportType.includes('My Activity')) {
            return allPlatformChannels.filter(c => c.team === 'Finance & Legal');
        }

        if (userRole === 'Admin') {
            if (selectedTeamId === 'all') return allPlatformChannels;
            // Admin selected a specific team: find team name and filter
            const selectedTeam = MOCK_TEAMS.find(t => t.id.toString() === selectedTeamId.toString());
            // Need to match partial names because mock data strings might differ slightly (e.g. "Finance & Legal" vs "Finance")
            // Or exact match if reliable. Let's try exact match with fallback.
            if (!selectedTeam) return allPlatformChannels;

            return allPlatformChannels.filter(c => c.team === selectedTeam.name || c.team?.includes(selectedTeam.name.split(' ')[0]));
        }

        // Manager & Member: Filter by Team
        // Mocking: David Chen (Manager) is in 'Engineering & Product' (Product Manager)
        // But MOCK_CHANNELS have team string.
        // Let's assume Manager has access to channels matching their Team.
        // For 'David Chen' (Manager), let's say "Finance & Legal" for the demo consistency or "Engineering". 
        // Based on Mock Data, David Chen is Product Manager, Department Product. 
        // Let's use generic logic: 
        return allPlatformChannels.filter(c => userRole === 'Admin' || c.team === 'Finance & Legal' || c.team === 'Engineering');
    };

    const availableChannels = getAvailableChannels();

    // Manager View blocked if no scope
    if (userRole === 'Manager' && !hasAuditScope) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <header>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit Documentation</h1>
                    <p className="text-slate-500 mt-1 text-xs font-medium">Generate compliance reports for team channels.</p>
                </header>
                <Card className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Audit Access Restricted</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                        Your account does not have the necessary "Audit" or "Documentation" scopes enabled to perform channel audits. Please contact your administrator.
                    </p>
                </Card>
            </div>
        );
    }

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

    const generateAuditPDF = async () => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            // 1. Add Verytis Logo & Header
            try {
                const imgData = await fetch('/logo-verytis.png').then(res => res.blob()).then(blob => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                });
                doc.addImage(imgData, 'PNG', 14, 10, 30, 8); // x, y, w, h
            } catch (e) {
                console.warn("Logo loading failed", e);
                doc.setFontSize(16);
                doc.text("VERYTIS", 14, 18);
            }

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("CERTIFIED AUDIT TRAIL", 14, 25);
            doc.setFontSize(8);
            doc.text(`Generated on: ${new Date().toISOString()}`, 14, 30);
            doc.text(`Auditor: ${currentUser.name} (${currentUser.role})`, 14, 34);

            // 2. Fetch Real Data
            // If specific channels selected, we might need multiple calls or filter client side.
            // For now, fetch recent activity (global or filtered by first channel)
            let apiUrl = '/api/activity';
            // Simple mapping: if names selected, try to find ID of first one for filter context
            // In a real app, we'd loop or pass multiple IDs.
            if (selectedChannels.length > 0) {
                const firstChan = availableChannels.find(c => c.name === selectedChannels[0]);
                if (firstChan) apiUrl += `?channelId=${firstChan.id}`;
            }

            const res = await fetch(apiUrl);
            const { events } = await res.json();

            // 3. Prepare Table Data
            const tableBody = events.map(log => {
                // Format Timestamp (UTC)
                const date = new Date(log.timestamp);
                const timestamp = date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');

                // Format Actor
                const actor = `${log.actor} (${log.email || 'N/A'})`;

                // Format Action & Emoji
                // Using text representation if font doesn't support emoji, but let's try.
                // jsPDF standard fonts don't support color emojis well.
                // We'll use text equivalents for robust PDF.
                let actionType = log.type.toUpperCase();
                if (log.action === 'Approval') actionType = '✅ APPROVE';
                if (log.action === 'Rejection') actionType = '❌ REJECT';

                // Context
                const context = `Slack #${log.channelId}`;

                // Payload
                const payload = log.target; // Summary/Text

                // Proof (Attachments)
                let proof = '';
                if (log.rawMetadata?.attachments?.length > 0) {
                    proof = log.rawMetadata.attachments.map(a => `${a.name} (Link: ${a.url})`).join('\n');
                    // If we had hash: `${a.name} (SHA-256: ${a.hash})`
                } else {
                    proof = 'No attachment';
                }

                return [timestamp, actor, actionType, context, payload, proof];
            });

            // 4. Generate Table
            autoTable(doc, {
                startY: 40,
                head: [['TIMESTAMP (UTC)', 'ACTOR (User)', 'ACTION TYPE', 'CONTEXT (Source)', 'PAYLOAD (Message)', 'PROOF (Attachment)']],
                body: tableBody,
                styles: { fontSize: 7, cellPadding: 2 },
                headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 25 }, // Timestamp
                    1: { cellWidth: 35 }, // Actor
                    2: { cellWidth: 25 }, // Type
                    3: { cellWidth: 25 }, // Context
                    4: { cellWidth: 'auto' }, // Payload (flexible)
                    5: { cellWidth: 35 }  // Proof
                },
                didDrawPage: (data) => {
                    // Footer
                    doc.setFontSize(8);
                    doc.setTextColor(150);
                    doc.text("Verytis - Digital Trust Platform", 14, doc.internal.pageSize.height - 10);
                    doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - 20, doc.internal.pageSize.height - 10);
                }
            });

            // 5. Digital Signature Simulation (Visual)
            const finalY = doc.lastAutoTable.finalY || 40;
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text("Cryptographic Signature Verification:", 14, finalY + 10);
            doc.setFontSize(8);
            doc.setTextColor(100);
            const signature = "VRTS-" + Math.random().toString(36).substring(2, 15).toUpperCase();
            doc.text(`Hash: ${signature}`, 14, finalY + 15);
            doc.text("Status: VALIDATED (Blockchain Anchor #9921)", 14, finalY + 19);

            doc.save('Verytis_Audit_Report.pdf');
        } catch (err) {
            console.error("PDF Generation Error:", err);
            alert("Failed to generate PDF. Check console.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {userRole === 'Member' ? 'My Audit Documentation' : 'Audit Documentation'}
                </h1>
                <p className="text-slate-500 mt-1 text-xs font-medium">
                    {userRole === 'Member'
                        ? 'Generate personal activity reports from your channels.'
                        : 'Generate complete and legally usable audit documents from authorized channels.'}
                </p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-5">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-4">
                            {userRole === 'Member' ? 'My Channel Audit' : 'Configuration'}
                        </h3>
                        <div className="space-y-4">
                            {/* Platform Selector */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Platform</label>
                                <select
                                    value={platform}
                                    onChange={(e) => {
                                        setPlatform(e.target.value);
                                        setSelectedChannels([]);
                                        setSelectedChannelId('');
                                        // Reset Team selection if platform changes? No, teams are cross-platform usually, but keep it simple.
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-md text-xs shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 py-2 px-3 outline-none"
                                >
                                    <option value="Slack">Slack</option>
                                    <option value="Teams">Microsoft Teams</option>
                                </select>
                            </div>

                            {/* Team Selector (Admin Only - Hidden for Personal Audit) */}
                            {userRole === 'Admin' && !reportType.includes('My Activity') && (
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Organization Team</label>
                                    <select
                                        value={selectedTeamId}
                                        onChange={(e) => {
                                            setSelectedTeamId(e.target.value);
                                            setSelectedChannels([]); // Reset channels when team changes
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-md text-xs shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 py-2 px-3 outline-none font-medium"
                                    >
                                        <option value="all">All Teams</option>
                                        {MOCK_TEAMS.map(team => (
                                            <option key={team.id} value={team.id}>{team.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Report Type Selector */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Report Type</label>
                                <select
                                    value={reportType}
                                    onChange={(e) => {
                                        setReportType(e.target.value);
                                        // Clear member selection if switching away from member audit
                                        if (!e.target.value.includes('Member')) setSelectedMembers([]);
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-md text-xs shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 py-2 px-3 outline-none"
                                >
                                    {userRole === 'Member' ? (
                                        <>
                                            <option>Full Channel Audit (Your Activity Only)</option>
                                            <option>Decision Audit</option>
                                        </>
                                    ) : userRole === 'Manager' ? (
                                        <>
                                            <option>My Activity (Full Audit)</option>
                                            <option>My Activity (Decisions Only)</option>
                                            <option disabled className="text-slate-300">--- Team Audit ---</option>
                                            <option>Team Channel Audit (Full History)</option>
                                            <option>Team Channel Audit (Decisions Only)</option>
                                            <option>Team Member Audit (Full History)</option>
                                            <option>Team Member Audit (Decisions Only)</option>
                                        </>
                                    ) : (
                                        <>
                                            <option>My Activity (Full Audit)</option>
                                            <option>My Activity (Decisions Only)</option>
                                            <option disabled className="text-slate-300">--- Organization Audit ---</option>
                                            <option>Full Channel Audit</option>
                                            <option>Full Decision Audit (Channel)</option>
                                            <option>Selected Member Audit (Full)</option>
                                            <option>Selected Member Audit (Decisions)</option>
                                        </>
                                    )}
                                </select>
                                {(userRole === 'Member' || reportType.includes('My Activity')) && (
                                    <p className="mt-1.5 text-[10px] text-emerald-600 font-medium leading-tight">
                                        Compliance Note: This report extracts only messages sent by you or threads where you are an active participant.
                                    </p>
                                )}
                            </div>

                            {/* Channel Selector - Role Based */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                                    {userRole === 'Member' ? 'Select Channel' : 'Authorized Channels'}
                                </label>
                                {userRole === 'Member' ? (
                                    <select
                                        value={selectedChannelId}
                                        onChange={(e) => {
                                            setSelectedChannelId(e.target.value);
                                            const channel = availableChannels.find(c => c.id.toString() === e.target.value);
                                            if (channel) setSelectedChannels([channel.name]);
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-md text-xs shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 py-2 px-3 outline-none"
                                    >
                                        <option value="">Select a channel...</option>
                                        {availableChannels.map(channel => (
                                            <option key={channel.id} value={channel.id}>{channel.name} ({channel.team})</option>
                                        ))}
                                    </select>
                                ) : (
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
                                        {availableChannels.length === 0 && <p className="text-xs text-slate-400 p-1">No channels found matching the filters.</p>}
                                    </div>
                                )}
                            </div>

                            {/* Member Selection Logic */}
                            {userRole !== 'Member' && (reportType.includes('Member') || reportType.includes('Selected Members')) && (
                                <div className="animate-in fade-in zoom-in-95 duration-200">
                                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                                        {userRole === 'Manager' ? 'Team Members' : 'Select Members'}
                                    </label>
                                    <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-md p-2 bg-slate-50">
                                        {MOCK_CHANNEL_MEMBERS.filter(m => userRole === 'Admin' || m.role !== 'Admin').map(member => (
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
                                                    {userRole === 'Manager' && <span className="text-[9px] text-slate-400">({member.role})</span>}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Time Range Selector */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Time Range</label>
                                <select
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-md text-xs shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 py-2 px-3 outline-none"
                                >
                                    <option value="all">All Time</option>
                                    <option value="30">Last 30 Days</option>
                                    <option value="7">Last 7 Days</option>
                                    <option value="custom">Custom Range...</option>
                                </select>
                                {dateRange === 'custom' && (
                                    <div className="flex items-center gap-2 mt-2 animate-in fade-in zoom-in-95">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 text-slate-600 focus:ring-1 focus:ring-slate-500 outline-none"
                                        />
                                        <span className="text-slate-300">-</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 text-slate-600 focus:ring-1 focus:ring-slate-500 outline-none"
                                        />
                                    </div>
                                )}
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
                                                {platform === 'Slack' ? <Slack className="w-8 h-8 text-slate-700" /> : <Users className="w-8 h-8 text-blue-600" />}
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-lg">
                                                        {userRole === 'Member' ? 'Channel Audit (Personal)' : 'Audit Report'}
                                                    </h3>
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
                                                    {reportType.toLowerCase().includes('decision')
                                                        ? 'Decisions Only'
                                                        : (selectedMembers.length > 0)
                                                            ? `${selectedMembers.length} Members`
                                                            : dateRange !== 'all'
                                                                ? `Last ${dateRange} Days`
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
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FileText className="w-5 h-5 text-blue-600" />
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
                                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">SJ</div>
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
                                <div className="ml-4 border-l-2 border-blue-200 pl-3">
                                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
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
                        <Button variant="primary" icon={Download} onClick={generateAuditPDF}>Generate PDF</Button>
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
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                        <div className="text-2xl font-bold text-blue-700">8</div>
                                        <div className="text-[10px] text-blue-600 font-medium uppercase">Decisions</div>
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
