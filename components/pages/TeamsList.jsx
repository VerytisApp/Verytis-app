'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Plus, MoreHorizontal, Shield, FileText, Download, Pencil, Users, Archive, Trash2, X, ChevronDown, Check, Settings } from 'lucide-react';
import { Card, Button, Modal, SkeletonTeamItem, EmptyState } from '../ui';
import ArchiveConfirmModal from '../ui/ArchiveConfirmModal';
import { useToast } from '../ui/Toast';
import { SCOPES_CONFIG } from '@/lib/constants';

const TeamsList = ({ userRole, currentUser: propUser }) => {
    const currentUser = propUser;
    const { showToast } = useToast();
    const fetcher = (...args) => fetch(...args).then(res => res.json());

    // Manager can invite but with restrictions
    const hasInviteScope = userRole === 'Admin' || userRole === 'Manager';

    // SWR Hooks for data management
    const { data: teamsData, isLoading: isTeamsLoading, mutate: mutateTeams } = useSWR(
        currentUser?.id || userRole === 'Admin' ? `/api/teams${currentUser?.id ? `?userId=${currentUser.id}` : ''}` : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 10000 }
    );

    const { data: usersData, isLoading: isUsersLoading } = useSWR('/api/users', fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 });
    const { data: channelsData, isLoading: isChannelsLoading } = useSWR('/api/resources/list', fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 });

    // Derived states
    const teams = teamsData?.teams || [];
    const availableUsers = usersData?.users || [];
    const availableChannels = (channelsData?.resources || []).filter(r => r.type === 'channel');
    const isLoading = isTeamsLoading && teams.length === 0; // Show loader only on first clear fetch

    const [dropdownState, setDropdownState] = useState({ type: false, addUser: false, memberRole: null });
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [modalConfig, setModalConfig] = useState({ type: null, team: null });
    const [showAddMember, setShowAddMember] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [teamFormData, setTeamFormData] = useState({
        name: '', description: '', type: 'operational', members: [], scopes: [], channels: []
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown && !event.target.closest('.action-menu')) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeDropdown]);

    const handleAction = (type, target) => {
        setActiveDropdown(null);
        if (type === 'delete') {
            setModalConfig({ type: 'delete', member: target });
        } else if (type === 'edit') {
            setTeamFormData({ email: target.email, role: target.role, name: target.name });
            setModalConfig({ type: 'edit', member: target });
        } else {
            setModalConfig({ type, member: target });
        }
    };

    const confirmDelete = async () => {
        const memberId = modalConfig.member?.id;
        if (!memberId) return;
        // In a real app, we'd call an API. Here we simulate success.
        showToast({
            title: 'Membre Supprimé',
            message: `"${modalConfig.member?.name}" a été retiré de l'organisation.`,
            type: 'success'
        });
        setModalConfig({ type: null, member: null });
    };

    // Filter teams based on backend response (which handles roles)
    const displayedTeams = teams;

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <header className="flex justify-between items-end">
                    <div className="space-y-2">
                        <div className="h-7 w-32 bg-slate-200 animate-pulse rounded-lg" />
                        <div className="h-4 w-64 bg-slate-100 animate-pulse rounded-md" />
                    </div>
                    {userRole === 'Admin' && <div className="h-9 w-28 bg-slate-200 animate-pulse rounded-lg" />}
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <SkeletonTeamItem key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Membres / Collaborateurs</h1>
                    <p className="text-slate-500 mt-1 text-xs font-medium">
                        {userRole === 'Member'
                            ? 'Overview of organization members.'
                            : userRole === 'Manager'
                                ? 'Manage members in your organization.'
                                : 'Manage users, roles, and access to internal AI agents.'}
                    </p>
                </div>
                {hasInviteScope && (
                    <Button variant="primary" icon={Plus} onClick={() => {
                        setTeamFormData({ email: '', role: 'Member', name: '', description: '', type: 'operational', members: [], scopes: [], channels: [] });
                        setModalConfig({ type: 'create', team: {} });
                    }}>Invite Member</Button>
                )}
            </header>
            <Card className="overflow-hidden shadow-sm min-h-[400px]">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 uppercase tracking-wide">Nom / Email</th>
                            <th className="px-6 py-3 uppercase tracking-wide">Rôle</th>
                            <th className="px-6 py-3 uppercase tracking-wide">Statut</th>
                            {userRole !== 'Member' && <th className="px-6 py-3 text-right uppercase tracking-wide">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {availableUsers.length > 0 ? availableUsers.map(user => {
                            let role = user.role || 'Member';
                            let status = user.status || 'Active'; // Simulated status

                            return (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 border text-slate-600 font-bold flex items-center justify-center uppercase text-xs">
                                                {user.name?.substring(0, 2) || user.email?.substring(0, 2)}
                                            </div>
                                            <div>
                                                <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors block">
                                                    {user.name}
                                                </span>
                                                <span className="text-[10px] text-slate-500">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${role?.toLowerCase() === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : role?.toLowerCase() === 'manager' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            {role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {status}
                                        </span>
                                    </td>

                                    {userRole?.toLowerCase() !== 'member' && (
                                        <td className="px-6 py-4 text-right relative action-menu">
                                            {(userRole?.toLowerCase() === 'admin' || (userRole?.toLowerCase() === 'manager' && user.role?.toLowerCase() === 'member')) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdown(activeDropdown === user.id ? null : user.id);
                                                    }}
                                                    className={`text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded ${activeDropdown === user.id ? 'bg-slate-100 text-slate-900' : ''}`}
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            )}
                                            {activeDropdown === user.id && (
                                                <div className="absolute right-8 top-8 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right text-left">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => handleAction('edit', user)}
                                                            className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5 text-slate-400" /> Edit Role
                                                        </button>
                                                        {userRole?.toLowerCase() === 'admin' && (
                                                            <>
                                                                <div className="h-px bg-slate-100 my-1"></div>
                                                                <button
                                                                    onClick={() => handleAction('delete', user)}
                                                                    className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" /> Remove Member
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-12">
                                    <EmptyState
                                        title="No members"
                                        description="Invite your collaborators to your AI-Ops workspace."
                                        icon={Users}
                                    />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>

            {/* Edit / Create Modal */}
            <Modal
                isOpen={modalConfig.type === 'edit' || modalConfig.type === 'create'}
                onClose={() => setModalConfig({ type: null, member: null })}
                title={modalConfig.type === 'create' ? `Inviter un Collaborateur` : `Modifier le Rôle de ${modalConfig.member?.name}`}
                maxWidth={modalConfig.type === 'create' ? "max-w-2xl" : "max-w-lg"}
            >
                {modalConfig.type === 'create' ? (
                    <div className="space-y-6 pt-2">
                        {/* ... existing invitation form ... */}
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-4 mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="text-xs text-blue-800 leading-relaxed">
                                <p className="font-bold mb-1">Invitation SaaS</p>
                                Envoyez une invitation par email pour accorder l'accès à votre console AI-Ops.
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Adresse Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="ex: jean.dupont@entreprise.com"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    value={teamFormData.email || ''}
                                    onChange={e => setTeamFormData({ ...teamFormData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rôle</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Member', 'Manager', 'Admin'].map((role) => {
                                        const isDisabled = userRole?.toLowerCase() === 'manager' && (role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'manager');
                                        return (
                                            <button
                                                key={role}
                                                type="button"
                                                disabled={isDisabled}
                                                onClick={() => setTeamFormData({ ...teamFormData, role })}
                                                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all font-bold text-[10px] ${isDisabled ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100' : (teamFormData.role?.toLowerCase() || 'member') === role?.toLowerCase()
                                                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                                                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                                    }`}
                                            >
                                                {role?.toLowerCase() === 'admin' ? <Shield className="w-4 h-4" /> : role?.toLowerCase() === 'manager' ? <Settings className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                                {role}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button variant="ghost" onClick={() => setModalConfig({ type: null, member: null })}>Annuler</Button>
                            <Button
                                variant="primary"
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 px-8 font-bold"
                                disabled={!teamFormData.email || !teamFormData.email.includes('@')}
                                onClick={() => {
                                    showToast({
                                        title: 'Invitation Envoyée',
                                        message: `Une invitation a été envoyée à ${teamFormData.email}`,
                                        type: 'success'
                                    });
                                    setModalConfig({ type: null, member: null });
                                }}
                            >
                                Envoyer l'invitation
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 pt-2">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rôle</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Member', 'Manager', 'Admin'].map((role) => {
                                        const isCurrentRole = role?.toLowerCase() === modalConfig.member?.role?.toLowerCase();
                                        const targetRole = modalConfig.member?.role?.toLowerCase();
                                        const isDisabled = isCurrentRole || (userRole?.toLowerCase() === 'manager' && (role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'manager' || targetRole === 'admin' || targetRole === 'manager'));
                                        return (
                                            <button
                                                key={role}
                                                type="button"
                                                disabled={isDisabled}
                                                onClick={() => setTeamFormData({ ...teamFormData, role })}
                                                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all font-bold text-[10px] ${isDisabled ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100' : (teamFormData.role?.toLowerCase() || 'member') === role?.toLowerCase()
                                                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                                                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                                    }`}
                                            >
                                                {role?.toLowerCase() === 'admin' ? <Shield className="w-4 h-4" /> : role?.toLowerCase() === 'manager' ? <Settings className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                                {role} {isCurrentRole && <span className="text-[8px] font-normal">(Actuel)</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-slate-400 italic pt-1">
                                    {userRole?.toLowerCase() === 'manager'
                                        ? "Les Managers ne peuvent pas promouvoir de membres."
                                        : (teamFormData.role?.toLowerCase() === 'admin'
                                            ? 'Accès complet : Gestion des agents, exports et facturation.'
                                            : teamFormData.role?.toLowerCase() === 'manager'
                                                ? 'Accès étendu : Gestion des agents et exports, pas de facturation.'
                                                : 'Accès restreint : Visualisation uniquement, pas d\'export possible.')}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button variant="ghost" onClick={() => setModalConfig({ type: null, member: null })}>Annuler</Button>
                            <Button
                                variant="primary"
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 px-8 font-bold"
                                onClick={() => {
                                    showToast({
                                        title: 'Rôle Mis à Jour',
                                        message: `Le rôle de ${modalConfig.member?.name} est maintenant ${teamFormData.role}.`,
                                        type: 'success'
                                    });
                                    setModalConfig({ type: null, member: null });
                                }}
                            >
                                Enregistrer
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Manage Members Modal */}
            <Modal
                isOpen={modalConfig.type === 'members'}
                onClose={() => setModalConfig({ type: null, team: null })}
                title={`Members: ${modalConfig.team?.name}`}
            >
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Manage Members</h3>
                    <p className="text-xs text-slate-500 mb-6">
                        Detailed member management, including role assignments and removals, is available in the Team Details page.
                    </p>
                    <div className="flex justify-center gap-3">
                        <Button variant="ghost" onClick={() => setModalConfig({ type: null, team: null })}>Cancel</Button>
                        <Link href={`/teams/${modalConfig.team?.id}`}>
                            <Button variant="primary">Go to Team Details</Button>
                        </Link>
                    </div>
                </div>
            </Modal>

            <ArchiveConfirmModal
                isOpen={modalConfig.type === 'delete'}
                onClose={() => setModalConfig({ type: null, member: null })}
                onConfirm={confirmDelete}
                title="Supprimer le Membre"
                subtitle={modalConfig.member?.name ? `Retirer "${modalConfig.member.name}" de l'organisation ?` : ''}
                details={[
                    'Révoquer tous les accès à la console Verytis',
                    'Supprimer les clés API personnelles éventuellement liées',
                    'Désactiver le compte pour cet espace de travail',
                ]}
                confirmLabel="Supprimer définitivement"
                variant="danger"
            />
        </div>
    );
};

export default TeamsList;
