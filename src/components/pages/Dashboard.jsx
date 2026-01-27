import {
    Activity, AlertCircle, AlertTriangle, ArrowUpRight, Clock, Download,
    FileText, Mail, MessageSquare, RefreshCw, Shield, Zap, Hash
} from 'lucide-react';
import { Card, Button } from '../ui';
import { MOCK_DECISION_METRICS, MOCK_RISK_METRICS, MOCK_TIMELINE_EVENTS } from '../../data/mockData';

const Dashboard = ({ navigate }) => (
    <div className="space-y-8 animate-in fade-in duration-300">
        <header className="flex justify-between items-end pb-4 border-b border-slate-200/60">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                <p className="text-slate-500 mt-1 text-xs font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    System Operational • Last synced 2 mins ago
                </p>
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" icon={Download}>Report</Button>
                <Button variant="primary" icon={RefreshCw}>Sync Now</Button>
            </div>
        </header>

        {/* Section: Decision Health */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-400" />
                    Decision Velocity
                </h3>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">Last 7 Days</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 flex flex-col justify-between h-32 border-t-4 border-t-emerald-500">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wide">Total Decisions</span>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900 tracking-tight">{MOCK_DECISION_METRICS.last7Days}</div>
                        <div className="text-xs text-slate-500 mt-1 font-medium">Across all channels</div>
                    </div>
                </Card>
                <Card className="p-5 flex flex-col justify-between h-32 border-t-4 border-t-amber-400">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wide">Pending</span>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900 tracking-tight">{MOCK_DECISION_METRICS.pendingReview}</div>
                        <div className="text-xs text-amber-600 mt-1 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Action required
                        </div>
                    </div>
                </Card>
                <Card className="p-5 flex flex-col justify-between h-32 border-t-4 border-t-blue-500">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wide">Avg Time</span>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900 tracking-tight">{MOCK_DECISION_METRICS.avgValidationTime}</div>
                        <div className="text-xs text-slate-500 mt-1 font-medium">To validation</div>
                    </div>
                </Card>
                <Card className="p-5 flex flex-col justify-between h-32 border-t-4 border-t-rose-500 bg-rose-50/10">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold uppercase text-rose-600 tracking-wide">Orphaned</span>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900 tracking-tight">{MOCK_DECISION_METRICS.withoutOwner}</div>
                        <div className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Missing owner
                        </div>
                    </div>
                </Card>
            </div>
        </div>

        {/* Section: Risk & Compliance */}
        <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" />
                Risk Monitor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-4 hover:border-amber-300 transition-colors cursor-pointer group">
                    <div className="p-2 bg-amber-50 rounded-lg border border-amber-100 text-amber-600 group-hover:bg-amber-100 transition-colors">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-slate-900 leading-none">{MOCK_RISK_METRICS.missingMarkers}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1">Missing Markers</div>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 hover:border-slate-300 transition-colors cursor-pointer">
                    <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 text-slate-600">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-slate-900 leading-none">{MOCK_RISK_METRICS.noFollowUp}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1">Stale Decisions</div>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 hover:border-slate-300 transition-colors cursor-pointer">
                    <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 text-slate-600">
                        <Hash className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-slate-900 leading-none">{MOCK_RISK_METRICS.inactiveWithProjects}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1">Ghost Channels</div>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 hover:border-slate-300 transition-colors cursor-pointer">
                    <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 text-slate-600">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-slate-900 leading-none">{MOCK_RISK_METRICS.emailDelayAggregated}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1">Response Lag</div>
                    </div>
                </Card>
            </div>
        </div>

        {/* Section: Activity & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 overflow-hidden flex flex-col border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Recent Activity Feed</h3>
                    </div>
                    <Button variant="ghost" onClick={() => navigate('timeline')} className="text-[10px] h-6 px-2 text-slate-500">
                        View Full Timeline <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Event</th>
                                <th className="px-6 py-3 text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {MOCK_TIMELINE_EVENTS.slice(0, 3).map(event => (
                                <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 w-24">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border ${event.type === 'decision' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            {event.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="font-bold text-slate-900">{event.action}</div>
                                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                            <span className="font-medium text-slate-600">{event.target}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span>{event.channelName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right text-slate-400 font-mono">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="flex flex-col gap-6">
                <Card className="p-5 flex flex-col bg-white">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Quick Actions
                    </h3>
                    <div className="space-y-2 flex-1">
                        <button className="w-full text-left px-4 py-3 rounded-lg bg-slate-50 hover:bg-white hover:shadow-sm hover:border-slate-300 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-3 transition-all duration-200 group">
                            <div className="p-1.5 bg-white rounded border border-slate-200 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors">
                                <FileText className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                            </div>
                            <span>Generate Audit Report</span>
                        </button>
                        <button onClick={() => navigate('email_audit')} className="w-full text-left px-4 py-3 rounded-lg bg-slate-50 hover:bg-white hover:shadow-sm hover:border-slate-300 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-3 transition-all duration-200 group">
                            <div className="p-1.5 bg-white rounded border border-slate-200 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors">
                                <Mail className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                            </div>
                            <span>Review Email Metadata</span>
                        </button>
                    </div>
                </Card>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white shadow-lg">
                    <h4 className="text-sm font-bold mb-2">Governance Status</h4>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[92%]"></div>
                        </div>
                        <span className="text-xs font-mono text-emerald-400">92%</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        Your organization is currently compliant with internal decision logging policies.
                    </p>
                </div>
            </div>
        </div>
    </div>
);

export default Dashboard;
