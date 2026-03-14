'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, CheckCircle, ShieldCheck, ArrowRight, Code, LineChart, Languages, Eye, Calendar, PenTool, Shield, FileText, UserPlus, Mail, Kanban, Target, Smile, TrendingUp, MessageCircle, Search, Headphones, Library, Users, Share2, Printer, Cloud, Database, Lock, Zap, Activity, BarChart3, Server, Scale, ShieldAlert, Check, X, Bot } from 'lucide-react';
import Image from 'next/image';
import icareLogo from '@/components/image/Gemini-Generated-Image-_14_.svg';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

/* Reusable favicon component with error fallback — proxied to avoid CORS */
function FavIcon({ domain, alt, className = "w-5 h-5 object-contain", size = 128 }) {
    const [hasError, setHasError] = useState(false);
    const initial = (domain || '?').replace('www.', '').charAt(0).toUpperCase();

    if (hasError) {
        return (
            <span className={`flex items-center justify-center bg-slate-100 text-slate-500 font-bold text-[10px] rounded ${className}`}>
                {initial}
            </span>
        );
    }

    return (
        <img
            src={`/api/favicon?domain=${encodeURIComponent(domain)}&sz=${size}`}
            alt={alt || domain}
            className={className}
            onError={() => setHasError(true)}
            loading="lazy"
        />
    );
}

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [orgName, setOrgName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const supabase = createClient();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Create user via backend API
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, fullName, orgName })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create account');
            }

            // 2. Automatically sign in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                throw signInError;
            }

            // 3. Success - redirect to home/dashboard
            router.push('/');
        } catch (err) {
            setError(err.message || 'An unexpected error occurred');
            setLoading(false);
        }
    };

    const handleOAuthSignup = async (provider) => {
        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
    };

    const gridItems = [
        { size: 'small', label: "Code Developer", icon: <Code size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" strokeWidth={1.5} /> },
        { size: 'small', label: "Finance Analyst", icon: <LineChart size={20} className="text-slate-400 group-hover:text-amber-500 transition-colors" strokeWidth={1.5} /> },
        { size: 'large', type: 'crm', name: "Digital SDR (Prospecting)", apps: ["salesforce.com", "notion.so", "slack.com"], llm: "openai.com", llmName: "OpenAI GPT-4o" },
        { size: 'small', label: "Live Translator", icon: <Languages size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" strokeWidth={1.5} /> },
        { size: 'small', label: "Market Research", icon: <Eye size={20} className="text-slate-400 group-hover:text-teal-500 transition-colors" strokeWidth={1.5} /> },
        { size: 'small', label: "SEO Copywriter", icon: <PenTool size={20} className="text-slate-400 group-hover:text-purple-500 transition-colors" strokeWidth={1.5} /> },
        { size: 'small', label: "Lead Scoring", icon: <Target size={20} className="text-slate-400 group-hover:text-pink-500 transition-colors" strokeWidth={1.5} /> },
        { size: 'large', type: 'support', name: "Customer Support Manager", apps: ["workday.com", "notion.so"], llm: "anthropic.com", llmName: "Claude 3.5" },
        { size: 'small', label: "Growth Marketer", icon: <Mail size={20} className="text-slate-400 group-hover:text-rose-500 transition-colors" strokeWidth={1.5} /> },
        { size: 'small', label: "Sentiment Analysis", icon: <Smile size={20} className="text-slate-400 group-hover:text-yellow-500 transition-colors" strokeWidth={1.5} /> },
        { size: 'small', label: "Data Analyst", icon: <TrendingUp size={20} className="text-slate-400 group-hover:text-green-500 transition-colors" strokeWidth={1.5} /> },
        { size: 'large', type: 'video', name: "AI Video Editor", apps: ["twitter.com", "instagram.com", "mailchimp.com"], llm: "google.com", llmName: "Google Gemini" },
        { size: 'small', label: "FAQ Responses", icon: <MessageCircle size={20} className="text-slate-400 group-hover:text-blue-400 transition-colors" strokeWidth={1.5} /> },
        { size: 'small', label: "SEO Audit", icon: <Search size={20} className="text-slate-400 group-hover:text-violet-500 transition-colors" strokeWidth={1.5} /> },
        { size: 'small', label: "Auto Accountant", icon: <Database size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" strokeWidth={1.5} /> },
        { size: 'small', label: "Supervisor", icon: <Zap size={20} className="text-slate-400 group-hover:text-yellow-400 transition-colors" strokeWidth={1.5} /> },
    ];

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* LEFT — Form (same as login page) */}
            <div className="w-full lg:w-[560px] xl:w-[600px] shrink-0 flex items-start justify-center pt-32 p-6 relative bg-slate-50 border-r border-slate-200">
                {/* Background Orbs */}
                <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <div className="absolute w-[500px] h-[500px] bg-sky-200/30 rounded-full blur-[80px] -left-[10%] top-[10%]"></div>
                    <div className="absolute w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[80px] right-[0%] bottom-[0%]"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-8"
                >
                    {/* Header */}
                    <div className="text-center mb-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200 shadow-sm mb-3">
                            7-day free trial
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-1.5">Start for free</h2>
                        <p className="text-slate-500 text-sm">No credit card required. <span className="font-semibold text-slate-700">Cancel anytime.</span></p>
                    </div>

                    {/* Trial perks */}
                    <div className="flex items-center justify-center gap-5 mb-5 py-3 px-5 bg-slate-50 rounded-2xl border border-slate-100">
                        {['7 days free', 'No commitment'].map((perk) => (
                            <div key={perk} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                <CheckCircle size={13} className="text-sky-500 shrink-0" />
                                {perk}
                            </div>
                        ))}
                    </div>

                    {/* Form */}
                    <form className="space-y-4" onSubmit={handleSignup}>
                        {error && (
                            <div className="p-3 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg animate-in shake duration-500">
                                {error}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Full name</label>
                                <input
                                    type="text"
                                    placeholder="Jean Dupont"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-medium text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Organisation</label>
                                <input
                                    type="text"
                                    placeholder="Your company"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-medium text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Email address</label>
                            <input
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-medium text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-medium text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 px-4 mt-2 ${loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'} text-white font-bold rounded-2xl transition-all text-sm`}
                        >
                            {loading ? 'Creating account...' : 'Start my free trial →'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-7">
                        <div className="flex-1 h-px bg-slate-200"></div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">or</div>
                        <div className="flex-1 h-px bg-slate-200"></div>
                    </div>

                    {/* OAuth buttons — same as login */}
                    <div className="flex gap-4">
                        <button 
                            onClick={() => handleOAuthSignup('github')}
                            className="flex-1 py-3 px-4 bg-slate-900 border border-slate-900 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 hover:bg-slate-800 text-sm active:scale-95"
                        >
                            <Github size={18} /> GitHub
                        </button>
                        <button 
                            onClick={() => handleOAuthSignup('google')}
                            className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 hover:bg-slate-50 text-sm active:scale-95"
                        >
                            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                    </div>

                    <p className="mt-4 text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <a href="/login" className="text-sky-600 font-semibold hover:underline">Log in</a>
                    </p>
                </motion.div>
            </div>

            {/* RIGHT — Exact same bento grid from the landing page */}
            <div className="hidden lg:flex flex-1 flex-col overflow-hidden relative bg-white">
                {/* Same background orbs as the landing */}
                <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                    <div className="absolute w-[600px] h-[600px] bg-sky-200/40 rounded-full blur-[100px] -left-[10%] top-0"></div>
                    <div className="absolute w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[100px] -right-[10%] bottom-0"></div>
                </div>
                <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] z-0"></div>

                {/* Marketing text above the grid */}
                <div className="relative z-10 px-10 pt-10 pb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-xs font-bold border border-sky-100 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                        Talent Pool IA
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-2">
                        Hire <span className="text-sky-500">digital</span> employees.<br />
                        Securely.
                    </h3>
                    <p className="text-slate-500 text-sm max-w-md leading-relaxed">
                        Verytis allows you to hire, manage, and supervise your AI employees with strict management and security standards.
                    </p>
                </div>

                {/* Bento Grid — identical to landing */}
                <div
                    className="flex-1 w-full relative overflow-y-auto no-scrollbar flex items-start justify-center z-10"
                    style={{ maskImage: "radial-gradient(ellipse at top, black 40%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse at top, black 50%, transparent 100%)" }}
                >
                    <div className="w-full pb-10 grid grid-cols-6 grid-flow-dense gap-4 content-start px-6 pt-4 auto-rows-[110px]">
                        {gridItems.map((item, idx) => (
                            item.size === 'small' ? (
                                <div key={idx} className="col-span-1 row-span-1 rounded-2xl border border-slate-200/60 bg-white/70 hover:bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center p-2 gap-2 cursor-default transition-all duration-300 group backdrop-blur-md hover:-translate-y-1 hover:shadow-md z-10 w-full h-full">
                                    <div className="bg-slate-50 w-10 h-10 rounded-xl shadow-inner border border-slate-100 flex items-center justify-center shrink-0">
                                        {item.icon}
                                    </div>
                                    <span className="text-[10px] md:text-xs font-bold text-slate-500 text-center leading-tight group-hover:text-slate-800 line-clamp-2 px-1">{item.label}</span>
                                </div>
                            ) : (
                                <div key={idx} className="col-span-2 sm:col-span-2 row-span-4 bg-white/95 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-4 pt-6 flex flex-col items-center relative z-20 transition-transform hover:-translate-y-2 duration-300 backdrop-blur-xl shrink-0">
                                    {/* Titre Node */}
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md whitespace-nowrap z-30">
                                        {item.name}
                                    </div>

                                    {/* VERYTIS ENDPOINT */}
                                    <div className="bg-gradient-to-b from-white to-sky-50 rounded-2xl border-2 border-sky-400 shadow-sm p-2.5 w-full flex flex-col items-center relative overflow-hidden mt-3">
                                        <div className="absolute top-0 left-0 w-full h-1/2 bg-sky-200 opacity-20 blur-xl"></div>
                                        <div className="flex items-center gap-1.5 mb-3 z-10 w-full justify-center">
                                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                                <Image src={icareLogo} alt="Icare Logo" width={32} height={32} className="object-cover scale-150" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[10px] text-sky-700 tracking-widest leading-none">VERYTIS</span>
                                                <span className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase tracking-tighter">AI Supervisor</span>
                                            </div>
                                        </div>
                                        <div className="w-full flex gap-1.5 justify-center z-10">
                                            <div className="bg-white rounded border border-sky-200 px-1 py-1 text-center shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex-1 overflow-hidden">
                                                <div className="flex items-center justify-center gap-0.5">
                                                    <ShieldCheck size={10} className="text-sky-500 shrink-0" />
                                                    <span className="text-[8px] font-bold text-sky-700 truncate">Guardrails In</span>
                                                </div>
                                            </div>
                                            <div className="bg-white rounded border border-sky-200 px-1 py-1 text-center shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex-1 overflow-hidden">
                                                <div className="flex items-center justify-center gap-0.5">
                                                    <ShieldCheck size={10} className="text-sky-500 shrink-0" />
                                                    <span className="text-[8px] font-bold text-sky-700 truncate">Guardrails Out</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <ArrowRight size={18} className="text-sky-300 rotate-90 my-2 shrink-0" />

                                    {/* LLM */}
                                    <div className="flex items-center justify-center gap-2 bg-slate-900 text-white pl-2 pr-4 py-2.5 rounded-xl shadow-md w-full relative overflow-hidden shrink-0">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-white opacity-5 blur-xl rounded-full"></div>
                                        <div className="w-7 h-7 bg-white shadow-sm rounded-lg flex items-center justify-center relative z-10 shrink-0">
                                            <FavIcon domain={item.llm} alt={item.llm} className="w-4 h-4 object-contain rounded-sm" />
                                        </div>
                                        <div className="flex flex-col relative z-10 text-left">
                                            <span className="font-bold text-[11px] leading-tight truncate">{item.llmName}</span>
                                            <span className="text-[8px] text-slate-400">Digital Brain</span>
                                        </div>
                                    </div>

                                    <ArrowRight size={18} className="text-slate-300 rotate-90 my-2 shrink-0" />

                                    {/* Apps */}
                                    <div className="flex justify-center flex-wrap gap-2 w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-4 shadow-inner relative mt-auto">
                                        <div className="absolute top-1 left-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Workstation</div>
                                        {item.apps.map(app => (
                                            <div key={app} className="w-8 h-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center hover:scale-110 transition-transform">
                                                <FavIcon domain={app} alt={app} className="w-5 h-5 object-contain rounded-sm" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

