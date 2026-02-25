'use client';

import React, { useState, useCallback } from 'react';
import { AlertTriangle, Archive, Shield, X } from 'lucide-react';

/**
 * ArchiveConfirmModal — Premium confirmation modal for destructive/archive actions.
 *
 * Props:
 *   isOpen       — boolean, controls visibility
 *   onClose      — () => void, close handler
 *   onConfirm    — () => void | Promise<void>, confirm handler
 *   title        — string, e.g. "Delete Agent"
 *   subtitle     — string, short description
 *   details      — string[], bullet list of what will happen
 *   variant      — 'danger' | 'warning' (default: 'danger')
 *   confirmLabel — string (default: 'Confirm & Archive')
 */
export default function ArchiveConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    subtitle = '',
    details = [],
    variant = 'danger',
    confirmLabel = 'Confirm & Archive',
}) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = useCallback(async () => {
        setLoading(true);
        try {
            await onConfirm?.();
        } finally {
            setLoading(false);
        }
    }, [onConfirm]);

    if (!isOpen) return null;

    const isDanger = variant === 'danger';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={!loading ? onClose : undefined}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">

                {/* Accent Bar */}
                <div className={`h-1 w-full ${isDanger ? 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500' : 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-400'}`} />

                {/* Header */}
                <div className="px-6 pt-5 pb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isDanger ? 'bg-rose-50 ring-1 ring-rose-100' : 'bg-amber-50 ring-1 ring-amber-100'}`}>
                            <AlertTriangle className={`w-5 h-5 ${isDanger ? 'text-rose-500' : 'text-amber-500'}`} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
                            {subtitle && (
                                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Details */}
                <div className="px-6 pb-4">
                    {/* Action Summary Box */}
                    <div className={`rounded-xl p-4 space-y-2.5 ${isDanger ? 'bg-rose-50/50 border border-rose-100' : 'bg-amber-50/50 border border-amber-100'}`}>
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${isDanger ? 'text-rose-400' : 'text-amber-500'}`}>
                            This action will:
                        </p>
                        <ul className="space-y-1.5">
                            {details.map((detail, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                                    <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDanger ? 'bg-rose-400' : 'bg-amber-400'}`} />
                                    {detail}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Vault Badge */}
                    <div className="mt-3 flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="p-1.5 bg-blue-50 rounded-md">
                            <Archive className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-slate-700">Archived to Vault</p>
                            <p className="text-[10px] text-slate-400">Sealed with SHA-256 integrity hash • Immutable audit record</p>
                        </div>
                        <Shield className="w-3.5 h-3.5 text-emerald-400 ml-auto flex-shrink-0" />
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-5 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-70 flex items-center gap-2 ${isDanger
                            ? 'bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-500/30'
                            : 'bg-amber-600 hover:bg-amber-700 shadow-sm shadow-amber-500/30'
                            }`}
                    >
                        {loading ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
