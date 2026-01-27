import { useState } from 'react';
import { Modal } from './components/ui';
import FloatingSidebar from './components/layout/FloatingSidebar';
import {
    Dashboard, Teams, Channels, Timeline, EmailAudit,
    AuditDocumentation, UsersAndRoles, IntegrationsSettings, AdminSecuritySettings
} from './components/pages';

export default function App() {
    const [activePage, setActivePage] = useState('dashboard');
    const [pageParams, setPageParams] = useState({});
    const [activeModal, setActiveModal] = useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleNavigate = (page, params = {}) => {
        setActivePage(page);
        setPageParams(params);
    };

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard': return <Dashboard navigate={handleNavigate} />;
            case 'teams': return <Teams />;
            case 'channels': return <Channels navigate={handleNavigate} />;
            case 'timeline': return <Timeline initialChannelId={pageParams.channelId} />;
            case 'email_audit': return <EmailAudit />;
            case 'exports': return <AuditDocumentation />;
            case 'users': return <UsersAndRoles />;
            default: return <Dashboard navigate={handleNavigate} />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 font-sans text-slate-900 selection:bg-indigo-200 overflow-hidden">
            {/* Floating Sidebar */}
            <FloatingSidebar
                activePage={activePage}
                onNavigate={handleNavigate}
                onModalOpen={setActiveModal}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={setIsSidebarCollapsed}
            />

            {/* Main Content Area - Margins: expanded=200+24=224px (ml-56), collapsed=72+24=96px (ml-24) */}
            <main className={`${isSidebarCollapsed ? 'ml-24' : 'ml-56'} p-8 min-h-screen transition-all duration-300 ease-out`}>
                <div className="max-w-6xl mx-auto">
                    {renderPage()}
                </div>
            </main>

            {/* Modals */}
            <Modal
                isOpen={activeModal === 'integrations'}
                onClose={() => setActiveModal(null)}
                title="Integrations & Permissions"
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
        </div>
    );
}
