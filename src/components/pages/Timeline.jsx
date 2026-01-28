import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Activity, CheckCircle, Settings, FileText, UserPlus, FilterX } from 'lucide-react';
import { Card, Button, PlatformIcon } from '../ui';
import { MOCK_CHANNELS, MOCK_TIMELINE_EVENTS, MOCK_TEAMS } from '../../data/mockData';

const Timeline = ({ userRole }) => {
    const { channelId } = useParams();
    const navigate = useNavigate();
    const [selectedChannelId, setSelectedChannelId] = useState(channelId || null);
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        setSelectedChannelId(channelId || null);
    }, [channelId]);

    // Role-based logic helpers
    const canViewScope = userRole !== 'Member';

    // Simulate channel filtering for Members (e.g., they only see channels they are part of)
    // For mock purposes, we'll just show all, relying on the 'Scope' visibility restriction as the main requested feature.
    // If strict channel filtering is needed: const visibleChannels = userRole === 'Member' ? MOCK_CHANNELS.slice(0, 2) : MOCK_CHANNELS;
    const visibleChannels = MOCK_CHANNELS;

    // STATE: Selection Screen
    if (!selectedChannelId) {
        return (
            <div className="space-y-8 animate-in fade-in duration-300">
                <header className="text-center max-w-2xl mx-auto py-16">
                    <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Activity className="w-7 h-7 text-slate-400" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Select Audit Context</h1>
                    <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">Choose a channel to inspect its chronological event stream and decision history.</p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto px-4">
                    {visibleChannels.map(channel => (
                        <Card
                            key={channel.id}
                            onClick={() => navigate(`/timeline/${channel.id}`)}
                            className="p-5 hover:border-indigo-300 hover:shadow-lg transition-all group relative overflow-hidden cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                        <PlatformIcon platform={channel.platform} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-slate-900 text-sm truncate">{channel.name}</h3>
                                        <p className="text-[10px] text-slate-500 truncate font-medium">{channel.team}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
                                {canViewScope && (
                                    <>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Scope</span>
                                            <span className="text-[10px] font-bold text-slate-700">{channel.scope}</span>
                                        </div>
                                        <div className="w-px h-6 bg-slate-100 mx-auto"></div>
                                    </>
                                )}
                                <div className="flex flex-col text-right ml-auto">
                                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Last Active</span>
                                    <span className="text-[10px] font-bold text-slate-700">{new Date(channel.lastActive).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // STATE: Timeline View
    const selectedChannel = MOCK_CHANNELS.find(c => c.id.toString() === selectedChannelId.toString());
    const parentTeam = selectedChannel ? MOCK_TEAMS.find(t => t.name === selectedChannel.team) : null;

    // Export permission logic
    // Admin: Always allow
    // Manager: Allow only if their team has 'export' scope
    // Member: Never allow
    const canExport = userRole === 'Admin' || (userRole === 'Manager' && parentTeam?.scopes?.includes('export'));

    const filteredEvents = MOCK_TIMELINE_EVENTS.filter(event => {
        if (event.channelId.toString() !== selectedChannelId.toString()) return false;
        if (filterType !== 'all') {
            if (filterType === 'decisions' && event.type !== 'decision') return false;
            if (filterType === 'system' && !['system', 'doc_metadata', 'member'].includes(event.type)) return false;
        }
        return true;
    });

    const groupedEvents = filteredEvents.reduce((groups, event) => {
        const date = new Date(event.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
        if (!groups[date]) groups[date] = [];
        groups[date].push(event);
        return groups;
    }, {});

    const getEventIcon = (type) => {
        switch (type) {
            case 'decision': return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
            case 'system': return <Settings className="w-3.5 h-3.5 text-slate-500" />;
            case 'doc_metadata': return <FileText className="w-3.5 h-3.5 text-blue-500" />;
            case 'member': return <UserPlus className="w-3.5 h-3.5 text-indigo-500" />;
            default: return <Activity className="w-3.5 h-3.5 text-slate-400" />;
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <header className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/timeline')}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors border border-transparent hover:border-slate-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold tracking-tight text-slate-900">{selectedChannel?.name}</h1>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                {selectedChannel?.platform}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-medium">
                            <span>{selectedChannel?.team}</span>
                            {canViewScope && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span>{selectedChannel?.scope}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5 cursor-pointer hover:bg-slate-50 shadow-sm"
                    >
                        <option value="all">All Events</option>
                        <option value="decisions">Decisions Only</option>
                        <option value="system">System & Meta</option>
                    </select>
                    {canExport && <Button variant="secondary" icon={Download} className="text-xs">Export</Button>}
                </div>
            </header>

            <div className="relative min-h-[400px] pt-4">
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-200" />

                {Object.keys(groupedEvents).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                            <FilterX className="w-6 h-6 opacity-50" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wide">No events found for this filter</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedEvents).map(([date, events]) => (
                            <div key={date}>
                                <div className="flex items-center gap-4 mb-4 sticky top-0 bg-[#FAFAFA] z-10 py-2">
                                    <div className="w-[10px]"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">{date}</span>
                                </div>
                                <div className="space-y-3">
                                    {events.map(event => (
                                        <div key={event.id} className="relative pl-10 group">
                                            <div className="absolute left-3 top-3.5 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm z-10 group-hover:border-slate-400 transition-colors">
                                                {getEventIcon(event.type)}
                                            </div>
                                            <Card className="p-3 hover:shadow-md transition-shadow group-hover:border-slate-300">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-slate-900 text-xs">{event.action}</span>
                                                            <span className="text-[10px] text-slate-400">•</span>
                                                            <span className="text-xs text-slate-600 font-medium">{event.target}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                            <span className="font-semibold text-slate-700">{event.actor}</span>
                                                            <span className="text-slate-300">|</span>
                                                            <span className="font-medium">{event.role}</span>
                                                            {event.meta && (
                                                                <>
                                                                    <span className="text-slate-300">|</span>
                                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-600 border border-slate-200">
                                                                        {event.meta}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Timeline;
