'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback(({ title, message, type = 'success', duration = 4000 }) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, title, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const value = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            layout
                            className="pointer-events-auto"
                        >
                            <div className="relative group overflow-hidden bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl p-4 pr-10 min-w-[320px] max-w-md ring-1 ring-slate-900/5 transition-all hover:bg-white hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)]">
                                {/* Accent gradient line */}
                                <div className={`absolute top-0 left-0 w-1 h-full ${toast.type === 'success' ? 'bg-gradient-to-b from-emerald-500 to-teal-500' :
                                        toast.type === 'error' ? 'bg-gradient-to-b from-rose-500 to-orange-500' :
                                            'bg-gradient-to-b from-blue-500 to-indigo-500'
                                    }`} />

                                <div className="flex gap-3">
                                    <div className={`mt-0.5 p-1.5 rounded-lg ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                                            toast.type === 'error' ? 'bg-rose-50 text-rose-600' :
                                                'bg-blue-50 text-blue-600'
                                        }`}>
                                        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                                        {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                                        {toast.type === 'info' && <Info className="w-5 h-5" />}
                                    </div>

                                    <div>
                                        {toast.title && <h4 className="text-sm font-bold text-slate-900">{toast.title}</h4>}
                                        <p className="text-xs font-medium text-slate-500 leading-relaxed mt-0.5">
                                            {toast.message}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="absolute top-3 right-3 p-1 text-slate-300 hover:text-slate-600 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
