'use client';

import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Trophy,
    TrendingUp,
    TrendingDown,
    Zap,
    DollarSign,
    Activity
} from 'lucide-react';
import { Card, Button } from '@/components/ui';

export default function AgentEfficiencyDeepDive({ params }) {
    const router = useRouter();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 p-6 max-w-7xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => router.push(`/agents/${params.agentId}`)}
                className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Agent Dashboard
            </button>

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-5 border-b border-slate-200">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-indigo-500" />
                        Efficiency & ROI Analytics
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        In-depth breakdown of model performance, token economics, and operational velocity.
                    </p>
                </div>
            </header>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

                {/* Cost Metrics */}
                <Card className="p-5 col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    <div className="px-4 py-2">
                        <div className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Total Spend (30d)
                        </div>
                        <div className="text-3xl font-bold text-slate-900">$142.50</div>
                        <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                            <TrendingDown className="w-3 h-3" /> -12% vs last month
                        </div>
                    </div>
                    <div className="px-4 py-2">
                        <div className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Tokens Processed
                        </div>
                        <div className="text-3xl font-bold text-slate-900">14.2M</div>
                        <div className="text-xs text-slate-400 mt-1">
                            Input: 11M | Output: 3.2M
                        </div>
                    </div>
                    <div className="px-4 py-2">
                        <div className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Est. Time Saved
                        </div>
                        <div className="text-3xl font-bold text-slate-900">340 hrs</div>
                        <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                            <TrendingUp className="w-3 h-3" /> Based on 1,240 runs
                        </div>
                    </div>
                </Card>

                {/* Model Economics */}
                <Card className="p-5 lg:col-span-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Cost Breakdown by Model</h3>
                    <div className="space-y-6">
                        {/* claude-3-haiku */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <span className="font-mono text-sm font-bold text-slate-700">claude-3-haiku</span>
                                    <span className="text-xs text-slate-500 ml-2">75% volume</span>
                                </div>
                                <span className="text-sm font-bold text-slate-900">$45.00</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                        </div>
                        {/* gpt-4o */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <span className="font-mono text-sm font-bold text-slate-700">gpt-4o</span>
                                    <span className="text-xs text-slate-500 ml-2">20% volume</span>
                                </div>
                                <span className="text-sm font-bold text-slate-900">$85.20</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-rose-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                        </div>
                        {/* llama-3 */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <span className="font-mono text-sm font-bold text-slate-700">llama-3-70b</span>
                                    <span className="text-xs text-slate-500 ml-2">5% volume</span>
                                </div>
                                <span className="text-sm font-bold text-slate-900">$12.30</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Additional Insight */}
                <Card className="p-5 bg-indigo-50/50 border-indigo-100">
                    <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-4">Cost Optimization Tip</h3>
                    <p className="text-sm text-indigo-700 leading-relaxed mb-4">
                        You route 20% of requests to GPT-4o for complex PR reviews. Our analysis indicates that fine-tuning Claude 3 Haiku on your codebase could achieve a similar success rate (94%) at 1/8th the cost.
                    </p>
                    <Button variant="primary" className="w-full">
                        Simulate Migration Savings
                    </Button>
                </Card>

            </div>
        </div>
    );
}
