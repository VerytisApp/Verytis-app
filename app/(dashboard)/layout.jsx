'use client';

import { Providers, useRole, useSidebar } from '@/lib/providers';
import FloatingSidebar from '@/components/layout/FloatingSidebar';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import IcareLogo from '@/components/image/LOGO.PNG-ICARE.svg';

import { useParams, useRouter } from 'next/navigation';

function DashboardContent({ children }) {
    const params = useParams();
    const router = useRouter();
    const { currentRole, setCurrentRole, currentUser, setCurrentUser } = useRole();
    const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebar();
    const supabase = createClient();

    const [isAppReady, setIsAppReady] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Bridge Logic: If we land here with OAuth params, it's a miss-redirect from GitHub App Setup
                const searchParams = new URLSearchParams(window.location.search);
                const hasState = searchParams.get('state');
                const hasCode = searchParams.get('code');
                const hasInstallId = searchParams.get('installation_id');

                if (hasState && (hasCode || hasInstallId)) {
                    console.log('[DASHBOARD] Stray GitHub/OAuth params detected, forwarding to API...');
                    window.location.href = `/api/auth/github/callback${window.location.search}`;
                    return;
                }

                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (profile) {
                        setCurrentUser({
                            id: profile.id,
                            name: profile.full_name || user.email?.split('@')[0] || 'User',
                            email: user.email,
                            initials: (profile.full_name?.substring(0, 2) || user.email?.substring(0, 2) || 'U').toUpperCase(),
                            role: profile.role ? (profile.role.charAt(0).toUpperCase() + profile.role.slice(1)) : 'Member',
                            color: 'from-blue-500 to-indigo-600'
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching user session:", error);
            } finally {
                // Add a tiny artificial delay to ensure smooth transition and show off the preloader logo slightly
                setTimeout(() => setIsAppReady(true), 500);
            }
        };
        fetchUser();
    }, []);

    if (!isAppReady) {
        return (
            <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-[9999]">
                <div className="flex flex-col items-center justify-center animate-pulse scale-150">
                    <img src={IcareLogo.src || IcareLogo} alt="Verytis Logo" className="w-16 h-16 object-contain drop-shadow-md" />
                </div>
            </div>
        );
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <>
            <FloatingSidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={setIsSidebarCollapsed}
                currentRole={currentRole}
                user={currentUser}
                onLogout={handleLogout}
            />

            <main className={`${isSidebarCollapsed ? 'ml-24' : 'ml-56'} p-8 min-h-screen transition-all duration-300 ease-out`}>
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </>
    );
}

export default function DashboardLayout({ children }) {
    return (
        <Providers>
            <DashboardContent>{children}</DashboardContent>
        </Providers>
    );
}
