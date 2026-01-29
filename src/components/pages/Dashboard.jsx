import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, AlertCircle, AlertTriangle, ArrowUpRight, Clock, Download,
    FileText, Mail, MessageSquare, Shield, Zap, Hash,
    TrendingUp, Flame, Trophy, UserCheck, UserX, BarChart3, Users, HelpCircle, Info, ChevronDown, CheckCircle, Lock, MousePointer2, RefreshCw
} from 'lucide-react';
import { Card, Button } from '../ui';
import { MOCK_DECISION_METRICS, MOCK_RISK_METRICS, MOCK_TIMELINE_EVENTS, MOCK_CHANNELS, MOCK_TEAMS } from '../../data/mockData';

const AdminDashboard = () => {
    const [selectedTeam, setSelectedTeam] = useState('all');
    const [selectedChannel, setSelectedChannel] = useState('all');

    // Filter Logic
    const availableTeams = [
        { id: 'all', name: 'All Teams' },
        ...MOCK_TEAMS
    ];

    const availableChannels = selectedTeam === 'all'
        ? MOCK_CHANNELS
        : MOCK_CHANNELS.filter(c => c.team === MOCK_TEAMS.find(t => t.id === parseInt(selectedTeam))?.name);

    // Compute dynamic metrics based on filters (simulated changes for demo)
    const isFiltered = selectedTeam !== 'all' || selectedChannel !== 'all';

    // 1. Global Executive Performance (Dynamic)
    const EXECUTIVE_METRICS = [
        { label: "% Initiatives < 24h", value: isFiltered ? (selectedTeam === '1' ? "92%" : "84%") : "87%", trend: isFiltered ? "+5%" : "+2%", icon: Zap, color: "text-emerald-500", border: "border-t-emerald-500" },
        { label: "Avg Signal-to-Action", value: isFiltered ? (selectedTeam === '1' ? "2.1h" : "5.5h") : "4.2h", trend: "-15m", icon: Clock, color: "text-blue-500", border: "border-t-blue-500" },
        { label: "Closed Loop Rate", value: isFiltered ? "98%" : "94%", trend: "Stable", icon: RefreshCw, color: "text-blue-500", border: "border-t-blue-500" },
        { label: "Abandoned / No Response", value: isFiltered ? "0" : "3", trend: "-1", icon: AlertCircle, color: "text-rose-500", border: "border-t-rose-500" }
    ];

    // 2. Engagement Data
    const TOP_TEAMS = [
        { name: "Finance & Legal", actions: 142, delay: "3.5h" },
        { name: "Engineering", actions: 118, delay: "2.1h" },
        { name: "Product", actions: 95, delay: "4.8h" },
        { name: "Marketing", actions: 76, delay: "1.2h" },
        { name: "Sales Ops", actions: 54, delay: "5.5h" }
    ];

    // 3. Structural Alerts
    const STRUCTURAL_ALERTS = [
        { id: 1, text: "Critical: Merger validation pending > 48h", type: "Validation", source: "Executive" },
        { id: 2, text: "Orphaned: 3 Q4 Budget decisions (User left)", type: "Orphaned", source: "Finance" },
        { id: 3, text: "Bypassed: 2 Actions without validation signal", type: "Compliance", source: "Marketing" },
        { id: 4, text: "Unread Link: Compliance Strategy v2 ignored > 5d", type: "Engagement", source: "Legal" },
    ];

    // 5. Quick Wins
    const QUICK_WINS = [
        "Finance closed 3 blockers in <8h this week",
        "Ops approved 92% of campaigns in under 1 day",
        "Marketing processed 14 updates with no backflow"
    ];
    // Get the currently selected team object for display
    const currentTeam = selectedTeam !== 'all'
        ? MOCK_TEAMS.find(t => t.id === parseInt(selectedTeam))
        : null;

    // --- TEAM DASHBOARD VIEW (Manager-style) ---
    if (currentTeam) {
        // Team-specific KPIs (simulated)
        const TEAM_METRICS = [
            { label: "Team Decisions", value: availableChannels.reduce((sum, c) => sum + c.decisions, 0), trend: "+8%", icon: Activity, color: "text-emerald-500", border: "border-t-emerald-500" },
            { label: "Avg Validation Time", value: selectedTeam === '1' ? "2.1h" : "3.5h", trend: "-20m", icon: Clock, color: "text-blue-500", border: "border-t-blue-500" },
            { label: "Pending Actions", value: Math.ceil(availableChannels.reduce((sum, c) => sum + c.decisions, 0) * 0.08), trend: "-2", icon: AlertCircle, color: "text-amber-500", border: "border-t-amber-500" },
            { label: "Loop Closure", value: "96%", trend: "Stable", icon: RefreshCw, color: "text-blue-500", border: "border-t-blue-500" }
        ];

        // Team-specific Alerts
        const TEAM_ALERTS = STRUCTURAL_ALERTS.filter(a => currentTeam.name.includes(a.source) || a.source === 'Marketing' || a.source === 'Legal');

        // Team-specific Quick Wins
        const TEAM_WINS = [
            `${currentTeam.name} resolved 5 blockers in under 6h`,
            `Channel sync improved by 15% this week`,
            `All pending reviews closed within SLA`
        ];

        return (
            <div className="space-y-8 animate-in fade-in duration-300">
                <header className="flex justify-between items-end pb-4 border-b border-slate-200/60">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{currentTeam.name}</h1>
                        <p className="text-slate-500 mt-1 text-xs font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Team View • {availableChannels.length} Channels • Last synced 1 min ago
                        </p>
                    </div>
                    <div className="flex gap-2 items-center">
                        {/* Team Filter */}
                        <div className="relative group">
                            <select
                                className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors bg-no-repeat"
                                value={selectedTeam}
                                onChange={(e) => {
                                    setSelectedTeam(e.target.value);
                                    setSelectedChannel('all');
                                }}
                            >
                                {availableTeams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Channel Filter */}
                        <div className="relative group">
                            <select
                                className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors bg-no-repeat"
                                value={selectedChannel}
                                onChange={(e) => setSelectedChannel(e.target.value)}
                            >
                                <option value="all">All Channels</option>
                                {availableChannels.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <Button variant="secondary" icon={Download}>Team Report</Button>
                    </div>
                </header>

                {/* Team KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {TEAM_METRICS.map((m, i) => (
                        <Card key={i} className={`p-5 flex flex-col justify-between h-32 border-t-4 ${m.border}`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wide">{m.label}</span>
                                <m.icon className={`w-4 h-4 ${m.color}`} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-slate-900 tracking-tight">{m.value}</div>
                                <div className="text-xs text-slate-400 mt-1 font-medium">Trend: <span className="text-slate-600">{m.trend}</span></div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Team Velocity Chart & Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Velocity Chart */}
                    <Card className="p-5 flex flex-col h-64">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-blue-500" />
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Decision Velocity (Team Trend)</h3>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 leading-tight">Daily decision volume for {currentTeam.name}.</p>
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium h-fit">This Week</span>
                        </div>
                        <div className="flex-1 flex items-end justify-between px-2 gap-3 h-36">
                            {[25, 40, 20, 55, 65, 35, 50].map((h, i) => (
                                <div key={i} className="flex flex-col items-center gap-1 flex-1 group cursor-pointer h-full justify-end">
                                    <div className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">{h}</div>
                                    <div
                                        className="w-full max-w-8 bg-blue-200 hover:bg-blue-500 rounded-t transition-all duration-300 group-hover:shadow-lg"
                                        style={{ height: `${h}%`, minHeight: '4px' }}
                                    ></div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-1">D{i + 1}</div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Team Alerts */}
                    <Card className="p-0 overflow-hidden flex flex-col">
                        <div className="px-5 py-3 border-b border-slate-100 bg-rose-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-700" />
                                <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wide">Team Alerts</h3>
                            </div>
                            <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded">{TEAM_ALERTS.length} Open</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {TEAM_ALERTS.length > 0 ? TEAM_ALERTS.map((alert) => (
                                <div key={alert.id} className="p-3 hover:bg-slate-50 transition-colors group cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                            <span className="text-xs font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{alert.text}</span>
                                        </div>
                                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{alert.source}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-6 text-center text-slate-400 text-xs italic">No active alerts for this team.</div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Team Quick Wins */}
                <Card className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-5 shadow-lg border-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Trophy className="w-24 h-24" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-amber-300 mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4" /> Team Highlights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {TEAM_WINS.map((win, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 flex items-start gap-3">
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <p className="text-xs font-medium leading-relaxed opacity-90">{win}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        );
    }

    // --- ADMIN/EXECUTIVE OVERVIEW (Global View) ---
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <header className="flex justify-between items-end pb-4 border-b border-slate-200/60">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Executive Overview</h1>
                    <p className="text-slate-500 mt-1 text-xs font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        System Operational • Global Admin View • Last synced 1 min ago
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    {/* Team Filter */}
                    <div className="relative group">
                        <select
                            className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors bg-no-repeat"
                            value={selectedTeam}
                            onChange={(e) => {
                                setSelectedTeam(e.target.value);
                                setSelectedChannel('all'); // Reset channel on team change
                            }}
                        >
                            {availableTeams.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Channel Filter (Conditional) */}
                    <div className={`relative group transition-opacity duration-200 ${selectedTeam === 'all' ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                        <select
                            disabled={selectedTeam === 'all'}
                            className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors bg-no-repeat"
                            value={selectedChannel}
                            onChange={(e) => setSelectedChannel(e.target.value)}
                        >
                            <option value="all">All Channels</option>
                            {availableChannels.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <Button variant="secondary" icon={Download}>Global Report</Button>
                </div>
            </header>

            {/* SECTION 1: Executive Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {EXECUTIVE_METRICS.map((m, i) => (
                    <Card key={i} className={`p-5 flex flex-col justify-between h-32 border-t-4 ${m.border}`}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wide">{m.label}</span>
                            <m.icon className={`w-4 h-4 ${m.color}`} />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-slate-900 tracking-tight">{m.value}</div>
                            <div className="text-xs text-slate-400 mt-1 font-medium">Trend: <span className="text-slate-600">{m.trend}</span></div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* SECTION 2: Engagement Mapping */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Top Teams */}
                <Card className="p-0 overflow-hidden flex flex-col">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Top 5 Initiator Teams</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {TOP_TEAMS.map((team, idx) => (
                            <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">{idx + 1}</div>
                                    <span className="text-xs font-bold text-slate-800">{team.name}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-slate-900">{team.actions} <span className="text-[9px] font-normal text-slate-400">actions</span></div>
                                    <div className="text-[9px] text-slate-400">Avg delay: {team.delay}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Interaction Types Chart (Simulated) */}
                <Card className="p-5 flex flex-col justify-center items-center relative">
                    <div className="absolute top-4 left-5 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Interaction Types</h3>
                    </div>
                    {/* CSS Donut Chart */}
                    <div className="w-32 h-32 rounded-full border-[12px] border-blue-500 border-r-emerald-400 border-b-amber-400 border-l-rose-400 transform rotate-45 flex items-center justify-center shadow-sm">
                        <div className="text-center transform -rotate-45">
                            <div className="text-xl font-bold text-slate-900">1.2k</div>
                            <div className="text-[9px] text-slate-400 uppercase">Total</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-6 w-full px-4">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[10px] text-slate-600">Decision (40%)</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"></div><span className="text-[10px] text-slate-600">Update (25%)</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400"></div><span className="text-[10px] text-slate-600">Request (20%)</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-400"></div><span className="text-[10px] text-slate-600">Escalation (15%)</span></div>
                    </div>
                </Card>

                {/* Heatmap (Compact) */}
                <Card className="p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <Flame className="w-4 h-4 text-rose-500" />
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Friction Heatmap</h3>
                    </div>
                    <div className="flex-1 flex flex-col gap-1 justify-center">
                        <div className="flex justify-between text-[8px] text-slate-400 px-1 font-mono uppercase mb-1">
                            <span>Morn</span><span>Noon</span><span>Eve</span>
                        </div>
                        {['M', 'T', 'W', 'T', 'F'].map(day => (
                            <div key={day} className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-slate-400 w-3">{day}</span>
                                <div className="flex-1 grid grid-cols-12 gap-0.5 h-4">
                                    {[...Array(12)].map((_, i) => (
                                        <div key={i} className={`rounded-[1px] ${Math.random() > 0.7 ? 'bg-rose-500' : Math.random() > 0.5 ? 'bg-amber-400' : 'bg-slate-100'}`}></div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* SECTION 3 & 4: Alerts & Compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Structural Alerts */}
                <Card className="p-0 overflow-hidden flex flex-col">
                    <div className="px-5 py-3 border-b border-slate-100 bg-rose-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-700" />
                            <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wide">Structural Friction Points</h3>
                        </div>
                        <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded">4 Critical</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {STRUCTURAL_ALERTS.map((alert) => (
                            <div key={alert.id} className="p-3 hover:bg-slate-50 transition-colors group cursor-pointer">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                        <span className="text-xs font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{alert.text}</span>
                                    </div>
                                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{alert.source}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Compliance & Governance */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 flex flex-col items-center justify-center border-l-4 border-l-emerald-500">
                        <Shield className="w-6 h-6 text-emerald-500 mb-2" />
                        <div className="text-2xl font-bold text-slate-900">100%</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide text-center">Rule Compliance</div>
                    </Card>
                    <Card className="p-4 flex flex-col items-center justify-center border-l-4 border-l-blue-500">
                        <CheckCircle className="w-6 h-6 text-blue-500 mb-2" />
                        <div className="text-2xl font-bold text-slate-900">98.5%</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide text-center">Traceability Rate</div>
                    </Card>
                    <Card className="p-4 flex flex-col items-center justify-center border-l-4 border-l-amber-500">
                        <Lock className="w-6 h-6 text-amber-500 mb-2" />
                        <div className="text-2xl font-bold text-slate-900">4,210</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide text-center">Audit Logs (Sep)</div>
                    </Card>
                    <Card className="p-4 flex flex-col items-center justify-center border-l-4 border-l-blue-500">
                        <MousePointer2 className="w-6 h-6 text-blue-500 mb-2" />
                        <div className="text-lg font-bold text-slate-900">Auto: 92%</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide text-center">Capture Rate</div>
                    </Card>
                </div>
            </div>

            {/* SECTION 5: Quick Wins */}
            <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 shadow-lg border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Trophy className="w-24 h-24" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-amber-300 mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> Quick Wins & Momentum
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {QUICK_WINS.map((win, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-xs font-medium leading-relaxed opacity-90">{win}</p>
                        </div>
                    ))}
                </div>
            </Card>
        </div >
    );
};

const Dashboard = ({ userRole }) => {
    const navigate = useNavigate();
    const [selectedChannel, setSelectedChannel] = useState('all');

    if (userRole === 'Admin') {
        return <AdminDashboard />;
    }


    // Filter Logic
    const getManagerTeams = () => ['Engineering', 'Engineering & Product', 'Product']; // Simulate Manager managing these

    const availableChannels = userRole === 'Admin'
        ? MOCK_CHANNELS
        : MOCK_CHANNELS.filter(c => getManagerTeams().some(t => c.team.includes(t) || c.name.includes('product')));

    const currentChannel = selectedChannel === 'all'
        ? null
        : availableChannels.find(c => c.id === parseInt(selectedChannel));

    // Calculate aggregations
    const calculateAggregates = (channels) => {
        const totalDecisions = channels.reduce((sum, c) => sum + c.decisions, 0);
        return {
            decisions: totalDecisions,
            avgValidationTime: '3.1h', // Weighted average simulation
            pending: Math.ceil(totalDecisions * 0.08),
            orphaned: Math.floor(totalDecisions * 0.01)
        };
    };

    const teamAggregates = calculateAggregates(availableChannels);

    const displayMetrics = currentChannel ? {
        decisions: currentChannel.decisions,
        avgTime: '2.5h', // Mock specific
        pending: Math.floor(currentChannel.decisions * 0.12),
        orphaned: 0
    } : (userRole === 'Admin' ? {
        decisions: MOCK_DECISION_METRICS.last7Days,
        avgTime: MOCK_DECISION_METRICS.avgValidationTime,
        pending: MOCK_DECISION_METRICS.pendingReview,
        orphaned: MOCK_DECISION_METRICS.withoutOwner
    } : {
        decisions: teamAggregates.decisions,
        avgTime: teamAggregates.avgValidationTime,
        pending: teamAggregates.pending,
        orphaned: teamAggregates.orphaned
    });

    // Mock Data for New Features
    const ALL_PERFORMANCE = [
        { name: "Elena Ross", metric: "12m avg", type: "top", label: "Top Performer" },
        { name: "Sarah Connor", metric: "18m avg", type: "top", label: "Consistent" },
        { name: "Mike Ross", metric: "4.2h avg", type: "blocker", label: "Bottleneck" },
    ];

    const ALL_STORIES = [
        { id: 1, text: "Elena unblocked #procurement in 2h", time: "10:30 AM", channel: "#procurement" },
        { id: 2, text: "David fast-tracked Q4 Budget", time: "Yesterday", channel: "#legal-approvals" },
        { id: 3, text: "Product Roadmap v2 approved", time: "2 days ago", channel: "#product-roadmap", team: "Engineering" },
    ];

    const ALL_ALERTS = [
        { id: 1, type: "high", text: "Recurrent friction in #legal-approvals", metric: "5 delays", channel: "#legal-approvals" },
        { id: 2, type: "medium", text: "Abnormal validation time > 4h", metric: "#engineering", channel: "#engineering" },
        { id: 3, type: "medium", text: "Specs validation pending > 48h", metric: "#product-roadmap", channel: "#product-roadmap" },
    ];

    // Apply Filters
    // 1. Filter by Scope (what user is ALLOWED to see)
    // 2. Filter by Selection (what user WANTS to see)

    const filterByScopeAndSelection = (items) => {
        return items.filter(item => {
            // First check if item belongs to an available channel/team
            const isInScope = availableChannels.some(c =>
                (item.channel && (c.name.includes(item.channel) || item.channel.includes(c.name))) ||
                (item.team && c.team.includes(item.team)) ||
                (userRole === 'Admin') // Admin sees everything by default if not strictly matched
            );

            if (!isInScope) return false;

            // Then check specific selection
            if (currentChannel) {
                return (item.channel && item.channel.includes(currentChannel.name)) ||
                    (item.text && item.text.includes(currentChannel.name));
            }
            return true;
        });
    };

    const filteredStories = filterByScopeAndSelection(ALL_STORIES);
    const filteredAlerts = filterByScopeAndSelection(ALL_ALERTS);
    const filteredPerformance = ALL_PERFORMANCE; // Performance might eventually need similar filtering

    const velocityData = currentChannel
        ? [15, 25, 10, 30, 45, 20, 35]
        : (userRole === 'Manager' ? [20, 30, 15, 40, 50, 25, 40] : [35, 45, 30, 60, 75, 50, 65]);

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <header className="flex justify-between items-end pb-4 border-b border-slate-200/60">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1 text-xs font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        System Operational • {userRole === 'Manager' ? 'Team View' : 'Global View'} • {currentChannel ? `Channel: ${currentChannel.name}` : 'All Channels'}
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    {/* Channel Filter */}
                    <div className="relative group">
                        <select
                            className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors bg-no-repeat"
                            value={selectedChannel}
                            onChange={(e) => setSelectedChannel(e.target.value)}
                        >
                            <option value="all">All Channels</option>
                            {availableChannels.map(channel => (
                                <option key={channel.id} value={channel.id}>
                                    {channel.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <Button variant="secondary" icon={Download}>Report</Button>
                </div>
            </header>

            {/* Row 1: Primary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 flex flex-col justify-between h-32 border-t-4 border-t-emerald-500" title="Total number of decisions detected across all monitored channels in the last 7 days.">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wide">Total Decisions</span>
                            <HelpCircle className="w-3 h-3 text-slate-300 hover:text-slate-500 cursor-help" title="Decisions are validated actions, approvals, or rejections detected in conversations." />
                        </div>
                        <Activity className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900 tracking-tight">{displayMetrics.decisions}</div>
                        <div className="text-xs text-slate-500 mt-1 font-medium">{currentChannel ? 'In selected channel' : 'Across monitored channels'}</div>
                    </div>
                </Card>
                <Card className="p-5 flex flex-col justify-between h-32 border-t-4 border-t-blue-500" title="Average time between a decision request and its validation.">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wide">Avg Validation Time</span>
                            <HelpCircle className="w-3 h-3 text-slate-300 hover:text-slate-500 cursor-help" title="Lower is better. Target: < 2h for critical decisions." />
                        </div>
                        <Clock className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900 tracking-tight">{displayMetrics.avgTime}</div>
                        <div className="text-xs text-slate-500 mt-1 font-medium">To final approval</div>
                    </div>
                </Card>
                <Card className="p-5 flex flex-col justify-between h-32 border-t-4 border-t-amber-500 bg-amber-50/10" title="Actions blocked or pending for more than 24h without resolution.">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold uppercase text-amber-600 tracking-wide">Frictions (Blocked)</span>
                            <HelpCircle className="w-3 h-3 text-amber-400 hover:text-amber-600 cursor-help" title="Frictions = Actions pending > 24h or explicitly rejected/blocked. Requires manual review." />
                        </div>
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900 tracking-tight">{displayMetrics.pending}</div>
                        <div className="text-xs text-amber-600 mt-1 font-medium flex items-center gap-1">
                            Action required
                        </div>
                    </div>
                </Card>
                <Card className="p-5 flex flex-col justify-between h-32 border-t-4 border-t-rose-500 bg-rose-50/10" title="Decisions with no assigned owner or owner has left the organization.">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold uppercase text-rose-600 tracking-wide">Orphaned Decisions</span>
                            <HelpCircle className="w-3 h-3 text-rose-400 hover:text-rose-600 cursor-help" title="Orphaned = Decision has no owner. Critical risk for compliance. Assign an owner immediately." />
                        </div>
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900 tracking-tight">{displayMetrics.orphaned}</div>
                        <div className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1">
                            Missing owner

                        </div>
                    </div>
                </Card>
            </div>

            {/* Row 2: Charts & Visuals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Evolution Curve */}
                <Card className="lg:col-span-2 p-5 flex flex-col h-64">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Decision Velocity (Trend)</h3>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 leading-tight">Daily decision volume. Higher bars indicate increased activity and processing speed.</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium h-fit">This Week</span>
                        </div>
                    </div>
                    <div className="flex-1 flex items-end justify-between px-2 gap-3 h-36">
                        {/* Simulated Bar Chart with CSS */}
                        {velocityData.map((h, i) => (
                            <div key={i} className="flex flex-col items-center gap-1 flex-1 group cursor-pointer h-full justify-end">
                                <div className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">{h}</div>
                                <div
                                    className="w-full max-w-8 bg-blue-200 hover:bg-blue-500 rounded-t transition-all duration-300 group-hover:shadow-lg"
                                    style={{ height: `${h}%`, minHeight: '4px' }}
                                ></div>
                                <div className="text-[10px] text-slate-400 font-mono mt-1">D{i + 1}</div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Heatmap (Friction) */}
                <Card className="p-5 flex flex-col h-64">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <Flame className="w-4 h-4 text-rose-500" />
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Friction Heatmap</h3>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 leading-tight max-w-xs">Visual overview of when bottlenecks occur most frequently during the week.</p>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-1 justify-center">
                        <div className="flex justify-between text-[9px] text-slate-400 px-1 font-mono uppercase">
                            <span>Morning</span>
                            <span>Noon</span>
                            <span>Evening</span>
                        </div>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                            <div key={day} className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 w-6">{day}</span>
                                <div className="flex-1 grid grid-cols-12 gap-0.5 h-6">
                                    {[...Array(12)].map((_, i) => {
                                        // Randomize intensity for demo
                                        const intensity = Math.random();
                                        const colorClass = intensity > 0.8 ? 'bg-rose-500' : intensity > 0.6 ? 'bg-amber-400' : 'bg-slate-100';
                                        return <div key={i} className={`rounded-sm ${colorClass} hover:opacity-80 transition-opacity`} title="Activity Level"></div>
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Row 3: Insights & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Active Alerts */}
                <Card className="p-0 overflow-hidden flex flex-col">
                    <div className="px-5 py-3 border-b border-slate-100 bg-rose-50/30 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-700" />
                                <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wide">Active Alerts</h3>
                            </div>
                            <p className="text-[10px] text-rose-600/80 mt-1 leading-tight">Real-time notifications of abnormal delays requiring attention.</p>
                        </div>
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold shrink-0 ml-2">{filteredAlerts.length} New</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {filteredAlerts.length > 0 ? (
                            filteredAlerts.map(alert => (
                                <div key={alert.id} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${alert.type === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>{alert.type}</span>
                                        <span className="text-[10px] font-mono text-slate-400">{alert.metric}</span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-800 mt-1">{alert.text}</p>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-slate-400 text-xs italic">
                                No active alerts for this view.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Performance Radar */}
                <Card className="p-0 overflow-hidden flex flex-col">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-500" />
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Team Performance</h3>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 leading-tight">Tracks average response times to identify bottlenecks.</p>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {filteredPerformance.map((user, idx) => (
                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-full ${user.type === 'top' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {user.type === 'top' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">{user.name}</div>
                                        <div className="text-[10px] text-slate-500">{user.label}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold font-mono text-slate-800">{user.metric}</div>
                                    <div className="text-[9px] text-slate-400 uppercase">Avg Time</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Success Stories */}
                <Card className="p-0 overflow-hidden flex flex-col bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
                    <div className="px-5 py-3 border-b border-blue-400/30 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-300" />
                                <h3 className="text-xs font-bold text-white uppercase tracking-wide">Success Spotlight</h3>
                            </div>
                            <p className="text-[10px] text-blue-100 mt-1 leading-tight">Highlighting quick wins and resolved blockers.</p>
                        </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col gap-4">
                        {filteredStories.length > 0 ? (
                            filteredStories.map(story => (
                                <div key={story.id} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                                    <p className="text-sm font-medium leading-relaxed">
                                        "{story.text}"
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 opacity-70">
                                        <Clock className="w-3 h-3" />
                                        <span className="text-[10px]">{story.time}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-white/50 text-xs italic py-4">
                                No spotlight stories for this channel yet.
                            </div>
                        )}
                        <Button variant="secondary" className="mt-auto w-full text-xs bg-white/10 border-white/20 text-white hover:bg-white/20">
                            View All Wins
                        </Button>
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default Dashboard;
