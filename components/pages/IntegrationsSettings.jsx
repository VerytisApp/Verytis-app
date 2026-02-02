import { useState, useEffect } from 'react';
import { Zap, CheckCircle, AlertCircle, RefreshCw, Lock } from 'lucide-react';
import { Card, Button } from '../ui';

const IntegrationsSettings = () => {
    const [selectedAppId, setSelectedAppId] = useState('slack');

    // Simulating connection state
    const [connections, setConnections] = useState({
        slack: { connected: false, lastSync: null },
        microsoft: { connected: true, lastSync: '30 secs ago' }
    });

    const [activeTab, setActiveTab] = useState('overview');
    const [channels, setChannels] = useState([]);
    const [isLoadingChannels, setIsLoadingChannels] = useState(false);

    // Check for connection success from URL
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('connected') === 'true' && !connections.slack.connected) {
                setConnections(prev => ({
                    ...prev,
                    slack: { connected: true, lastSync: 'Just now' }
                }));
                // Remove param from URL without refresh
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }, [connections.slack.connected]); // Re-run if slack connection status changes

    const handleConnect = async (appId) => {
        if (appId === 'slack') {
            if (!connections.slack.connected) {
                window.location.href = '/api/slack/install';
            } else {
                // Disconnect logic
                setConnections(prev => ({
                    ...prev,
                    slack: { connected: false, lastSync: null }
                }));
                setChannels([]); // Clear channels on disconnect
                setActiveTab('overview'); // Reset tab to overview on disconnect
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
            const res = await fetch('/api/slack/channels');
            const data = await res.json();
            if (data.channels) setChannels(data.channels);
        } catch (error) {
            console.error("Failed to fetch channels", error);
        } finally {
            setIsLoadingChannels(false);
        }
    };

    // Auto-fetch channels if connected and tab is channels
    useEffect(() => {
        if (selectedAppId === 'slack' && connections.slack.connected && activeTab === 'channels' && channels.length === 0 && !isLoadingChannels) {
            fetchChannels();
        }
    }, [selectedAppId, connections.slack.connected, activeTab, channels.length, isLoadingChannels]);


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
            id: 'microsoft',
            name: 'Microsoft 365',
            category: 'Productivity',
            logo: "https://www.google.com/s2/favicons?domain=microsoft.com&sz=128",
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-100',
            description: "Synchronisation des métadonnées e-mail pour la traçabilité des échanges externes (Headers & Sujets uniquement).",
            features: ['Metadata Sync', 'Header Analysis', 'No Body Read'],
            permissions: ['Lecture En-têtes E-mails', 'Profil Utilisateur Basique']
        }
    ];

    const upcomingApps = [
        { id: 'jira', name: 'Jira', logo: "https://www.google.com/s2/favicons?domain=atlassian.com&sz=128" },
        { id: 'salesforce', name: 'Salesforce', logo: "https://www.google.com/s2/favicons?domain=salesforce.com&sz=128" },
        { id: 'notion', name: 'Notion', logo: "https://www.google.com/s2/favicons?domain=notion.so&sz=128" },
    ];

    const selectedApp = apps.find(a => a.id === selectedAppId) || apps[0];
    const isConnected = connections[selectedAppId]?.connected;

    return (
        <div className="flex h-[500px] gap-6 animate-in fade-in duration-300">
            {/* LEFT COLUMN: Master List */}
            <div className="w-1/3 flex flex-col gap-6 border-r border-slate-100 pr-2">

                {/* Active Apps Section */}
                <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Applications Disponibles</h3>
                    <div className="space-y-2">
                        {apps.map(app => (
                            <button
                                key={app.id}
                                onClick={() => setSelectedAppId(app.id)}
                                className={`w - full flex items - center gap - 3 p - 3 rounded - xl border text - left transition - all duration - 200 group relative
                                    ${selectedAppId === app.id
                                        ? 'bg-blue-50/50 border-blue-200 shadow-sm ring-1 ring-blue-500/10'
                                        : 'bg-white border-transparent hover:bg-slate-50'
                                    } `}
                            >
                                <div className={`p - 2 rounded - lg ${app.bgColor} ${app.borderColor} border`}>
                                    <img src={app.logo} alt={app.name} className="w-5 h-5 object-contain" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className={`text - sm font - bold ${selectedAppId === app.id ? 'text-slate-900' : 'text-slate-600'} `}>
                                            {app.name}
                                        </span>
                                        {connections[app.id].connected && (
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{app.category}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Upcoming Apps Section */}
                <div className="flex-1">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">À Venir</h3>
                    <div className="grid grid-cols-3 gap-2 px-1">
                        {upcomingApps.map(app => (
                            <div key={app.id} className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-not-allowed">
                                <img src={app.logo} alt={app.name} className="w-5 h-5 object-contain" />
                                <span className="text-[9px] font-medium text-slate-500">{app.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Detail View */}
            <div className="flex-1 flex flex-col h-full bg-slate-50/30 rounded-2xl border border-slate-100 overflow-hidden relative">

                {/* Header Pattern Background */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />

                <div className="p-8 relative z-10 flex flex-col h-full">

                    {/* App Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`p - 4 rounded - 2xl bg - white shadow - lg shadow - blue - 900 / 5 ring - 1 ring - slate - 900 / 5`}>
                                <img src={selectedApp.logo} alt={selectedApp.name} className="w-10 h-10 object-contain" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{selectedApp.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px - 2 py - 0.5 rounded - md text - [10px] font - bold uppercase tracking - wide border ${isConnected
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                        } `}>
                                        {isConnected ? 'Connecté' : 'Non Connecté'}
                                    </span>
                                    {isConnected && (
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <RefreshCw className="w-3 h-3" /> Sync: {connections[selectedApp.id].lastSync || 'Now'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Validated Toggle Button concept */}
                        <Button
                            onClick={() => handleConnect(selectedApp.id)}
                            className={`px-6 py-2 transition-all duration-300 ${isConnected
                                ? 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25'
                                } `}
                        >
                            {isConnected ? 'Déconnecter' : 'Connecter'}
                        </Button>
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 space-y-6">
                        <div className="prose prose-sm">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">À propos</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {selectedApp.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {selectedApp.features.map((feat, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs font-medium text-slate-700">{feat}</span>
                                </div>
                            ))}
                        </div>

                        {/* Technical Scopes (Collapsible-style look) */}
                        <div className="border-t border-slate-200/60 pt-6 mt-6">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Zap className="w-3 h-3" /> Permissions Requises
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedApp.permissions.map((perm, i) => (
                                    <span key={i} className="px-2 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-[10px] font-medium border border-slate-200 flex items-center gap-1.5">
                                        <Lock className="w-3 h-3 text-slate-400" />
                                        {perm}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer / Disclaimer */}
                    <div className="mt-8 pt-4 border-t border-slate-200 flex items-center gap-3 opacity-60">
                        <AlertCircle className="w-4 h-4 text-slate-500" />
                        <p className="text-[10px] text-slate-500 leading-tight">
                            Passport ID Société utilise des protocoles de chiffrement standards (TLS/AES).
                            Vos données d'audit sont sécurisées et confidentielles.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntegrationsSettings;
