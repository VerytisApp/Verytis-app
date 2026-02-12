'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, PlatformIcon, StatusBadge, Button, ActivityFeed, Modal } from '@/components/ui';
import {
    Layers, ChevronRight, Settings, Plus, Info,
    CheckCircle2, AlertCircle, Clock, Activity, FileText
} from 'lucide-react';

export default function StackDetailPage() {
    const { teamId } = useParams();
    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState(null);

    // Mock Data Loading (Replace with real API calls later)
    useEffect(() => {
        // Simulate fetching team details & members
        setTimeout(() => {
            setTeam({
                id: teamId,
                name: teamId === '1' ? 'Engineering & Product' : 'Finance & Legal',
                description: 'Operational view of team integrations.',
                integrations: teamId === '1' ? ['github', 'slack'] : ['teams', 'slack']
            });

            setMembers([
                { id: 1, name: 'Sarah Jenkins', avatar: null, social_profiles: { github: 'sarahj', slack: 'U123' } },
                { id: 2, name: 'David Chen', avatar: null, social_profiles: { github: 'chen-dev' } }, // Missing slack
                { id: 3, name: 'Elena Ross', avatar: null, social_profiles: { slack: 'U456' } },    // Missing github
                { id: 4, name: 'Michael Thorne', avatar: null, social_profiles: {} }                 // Missing all
            ]);

            setLoading(false);
        }, 500);
    }, [teamId]);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading stack context...</div>;
    if (!team) return <div className="p-8 text-center text-slate-500">Team not found</div>;

    // Helper to check if a user is connected to a specific tool
    const isConnected = (member, tool) => {
        if (!member.social_profiles) return false;
        // Simple check: does the key exist and have a value?
        return !!member.social_profiles[tool.toLowerCase()];
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    <Link href="/stacks" className="cursor-pointer hover:text-slate-900 transition-colors">Stacks</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-900">{team.name}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{team.name}</h1>
                        <div className="flex -space-x-2">
                            {team.integrations.map((tool, idx) => (
                                <div key={idx} className="w-8 h-8 rounded-full bg-white border-2 border-slate-50 shadow-sm flex items-center justify-center p-0.5 relative z-0 hover:z-10 hover:scale-110 transition-transform">
                                    <PlatformIcon platform={tool} className="w-full h-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                            <Settings className="w-4 h-4 mr-2" />
                            Manage Stack
                        </Button>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                    <span className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100/50 px-2 py-1 rounded">
                        <Layers className="w-3.5 h-3.5" />
                        Stack ID: {team.id}
                    </span>
                    <StatusBadge status="Active" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN: Main Activity Feed (2/3) */}
                {/* LEFT COLUMN: Stack Activity Streams (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-xl font-bold text-slate-900">Stack Activity Streams</h1>
                        <button className="text-[10px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Real-time
                        </button>
                    </div>

                    {/* Render a separate Activity Card for each integration */}
                    {/* Render a separate Activity Card for each integration */}
                    {team.integrations.map(tool => {
                        // Filter mock activities for this tool
                        const toolActivities = [
                            { type: 'github', action: 'Pull Request Merged', target: 'fix/auth-flow into main', actor: 'David Chen', time: '2 mins ago', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
                            { type: 'slack', action: 'New Message', target: '#engineering: "Deployment started"', actor: 'Sarah Jenkins', time: '10 mins ago', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { type: 'teams', action: 'Document Updated', target: 'Q4_Financial_Report.xlsx', actor: 'Elena Ross', time: '15 mins ago', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { type: 'github', action: 'New Issue', target: 'Bug: Login page flickering', actor: 'Michael Thorne', time: '1 hour ago', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { type: 'slack', action: 'File Shared', target: 'specs_v2.pdf', actor: 'David Chen', time: '2 hours ago', icon: PlatformIcon, platform: 'slack', color: 'text-slate-600', bg: 'bg-slate-100' },
                        ].filter(item => item.type === tool);

                        if (toolActivities.length === 0) return null;

                        return (
                            <div key={tool} className="space-y-3">
                                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-3 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-slate-50 border border-slate-100 flex items-center justify-center p-1">
                                                <PlatformIcon platform={tool} className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 capitalize leading-tight flex items-center gap-2">
                                                    {tool === 'github' ? 'Repositories' : tool === 'slack' ? 'Channels' : 'SharePoint'}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Team</span>
                                                    <span className="text-xs font-semibold text-slate-600">{team.name}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                                                        Active
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Link href={`/timeline/${team.id}?filter=${tool}`}>
                                                <Button variant="outline" size="sm" className="h-7 text-xs">
                                                    View Timeline <ChevronRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </Link>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                Last active: 2 mins ago
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Card className="min-h-[150px]">
                                    <div className="p-0">
                                        <div className="divide-y divide-slate-100">
                                            {toolActivities.map((item, idx) => (
                                                <div key={idx} className="p-3 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer group">
                                                    <div className="mt-0.5">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.bg}`}>
                                                            {item.platform ? (
                                                                <PlatformIcon platform={item.platform} className="w-3.5 h-3.5" />
                                                            ) : (
                                                                <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="text-xs font-bold text-slate-900 truncate pr-2">
                                                                {item.action}
                                                            </h4>
                                                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{item.time}</span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                                            {item.target}
                                                        </p>
                                                        <div className="mt-1.5 flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1 text-[9px] text-slate-500 border border-slate-200 rounded px-1 py-0.5 bg-slate-50">
                                                                <PlatformIcon platform={item.type} className="w-2.5 h-2.5" />
                                                                {item.type === 'github' ? 'verytis/core' : item.type === 'slack' ? 'Engineering' : 'SharePoint'}
                                                            </span>
                                                            <span className="text-[9px] text-slate-400">•</span>
                                                            <span className="text-[10px] font-medium text-slate-600">{item.actor}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        );
                    })}

                </div>

                {/* RIGHT COLUMN: Sidebar (1/3) */}
                <div className="space-y-6">

                    {/* Active Stack Config */}
                    <Card>
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-blue-600" /> Active Stack
                            </h3>
                            <button className="text-slate-400 hover:text-blue-600 transition-colors">
                                <Settings className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="p-2 space-y-1">
                            {team.integrations.map(tool => (
                                <div key={tool} className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                            <PlatformIcon platform={tool} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900 capitalize">{tool}</div>
                                            <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                                Connected
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button className="w-full mt-2 py-2 border border-dashed border-slate-300 rounded text-xs font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                                <Plus className="w-3.5 h-3.5" /> Add Tool
                            </button>
                        </div>
                    </Card>

                    {/* Member Passports */}
                    <Card>
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Member Passports
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {members.map(member => (
                                <div key={member.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
                                            {member.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-900">{member.name}</div>
                                            <div className="text-[10px] text-slate-400">Developer</div>
                                        </div>
                                    </div>

                                    {/* Passport Status Icons */}
                                    <div className="flex gap-1.5">
                                        {team.integrations.map(tool => {
                                            const active = isConnected(member, tool);
                                            return (
                                                <div
                                                    key={tool}
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${active
                                                        ? 'bg-white border-emerald-400 ring-1 ring-emerald-100 shadow-sm'
                                                        : 'bg-slate-100 border-slate-200 opacity-50 grayscale'
                                                        }`}
                                                    title={`${tool}: ${active ? 'Connected' : 'Missing'}`}
                                                >
                                                    <PlatformIcon platform={tool} className="w-3 h-3" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                            <div className="flex items-start gap-2">
                                <Info className="w-3 h-3 text-slate-400 mt-0.5" />
                                <p className="text-[10px] text-slate-500 leading-tight">
                                    Gray icons indicate the user has not verified their identity for that tool in their profile settings.
                                </p>
                            </div>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
}
