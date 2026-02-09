
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function VerifySlackPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    // Status: verifying, confirm_needed, linking, success, error
    const [status, setStatus] = useState('verifying');
    const [errorMsg, setErrorMsg] = useState('');
    const [linkData, setLinkData] = useState(null);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMsg('Invalid link: No token provided.');
            return;
        }

        // 1. Decode token (client-side unsafe decode just for UI preview, verify on server!)
        try {
            const [headerB64] = token.split('.');
            if (headerB64) {
                const payload = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
                setLinkData(payload);

                if (payload.exp < Date.now()) {
                    setStatus('error');
                    setErrorMsg('This link has expired.');
                    return;
                }

                setStatus('confirm_needed');
            } else {
                setStatus('error');
                setErrorMsg('Invalid token format.');
            }
        } catch (e) {
            console.error("Decode error", e);
            setStatus('error');
            setErrorMsg('Corrupted link.');
        }
    }, [token]);

    const handleConfirm = async () => {
        setStatus('linking');
        try {
            const res = await fetch('/api/user/confirm-slack-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Linking failed.');
            }

            setStatus('success');
        } catch (e) {
            setStatus('error');
            setErrorMsg(e.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>

                    {/* Logo Section */}
                    <div className="mb-6 flex justify-center">
                        <div className="w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-sm flex items-center justify-center p-2 shadow-inner border border-white/20">
                            <Image src="/logo-verytis.png" alt="Verytis" width={80} height={80} priority className="object-contain" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight">Connect Slack</h1>
                    <p className="text-slate-300 mt-2 text-sm">Secure your Verytis workflow</p>
                </div>

                <div className="p-8">
                    {status === 'verifying' && (
                        <div className="text-center py-8">
                            <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-slate-500 font-medium">Verifying link...</p>
                        </div>
                    )}

                    {status === 'confirm_needed' && linkData && (
                        <div className="space-y-6">
                            <p className="text-center text-slate-600">
                                You are about to link the Slack account <br />
                                <strong className="text-slate-900">{linkData.e}</strong>
                            </p>

                            {/* Organization Context */}
                            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">

                                {/* Org Header */}
                                <div className="p-4 bg-slate-100/50">
                                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Organization</span>
                                    <div className="font-semibold text-slate-900 mt-1">{linkData.o || 'Verytis Organization'}</div>
                                </div>

                                {/* Verytis Account */}
                                <div className="p-4 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-500 mb-0.5">Verytis Account</span>
                                        <span className="font-medium text-slate-900 text-sm">{linkData.ve || 'your.email@example.com'}</span>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                </div>

                                {/* Slack Account */}
                                <div className="p-4 flex justify-between items-center bg-blue-50/50">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-500 mb-0.5">Slack Account</span>
                                        <span className="font-medium text-slate-900 text-sm">{linkData.e}</span>
                                    </div>
                                    {/* Slack Icon Image */}
                                    <div className="w-5 h-5 flex items-center justify-center">
                                        <Image src="/slack-logo.png" alt="Slack" width={20} height={20} className="object-contain" />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleConfirm}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Confirm Connection
                            </button>
                        </div>
                    )}

                    {status === 'linking' && (
                        <div className="text-center py-8 space-y-4">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-slate-600 font-medium">Linking accounts securely...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center space-y-6 py-4">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-in bounce-in">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Link Successful!</h2>
                                <p className="text-slate-500 mt-2">
                                    Your Slack account is now connected. You can close this window and return to the app.
                                </p>
                            </div>
                            <Link
                                href="/users"
                                className="block w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
                            >
                                Return to Dashboard
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center space-y-6 py-4">
                            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Connection Failed</h2>
                                <p className="text-rose-600 mt-2 font-medium bg-rose-50 p-3 rounded-lg border border-rose-100 text-sm">
                                    {errorMsg}
                                </p>
                            </div>
                            <Link
                                href="/users"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to settings
                            </Link>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">© 2026 Verytis Security</p>
                </div>
            </div>
        </div>
    );
}
