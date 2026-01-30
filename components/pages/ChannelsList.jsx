'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, ChevronRight, X, MoreVertical, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { Card, Button, StatusBadge, PlatformIcon, Modal } from '../ui';
import { MOCK_CHANNELS, MOCK_TEAMS } from '../../data/mockData';

const ChannelsList = ({ userRole }) => {
    const [channels] = useState(MOCK_CHANNELS);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ platform: '', status: '' });

    // Modal State
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [manageTeamsModal, setManageTeamsModal] = useState({ isOpen: false, channel: null });
    const [newChannelData, setNewChannelData] = useState({ name: '', teamId: '' });

    // Dropdown State
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showFilters && !event.target.closest('.filter-menu')) {
                setShowFilters(false);
            }
            if (activeDropdown && !event.target.closest('.action-menu')) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showFilters, activeDropdown]);

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

    // Derived state for available teams based on role
    const availableTeams = userRole === 'Admin' ? MOCK_TEAMS : MOCK_TEAMS.slice(0, 1);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Channels</h1>
                    <p className="text-slate-500 mt-1 text-xs font-medium">Manage authorized communication channels.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search channels..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                        />
                    </div>
                    <div className="relative filter-menu">
                        <Button
                            variant="secondary"
                            icon={Filter}
                            onClick={(e) => { e.stopPropagation(); setShowFilters(!showFilters); }}
                            className={activeFilterCount > 0 ? 'border-blue-300 bg-blue-50' : ''}
                        >
                            Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
                        </Button>
                        {showFilters && (
                            <div className="absolute right-0 top-11 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Filters</span>
                                    {activeFilterCount > 0 && (
                                        <button onClick={clearFilters} className="text-[10px] text-blue-600 hover:underline font-medium">Clear All</button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Platform</label>
                                        <select
                                            value={filters.platform}
                                            onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
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
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
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
                    {userRole !== 'Member' && (
                        <Button variant="primary" icon={Plus} onClick={() => setIsLinkModalOpen(true)}>Add Channel</Button>
                    )}
                </div>
            </header>

            {/* Active Filters Tags */}
            {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Active Filters:</span>
                    {filters.platform && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-medium border border-blue-100">
                            Platform: <span className="capitalize">{filters.platform}</span>
                            <button onClick={() => setFilters({ ...filters, platform: '' })} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                        </span>
                    )}
                    {filters.status && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-medium border border-blue-100">
                            Status: <span className="capitalize">{filters.status}</span>
                            <button onClick={() => setFilters({ ...filters, status: '' })} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
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
                            {userRole === 'Admin' && <th className="px-6 py-3 text-right uppercase tracking-wide">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredChannels.length > 0 ? filteredChannels.map(channel => (
                            <tr key={channel.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <Link href={`/channels/${channel.id}`} className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
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
                                {userRole === 'Admin' && (
                                    <td className="px-6 py-4 text-right relative action-menu">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDropdown(activeDropdown === channel.id ? null : channel.id);
                                            }}
                                            className={`p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ${activeDropdown === channel.id ? 'bg-slate-100 text-slate-900' : ''}`}
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                        {activeDropdown === channel.id && (
                                            <div className="absolute right-8 top-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                                <div className="py-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setManageTeamsModal({ isOpen: true, channel });
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                    >
                                                        <Users className="w-3.5 h-3.5 text-slate-400" /> Assign to Teams
                                                    </button>
                                                    <div className="h-px bg-slate-100 my-1"></div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Delete logic (mock)
                                                            // In a real app, we would call an API here
                                                            console.log('Deleting channel', channel.id);
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete Channel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={userRole === 'Admin' ? "6" : "5"} className="px-6 py-12 text-center">
                                    <div className="text-slate-400 text-sm">No channels match your filters.</div>
                                    <button onClick={clearFilters} className="text-blue-600 text-xs mt-2 hover:underline font-medium">Clear Filters</button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>

            <Modal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                title="Link New Channel"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Channel Name or Link</label>
                        <input
                            type="text"
                            placeholder="#general or https://..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                            value={newChannelData.name}
                            onChange={(e) => setNewChannelData({ ...newChannelData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Assign to Team</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                            value={newChannelData.teamId}
                            onChange={(e) => setNewChannelData({ ...newChannelData, teamId: e.target.value })}
                        >
                            <option value="">Select a team...</option>
                            {availableTeams.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-500 mt-1">
                            {userRole === 'Manager'
                                ? "You can only link channels to teams you manage."
                                : "Admins can link channels to any team."}
                        </p>
                    </div>
                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="ghost" onClick={() => setIsLinkModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={() => setIsLinkModalOpen(false)} disabled={!newChannelData.name || !newChannelData.teamId}>Link Channel</Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={manageTeamsModal.isOpen}
                onClose={() => setManageTeamsModal({ isOpen: false, channel: null })}
                title={manageTeamsModal.channel ? `Manage Teams: ${manageTeamsModal.channel.name}` : 'Manage Teams'}
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">Select which teams this channel is assigned to.</p>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto border border-slate-200 rounded-md">
                        {MOCK_TEAMS.map(team => {
                            // Mock logic: Check if channel.team string matches or if we had a list. 
                            // Since mock data is simple (string), we simplistically check basic string match for now.
                            // In a real app with M-to-N, we would check array inclusion.
                            // Here we just let UI toggle (visual only since no backend).
                            const isAssigned = manageTeamsModal.channel?.team === team.name;
                            return (
                                <label key={team.id} className={`flex items-center justify-between p-3 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 ${isAssigned ? 'bg-blue-50/50' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            defaultChecked={isAssigned}
                                        />
                                        <div>
                                            <div className="text-xs font-bold text-slate-900">{team.name}</div>
                                            <div className="text-[10px] text-slate-500">{team.description}</div>
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="ghost" onClick={() => setManageTeamsModal({ isOpen: false, channel: null })}>Cancel</Button>
                        <Button variant="primary" onClick={() => setManageTeamsModal({ isOpen: false, channel: null })}>Save Changes</Button>
                    </div>
                </div>
            </Modal>
        </div >
    );
};

export default ChannelsList;

