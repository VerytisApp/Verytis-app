
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Activity, CheckCircle, Settings, FileText, UserPlus, FilterX, XCircle, RefreshCw, Edit2, GitCommit, GitPullRequest, GitMerge, Archive as ArchiveIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, Button, PlatformIcon } from '@/components/ui';

export default function TimelineFeed({ userRole }) {
    const { provider, resourceId } = useParams();
    const router = useRouter();
    const supabase = createClient();

    // We already have the resourceId, so 'selectedChannelId' refers to that
    const [filterType, setFilterType] = useState('all');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [resourceInfo, setResourceInfo] = useState(null);

    // Fetch Resource Info (Name, etc.)
    useEffect(() => {
        const fetchResourceInfo = async () => {
            try {
                // In a real app we might have a specific endpoint for single resource details
                // For now, let's reuse the list and find it, or fallback
                const res = await fetch('/api/resources/list');
                if (res.ok) {
                    const data = await res.json();
                    const found = data.resources?.find(r => r.id.toString() === resourceId);
                    if (found) setResourceInfo(found);
                }
            } catch (e) {
                console.error('Error fetching resource details:', e);
            }
        };
        fetchResourceInfo();
    }, [resourceId]);

    const fetchEvents = async () => {
        if (!resourceId) return;

        // Only show loading on initial fetch if we don't have events yet
        if (events.length === 0) setLoading(true);

        try {
            // Assumption: API supports fetching by ID directly
            const res = await fetch(`/api/activity?channelId=${resourceId}`);
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events || []);
            }
        } catch (e) {
            console.error('Error fetching events:', e);
        } finally {
            setLoading(false);
        }
    };

    // Fetch real events & Subscribe to Realtime
    useEffect(() => {
        fetchEvents();

        // REAL-TIME: Listen for new activity logs for this resource
        const channel = supabase
            .channel(`resource-activity-${resourceId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'activity_logs',
                    filter: `resource_id=eq.${resourceId}`
                },
                (payload) => {
                    console.log('🔥 New Activity Detected for this resource!', payload);
                    fetchEvents();
                }
            )
            .subscribe((status) => {
                console.log(`📡 Realtime Status: ${status}`);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [resourceId]);

    // Filter events
    const filteredEvents = events.filter(event => {
        if (filterType === 'all') return true;

        // GitHub Specific Filters
        if (provider === 'github') {
            if (filterType === 'commits' && event.action === 'Code Push') return true;
            if (filterType === 'prs' && ['PR Opened', 'PR Merged'].includes(event.action)) return true;
            if (filterType === 'system' && ['system', 'anonymous'].includes(event.type)) return true;
            return false;
        }

        // Default / Slack Filters
        if (filterType === 'decisions' && event.type === 'decision') return true;
        if (filterType === 'code' && (event.type === 'file' || event.type === 'comment' || event.action === 'PR Merged')) return true;
        if (filterType === 'system' && ['system', 'anonymous'].includes(event.type)) return true;
        return false;
    });

    const groupedEvents = filteredEvents.reduce((groups, event) => {
        const date = new Date(event.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
        if (!groups[date]) groups[date] = [];
        groups[date].push(event);
        return groups;
    }, {});

    const getEventIcon = (event) => {
        let style = { icon: Activity, color: 'text-slate-400' };

        if (event.type === 'decision') {
            const decisionStyles = {
                'Approval': { icon: CheckCircle, color: 'text-emerald-600' },
                'Rejection': { icon: XCircle, color: 'text-rose-600' },
                'Transfer': { icon: RefreshCw, color: 'text-purple-600' },
                'Edit': { icon: Edit2, color: 'text-blue-600' },
                'Archive': { icon: ArchiveIcon, color: 'text-slate-600' },
                'PR Merged': { icon: GitMerge, color: 'text-purple-600' }
            };
            style = decisionStyles[event.action] || decisionStyles['Approval'];
        } else if (event.type === 'file') {
            if (event.action === 'Code Push') {
                style = { icon: GitCommit, color: 'text-orange-500' };
            } else {
                style = { icon: FileText, color: 'text-orange-500' };
            }
        } else if (event.type === 'comment') {
            if (event.action === 'PR Opened') {
                style = { icon: GitPullRequest, color: 'text-blue-500' };
            } else {
                style = { icon: GitCommit, color: 'text-blue-500' };
            }
        } else if (event.type === 'system') {
            style = { icon: Settings, color: 'text-slate-500' };
        } else if (event.type === 'anonymous') {
            style = { icon: UserPlus, color: 'text-amber-500' };
        }

        const Icon = style.icon;
        return <Icon className={`w-3.5 h-3.5 ${style.color}`} />;
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 max-w-5xl mx-auto px-4 pb-12">
            <header className="flex items-center justify-between pb-4 border-b border-slate-200 mt-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors border border-transparent hover:border-slate-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold tracking-tight text-slate-900">
                                {resourceInfo ? resourceInfo.name : 'Loading...'}
                            </h1>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                {provider}
                            </span>
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
                        {provider === 'github' ? (
                            <>
                                <option value="commits">Commits</option>
                                <option value="prs">Pull Requests</option>
                                <option value="system">System</option>
                            </>
                        ) : (
                            <>
                                <option value="code">Code Activity</option>
                                <option value="decisions">Decisions Only</option>
                                <option value="system">System & Meta</option>
                            </>
                        )}
                    </select>
                </div>
            </header>

            <div className="relative min-h-[400px] pt-4">
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-200" />

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mb-3"></div>
                        <p className="text-xs font-medium">Loading events...</p>
                    </div>
                ) : Object.keys(groupedEvents).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                            <FilterX className="w-6 h-6 opacity-50" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wide">No events recorded yet</p>
                        <p className="text-[10px] mt-1 max-w-xs text-center">
                            Activity will appear here once actions are taken.
                        </p>
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
                                                {getEventIcon(event)}
                                            </div>
                                            <Card
                                                className="p-3 hover:shadow-md transition-shadow group-hover:border-slate-300 cursor-pointer"
                                                onClick={() => {
                                                    if (resourceInfo?.teamId) {
                                                        router.push(`/stacks/${resourceInfo.teamId}/activity/${event.id}`);
                                                    }
                                                }}
                                            >
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
