import { useState } from 'react';
import { Shield, FileCheck, FileText, CheckSquare, Square, Download, Mail, Table, FileSpreadsheet, Calendar, Info, Lock, Search } from 'lucide-react';
import { Card, Button, StatusBadge, Modal } from '../ui';
import { MOCK_CONNECTED_ACCOUNTS, MOCK_EMAIL_METADATA, MOCK_USERS, MOCK_TEAMS } from '../../data/mockData';

const EmailAudit = ({ userRole }) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [exportModal, setExportModal] = useState({ type: null, isOpen: false });
    const [dateRange, setDateRange] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Determine current user based on role
    const getCurrentUser = () => {
        if (userRole === 'Admin') return MOCK_USERS.find(u => u.role === 'Admin') || MOCK_USERS[0];
        if (userRole === 'Manager') return MOCK_USERS.find(u => u.role === 'Manager') || MOCK_USERS[1];
        return MOCK_USERS.find(u => u.role === 'Employee') || MOCK_USERS[2];
    };
    const currentUser = getCurrentUser();
    const currentUserEmail = currentUser?.email || '';

    // Filter logic for personal emails (current user's own emails)
    const userEmails = MOCK_EMAIL_METADATA.filter(email => email.sender === currentUserEmail || email.recipients.includes(currentUserEmail));

    // 2. Apply search filter (Correspondent or Subject)
    const filteredMemberEmails = userEmails.filter(email => {
        const term = searchTerm.toLowerCase();
        const matchesSender = email.sender.toLowerCase().includes(term);
        const matchesRecipient = email.recipients.some(r => r.toLowerCase().includes(term));
        const matchesSubject = email.subject.toLowerCase().includes(term);
        return matchesSender || matchesRecipient || matchesSubject;
    });

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

    // MEMBER VIEW
    if (userRole === 'Member') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <header>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Email Audit</h1>
                    <p className="text-slate-500 mt-1 text-xs font-medium">Transparency log for your connected professional account.</p>
                </header>

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3 items-start">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-1">Transparency & Privacy Notice</h4>
                        <p className="text-xs text-amber-800 leading-relaxed mb-2">
                            This audit log is strictly limited to your professional email activity on <strong>{currentUserEmail}</strong>, in compliance with corporate transparency policies.
                        </p>
                        <p className="text-xs text-amber-800 leading-relaxed">
                            <strong>What is captured:</strong> Only metadata (Sender, Recipient, Timestamp, Subject) and interaction status (Open, Reply).<br />
                            <strong>What is PRIVATE:</strong> The actual body content and attachments of your emails are <span className="font-bold underline">never</span> accessed, read, or stored by this system.
                        </p>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm gap-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-50 rounded-md border border-slate-100">
                                <Calendar className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Time Range</span>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={dateRange}
                                        onChange={(e) => setDateRange(e.target.value)}
                                        className="text-xs font-semibold text-slate-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                                    >
                                        <option value="all">Since Connection (All Time)</option>
                                        <option value="30">Last 30 Days</option>
                                        <option value="7">Last 7 Days</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                    {dateRange === 'custom' && (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 ml-2 pl-2 border-l border-slate-200">
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="text-xs border border-slate-200 rounded px-2 py-0.5 text-slate-600 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <span className="text-slate-300">-</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="text-xs border border-slate-200 rounded px-2 py-0.5 text-slate-600 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="w-px h-8 bg-slate-100" />

                        <div className="flex items-center gap-3">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Filter by email or subject..."
                                className="text-xs border-none p-0 w-48 focus:ring-0 bg-transparent placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                    <Button variant="secondary" icon={Download} className="text-xs">Export My Logs</Button>
                </div>

                <Card className="overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            Your Metadata Log
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">Showing {filteredMemberEmails.length} records</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 uppercase tracking-wide">Timestamp</th>
                                    <th className="px-6 py-3 uppercase tracking-wide">Type</th>
                                    <th className="px-6 py-3 uppercase tracking-wide">Correspondent</th>
                                    <th className="px-6 py-3 uppercase tracking-wide">Subject</th>
                                    <th className="px-6 py-3 uppercase tracking-wide">Tracking Status</th>
                                    <th className="px-6 py-3 uppercase tracking-wide text-right">Ref ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredMemberEmails.length > 0 ? filteredMemberEmails.map((email, idx) => {
                                    const isSender = email.sender === currentUserEmail;
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-3 font-mono text-slate-500" suppressHydrationWarning>{new Date(email.sentAt).toLocaleString()}</td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${isSender ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                                    {isSender ? 'Sent' : 'Received'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 font-medium text-slate-700">
                                                {isSender ? email.recipients.join(', ') : email.sender}
                                            </td>
                                            <td className="px-6 py-3 text-slate-600 truncate max-w-[200px]" title={email.subject}>
                                                {email.subject}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex gap-2">
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${email.openStatus === 'opened' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${email.openStatus === 'opened' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                                        {email.openStatus}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${email.replyStatus === 'replied' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${email.replyStatus === 'replied' ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                                                        {email.replyStatus}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="text-[10px] font-mono text-slate-400">{email.messageId}</span>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                            No logs found matching your filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        );
    }

    // ADMIN / MANAGER VIEW
    // Determine available accounts based on role
    // Admin: All accounts in the organization
    // Manager: Only team members if 'email' scope is authorized
    const managerTeam = MOCK_TEAMS.find(t => t.scopes?.includes('email')); // Simulate manager's team with email scope
    const availableAccounts = userRole === 'Admin'
        ? MOCK_CONNECTED_ACCOUNTS
        : (managerTeam ? MOCK_CONNECTED_ACCOUNTS.filter(a => a.department === 'Finance' || a.department === 'Legal') : []);

    const hasEmailScope = userRole === 'Admin' || (managerTeam?.scopes?.includes('email'));

    // Filter emails for selected accounts
    const getEmailsForAccounts = () => {
        if (selectedIds.length === 0) return [];
        const selectedEmails = MOCK_CONNECTED_ACCOUNTS
            .filter(a => selectedIds.includes(a.id))
            .map(a => a.email);
        return MOCK_EMAIL_METADATA.filter(email =>
            selectedEmails.includes(email.sender) ||
            email.recipients.some(r => selectedEmails.includes(r))
        );
    };

    const accountEmails = getEmailsForAccounts();

    // Apply search filter to account emails
    const filteredAccountEmails = accountEmails.filter(email => {
        const term = searchTerm.toLowerCase();
        const matchesSender = email.sender.toLowerCase().includes(term);
        const matchesRecipient = email.recipients.some(r => r.toLowerCase().includes(term));
        const matchesSubject = email.subject.toLowerCase().includes(term);
        return matchesSender || matchesRecipient || matchesSubject;
    });

    // Manager without email scope: Show personal audit + restricted message for team audit
    if (userRole === 'Manager' && !hasEmailScope) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <header>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Email Metadata Audit</h1>
                    <p className="text-slate-500 mt-1 text-xs font-medium">Review your personal email activity and team accounts.</p>
                </header>

                {/* Personal Audit - Always accessible */}
                <Card className="overflow-hidden border-blue-100">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-slate-50/50 flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900 flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-blue-400" />
                            My Personal Email Audit
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <select
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="text-xs font-medium text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                                >
                                    <option value="all">All Time</option>
                                    <option value="30">Last 30 Days</option>
                                    <option value="7">Last 7 Days</option>
                                    <option value="custom">Custom</option>
                                </select>
                                {dateRange === 'custom' && (
                                    <div className="flex items-center gap-1 ml-1">
                                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs border border-slate-200 rounded px-1.5 py-0.5" />
                                        <span className="text-slate-300">-</span>
                                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs border border-slate-200 rounded px-1.5 py-0.5" />
                                    </div>
                                )}
                            </div>
                            <div className="w-px h-4 bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <Search className="w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Filter..."
                                    className="text-xs border-none p-0 w-24 focus:ring-0 bg-transparent placeholder:text-slate-400"
                                />
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{filteredMemberEmails.length} records</span>
                            <Button variant="secondary" icon={Download} className="text-xs py-1">Export</Button>
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 uppercase tracking-wide">Timestamp</th>
                                    <th className="px-6 py-3 uppercase tracking-wide">Type</th>
                                    <th className="px-6 py-3 uppercase tracking-wide">Correspondent</th>
                                    <th className="px-6 py-3 uppercase tracking-wide">Subject</th>
                                    <th className="px-6 py-3 uppercase tracking-wide">Tracking</th>
                                    <th className="px-6 py-3 uppercase tracking-wide text-right">Ref ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredMemberEmails.length > 0 ? filteredMemberEmails.map((email, idx) => {
                                    const isSender = email.sender === currentUserEmail;
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-3 font-mono text-slate-500" suppressHydrationWarning>{new Date(email.sentAt).toLocaleString()}</td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${isSender ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                                    {isSender ? 'Sent' : 'Received'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 font-medium text-slate-700">
                                                {isSender ? email.recipients.join(', ') : email.sender}
                                            </td>
                                            <td className="px-6 py-3 text-slate-600 truncate max-w-[200px]" title={email.subject}>
                                                {email.subject}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex gap-2">
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${email.openStatus === 'opened' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                        {email.openStatus}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${email.replyStatus === 'replied' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                        {email.replyStatus}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="text-[10px] font-mono text-slate-400">{email.messageId}</span>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                            No personal email logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Team Audit - Restricted */}
                <Card className="p-8 text-center border-slate-200 bg-slate-50/50">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Team Email Audit Not Authorized</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Your team does not have the "Email Audit" scope enabled. Contact your administrator to request access to audit team members.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Email Metadata Audit</h1>
                <p className="text-slate-500 mt-1 text-xs font-medium">
                    {userRole === 'Admin' ? 'Review all connected corporate email accounts.' : 'Review email accounts for your team members.'}
                </p>
            </header>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 items-start">
                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">Privacy Scope</h4>
                    <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                        {userRole === 'Admin'
                            ? 'Organization-wide audit access. Only metadata is visible – no email content is collected or stored.'
                            : 'Team-level audit access. You can only view metadata for members of your authorized team.'}
                    </p>
                </div>
            </div>

            {/* My Personal Audit - Admin/Manager can see their own audit too */}
            <Card className="overflow-hidden border-blue-100">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900 flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-blue-400" />
                        My Personal Email Audit
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="text-xs font-medium text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                            >
                                <option value="all">All Time</option>
                                <option value="30">Last 30 Days</option>
                                <option value="7">Last 7 Days</option>
                                <option value="custom">Custom</option>
                            </select>
                            {dateRange === 'custom' && (
                                <div className="flex items-center gap-1 ml-1">
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs border border-slate-200 rounded px-1.5 py-0.5" />
                                    <span className="text-slate-300">-</span>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs border border-slate-200 rounded px-1.5 py-0.5" />
                                </div>
                            )}
                        </div>
                        <div className="w-px h-4 bg-slate-200" />
                        <div className="flex items-center gap-2">
                            <Search className="w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Filter..."
                                className="text-xs border-none p-0 w-24 focus:ring-0 bg-transparent placeholder:text-slate-400"
                            />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{filteredMemberEmails.length} records</span>
                        <Button variant="secondary" icon={Download} className="text-xs py-1">Export</Button>
                    </div>
                </div>
                <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 uppercase tracking-wide">Timestamp</th>
                                <th className="px-6 py-3 uppercase tracking-wide">Type</th>
                                <th className="px-6 py-3 uppercase tracking-wide">Correspondent</th>
                                <th className="px-6 py-3 uppercase tracking-wide">Subject</th>
                                <th className="px-6 py-3 uppercase tracking-wide">Tracking</th>
                                <th className="px-6 py-3 uppercase tracking-wide text-right">Ref ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredMemberEmails.length > 0 ? filteredMemberEmails.map((email, idx) => {
                                const isSender = email.sender === currentUserEmail;
                                return (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3 font-mono text-slate-500" suppressHydrationWarning>{new Date(email.sentAt).toLocaleString()}</td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${isSender ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                                {isSender ? 'Sent' : 'Received'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 font-medium text-slate-700">
                                            {isSender ? email.recipients.join(', ') : email.sender}
                                        </td>
                                        <td className="px-6 py-3 text-slate-600 truncate max-w-[200px]" title={email.subject}>
                                            {email.subject}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex gap-2">
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${email.openStatus === 'opened' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                    {email.openStatus}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${email.replyStatus === 'replied' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                    {email.replyStatus}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="text-[10px] font-mono text-slate-400">{email.messageId}</span>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                        No personal email logs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>


            {/* Account Selection Table */}
            <div className="flex gap-6">
                <div className="flex-1">
                    <Card className="overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                                {userRole === 'Admin' ? 'All Connected Accounts' : 'Team Members'}
                            </h3>
                            <span className="text-[10px] text-slate-400">
                                {selectedIds.length > 0 ? `${selectedIds.length} selected` : `${availableAccounts.length} accounts`}
                            </span>
                        </div>
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
                                {availableAccounts.map(account => (
                                    <tr key={account.id} className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${selectedIds.includes(account.id) ? 'bg-blue-50/30' : ''}`}>
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

                {/* Export Sidebar */}
                {selectedIds.length > 0 && (
                    <div className="w-72 animate-in slide-in-from-right-4 fade-in duration-300">
                        <Card className="p-4 sticky top-6 border-blue-100 shadow-sm bg-white">
                            <div className="flex items-center gap-2 mb-3 text-blue-700">
                                <FileCheck className="w-4 h-4" />
                                <h3 className="font-bold text-xs uppercase tracking-wide">Audit Actions</h3>
                            </div>
                            <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                                {selectedIds.length} user(s) selected. View detailed logs or export metadata.
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

            {/* Detailed Email Log for Selected Accounts */}
            {selectedIds.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className="overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                Email Metadata Log
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    <select
                                        value={dateRange}
                                        onChange={(e) => setDateRange(e.target.value)}
                                        className="text-xs font-medium text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                                    >
                                        <option value="all">All Time</option>
                                        <option value="30">Last 30 Days</option>
                                        <option value="7">Last 7 Days</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                    {dateRange === 'custom' && (
                                        <div className="flex items-center gap-1 ml-1">
                                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs border border-slate-200 rounded px-1.5 py-0.5" />
                                            <span className="text-slate-300">-</span>
                                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs border border-slate-200 rounded px-1.5 py-0.5" />
                                        </div>
                                    )}
                                </div>
                                <div className="w-px h-4 bg-slate-200" />
                                <div className="flex items-center gap-2">
                                    <Search className="w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Filter..."
                                        className="text-xs border-none p-0 w-24 focus:ring-0 bg-transparent placeholder:text-slate-400"
                                    />
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">{filteredAccountEmails.length} records</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 uppercase tracking-wide">Timestamp</th>
                                        <th className="px-6 py-3 uppercase tracking-wide">Sender</th>
                                        <th className="px-6 py-3 uppercase tracking-wide">Recipients</th>
                                        <th className="px-6 py-3 uppercase tracking-wide">Subject</th>
                                        <th className="px-6 py-3 uppercase tracking-wide">Tracking</th>
                                        <th className="px-6 py-3 uppercase tracking-wide text-right">Ref ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAccountEmails.length > 0 ? filteredAccountEmails.map((email, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-3 font-mono text-slate-500" suppressHydrationWarning>{new Date(email.sentAt).toLocaleString()}</td>
                                            <td className="px-6 py-3 font-medium text-slate-700">{email.sender}</td>
                                            <td className="px-6 py-3 text-slate-600 truncate max-w-[150px]">{email.recipients.join(', ')}</td>
                                            <td className="px-6 py-3 text-slate-600 truncate max-w-[200px]" title={email.subject}>{email.subject}</td>
                                            <td className="px-6 py-3">
                                                <div className="flex gap-2">
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${email.openStatus === 'opened' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                        {email.openStatus}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${email.replyStatus === 'replied' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                        {email.replyStatus}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="text-[10px] font-mono text-slate-400">{email.messageId}</span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                                No email metadata found for selected accounts.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

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
                                        <div className="text-[10px] text-slate-500" suppressHydrationWarning>{new Date().toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {MOCK_EMAIL_METADATA.slice(0, 3).map((email, idx) => (
                                        <div key={idx} className="border border-slate-200 rounded p-3 text-xs">
                                            <div className="grid grid-cols-2 gap-y-1 mb-2">
                                                <div className="flex gap-2"><span className="text-slate-500 w-16">Sender:</span> <span className="font-mono text-slate-900">{email.sender}</span></div>
                                                <div className="flex gap-2"><span className="text-slate-500 w-16">Date:</span> <span className="font-mono text-slate-900" suppressHydrationWarning>{new Date(email.sentAt).toLocaleString()}</span></div>
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
