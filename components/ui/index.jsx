'use client';

import { Slack, Users, Mail, Hash } from 'lucide-react';

export const StatusBadge = ({ status }) => {
    const safeStatus = status || 'inactive';
    const styles = {
        active: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
        paused: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
        inactive: 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/10',
        linked: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10',
        pending: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10',
        validated: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
        rejected: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
        'authorization revoked': 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
        'connection error': 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10'
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ring-1 ring-inset ${styles[safeStatus.toLowerCase()] || styles.inactive}`}>
            {safeStatus}
        </span>
    );
};

export const PlatformIcon = ({ platform }) => {
    const getFavicon = (domain) => `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=64`;

    switch (platform.toLowerCase()) {
        case 'slack':
            return <img src={getFavicon('slack.com')} alt="Slack" className="w-4 h-4" />;
        case 'teams':
            return <img src={getFavicon('teams.microsoft.com')} alt="Teams" className="w-4 h-4" />;
        case 'google workspace':
            return <img src={getFavicon('workspace.google.com')} alt="Google Workspace" className="w-4 h-4" />;
        case 'microsoft 365':
            return <img src={getFavicon('microsoft.com')} alt="Microsoft 365" className="w-4 h-4" />;
        case 'github':
            return <img src={getFavicon('github.com')} alt="GitHub" className="w-4 h-4" />;
        case 'email':
            return <Mail className="w-3.5 h-3.5 text-slate-600" />;
        default:
            return <Hash className="w-3.5 h-3.5 text-slate-400" />;
    }
};

export const Card = ({ children, className = "", onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white rounded-xl border border-blue-50 shadow-sm transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-blue-200 hover:shadow-md hover:shadow-blue-100' : ''} ${className}`}
    >
        {children}
    </div>
);

export const Button = ({ variant = 'primary', icon: Icon, children, onClick, className = "" }) => {
    const baseStyle = "inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed leading-tight";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/30 ring-1 ring-inset ring-blue-500",
        secondary: "bg-white text-slate-700 border border-blue-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 shadow-sm",
        ghost: "bg-transparent text-slate-500 hover:bg-blue-50 hover:text-blue-700",
        danger: "bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 shadow-sm"
    };
    return (
        <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {children}
        </button>
    );
};

export const ToggleSwitch = ({ enabled, disabled, onClick }) => (
    <div onClick={() => !disabled && onClick && onClick()} className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors duration-300 ${enabled ? 'bg-blue-600' : 'bg-slate-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
        <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform duration-300 ${enabled ? 'translate-x-3.5' : 'translate-x-0'}`}></div>
    </div>
);

export const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-4xl" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 min-h-screen">
            <div className="absolute inset-0 transition-opacity duration-300 pointer-events-auto" onClick={onClose} />
            <div className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200`}>
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-md rounded-t-xl">
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <span className="sr-only">Close</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 md:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};
