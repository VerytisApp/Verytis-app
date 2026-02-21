'use client';

import React from 'react';
import { Cpu, Users, ShieldCheck, CheckCircle, ArrowRight, Activity, Code, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRole } from '@/lib/providers';

const MOCK_EVENTS = [
    {
        id: 'trc_1',
        actor: { name: 'Elena Ross', type: 'human', avatar: 'ER' },
        action: 'merged pull request #142',
        target: 'core-api',
        status: 'VERIFIED',
        time: '2 mins ago',
        icon: <Code className="w-4 h-4" />
    },
    {
        id: 'trc_2',
        actor: { name: 'Security-Scan-Bot', type: 'agent', avatar: '🤖' },
        action: 'completed vulnerability scan',
        target: 'prod-eu-west',
        status: 'CLEAN',
        time: '15 mins ago',
        icon: <ShieldCheck className="w-4 h-4" />
    },
    {
        id: 'trc_3',
        actor: { name: 'Auto-Deployer-Agent', type: 'agent', avatar: '🤖' },
        action: 'triggered deployment',
        target: 'auth-service v2.1.0',
        status: 'VERIFIED',
        time: '1 hour ago',
        icon: <Activity className="w-4 h-4" />
    },
    {
        id: 'trc_4',
        actor: { name: 'David Kim', type: 'human', avatar: 'DK' },
        action: 'updated IAM policy',
        target: 'Role: db-admin',
        status: 'REVIEWED',
        time: '3 hours ago',
        icon: <Users className="w-4 h-4" />
    }
];

export default function ExecutiveLaunchpad() {
    const { currentUser } = useRole();
    const userName = currentUser?.name?.split(' ')[0] || 'Tychique';

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
                            Your hybrid workforce (Humans + AI) is fully audited and secure.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm text-sm font-semibold text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                        System Status: All Systems Operational (WORM Active)
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
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">AI Workforce</h3>
                                <div className="text-2xl font-bold text-slate-900">10 Active Agents</div>
                            </div>
                            <div className="mt-6 flex items-center font-semibold text-sm text-indigo-600 group-hover:text-indigo-700 transition-colors">
                                Manage AI Fleet <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Card 2: Passport Identities */}
                    <Link href="/passport-identities" className="block group">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md transition-all cursor-pointer h-full flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Passport Identities</h3>
                                <div className="text-2xl font-bold text-slate-900">152 Monitored Users</div>
                            </div>
                            <div className="mt-6 flex items-center font-semibold text-sm text-blue-600 group-hover:text-blue-700 transition-colors">
                                Manage Access <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Card 3: Compliance & Risk */}
                    <Link href="/audit" className="block group">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md transition-all cursor-pointer h-full flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Compliance & Risk</h3>
                                <div className="text-2xl font-bold text-slate-900">Certification</div>
                            </div>
                            <div className="mt-6 flex items-center font-semibold text-sm text-emerald-600 group-hover:text-emerald-700 transition-colors">
                                Export Proofs <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>
                    </Link>

                </div>

                {/* 3. "Security Pulse" Vital Metrics */}
                <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">

                        <div className="p-6 flex flex-col justify-center">
                            <h3 className="text-sm font-semibold text-slate-500 mb-1">Certified Traceability</h3>
                            <div className="text-3xl font-bold text-emerald-600 tracking-tight">100%</div>
                            <div className="text-xs font-medium text-slate-400 mt-1">Actions sourcées et cryptées</div>
                        </div>

                        <div className="p-6 flex flex-col justify-center">
                            <h3 className="text-sm font-semibold text-slate-500 mb-1">Total Audited Events</h3>
                            <div className="text-3xl font-bold text-slate-900 tracking-tight">14,250</div>
                            <div className="text-xs font-medium text-slate-400 mt-1">Logs sécurisés (30 derniers jours)</div>
                        </div>

                        <div className="p-6 flex flex-col justify-center">
                            <h3 className="text-sm font-semibold text-slate-500 mb-1">AI Autonomy Index</h3>
                            <div className="text-3xl font-bold text-slate-900 tracking-tight">85%</div>
                            <div className="text-xs font-medium text-slate-400 mt-1">Tasks completed without human override</div>
                        </div>

                    </div>
                </div>

                {/* 4. "Recent Activity" Mini-feed */}
                <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                        <h2 className="text-sm font-bold text-slate-900">Latest Audited Events</h2>
                        <Link href="/agents/verytis-ops/logs" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center">
                            View full ledger <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {MOCK_EVENTS.map((event) => (
                            <div key={event.id} className="p-4 sm:px-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                                {/* Left & Middle: Avatar + Context */}
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm border ${event.actor.type === 'agent' ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                        {event.actor.avatar}
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-700">
                                            <span className="font-bold text-slate-900">{event.actor.name}</span> {event.action} in <span className="font-mono text-[13px] bg-slate-100 px-1 py-0.5 rounded text-slate-600">{event.target}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Right: Badge & Time */}
                                <div className="flex items-center gap-3 shrink-0 ml-12 sm:ml-0">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${event.status === 'CLEAN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        event.status === 'REVIEWED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}>
                                        {event.status}
                                    </span>
                                    <div className="flex items-center text-xs font-medium text-slate-400 w-24 justify-end">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {event.time}
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
