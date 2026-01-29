import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, MessageSquare, FileText, Users, Clock, Mail,
    Settings, LogOut, MoreVertical, Layers, ChevronLeft
} from 'lucide-react';
import IcareLogo from '../image/Gemini Generated Image (14).png';

const FloatingSidebar = ({ onModalOpen, isCollapsed, onToggleCollapse, currentRole, onRoleChange }) => {
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    // currentRole and onRoleChange are now passed as props from App.jsx
    const profileMenuRef = useRef(null);
    const location = useLocation();

    // Define user personas for display
    const userPersonas = {
        Admin: { name: 'Sarah Jenkins', initials: 'SJ', role: 'Admin', color: 'from-blue-500 to-purple-600' },
        Manager: { name: 'David Chen', initials: 'DC', role: 'Manager', color: 'from-emerald-500 to-teal-600' },
        Member: { name: 'Elena Ross', initials: 'ER', role: 'Member', color: 'from-amber-500 to-orange-600' }
    };

    const currentUser = userPersonas[currentRole];

    const allNavItems = [
        { path: '/', altPath: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager'] },
        { path: '/teams', label: 'Teams', icon: Layers, roles: ['Admin', 'Manager', 'Member'] },
        { path: '/users', label: 'Users', icon: Users, roles: ['Admin'] },
        { path: '/channels', label: 'Channels', icon: MessageSquare, roles: ['Admin', 'Manager', 'Member'] },
        { path: '/timeline', label: 'Timeline', icon: Clock, roles: ['Admin', 'Manager', 'Member'] },
        { path: '/email-audit', label: 'Email Audit', icon: Mail, roles: ['Admin', 'Manager', 'Member'] },
        { path: '/reports', label: 'Reports', icon: FileText, roles: ['Admin', 'Manager', 'Member'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(currentRole));

    useEffect(() => {
        function handleClickOutside(event) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setProfileMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isActive = (item) => {
        const currentPath = location.pathname;
        if (item.altPath) {
            return currentPath === item.path || currentPath === item.altPath || currentPath.startsWith(item.path + '/');
        }
        return currentPath === item.path || currentPath.startsWith(item.path + '/');
    };

    return (
        <aside
            className={`fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${isCollapsed ? 'w-[72px]' : 'w-[200px]'}`}
            style={{ height: 'calc(100vh - 32px)' }}
        >
            {/* Logo Section */}
            <div className={`py-4 ${isCollapsed ? '' : 'px-3'}`}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'justify-between px-3'}`}>
                    <NavLink
                        to="/"
                        className="cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => isCollapsed && onToggleCollapse(false)}
                    >
                        <img src={IcareLogo} alt="ICARE" className="w-10 h-10 object-contain" />
                    </NavLink>

                    {/* Close button - only when expanded */}
                    {!isCollapsed && (
                        <button
                            onClick={() => onToggleCollapse(true)}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="px-3 py-2 flex-1">
                {/* Menu label */}
                <div className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-3 transition-all duration-200 ${isCollapsed ? 'opacity-0 h-0 mb-0' : 'opacity-100'}`}>
                    Menu
                </div>
                <nav className="space-y-1">
                    {navItems.map(item => {
                        const active = isActive(item);
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`w-full flex items-center transition-all duration-200 ${isCollapsed ? 'justify-center px-0' : 'justify-start px-3'} py-2.5 rounded-xl text-xs font-medium ${active
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                                title={isCollapsed ? item.label : ''}
                            >
                                <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                                {/* Label */}
                                <span className={`ml-3 whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 ml-0' : 'opacity-100'}`}>
                                    {item.label}
                                </span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* Role Switcher - Dev Tool */}
            {!isCollapsed && (
                <div className="px-6 py-2 mb-2">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Dev: Switch Role</div>
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                        {['Admin', 'Manager', 'Member'].map(role => (
                            <button
                                key={role}
                                onClick={() => onRoleChange(role)}
                                className={`flex-1 py-1 px-2 rounded-md text-[9px] font-bold transition-all ${currentRole === role ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {role.charAt(0)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Profile Section */}
            <div className={`border-t border-slate-200/50 relative ${isCollapsed ? 'py-4' : 'p-4'}`} ref={profileMenuRef}>
                <AnimatePresence>
                    {profileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-2xl ring-1 ring-slate-900/5 p-1 z-50"
                        >
                            <button
                                onClick={() => { onModalOpen('integrations'); setProfileMenuOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-left font-medium"
                            >
                                <Settings className="w-3.5 h-3.5" />
                                Integrations
                            </button>
                            <button
                                onClick={() => { onModalOpen('account'); setProfileMenuOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-left font-medium"
                            >
                                <Users className="w-3.5 h-3.5" />
                                Security & Account
                            </button>
                            <div className="h-px bg-slate-100 my-1" />
                            <div className="px-3 py-1.5 ">
                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">Current Role</span>
                                <div className="flex gap-1">
                                    {['Admin', 'Manager', 'Member'].map(role => (
                                        <button
                                            key={role}
                                            onClick={() => { onRoleChange(role); }}
                                            className={`text-[10px] px-1.5 py-0.5 rounded border ${currentRole === role ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-px bg-slate-100 my-1" />
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg text-left font-medium">
                                <LogOut className="w-3.5 h-3.5" />
                                Log Out
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'justify-between px-3'}`}>
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currentUser.color} flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-lg`}>
                            {currentUser.initials}
                        </div>
                        {/* User info - only when expanded */}
                        {!isCollapsed && (
                            <div className="text-xs">
                                <p className="font-bold text-slate-900 truncate w-24">{currentUser.name}</p>
                                <p className="text-[10px] text-slate-500 font-medium">{currentUser.role}</p>
                            </div>
                        )}
                    </div>

                    {/* Menu button - only when expanded */}
                    {!isCollapsed && (
                        <button
                            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ${profileMenuOpen ? 'bg-slate-100 text-slate-600' : ''}`}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default FloatingSidebar;
