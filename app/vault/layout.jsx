'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Shield, Lock } from 'lucide-react';
import IcareLogo from '@/components/image/LOGO.PNG-ICARE.svg';

export default function VaultLayout({ children }) {
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkAccess = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) { router.push('/login'); return; }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, full_name, email, avatar_url')
                .eq('id', authUser.id)
                .single();

            if (profile?.role !== 'admin') {
                router.push('/');
                return;
            }

            setUser({
                name: profile.full_name || authUser.email?.split('@')[0] || 'Admin',
                email: authUser.email,
                initials: (profile.full_name?.substring(0, 2) || authUser.email?.substring(0, 2) || 'AD').toUpperCase(),
            });
            setAuthorized(true);
            setLoading(false);
        };
        checkAccess();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center animate-pulse border border-blue-100">
                        <Lock className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-sm text-slate-500 font-mono">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!authorized) return null;

    return (
        <html lang="en">
            <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
                {/* Vault Top Bar */}
                <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/90 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <img src={IcareLogo.src || IcareLogo} alt="ICARE" className="w-8 h-8 object-contain" />
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 tracking-tight">Verytis Vault</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-200 uppercase tracking-wider">
                                Archive Zone
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            WORM Sealed
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                            <Lock className="w-3 h-3" />
                            Read-Only
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        {/* Connected User */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                {user?.initials}
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-slate-900">{user?.name}</div>
                                <div className="text-[10px] text-slate-500">{user?.email}</div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="pt-14">
                    {children}
                </main>
            </body>
        </html>
    );
}
