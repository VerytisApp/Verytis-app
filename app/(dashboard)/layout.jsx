'use client';

import { Providers, useRole, useModal, useSidebar } from '@/lib/providers';
import FloatingSidebar from '@/components/layout/FloatingSidebar';
import { Modal } from '@/components/ui';
import IntegrationsSettings from '@/components/pages/IntegrationsSettings';
import AdminSecuritySettings from '@/components/pages/AdminSecuritySettings';

function DashboardContent({ children }) {
    const { currentRole, setCurrentRole } = useRole();
    const { activeModal, setActiveModal } = useModal();
    const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebar();

    return (
        <>
            <FloatingSidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={setIsSidebarCollapsed}
                onModalOpen={setActiveModal}
                currentRole={currentRole}
                onRoleChange={setCurrentRole}
            />

            <main className={`${isSidebarCollapsed ? 'ml-24' : 'ml-56'} p-8 min-h-screen transition-all duration-300 ease-out`}>
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>

            <Modal
                isOpen={activeModal === 'integrations'}
                onClose={() => setActiveModal(null)}
                title="Passport ID Société"
            >
                <IntegrationsSettings />
            </Modal>

            <Modal
                isOpen={activeModal === 'account'}
                onClose={() => setActiveModal(null)}
                title="Admin Security & Logs"
            >
                <AdminSecuritySettings />
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
