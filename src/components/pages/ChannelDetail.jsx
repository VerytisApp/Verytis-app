import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Clock, Download, CheckCircle, GitCommit, UserPlus, FileText } from 'lucide-react';
import { Card, Button, StatusBadge, PlatformIcon } from '../ui';
import { MOCK_CHANNELS, MOCK_USERS, MOCK_RECENT_DECISIONS, MOCK_CHANNEL_ACTIVITY, MOCK_TEAMS } from '../../data/mockData';

const ChannelDetail = ({ userRole }) => {
    const { channelId } = useParams();
    const navigate = useNavigate();
    const channel = MOCK_CHANNELS.find(c => c.id.toString() === channelId);
    // Find parent team to check scopes
    const parentTeam = channel ? MOCK_TEAMS.find(t => t.name === channel.team) : null;

    // Permission checks
    const showScope = userRole !== 'Member';
    // Manager needs 'export' scope enabled on the team to see Export button
    const canExport = userRole === 'Admin' || (userRole === 'Manager' && parentTeam?.scopes?.includes('export'));

    const getActivityIcon = (iconType) => {
        switch (iconType) {
            case 'CheckCircle': return CheckCircle;
            case 'GitCommit': return GitCommit;
            case 'UserPlus': return UserPlus;
            case 'FileText': return FileText;
            default: return CheckCircle;
        }
    };

    if (!channel) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">Channel not found</p>
                <Link to="/channels" className="text-indigo-600 hover:underline mt-2 inline-block">Back to Channels</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <Link to="/channels" className="cursor-pointer hover:text-slate-900 transition-colors">Channels</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-900">{channel.name}</span>
                </div>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{channel.name}</h1>
                            <PlatformIcon platform={channel.platform} />
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-fit shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Team</span>
                                <span className="text-xs font-semibold text-slate-700">{channel.team}</span>
                            </div>
                            {showScope && (
                                <>
                                    <div className="w-px h-3 bg-slate-300"></div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Scope</span>
                                        <span className="text-xs font-semibold text-slate-700">{channel.scope}</span>
                                    </div>
                                </>
                            )}
                            <div className="w-px h-3 bg-slate-300"></div>
                            <StatusBadge status={channel.status} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" icon={Clock} onClick={() => navigate(`/timeline/${channel.id}`)}>View Timeline</Button>
                        {canExport && <Button variant="secondary" icon={Download}>Export</Button>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 bg-slate-50/50 border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Decisions</span>
                    <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{channel.decisions}</div>
                    <span className="text-[10px] text-slate-400 font-medium">Total logged</span>
                </Card>
                <Card className="p-4 bg-slate-50/50 border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Members</span>
                    <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{channel.members}</div>
                    <span className="text-[10px] text-slate-400 font-medium">Active participants</span>
                </Card>
                <Card className="p-4 bg-slate-50/50 border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Visibility</span>
                    <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{channel.type}</div>
                    <span className="text-[10px] text-slate-400 font-medium">Access level</span>
                </Card>
                <Card className="p-4 bg-slate-50/50 border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Created</span>
                    <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">240d</div>
                    <span className="text-[10px] text-slate-400 font-medium">Ago</span>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">Recent Decisions</h3>
                        <Card className="overflow-hidden border-slate-200">
                            <table className="w-full text-xs text-left">
                                <tbody className="divide-y divide-slate-100">
                                    {MOCK_RECENT_DECISIONS.map(decision => (
                                        <tr key={decision.id} className="hover:bg-slate-50/50">
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-slate-900">{decision.title}</div>
                                                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                                                    {decision.date}
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span className="text-slate-400 font-medium">{decision.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <StatusBadge status={decision.status} />
                                            </td>
                                            <td className="px-5 py-3.5 text-right w-12">
                                                <div className="inline-flex w-6 h-6 rounded-full bg-slate-100 items-center justify-center text-[9px] font-bold text-slate-500 border border-slate-200">
                                                    {decision.author}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">Activity Stream</h3>
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="space-y-5 relative">
                                <div className="absolute left-2.5 top-2 bottom-2 w-px bg-slate-100"></div>
                                {MOCK_CHANNEL_ACTIVITY.map(activity => {
                                    const IconComponent = getActivityIcon(activity.iconType);
                                    return (
                                        <div key={activity.id} className="relative pl-9 flex items-start justify-between group">
                                            <div className="absolute left-0 top-0.5 w-5 h-5 flex items-center justify-center bg-white border border-slate-200 rounded-full shadow-sm z-10 group-hover:border-indigo-300 transition-colors">
                                                <IconComponent className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-900">{activity.text}</p>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-mono">{activity.time}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">Participants</h3>
                    <Card className="p-0 border-slate-200">
                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                            {MOCK_USERS.map(user => (
                                <div key={user.id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg transition-colors">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">{user.initials}</div>
                                    <div className="overflow-hidden">
                                        <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                                        <div className="text-[10px] text-slate-400 truncate font-medium">{user.role}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-slate-100 p-3 text-center bg-slate-50/50">
                            <span className="text-[10px] font-bold text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors uppercase tracking-wide">View All {channel.members} Members</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ChannelDetail;
