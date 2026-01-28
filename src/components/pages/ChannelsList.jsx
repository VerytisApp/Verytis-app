import { useState, useEffect } from 'react';
import { Search, Filter, Plus, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Button, StatusBadge, PlatformIcon } from '../ui';
import { MOCK_CHANNELS } from '../../data/mockData';

const ChannelsList = () => {
    const [channels] = useState(MOCK_CHANNELS);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ platform: '', status: '' });

    // Close filter dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showFilters && !event.target.closest('.filter-menu')) {
                setShowFilters(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showFilters]);

    // Filter logic
    const filteredChannels = channels.filter(channel => {
        const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlatform = filters.platform === '' || channel.platform === filters.platform;
        const matchesStatus = filters.status === '' || channel.status === filters.status;
        return matchesSearch && matchesPlatform && matchesStatus;
    });

    const activeFilterCount = (filters.platform ? 1 : 0) + (filters.status ? 1 : 0);

    const clearFilters = () => {
        setFilters({ platform: '', status: '' });
    };

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
                            placeholder="Search channels..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                        />
                    </div>
                    <div className="relative filter-menu">
                        <Button
                            variant="secondary"
                            icon={Filter}
                            onClick={(e) => { e.stopPropagation(); setShowFilters(!showFilters); }}
                            className={activeFilterCount > 0 ? 'border-indigo-300 bg-indigo-50' : ''}
                        >
                            Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
                        </Button>
                        {showFilters && (
                            <div className="absolute right-0 top-11 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Filters</span>
                                    {activeFilterCount > 0 && (
                                        <button onClick={clearFilters} className="text-[10px] text-indigo-600 hover:underline font-medium">Clear All</button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Platform</label>
                                        <select
                                            value={filters.platform}
                                            onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                                        >
                                            <option value="">All Platforms</option>
                                            <option value="slack">Slack</option>
                                            <option value="teams">Microsoft Teams</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Status</label>
                                        <select
                                            value={filters.status}
                                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="active">Active</option>
                                            <option value="paused">Paused</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100">
                                    <Button variant="primary" className="w-full h-8" onClick={() => setShowFilters(false)}>Apply Filters</Button>
                                </div>
                            </div>
                        )}
                    </div>
                    <Button variant="primary" icon={Plus}>Add Channel</Button>
                </div>
            </header>

            {/* Active Filters Tags */}
            {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Active Filters:</span>
                    {filters.platform && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-medium border border-indigo-100">
                            Platform: <span className="capitalize">{filters.platform}</span>
                            <button onClick={() => setFilters({ ...filters, platform: '' })} className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
                        </span>
                    )}
                    {filters.status && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-medium border border-indigo-100">
                            Status: <span className="capitalize">{filters.status}</span>
                            <button onClick={() => setFilters({ ...filters, status: '' })} className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
                        </span>
                    )}
                </div>
            )}

            <Card className="overflow-visible shadow-sm">
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
                        {filteredChannels.length > 0 ? filteredChannels.map(channel => (
                            <tr key={channel.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <Link to={`/channels/${channel.id}`} className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                        {channel.name}
                                    </Link>
                                </td>
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
                                <td className="px-6 py-4 text-right">
                                    <Link to={`/channels/${channel.id}`} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded transition-colors inline-block">
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center">
                                    <div className="text-slate-400 text-sm">No channels match your filters.</div>
                                    <button onClick={clearFilters} className="text-indigo-600 text-xs mt-2 hover:underline font-medium">Clear Filters</button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default ChannelsList;

