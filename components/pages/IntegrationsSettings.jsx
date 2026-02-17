import { useState, useEffect } from 'react';
import { Zap, CheckCircle, AlertCircle, RefreshCw, Lock, Shield, Info } from 'lucide-react';
import { Card, Button } from '../ui';

const GitHubRepositoriesView = ({ teamId }) => {
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRepos = async () => {
            try {
                const query = teamId ? `?teamId=${teamId}` : '';
                const res = await fetch(`/api/github/repositories${query}`);
                const data = await res.json();
                if (data.repositories) setRepos(data.repositories);
            } catch (error) {
                console.error("Failed to fetch repos", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRepos();
    }, [teamId]);



    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-xs text-slate-400 font-medium">Loading repositories...</p>
            </div>
        );
    }

    if (repos.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <img src="https://www.google.com/s2/favicons?domain=github.com&sz=64" alt="GitHub" className="w-6 h-6 opacity-50" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Aucun dépôt accessible</h3>
                <p className="text-slate-500 text-xs mt-2 max-w-sm mx-auto">
                    Assurez-vous d'avoir donné accès aux dépôts lors de l'installation.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-slate-500">
                    Active Repositories ({repos.length})
                </p>
                <div className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wide border border-emerald-100">
                    Auto-Sync Active
                </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {repos.map(repo => (
                    <div key={repo.id} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                <span className="font-bold text-xs">{repo.private ? '🔒' : '🌐'}</span>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-900">{repo.name}</div>
                                {repo.description && (
                                    <div className="text-xs text-slate-500 line-clamp-1 max-w-md">{repo.description}</div>
                                )}
                            </div>
                        </div>
                        <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            View
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

const IntegrationsSettings = ({ teamId }) => {
    const [selectedAppId, setSelectedAppId] = useState('slack');

    // Initial State (Clean, no fakes)
    const [connections, setConnections] = useState({
        slack: { connected: false, lastSync: null },
        github: { connected: false, lastSync: null }
    });

    const [activeTab, setActiveTab] = useState('overview');
    const [channels, setChannels] = useState([]);
    const [isLoadingChannels, setIsLoadingChannels] = useState(false);

    // 1. Fetch Real Status (Re-usable function)
    const checkStatus = async () => {
        try {
            // Slack Status
            const query = teamId ? `?teamId=${teamId}` : '';
            const resSlack = await fetch(`/api/slack/status${query}`);
            const dataSlack = await resSlack.json();
            if (dataSlack.connected) {
                setConnections(prev => ({
                    ...prev,
                    slack: { connected: true, lastSync: 'Connecté' }
                }));
            }

            // GitHub Status
            const resGithub = await fetch(`/api/github/status${query}`);
            const dataGithub = await resGithub.json();
            if (dataGithub.connected) {
                setConnections(prev => ({
                    ...prev,
                    github: { connected: true, lastSync: 'Connecté' }
                }));
            }
        } catch (e) {
            console.error("Status check failed", e);
        }
    };

    useEffect(() => {
        checkStatus();
    }, [teamId]);

    // Listener for Popup Message
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data.type === 'GITHUB_CONNECTED') {
                checkStatus();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // 2. Check for connection success callback from URL (Legacy/Fallback)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('connected') === 'true') {
                const app = params.get('app') || 'slack';
                setConnections(prev => ({
                    ...prev,
                    [app]: { connected: true, lastSync: 'À l\'instant' }
                }));
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }, []);

    const handleConnect = async (appId) => {
        if (appId === 'slack') {
            if (!connections.slack.connected) {
                const query = teamId ? `?teamId=${teamId}` : '';
                window.location.href = `/api/slack/install${query}`;
            } else {
                setConnections(prev => ({
                    ...prev,
                    slack: { connected: false, lastSync: null }
                }));
                setChannels([]);
                setActiveTab('overview');
            }
        } else if (appId === 'github') {
            if (!connections.github.connected) {
                // Open Popup
                const width = 600;
                const height = 700;
                const left = (window.screen.width - width) / 2;
                const top = (window.screen.height - height) / 2;
                const query = teamId ? `?teamId=${teamId}` : '';
                window.open(
                    `/api/auth/github/install${query}`,
                    'GitHubConnect',
                    `width=${width},height=${height},top=${top},left=${left}`
                );
            } else {
                setConnections(prev => ({
                    ...prev,
                    github: { connected: false, lastSync: null }
                }));
            }
        } else {
            // Original toggle logic for other apps
            setConnections(prev => ({
                ...prev,
                [appId]: {
                    ...prev[appId],
                    connected: !prev[appId].connected,
                    lastSync: !prev[appId].connected ? 'Just now' : null
                }
            }));
        }
    };

    const fetchChannels = async () => {
        setIsLoadingChannels(true);
        try {
            const query = teamId ? `?teamId=${teamId}` : '';
            const res = await fetch(`/api/slack/channels${query}`);
            const data = await res.json();
            if (data.channels) setChannels(data.channels);
        } catch (error) {
            console.error("Failed to fetch channels", error);
        } finally {
            setIsLoadingChannels(false);
        }
    };

    // Auto-fetch channels if connected and tab is channels
    // Auto-fetch channels if connected and tab is channels
    // Prevent loop: only fetch if we haven't successfully loaded, but be careful with dependencies.
    useEffect(() => {
        if (selectedAppId === 'slack' && connections.slack.connected && activeTab === 'channels') {
            // Only fetch if we have 0 channels and aren't loading.
            // AND we haven't failed recently? Simpler: Just check if empty.
            // usage of hasFetched ref is better, but for now let's just NOT react to channels.length
            // inside the check we look at channels.length, but we don't depend on it.
            if (channels.length === 0 && !isLoadingChannels) {
                fetchChannels();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAppId, connections.slack.connected, activeTab]);


    const apps = [
        {
            id: 'slack',
            name: 'Slack',
            category: 'Communication',
            logo: "https://www.google.com/s2/favicons?domain=slack.com&sz=128",
            bgColor: 'bg-[#4A154B]/5',
            borderColor: 'border-[#4A154B]/10',
            description: "Activez l'audit trail certifié pour vos canaux Slack. Capturez les décisions, validations et preuves en temps réel.",
            features: ['Certification des Echanges', 'Traçabilité Temporelle', 'Preuves d\'Audit', 'Recontextualisation des Décisions'],
            permissions: [
                'Accès aux Messages (Canaux/Groupes)',
                'Identification Utilisateurs (Email)',
                'Gestion de Fichiers & Preuves',
                'Publication de Messages'
            ]
        },
        {
            id: 'github',
            name: 'GitHub',
            category: 'Development',
            logo: "https://www.google.com/s2/favicons?domain=github.com&sz=128",
            bgColor: 'bg-slate-50',
            borderColor: 'border-slate-200',
            description: "Synchronisation des métadonnées de code pour la traçabilité des modifications et des validations (Commits & PRs uniquement).",
            features: ['Code Audit', 'Commit Tracking', 'PR Validation'],
            permissions: ['Lecture Repositories', 'Lecture Historique Commits', 'Lecture Pull Requests']
        }
    ];

    const upcomingApps = [
        { id: 'jira', name: 'Jira', logo: "https://www.google.com/s2/favicons?domain=atlassian.com&sz=128" },
        { id: 'salesforce', name: 'Salesforce', logo: "https://www.google.com/s2/favicons?domain=salesforce.com&sz=128" },
        { id: 'notion', name: 'Notion', logo: "https://www.google.com/s2/favicons?domain=notion.so&sz=128" },
    ];

    const selectedApp = apps.find(a => a.id === selectedAppId) || apps[0];
    const isConnected = connections[selectedAppId]?.connected;

    const [selectedChannels, setSelectedChannels] = useState(new Set());
    const [isSaving, setIsSaving] = useState(false);

    const toggleChannel = (channelId) => {
        const next = new Set(selectedChannels);
        if (next.has(channelId)) next.delete(channelId);
        else next.add(channelId);
        setSelectedChannels(next);
    };

    const handleSaveChannels = async () => {
        setIsSaving(true);
        try {
            const selectedList = channels.filter(c => selectedChannels.has(c.id));
            const res = await fetch('/api/slack/save-channels', {
                method: 'POST',
                body: JSON.stringify({ channels: selectedList })
            });
            if (res.ok) {
                alert('Canaux importés avec succès !');
                setSelectedChannels(new Set()); // Reset selection
            }
        } catch (e) {
            console.error('Save failed', e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-[600px] bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xl">
            {/* Sidebar */}
            <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col gap-4">
                {/* ... existing sidebar ... */}
                <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Applications Disponibles</h3>
                    <div className="space-y-2">
                        {apps.map(app => (
                            <button
                                key={app.id}
                                onClick={() => { setSelectedAppId(app.id); setActiveTab('overview'); }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 group relative
                                    ${selectedAppId === app.id
                                        ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-500/10'
                                        : 'bg-transparent border-transparent hover:bg-white hover:shadow-sm'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${selectedAppId === app.id ? 'bg-blue-50' : 'bg-slate-100 group-hover:bg-slate-50'}`}>
                                    <img src={app.logo} alt={app.name} className="w-6 h-6 object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-slate-900">{app.name}</div>
                                    <div className={`text-[10px] font-medium mt-0.5 flex items-center gap-1.5 ${connections[app.id].connected ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${connections[app.id].connected ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                        {connections[app.id].connected ? 'Connecté' : 'Non configuré'}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {/* App Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-white">
                    <div className="flex gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center p-3">
                            <img src={selectedApp.logo} alt={selectedApp.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{selectedApp.name} Gateway</h2>
                            <p className="text-sm text-slate-500 mt-1 max-w-md leading-relaxed">{selectedApp.description}</p>

                            {/* Tabs */}
                            <div className="flex gap-6 mt-6">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Overview
                                    {activeTab === 'overview' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>}
                                </button>
                                {connections[selectedAppId].connected && (
                                    <button
                                        onClick={() => setActiveTab('channels')}
                                        className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'channels' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {selectedAppId === 'github' ? 'Repositories' : 'Channels & Sources'}
                                        {activeTab === 'channels' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Connect Logic */}
                    <div className="flex flex-col items-end gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset inline-flex items-center gap-1.5
                            ${connections[selectedAppId].connected
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                : 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${connections[selectedAppId].connected ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                            {connections[selectedAppId].connected ? 'DATA FLOW ACTIVE' : 'NO CONNECTION'}
                        </div>

                        <button
                            onClick={() => handleConnect(selectedAppId)}
                            disabled={selectedAppId !== 'slack' && selectedAppId !== 'github'}
                            className={`px-6 py-2 transition-all duration-300 font-medium rounded-lg shadow-sm text-sm
                                ${connections[selectedAppId].connected
                                    ? 'bg-rose-600 text-white hover:bg-rose-700 hover:shadow-rose-500/20 shadow-rose-500/10'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg'
                                }`}
                        >
                            {connections[selectedAppId].connected ? 'Disconnect' : 'Connect'}
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    {activeTab === 'overview' ? (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Permissions Section */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-emerald-500" />
                                    Required Permissions
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedApp.permissions.map((perm, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="p-1.5 bg-white rounded shadow-sm border border-slate-100 text-blue-600">
                                                <Lock className="w-3 h-3" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-700">{perm}</div>
                                                <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">Required for audit trail.</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-4">
                                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-blue-900">E2E Encryption Active</h4>
                                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                                        Tokens are encrypted with AES-256 before storage. Verytis only reads messages where the bot is explicitly mentioned or invited.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            {selectedAppId === 'github' ? (
                                <GitHubRepositoriesView teamId={teamId} />
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm text-slate-500">
                                            Select channels to audit.
                                        </p>
                                        {selectedChannels.size > 0 && (
                                            <button
                                                onClick={handleSaveChannels}
                                                disabled={isSaving}
                                                className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                            >
                                                {isSaving ? 'Saving...' : `Import (${selectedChannels.size})`}
                                            </button>
                                        )}
                                    </div>

                                    {isLoadingChannels ? (
                                        <div className="text-center py-12">
                                            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                                            <p className="text-xs text-slate-400 font-medium">Loading channels...</p>
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                                            {channels.length === 0 ? (
                                                <div className="p-8 text-center text-slate-500 text-sm">
                                                    No channels found. Invite @Verytis to a channel to see it here.
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-slate-100">
                                                    {channels.map(channel => (
                                                        <div
                                                            key={channel.id}
                                                            onClick={() => toggleChannel(channel.id)}
                                                            className={`p-4 flex items-center justify-between hover:bg-blue-50/50 cursor-pointer transition-colors ${selectedChannels.has(channel.id) ? 'bg-blue-50/80' : 'bg-white'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedChannels.has(channel.id) ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'}`}>
                                                                    {selectedChannels.has(channel.id) && <CheckCircle className="w-3 h-3 text-white" />}
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" /></svg>
                                                                    <div>
                                                                        <span className="text-sm font-semibold text-slate-900">#{channel.name}</span>
                                                                        {channel.is_private && <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">Privé</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs font-medium text-slate-500">{channel.num_members} membres</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};



export default IntegrationsSettings;
