'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, Download, CheckCircle, GitCommit, UserPlus, FileText } from 'lucide-react';
import { Card, Button, StatusBadge, PlatformIcon } from '../ui';
import { MOCK_CHANNELS, MOCK_USERS, MOCK_RECENT_DECISIONS, MOCK_CHANNEL_ACTIVITY, MOCK_TEAMS } from '../../data/mockData';

const ChannelDetail = ({ userRole }) => {
    const { channelId } = useParams();
    const router = useRouter();

    // State for real data
    const [channel, setChannel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    useEffect(() => {
        const fetchChannel = async () => {
            // Initialize Supabase
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            // Simple fetch via REST if we don't have client imported. 
            // Or better: Use the endpoint we created? No, we created /list.
            // Let's use the same trick: /api/resources/list but filter? 
            // No, let's just use a direct query via a new helper or just fetch all and find. 
            // Fetching all is inefficient ID lookup. 

            // Allow mock ID lookup first (for legacy mocks if any)
            const mock = MOCK_CHANNELS.find(c => c.id.toString() === channelId);
            if (mock) {
                setChannel(mock);
                setLoading(false);
                return;
            }

            // Fetch from API (we will create a dedicated endpoint or just list and find for now)
            // For urgency, I will use /api/resources/list and find. 
            // It's not optimal but it works without new backend code immediately.
            try {
                const res = await fetch('/api/resources/list');
                if (res.ok) {
                    const data = await res.json();
                    const found = data.resources.find(r => r.id === channelId);
                    if (found) {
                        // Use real data from API
                        setChannel({
                            ...found,
                            team: 'General', // Default
                            scope: 'Global',
                            members: found.numMembers || 0, // Real member count from Slack
                            type: found.isPrivate ? 'Private' : 'Public',
                            description: 'Imported channel',
                            platform: found.platform || 'slack',
                            status: 'active'
                        });
                    }
                }
            } catch (e) {
                console.error("Error fetching channel detail", e);
            } finally {
                setLoading(false);
            }
        };
        fetchChannel();
    }, [channelId]);

    // Fetch members when channel is loaded (and it's a real channel, not mock)
    useEffect(() => {
        const fetchMembers = async () => {
            if (!channel || !channelId || channelId.length < 30) return; // Skip if mock ID (short)

            setLoadingMembers(true);
            try {
                const res = await fetch(`/api/slack/channel-members/${channelId}`);
                if (res.ok) {
                    const data = await res.json();
                    setMembers(data.members || []);
                }
            } catch (e) {
                console.error('Error fetching members:', e);
            } finally {
                setLoadingMembers(false);
            }
        };
        fetchMembers();
    }, [channel, channelId]);

    // State for activities
    const [activities, setActivities] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(false);

    // Fetch activities when channel is loaded
    useEffect(() => {
        const fetchActivities = async () => {
            if (!channelId || channelId.length < 30) return; // Skip mock IDs

            setLoadingActivities(true);
            try {
                const res = await fetch(`/api/activity?channelId=${channelId}`);
                if (res.ok) {
                    const data = await res.json();
                    setActivities(data.events || []);
                }
            } catch (e) {
                console.error('Error fetching activities:', e);
            } finally {
                setLoadingActivities(false);
            }
        };
        fetchActivities();
    }, [channelId]);

    // Find parent team to check scopes (Mock logic mostly)
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

    if (loading) {
        return <div className="p-12 text-center text-slate-500">Loading channel details...</div>;
    }

    if (!channel) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">Channel not found</p>
                <Link href="/channels" className="text-blue-600 hover:underline mt-2 inline-block">Back to Channels</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <Link href="/channels" className="cursor-pointer hover:text-slate-900 transition-colors">Channels</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-900">{channel.name}</span>
                </div>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{channel.name}</h1>
                            <img
                                src={`https://www.google.com/s2/favicons?domain=${channel.platform}.com&sz=32`}
                                alt={channel.platform}
                                className="w-6 h-6 rounded"
                            />
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
                        <Button variant="secondary" icon={Clock} onClick={() => router.push(`/timeline/${channel.id}`)}>View Timeline</Button>
                        {canExport && <Button variant="secondary" icon={Download}>Export</Button>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 bg-slate-50/50 border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Decisions</span>
                    <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                        {activities.filter(a => a.type === 'decision').length}
                    </div>
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
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                            Recent Decisions ({activities.filter(a => a.type === 'decision').length})
                        </h3>
                        <Card className="overflow-hidden border-slate-200">
                            {loadingActivities ? (
                                <div className="p-6 text-center">
                                    <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                                </div>
                            ) : activities.filter(a => a.type === 'decision').length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {activities.filter(a => a.type === 'decision').slice(0, 5).map(activity => (
                                        <div key={activity.id} className="p-3 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-slate-900">{activity.action}</div>
                                                    <div className="text-[10px] text-slate-500 truncate">{activity.target}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-medium text-slate-600">{activity.actor}</div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    No decisions logged yet.
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                            Activity Stream ({activities.length})
                        </h3>
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            {loadingActivities ? (
                                <div className="p-6 text-center">
                                    <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                                </div>
                            ) : activities.length > 0 ? (
                                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                                    {activities.slice(0, 10).map(activity => (
                                        <div key={activity.id} className="p-3 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${activity.type === 'decision' ? 'bg-emerald-50' :
                                                    activity.type === 'file' ? 'bg-orange-50' :
                                                        activity.type === 'comment' ? 'bg-blue-50' : 'bg-slate-100'
                                                    }`}>
                                                    {activity.type === 'decision' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                                    {activity.type === 'file' && <FileText className="w-3.5 h-3.5 text-orange-500" />}
                                                    {activity.type === 'comment' && <GitCommit className="w-3.5 h-3.5 text-blue-500" />}
                                                    {activity.type === 'system' && <UserPlus className="w-3.5 h-3.5 text-slate-500" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[11px] font-bold text-slate-800">{activity.action}</div>
                                                    <div className="text-[10px] text-slate-500 truncate">{activity.target}</div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-[10px] font-medium text-slate-600">{activity.actor}</div>
                                                    <div className="text-[9px] text-slate-400">
                                                        {new Date(activity.timestamp).toLocaleString([], {
                                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 text-sm py-8">
                                    No activity recorded yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                        Participants ({channel.members})
                    </h3>
                    <Card className="p-0 border-slate-200">
                        {loadingMembers ? (
                            <div className="p-6 text-center">
                                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                <p className="text-xs text-slate-400">Loading members...</p>
                            </div>
                        ) : members.length > 0 ? (
                            <>
                                <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                                    {members.map(member => (
                                        <div key={member.id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg transition-colors">
                                            {member.avatar ? (
                                                <img
                                                    src={member.avatar}
                                                    alt={member.name}
                                                    className="w-8 h-8 rounded-full border border-slate-200"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                                                    {member.initials}
                                                </div>
                                            )}
                                            <div className="overflow-hidden flex-1">
                                                <div className="text-xs font-bold text-slate-900 truncate">{member.name}</div>
                                                <div className="text-[10px] text-slate-400 truncate font-medium">
                                                    {member.title || 'Team Member'}
                                                </div>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${member.isConnected
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                                                }`}>
                                                {member.isConnected ? 'Connected' : 'Not connected'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {channel.members > members.length && (
                                    <div className="border-t border-slate-100 p-3 text-center bg-slate-50/50">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                            +{channel.members - members.length} more members
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-6 text-center">
                                <div className="text-slate-400 text-sm">No members found</div>
                                <p className="text-[10px] text-slate-400 mt-1">Unable to load member list from Slack.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ChannelDetail;
