'use client';

import { Providers, useRole, useModal, useSidebar } from '@/lib/providers';
import FloatingSidebar from '@/components/layout/FloatingSidebar';
import { Modal } from '@/components/ui';
import IntegrationsSettings from '@/components/pages/IntegrationsSettings';
import AdminSecuritySettings from '@/components/pages/AdminSecuritySettings';
import PassportIDSettings from '@/components/pages/PassportIDSettings';

import { useParams } from 'next/navigation';

function DashboardContent({ children }) {
    const params = useParams();
    const { currentRole, setCurrentRole } = useRole();
    const { activeModal, setActiveModal } = useModal();
    const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebar();

    const handleRoleSwitch = async (role) => {
        try {
            const response = await fetch('/api/dev/switch-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
            });

            if (response.ok) {
                // Reload the page to apply the new session
                window.location.reload();
            } else {
                console.error('Failed to switch role');
                // Fallback to just changing the role in state
                setCurrentRole(role);
            }
        } catch (error) {
            console.error('Role switch error:', error);
            setCurrentRole(role);
        }
    };

    return (
        <>
            <FloatingSidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={setIsSidebarCollapsed}
                onModalOpen={setActiveModal}
                currentRole={currentRole}
                onRoleChange={handleRoleSwitch}
            />

            <main className={`${isSidebarCollapsed ? 'ml-24' : 'ml-56'} p-8 min-h-screen transition-all duration-300 ease-out`}>
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>

            <Modal
                isOpen={activeModal === 'integrations'}
                onClose={() => setActiveModal(null)}
                title="Company Passport ID"
            >
                <IntegrationsSettings teamId={params?.teamId} />
            </Modal>

            <Modal
                isOpen={activeModal === 'account'}
                onClose={() => setActiveModal(null)}
                title="Admin Security & Logs"
            >
                <AdminSecuritySettings />
            </Modal>

            <Modal
                isOpen={activeModal === 'passport'}
                onClose={() => setActiveModal(null)}
                title="My Passport ID"
            >
                <PassportIDSettings />
            </Modal>
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
