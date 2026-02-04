'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Card } from '../ui';

import { useRole } from '@/lib/providers';

const PassportIDSettings = () => {
    const { currentUser, setCurrentUser } = useRole();
    const [passportStatus, setPassportStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Sync Slack info to Context when status is loaded and connected
    useEffect(() => {
        if (passportStatus?.connections?.slack?.connected && passportStatus.connections.slack.slackId) {
            const slackId = passportStatus.connections.slack.slackId;
            const slackEmail = passportStatus.connections.slack.email;

            // Only update if not already set to avoid infinite loops
            if (currentUser.slackId !== slackId) {
                console.log("Syncing Slack ID to Context:", slackId);
                setCurrentUser({
                    ...currentUser,
                    slackId: slackId,
                    slackEmail: slackEmail
                });
            }
        }
    }, [passportStatus, currentUser, setCurrentUser]);

    useEffect(() => {
        if (currentUser?.id && currentUser.id !== 'mock-admin-id') {
            fetchPassportStatus();
        }
    }, [currentUser?.id]);

    const fetchPassportStatus = async () => {
        if (!currentUser?.id || currentUser.id === 'mock-admin-id') return;

        setIsLoading(true);
        setError(null);
        try {
            // Pass the current DEV user ID to the API + cache buster
            const res = await fetch(`/api/user/passport-status?userId=${currentUser.id}&t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setPassportStatus(data);
            } else {
                throw new Error('Failed to fetch passport status');
            }
        } catch (e) {
            console.error('Error fetching passport status:', e);
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const integrations = [
        {
            id: 'slack',
            name: 'Slack',
            logo: 'https://www.google.com/s2/favicons?domain=slack.com&sz=128',
            description: 'Connect your Slack workspace for real-time collaboration tracking'
        },
        {
            id: 'teams',
            name: 'Microsoft Teams',
            logo: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128',
            description: 'Integrate with Microsoft Teams for enterprise communication'
        }
    ];

    if (isLoading && !passportStatus) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Passport ID
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Checking connection status...</p>
                    </div>
                </div>
                <div className="animate-pulse space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-24 bg-slate-100 rounded-lg"></div>)}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Passport ID
                </h2>
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
                    Error loading passport status: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        Passport ID
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Your connection status to external applications
                    </p>
                </div>
                <button
                    onClick={fetchPassportStatus}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Refresh status"
                >
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                </button>
            </div>

            {/* Info Banner */}
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs text-blue-700 leading-relaxed">
                    <strong>Passport ID</strong> is your unified identity across all connected services.
                    The connections shown below are managed by your organization administrator.
                </p>
            </div>

            {/* Integration Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map(integration => {
                    const status = passportStatus?.connections?.[integration.id];
                    const isConnected = status?.connected || false;

                    return (
                        <Card key={integration.id}>
                            <div className="p-5 space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                                            <img
                                                src={integration.logo}
                                                alt={integration.name}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">{integration.name}</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">{integration.description}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <span className="text-xs font-medium text-slate-600">Connection Status</span>
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isConnected
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                                        }`}>
                                        {isConnected ? (
                                            <>
                                                <CheckCircle className="w-3 h-3" />
                                                Connected
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-3 h-3" />
                                                Not Connected
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Connected Account Info / Manual Connect */}
                                {isConnected ? (
                                    <div className="pt-3 border-t border-slate-50">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Connected Account</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-medium text-slate-700 truncate max-w-[150px]" title={status.email}>
                                                {status.email}
                                            </p>
                                            <button className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-medium">
                                                Switch Account
                                            </button>
                                        </div>
                                        {status.lastSync && (
                                            <div className="text-[10px] text-slate-400 mt-1">
                                                Last sync: {new Date(status.lastSync).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="pt-3 border-t border-slate-50">
                                        {status?.reason === 'email_mismatch' && (
                                            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md animate-in fade-in zoom-in-95 duration-200">
                                                <p className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                                                    ⚠️ Email Mismatch
                                                </p>
                                                <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
                                                    We couldn't automatically find a match for <strong>{currentUser?.email}</strong> in {integration.name}.
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex justify-end">
                                            <button className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline">
                                                {status?.reason === 'email_mismatch' ? 'Link Account Manually' : 'Connect manually'} &rarr;
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Footer Note */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                    <strong>Note:</strong> To connect or disconnect services, please contact your organization administrator.
                    This view is read-only and reflects the current state of your Passport ID.
                </p>
            </div>

        </div>
    );
};

export default PassportIDSettings;
