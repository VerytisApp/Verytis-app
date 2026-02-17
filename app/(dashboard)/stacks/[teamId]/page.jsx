'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, PlatformIcon, StatusBadge, Button, ActivityFeed, Modal } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
    Layers, ChevronRight, Settings, Plus, Info,
    CheckCircle2, AlertCircle, Clock, Activity, FileText,
    GitCommit, GitPullRequest, GitBranch, Trash2, X
} from 'lucide-react';

export default function StackDetailPage() {
    const { teamId } = useParams();
    const router = useRouter(); // Initialize router
    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState(null);
    const supabase = createClient();

    // Add Tool State
    const [availableIntegrations, setAvailableIntegrations] = useState([]);
    const [integrationResources, setIntegrationResources] = useState([]);
    const [loadingResources, setLoadingResources] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);

    // Stack Management State
    const [isManagingStack, setIsManagingStack] = useState(false);

    // Load Real Data
    const fetchTeamData = async () => {
        try {
            const res = await fetch(`/api/teams/${teamId}`);
            if (!res.ok) throw new Error('Failed to fetch team');
            const data = await res.json();

            if (data.team) {
                setTeam(data.team);
                setMembers(data.team.members || []);
            }
        } catch (err) {
            console.error("Error loading team data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamData();

        // REAL-TIME: Listen for new activity logs for this team/resources
        const channel = supabase
            .channel(`team-activity-${teamId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'activity_logs'
                },
                (payload) => {
                    console.log('🔥 New Activity Detected (DB)!', payload);
                    fetchTeamData();
                }
            )
            .on(
                'broadcast',
                { event: 'new_activity' },
                (payload) => {
                    console.log('🔥 New Activity Detected (Broadcast)!', payload);
                    setTimeout(() => {
                        fetchTeamData();
                    }, 1000);
                }
            )
            .subscribe((status) => {
                console.log(`📡 Realtime Status: ${status}`);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [teamId]);



    const formatActionUI = (actionType) => {
        switch (actionType) {
            case 'APPROVE': return 'Approval';
            case 'REJECT': return 'Rejection';
            case 'TRANSFER': return 'Transfer';
            case 'EDIT': return 'Edit';
            case 'ARCHIVE': return 'Archive';
            case 'COMMENT': return 'Comment';
            case 'FILE_SHARED': return 'File';
            case 'MEMBER_JOINED': return 'Member joined';
            case 'CHANNEL_CREATED': return 'Channel created';
            case 'CODE_MERGE': return 'Merged PR';
            case 'CODE_PUSH': return 'Pushed Code';
            case 'ATTEMPTED_ACTION_ANONYMOUS': return 'Unverified action';
            case 'CARD_MOVED': return 'Card Moved';
            case 'MEMBER_ASSIGNED': return 'Member Assigned';
            case 'ATTACHMENT_ADDED': return 'Attachment';
            case 'CHECKLIST_DONE': return 'Checklist Done';
            case 'CARD_ARCHIVED': return 'Card Archived';
            default: return actionType;
        }
    };

    // Add Tool Handlers
    const openAddToolModal = async () => {
        setActiveModal('add_tool');
        setCurrentStep(1);
        setSelectedIntegration(null);
        setIntegrationResources([]);

        try {
            const res = await fetch('/api/integrations');
            if (res.ok) {
                const data = await res.json();
                // Filter out Slack as it's managed in Channels
                setAvailableIntegrations((data.integrations || []).filter(i => i.provider !== 'slack'));
            }
        } catch (e) {
            console.error("Failed to fetch integrations", e);
        }
    };

    const handleIntegrationSelect = async (integration) => {
        setSelectedIntegration(integration);
        setLoadingResources(true);
        setCurrentStep(2);

        try {
            let url = '';
            if (integration.provider === 'github') url = '/api/github/repositories';
            if (integration.provider === 'slack') url = '/api/slack/channels';

            if (url) {
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setIntegrationResources(data.repositories || data.channels || []);
                }
            }
        } catch (e) {
            console.error("Failed to fetch resources", e);
        } finally {
            setLoadingResources(false);
        }
    };

    const handleAddResource = async (resource) => {
        try {
            const res = await fetch(`/api/teams/${teamId}/resources`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resource_id: resource.id,
                    resource_name: resource.name,
                    resource_type: selectedIntegration.provider === 'github' ? 'repo' : 'channel',
                    integration_id: selectedIntegration.id,
                    external_id: resource.id // Or specialized ID if needed
                })
            });

            if (res.ok) {
                const teamRes = await fetch(`/api/teams/${teamId}`);
                const data = await teamRes.json();
                if (data.team) {
                    setTeam(data.team);
                }
                setActiveModal(null);
            }
        } catch (e) {
            console.error("Failed to add resource", e);
        }
    };

    // Delete Handlers
    const handleDeleteResource = async (resourceId) => {
        if (!confirm('Are you sure you want to remove this resource from the stack? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/teams/${teamId}/resources/${resourceId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchTeamData(); // Refresh list
            } else {
                alert('Failed to delete resource');
            }
        } catch (e) {
            console.error('Error deleting resource:', e);
        }
    };

    const handleDeleteStack = async () => {
        if (!confirm('Are you sure you want to delete this ENTIRE STACK? All data and configuration will be lost permanently.')) return;

        try {
            const res = await fetch(`/api/teams/${teamId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                router.push('/stacks');
            } else {
                alert('Failed to delete stack');
            }
        } catch (e) {
            console.error('Error deleting stack:', e);
        }
    };

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
                            <div className="flex -space-x-2">
                                {team.integrations
                                    .filter(tool => tool !== 'slack')
                                    .map((tool, idx) => (
                                        <div key={idx} className="w-8 h-8 flex items-center justify-center p-0.5 relative z-0 hover:z-10 hover:scale-110 transition-transform">
                                            <PlatformIcon platform={tool} className="w-full h-full" />
                                        </div>
                                    ))}
                            </div>
                        </div>
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

                    {/* No Apps Empty State */}
                    {(!team.integrations || team.integrations.filter(t => t !== 'slack').length === 0) && (
                        <Card className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                <Plus className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">No apps connected</h3>
                            <Button onClick={openAddToolModal}>
                                <Plus className="w-4 h-4 mr-2" /> Add Tool
                            </Button>
                        </Card>
                    )}

                    {/* No Activity Empty State (Apps connected but no data) */}
                    {team.integrations && team.integrations.filter(t => t !== 'slack').length > 0 && (!team.recentActivity || team.recentActivity.length === 0) && (
                        <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
                            <div className="w-16 h-16 rounded-full bg-slate-50/50 flex items-center justify-center mb-4">
                                <Activity className="w-8 h-8 text-slate-200" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mb-1">No recent activity</h3>
                            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6">
                                It looks a bit quiet here. New commits and PRs will appear here as they happen.
                            </p>
                            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                                <Clock className="w-3 h-3 mr-2" /> Refresh Stream
                            </Button>
                        </Card>
                    )}

                    {/* Render a separate Activity Card for each integration */}
                    {/* Render a separate Activity Card for each integration */}
                    {team.integrations
                        .filter(tool => tool !== 'slack')
                        .map(tool => (
                            <ToolActivitySection
                                key={tool}
                                tool={tool}
                                team={team}
                                formatActionUI={formatActionUI}
                            />
                        ))}

                </div>

                {/* RIGHT COLUMN: Sidebar (1/3) */}
                <div className="space-y-6">

                    {/* Active Stack Config */}
                    <Card>
                        <div className={`px-5 py-3 border-b ${isManagingStack ? 'bg-red-50 border-red-100' : 'bg-slate-50/30 border-slate-100'} flex justify-between items-center transition-colors`}>
                            <h3 className={`text-xs font-bold uppercase tracking-wide flex items-center gap-2 ${isManagingStack ? 'text-red-600' : 'text-slate-900'}`}>
                                <Layers className="w-3.5 h-3.5" />
                                {isManagingStack ? 'Manage Stack' : 'Active Stack'}
                            </h3>
                            <button
                                onClick={() => setIsManagingStack(!isManagingStack)}
                                className={`${isManagingStack ? 'text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 p-1 rounded-full' : 'text-slate-400 hover:text-blue-600'} transition-all`}
                                title={isManagingStack ? "Close Management" : "Manage Stack"}
                            >
                                {isManagingStack ? <X className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                        <div className="p-2 space-y-1">

                            {/* Add Tool Button (Top of List) */}
                            {!isManagingStack && (
                                <button onClick={openAddToolModal} className="w-full mb-2 py-2 border border-dashed border-slate-300 rounded text-xs font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                                    <Plus className="w-3.5 h-3.5" /> Add Tool
                                </button>
                            )}

                            {/* Iterate over actual CHANNELS/RESOURCES (Exclude Slack) */}
                            {(team.channels || [])
                                .filter(resource => resource.platform !== 'slack')
                                .map(resource => (
                                    <div key={resource.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 flex items-center justify-center">
                                                <PlatformIcon platform={resource.platform} className="w-6 h-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-slate-900 break-words leading-tight" title={resource.name}>{resource.name}</div>
                                                <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                                    Connected
                                                </div>
                                            </div>
                                        </div>
                                        {isManagingStack ? (
                                            <button
                                                onClick={() => handleDeleteResource(resource.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Remove this app"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <Link
                                                href={`/timeline/${resource.platform}/${resource.id}`}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="View Timeline"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        )}
                                    </div>
                                ))}

                            {isManagingStack && (
                                <div className="pt-2 mt-2 border-t border-slate-100 space-y-2">
                                    <button
                                        onClick={openAddToolModal}
                                        className="w-full py-2 border border-dashed border-slate-300 rounded text-xs font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Tool
                                    </button>
                                    <button
                                        onClick={handleDeleteStack}
                                        className="w-full py-2 bg-red-50 border border-red-100 rounded text-xs font-bold text-red-600 hover:bg-red-100 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> DELETE STACK
                                    </button>
                                </div>
                            )}
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
                                        {team.integrations
                                            .filter(tool => tool !== 'slack')
                                            .map(tool => {
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

            {/* Add Tool Modal */}
            <Modal
                isOpen={activeModal === 'add_tool'}
                onClose={() => setActiveModal(null)}
                title={currentStep === 1 ? "Connect Integration" : `Select ${selectedIntegration?.provider === 'github' ? 'Repository' : 'Channel'}`}
                className="max-w-md"
            >
                {currentStep === 1 ? (
                    <div className="space-y-2">
                        <p className="text-sm text-slate-500 mb-4">Select an active integration to add resources from.</p>
                        {availableIntegrations.map(integration => (
                            <button
                                key={integration.id}
                                onClick={() => handleIntegrationSelect(integration)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group text-left"
                            >
                                <div className="w-10 h-10 flex items-center justify-center">
                                    <PlatformIcon platform={integration.provider} className="w-8 h-8" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 capitalize">{integration.provider}</div>
                                    <div className="text-xs text-slate-500">Connected</div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-blue-500" />
                            </button>
                        ))}
                        {availableIntegrations.length === 0 && (
                            <div className="text-center py-6 text-slate-500 text-sm">
                                No integrations found. Please go to Settings to connect apps first.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                            <span onClick={() => setCurrentStep(1)} className="cursor-pointer hover:text-slate-900 hover:underline">Apps</span>
                            <ChevronRight className="w-3 h-3" />
                            <span className="font-medium text-slate-900">Select Resource</span>
                        </div>

                        {loadingResources ? (
                            <div className="py-8 text-center text-slate-500 flex flex-col items-center gap-2">
                                <Activity className="w-6 h-6 animate-spin text-blue-500" />
                                <span className="text-xs">Fetching resources...</span>
                            </div>
                        ) : (
                            <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
                                {integrationResources.map(resource => {
                                    // Check if resource is already in the stack
                                    const isAdded = (team.channels || []).some(
                                        c => c.external_id === String(resource.id) &&
                                            (c.platform === selectedIntegration.provider || (c.type === 'channel' && selectedIntegration.provider === 'slack'))
                                    );

                                    return (
                                        <button
                                            key={resource.id}
                                            onClick={() => !isAdded && handleAddResource(resource)}
                                            disabled={isAdded}
                                            className={`w-full flex items-center justify-between p-2.5 rounded text-left border transition-all ${isAdded
                                                ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                                                : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {selectedIntegration?.provider === 'github' ? (
                                                    <Layers className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                ) : (
                                                    <div className="w-4 h-4 text-slate-400 flex-shrink-0">#</div>
                                                )}
                                                <span className={`text-sm font-medium truncate ${isAdded ? 'text-slate-400' : 'text-slate-700'}`}>
                                                    {resource.name}
                                                </span>
                                            </div>
                                            {isAdded ? (
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Added</span>
                                            ) : (
                                                <Plus className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                                            )}
                                        </button>
                                    );
                                })}
                                {integrationResources.length === 0 && (
                                    <div className="text-center py-6 text-slate-400 text-sm">
                                        No resources found.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

// ── Tool Activity Section Component ─────────────────────────────────────────

function ToolActivitySection({ tool, team, formatActionUI }) {
    const [isExpanded, setIsExpanded] = useState(false);

    let toolActivities = [];
    if (tool === 'github') {
        toolActivities = (team.recentActivity || [])
            .filter(item => ['CODE_MERGE', 'CODE_PUSH', 'OPEN_PR', 'COMMIT'].includes(item.actionType))
            .map(item => {
                const isSingleCommit = item.metadata?.commits?.length === 1;
                const displayTarget = isSingleCommit
                    ? item.metadata.commits[0].message
                    : item.description;

                return {
                    id: item.id,
                    type: 'github',
                    platform: 'github',
                    action: isSingleCommit ? 'Pushed Commit' : formatActionUI(item.actionType),
                    target: displayTarget,
                    actor: item.user.name,
                    time: new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    icon: Activity,
                    color: 'text-slate-600',
                    bg: 'bg-slate-50',
                    url: isSingleCommit ? item.metadata.commits[0].url : null,
                    resourceName: item.channel,
                    metadata: item.metadata
                };
            });
    } else {
        toolActivities = (team.recentActivity || [])
            .filter(item => {
                const channel = team.channels?.find(c => c.name === item.channel);
                return channel?.platform === tool || (tool === 'trello' && item.metadata?.platform === 'Trello') || (tool === 'slack' && !channel?.platform);
            })
            .map(item => ({
                id: item.id,
                type: tool,
                platform: tool,
                action: item.actionType,
                target: `${item.channel}: "${item.description}"`,
                actor: item.user.name,
                time: new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                icon: tool === 'slack' ? Activity : FileText,
                color: tool === 'slack' ? 'text-emerald-600' : 'text-blue-600',
                bg: tool === 'slack' ? 'bg-emerald-50' : 'bg-blue-50',
                resourceName: item.channel,
                metadata: item.metadata
            }));
    }

    const displayedActivities = isExpanded ? toolActivities : toolActivities.slice(0, 5);
    const hasMore = toolActivities.length > 5;

    return (
        <div key={tool} className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-3 shadow-sm">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center p-1">
                            <PlatformIcon platform={tool} className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 capitalize leading-tight flex items-center gap-2">
                                {tool === 'github' ? 'Repositories' : tool === 'slack' ? 'Channels' : tool === 'trello' ? 'Boards' : 'SharePoint'}
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
                        <span className="text-[10px] text-slate-400 font-medium">
                            {toolActivities.length > 0 ? "Last active: Just now" : "No recent data"}
                        </span>
                    </div>
                </div>
            </div>
            <Card className="min-h-[100px] flex flex-col justify-center">
                <div className="p-0">
                    {toolActivities.length === 0 ? (
                        <div className="py-8 text-center px-4">
                            <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2 opacity-50" />
                            <p className="text-xs text-slate-400">No recent {tool} activity found for this stack.</p>
                            <p className="text-[10px] text-slate-300 mt-1">Actions on connected resources will appear here.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {displayedActivities.map((item, idx) => (
                                <Link
                                    key={idx}
                                    href={`/stacks/${team.id}/activity/${item.id || '#'}`}
                                    className="p-3 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer group block"
                                >
                                    <div className="mt-0.5">
                                        <div className="flex items-center justify-center">
                                            {item.action === 'Pushed Code' ? (
                                                <GitCommit className={`w-3.5 h-3.5 ${item.color}`} />
                                            ) : item.action === 'Merged PR' ? (
                                                <GitPullRequest className={`w-3.5 h-3.5 ${item.color}`} />
                                            ) : item.platform ? (
                                                <PlatformIcon platform={item.platform} className="w-4 h-4" />
                                            ) : (
                                                <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-xs font-bold text-slate-900 truncate pr-2 group-hover:text-blue-600 transition-colors">
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
                                                {item.resourceName || (item.type === 'github' ? 'Repository' : 'Channel')}
                                            </span>
                                            <span className="text-[9px] text-slate-400">•</span>
                                            <span className="text-[10px] font-medium text-slate-600">{item.actor}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
                {/* View More Logic */}
                {hasMore && (
                    <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-full text-xs text-blue-600 font-medium hover:text-blue-800 flex items-center justify-center gap-1 py-1"
                        >
                            {isExpanded ? (
                                <>Show Less</>
                            ) : (
                                <>View {toolActivities.length - 5} more activities</>
                            )}
                        </button>
                    </div>
                )}
            </Card>
        </div>
    );
}
