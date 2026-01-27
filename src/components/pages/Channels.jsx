import { useState } from 'react';
import { Search, Filter, Plus, ChevronRight, Clock, Download, CheckCircle, GitCommit, UserPlus, FileText } from 'lucide-react';
import { Card, Button, StatusBadge, PlatformIcon } from '../ui';
import { MOCK_CHANNELS, MOCK_USERS, MOCK_RECENT_DECISIONS, MOCK_CHANNEL_ACTIVITY } from '../../data/mockData';

const Channels = ({ navigate }) => {
    const [view, setView] = useState('list');
    const [selectedChannel, setSelectedChannel] = useState(null);

    const openChannelDetail = (channel) => {
        setSelectedChannel(channel);
        setView('detail');
    };

    const backToChannelsList = () => {
        setSelectedChannel(null);
        setView('list');
    };

    const getActivityIcon = (iconType) => {
        switch (iconType) {
            case 'CheckCircle': return CheckCircle;
            case 'GitCommit': return GitCommit;
            case 'UserPlus': return UserPlus;
            case 'FileText': return FileText;
            default: return CheckCircle;
        }
    };

    if (view === 'list') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Channels</h1>
                        <p className="text-slate-500 mt-1 text-xs font-medium">Manage authorized communication channels.</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                            />
                        </div>
                        <Button variant="secondary" icon={Filter}>Filter</Button>
                        <Button variant="primary" icon={Plus}>Add Channel</Button>
                    </div>
                </header>
                <Card className="overflow-hidden shadow-sm">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 uppercase tracking-wide">Name</th>
                                <th className="px-6 py-3 uppercase tracking-wide">Platform</th>
                                <th className="px-6 py-3 uppercase tracking-wide">Status</th>
                                <th className="px-6 py-3 uppercase tracking-wide">Decisions</th>
                                <th className="px-6 py-3 uppercase tracking-wide">Last Activity</th>
                                <th className="px-6 py-3 text-right uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {MOCK_CHANNELS.map(channel => (
                                <tr key={channel.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => openChannelDetail(channel)}>
                                    <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{channel.name}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <PlatformIcon platform={channel.platform} />
                                            <span className="capitalize text-slate-600 font-medium">{channel.platform}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={channel.status} />
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-mono">{channel.decisions}</td>
                                    <td className="px-6 py-4 text-slate-500">{new Date(channel.lastActive).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <button className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded transition-colors">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        );
    }

    if (view === 'detail' && selectedChannel) {
        return (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <span className="cursor-pointer hover:text-slate-900 transition-colors" onClick={backToChannelsList}>Channels</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-slate-900">{selectedChannel.name}</span>
                    </div>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{selectedChannel.name}</h1>
                                <PlatformIcon platform={selectedChannel.platform} />
                            </div>

                            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-fit shadow-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Team</span>
                                    <span className="text-xs font-semibold text-slate-700">{selectedChannel.team}</span>
                                </div>
                                <div className="w-px h-3 bg-slate-300"></div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Scope</span>
                                    <span className="text-xs font-semibold text-slate-700">{selectedChannel.scope}</span>
                                </div>
                                <div className="w-px h-3 bg-slate-300"></div>
                                <StatusBadge status={selectedChannel.status} />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" icon={Clock} onClick={() => navigate('timeline', { channelId: selectedChannel.id })}>View Timeline</Button>
                            <Button variant="secondary" icon={Download}>Export</Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <Card className="p-4 bg-slate-50/50 border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Decisions</span>
                        <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{selectedChannel.decisions}</div>
                        <span className="text-[10px] text-slate-400 font-medium">Total logged</span>
                    </Card>
                    <Card className="p-4 bg-slate-50/50 border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Members</span>
                        <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{selectedChannel.members}</div>
                        <span className="text-[10px] text-slate-400 font-medium">Active participants</span>
                    </Card>
                    <Card className="p-4 bg-slate-50/50 border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Visibility</span>
                        <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{selectedChannel.type}</div>
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
                                <span className="text-[10px] font-bold text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors uppercase tracking-wide">View All {selectedChannel.members} Members</span>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default Channels;
