
import { createClient } from '@supabase/supabase-js';
import { Card, PlatformIcon, StatusBadge, Button } from '@/components/ui';
import Link from 'next/link';
import {
    ChevronLeft, Clock, GitCommit, GitPullRequest,
    GitBranch, ExternalLink, User, Hash, Code, Server,
    FileJson,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import BackToPrevious from '@/components/ui/BackToPrevious';


export const dynamic = 'force-dynamic';

export default async function ActivityDetailsPage({ params }) {
    const { teamId, activityId } = await params;

    // Use Service Role to bypass RLS, matching the API behavior
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch Activity Log
    const { data: activity, error } = await supabase
        .from('activity_logs')
        .select(`
            *,
            profiles:actor_id (
                full_name,
                avatar_url,
                email
            ),
            monitored_resources (
                name,
                type,
                integrations (
                    provider
                )
            )
        `)
        .eq('id', activityId)
        .single();

    if (error || !activity) {
        console.error("Error fetching activity:", error);
        return notFound();
    }

    const { metadata, action_type, summary, created_at, profiles, monitored_resources, id } = activity;
    const actorName = profiles?.full_name || profiles?.email || 'System';
    const resourceName = monitored_resources?.name || 'Unknown Resource';
    const platform = monitored_resources?.integrations?.provider || metadata?.platform || 'sc';

    const formatActionUI = (type) => {
        switch (type) {
            case 'CODE_MERGE': return 'Merged Pull Request';
            case 'CODE_PUSH': return 'Pushed Code';
            case 'OPEN_PR': return 'Opened Pull Request';
            case 'CARD_MOVED': return 'Card Moved';
            case 'MEMBER_ASSIGNED': return 'Member Assigned';
            case 'ATTACHMENT_ADDED': return 'Attachment Added';
            case 'CHECKLIST_DONE': return 'Checklist Completed';
            case 'CARD_COMPLETED': return 'Card Completed';
            case 'CARD_ARCHIVED': return 'Card Archived';
            default: return type.replace(/_/g, ' ');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header / Back Link */}
            <div>
                <BackToPrevious />

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="flex items-start gap-5">
                        <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 shadow-lg shadow-slate-100/50">
                            <PlatformIcon platform={platform} className="w-10 h-10" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{formatActionUI(action_type)}</h1>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                                    <Server className="w-3.5 h-3.5 text-slate-400" />
                                    {resourceName}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {new Date(created_at).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'medium' })}
                                </span>
                            </div>
                        </div>
                    </div>
                    <StatusBadge status="Completed" className="hidden md:flex px-4 py-1.5 text-sm" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Main Content (3/5) */}
                <div className="lg:col-span-3 space-y-6">

                    {/* Summary Card */}
                    <Card className="p-6 md:p-8 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <PlatformIcon platform={platform} className="w-32 h-32" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FileJson className="w-3.5 h-3.5" /> Summary
                        </h3>
                        <p className="text-lg text-slate-900 font-medium leading-relaxed">
                            {summary}
                        </p>
                    </Card>

                    {/* GitHub Specific Details */}
                    {platform === 'github' && (
                        <div className="space-y-6">
                            {/* Branch Info */}
                            {metadata?.branch && (
                                <Card className="p-4 flex items-center gap-4 bg-slate-50/50">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
                                        <GitBranch className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 font-medium uppercase">Branch</div>
                                        <div className="text-sm font-bold text-slate-900 font-mono">{metadata.branch}</div>
                                    </div>
                                    {metadata?.compare_url && (
                                        <a
                                            href={metadata.compare_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-auto"
                                        >
                                            <Button variant="outline" size="sm" className="gap-2 bg-white">
                                                Compare <ExternalLink className="w-3 h-3" />
                                            </Button>
                                        </a>
                                    )}
                                </Card>
                            )}

                            {/* Commits List */}
                            {metadata?.commits && metadata.commits.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <GitCommit className="w-4 h-4 text-slate-500" />
                                            Commits ({metadata.commits.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-3">
                                        {metadata.commits.map((commit, idx) => (
                                            <div key={commit.id || idx} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group relative overflow-hidden">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <p className="text-sm text-slate-900 font-medium leading-relaxed font-mono">
                                                            {commit.message}
                                                        </p>
                                                        {commit.url && (
                                                            <a
                                                                href={commit.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                                                title="View Diff"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 pt-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                                                                {commit.author?.[0]?.toUpperCase() || 'U'}
                                                            </div>
                                                            <span className="text-xs text-slate-600 font-medium">{commit.author}</span>
                                                        </div>
                                                        <span className="text-slate-200">•</span>
                                                        <span className="text-xs font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                            {commit.id?.substring(0, 7)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                </div>

                {/* Sidebar (2/5) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Actor Card */}
                    <Card>
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-xs font-bold uppercase text-slate-500">Triggered By</h3>
                        </div>
                        <div className="p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600">
                                {profiles?.avatar_url ? (
                                    <img src={profiles.avatar_url} alt={actorName} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    actorName.substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-900">{actorName}</div>
                                <div className="text-xs text-slate-500">{profiles?.email || 'Authenticated User'}</div>
                            </div>
                        </div>
                    </Card>

                    {/* Context Info */}
                    <Card className="divide-y divide-slate-100">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-xs font-bold uppercase text-slate-500">Context</h3>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <span className="text-xs text-slate-500">Platform</span>
                            <div className="flex items-center gap-2">
                                <PlatformIcon platform={platform} className="w-4 h-4" />
                                <span className="text-xs font-bold text-slate-700 capitalize">{platform}</span>
                            </div>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <span className="text-xs text-slate-500">Resource Type</span>
                            <span className="text-xs font-bold text-slate-700 capitalize">{monitored_resources?.type || 'Unknown'}</span>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <span className="text-xs text-slate-500">Activity ID</span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{id.substring(0, 8)}...</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
