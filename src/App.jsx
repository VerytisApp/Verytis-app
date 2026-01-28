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
    const [currentRole, setCurrentRole] = useState('Admin'); // Lifted state for Role-Based Access Control

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 font-sans text-slate-900 selection:bg-indigo-200 overflow-hidden">
            {/* Floating Sidebar */}
            <FloatingSidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={setIsSidebarCollapsed}
                onModalOpen={setActiveModal}
                currentRole={currentRole}
                onRoleChange={setCurrentRole}
            />

            {/* Main Content Area */}
            <main className={`${isSidebarCollapsed ? 'ml-24' : 'ml-56'} p-8 min-h-screen transition-all duration-300 ease-out`}>
                <div className="max-w-6xl mx-auto">
                    <Routes>
                        <Route path="/" element={<Dashboard userRole={currentRole} />} />
                        <Route path="/dashboard" element={<Dashboard userRole={currentRole} />} />

                        <Route path="/teams" element={<Teams userRole={currentRole} />} />
                        <Route path="/teams/:teamId" element={<TeamDetail userRole={currentRole} />} />

                        <Route path="/users" element={<UsersAndRoles userRole={currentRole} />} />
                        <Route path="/users/:userId" element={<UserDetail userRole={currentRole} />} />

                        <Route path="/channels" element={<Channels userRole={currentRole} />} />
                        <Route path="/channels/:channelId" element={<ChannelDetail userRole={currentRole} />} />

                        <Route path="/timeline" element={<Timeline userRole={currentRole} />} />
                        <Route path="/timeline/:channelId" element={<Timeline userRole={currentRole} />} />

                        <Route path="/email-audit" element={<EmailAudit userRole={currentRole} />} />
                        <Route path="/reports" element={<AuditDocumentation userRole={currentRole} />} />
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
