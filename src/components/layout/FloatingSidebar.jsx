import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, MessageSquare, FileText, Users, Clock, Mail,
    Settings, LogOut, MoreVertical, Layers, ChevronLeft
} from 'lucide-react';
import IcareLogo from '../image/Gemini Generated Image (14).png';

const FloatingSidebar = ({ onModalOpen, isCollapsed, onToggleCollapse }) => {
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null);
    const location = useLocation();

    const navItems = [
        { path: '/', altPath: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/teams', label: 'Teams', icon: Layers },
        { path: '/users', label: 'Users', icon: Users },
        { path: '/channels', label: 'Channels', icon: MessageSquare },
        { path: '/timeline', label: 'Timeline', icon: Clock },
        { path: '/email-audit', label: 'Email Audit', icon: Mail },
        { path: '/reports', label: 'Reports', icon: FileText },
    ];

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
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
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
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg text-left font-medium">
                                <LogOut className="w-3.5 h-3.5" />
                                Log Out
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'justify-between px-3'}`}>
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                            SJ
                        </div>
                        {/* User info - only when expanded */}
                        {!isCollapsed && (
                            <div className="text-xs">
                                <p className="font-bold text-slate-900 truncate w-24">Sarah Jenkins</p>
                                <p className="text-[10px] text-slate-500 font-medium">Admin</p>
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
