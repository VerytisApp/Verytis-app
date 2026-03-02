'use client';

import { Providers, useRole, useSidebar } from '@/lib/providers';
import FloatingSidebar from '@/components/layout/FloatingSidebar';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import IcareLogo from '@/components/image/Gemini Generated Image (14).png';

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
                            name: profile.full_name || user.email.split('@')[0],
                            email: user.email,
                            initials: (profile.full_name?.substring(0, 2) || user.email.substring(0, 2)).toUpperCase(),
                            role: profile.role.charAt(0).toUpperCase() + profile.role.slice(1),
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
