import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Modal } from './components/ui';
import FloatingSidebar from './components/layout/FloatingSidebar';
import {
    Dashboard, Teams, TeamDetail, Channels, ChannelDetail, Timeline, EmailAudit,
    AuditDocumentation, UsersAndRoles, UserDetail, IntegrationsSettings, AdminSecuritySettings
} from './components/pages';

export default function App() {
    const [activeModal, setActiveModal] = useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 font-sans text-slate-900 selection:bg-indigo-200 overflow-hidden">
            {/* Floating Sidebar */}
            <FloatingSidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={setIsSidebarCollapsed}
                onModalOpen={setActiveModal}
            />

            {/* Main Content Area */}
            <main className={`${isSidebarCollapsed ? 'ml-24' : 'ml-56'} p-8 min-h-screen transition-all duration-300 ease-out`}>
                <div className="max-w-6xl mx-auto">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />

                        <Route path="/teams" element={<Teams />} />
                        <Route path="/teams/:teamId" element={<TeamDetail />} />

                        <Route path="/users" element={<UsersAndRoles />} />
                        <Route path="/users/:userId" element={<UserDetail />} />

                        <Route path="/channels" element={<Channels />} />
                        <Route path="/channels/:channelId" element={<ChannelDetail />} />

                        <Route path="/timeline" element={<Timeline />} />
                        <Route path="/timeline/:channelId" element={<Timeline />} />

                        <Route path="/email-audit" element={<EmailAudit />} />
                        <Route path="/reports" element={<AuditDocumentation />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
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
