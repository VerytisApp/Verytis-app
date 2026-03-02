'use client';

import React from 'react';
import { Cpu, DollarSign, Database, CheckCircle, ArrowRight, ShieldAlert, Code, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRole } from '@/lib/providers';
import { SkeletonDashboard } from '@/components/ui';

export default function ExecutiveLaunchpad() {
    const { currentUser } = useRole();
    const userName = currentUser?.name?.split(' ')[0] || 'Tychique';

    const [metrics, setMetrics] = React.useState({
        activeAgents: 0,
        totalTokens: 0,
        apiCosts: 0,
        blockedRequests: 0,
        avgLatency: 0
    });
    const [recentEvents, setRecentEvents] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch('/api/dashboard');
                if (res.ok) {
                    const data = await res.json();
                    if (data.metrics) setMetrics(data.metrics);
                    if (data.recentEvents) setRecentEvents(data.recentEvents);
                }
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const formatTimeAgo = (dateString) => {
        const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
        const diff = (new Date(dateString) - new Date()) / 1000;

        if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), 'second');
        if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minute');
        if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
        return rtf.format(Math.round(diff / 86400), 'day');
    };

    const calculateProjectedCost = (currentCost) => {
        if (!currentCost || currentCost === 0) return 0;
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();
        const progress = currentDay / daysInMonth;
        return currentCost / progress;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 animate-in fade-in duration-300">
                <div className="max-w-6xl mx-auto space-y-8 pt-2">
                    <SkeletonDashboard />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 animate-in fade-in duration-300">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* 1. Hero Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                            Welcome back, {userName}.
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium text-base">
                            Your AI-Ops telemetry & FinOps command center.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm text-sm font-semibold text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                        AI Fleet: Optimized & Online
                    </div>
                </header>

                {/* 2. "Quick Launch" Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">

                    {/* Card 1: AI Workforce */}
                    <Link href="/agents" className="block group">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md transition-all cursor-pointer h-full flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                                    <Cpu className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Active Agents</h3>
                                <div className="text-2xl font-bold text-slate-900">
                                    {isLoading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded"></div> : `${metrics.activeAgents} Agents`}
                                </div>
                            </div>
                            <div className="mt-6 flex items-center font-semibold text-sm text-indigo-600 group-hover:text-indigo-700 transition-colors">
                                Manage AI Fleet <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Card 2: API Costs */}
                    <div className="block group cursor-default">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all h-full flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4 transition-colors">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">API Costs (MTD)</h3>
                                <div className="text-2xl font-bold text-slate-900">
                                    {isLoading ? <div className="h-8 w-24 bg-slate-100 animate-pulse rounded inline-block"></div> : `$${metrics.apiCosts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </div>
                            </div>
                            <div className="mt-6 flex items-center font-semibold text-sm text-emerald-600 transition-colors">
                                Projected: ${calculateProjectedCost(metrics.apiCosts).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Total Tokens */}
                    <div className="block group cursor-default">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all h-full flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4 transition-colors">
                                    <Database className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Tokens Used</h3>
                                <div className="text-2xl font-bold text-slate-900">
                                    {isLoading ? <div className="h-8 w-24 bg-slate-100 animate-pulse rounded inline-block"></div> : `${(metrics.totalTokens / 1000000).toFixed(1)}M`}
                                </div>
                            </div>
                            <div className="mt-6 flex items-center font-semibold text-sm text-blue-600 transition-colors">
                                Across all providers
                            </div>
                        </div>
                    </div>

                </div>

                {/* 3. "Security Pulse" Vital Metrics */}
                <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">

                        <div className="p-6 flex flex-col justify-center">
                            <h3 className="text-sm font-semibold text-slate-500 mb-1">Blocked Requests</h3>
                            <div className="text-3xl font-bold text-rose-600 tracking-tight flex items-center gap-2">
                                <ShieldAlert className="w-6 h-6" />
                                {isLoading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded inline-block"></div> : metrics.blockedRequests}
                            </div>
                            <div className="text-xs font-medium text-slate-400 mt-1">DLP & Policy violations prevented</div>
                        </div>

                        <div className="p-6 flex flex-col justify-center">
                            <h3 className="text-sm font-semibold text-slate-500 mb-1">Processed Events</h3>
                            <div className="text-3xl font-bold text-slate-900 tracking-tight">
                                {isLoading ? <div className="h-8 w-24 bg-slate-100 animate-pulse rounded inline-block"></div> : (metrics.totalTokens / 500).toLocaleString() /* rough estimate */}
                            </div>
                            <div className="text-xs font-medium text-slate-400 mt-1">LLM interactions logged</div>
                        </div>

                        <div className="p-6 flex flex-col justify-center">
                            <h3 className="text-sm font-semibold text-slate-500 mb-1">Avg AI Latency</h3>
                            <div className="text-3xl font-bold text-slate-900 tracking-tight">
                                {isLoading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded inline-block"></div> : `${metrics.avgLatency}s`}
                            </div>
                            <div className="text-xs font-medium text-slate-400 mt-1">Time to first token (TTFT)</div>
                        </div>

                    </div>
                </div>

                {/* 4. "Recent Activity" Mini-feed */}
                <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                        <h2 className="text-sm font-bold text-slate-900">Latest AI Interactions</h2>
                    </div>
                    <div className="divide-y divide-gray-50 flex flex-col">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Loading latest events...</div>
                        ) : recentEvents.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">No recent events found in the database.</div>
                        ) : recentEvents.map((event) => (
                            <div key={event.id} className="p-4 sm:px-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                                {/* Left & Middle: Avatar + Context */}
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm border ${event.actor.type === 'agent' ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                        {event.actor.avatar}
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-700">
                                            <span className="font-bold text-slate-900">{event.actor.name}</span> <span className="uppercase text-[10px] mx-1 font-bold text-slate-400">{event.action}</span> in <span className="font-mono text-[13px] bg-slate-100 px-1 py-0.5 rounded text-slate-600">{event.target}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Right: Badge & Time */}
                                <div className="flex items-center gap-3 shrink-0 ml-12 sm:ml-0">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${event.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        event.status === 'BLOCKED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                            'bg-slate-50 text-slate-700 border-slate-200'
                                        }`}>
                                        {event.status}
                                    </span>
                                    <div className="flex items-center text-xs font-medium text-slate-400 w-24 justify-end">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {formatTimeAgo(event.time)}
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
