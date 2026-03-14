'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const supabase = createClient();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (loginError) {
                setError(loginError.message);
                setLoading(false);
            } else {
                router.push('/');
            }
        } catch (err) {
            setError('An unexpected error occurred during login');
            setLoading(false);
        }
    };

    const handleOAuthLogin = async (provider) => {
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

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 relative border-b border-t border-slate-200 py-32">
            {/* Background Orbs to match the "How it works" slider aesthetic */}
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <div className="absolute w-[500px] h-[500px] bg-sky-200/30 rounded-full blur-[80px] -left-[10%] top-[10%]"></div>
                <div className="absolute w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[80px] right-[0%] bottom-[0%]"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-10"
            >
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 shadow-sm mb-6">
                        Log in
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
                    <p className="text-slate-500 text-sm">Manage your digital workforce on the Verytis platform.</p>
                </div>

                <form className="space-y-4" onSubmit={handleLogin}>
                    {error && (
                        <div className="p-3 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg animate-in shake duration-500 text-center">
                            {error}
                        </div>
                    )}
                    <div className="space-y-1.5 text-left">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Email / Username</label>
                        <input 
                            type="email" 
                            placeholder="you@company.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-medium"
                        />
                    </div>
                    <div className="space-y-1.5 text-left">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-medium"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 px-4 mt-2 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'} text-white font-bold rounded-2xl transition-all shadow-md active:scale-95`}
                    >
                        {loading ? 'Authenticating...' : 'Log in'}
                    </button>
                </form>

                <div className="flex items-center gap-4 my-8">
                    <div className="flex-1 h-px bg-slate-200"></div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">or</div>
                    <div className="flex-1 h-px bg-slate-200"></div>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => handleOAuthLogin('github')}
                        className="flex-1 py-4 px-4 bg-[#24292e] hover:bg-[#1b1f23] text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-3 active:scale-95"
                    >
                        <Github size={20} /> GitHub
                    </button>
                    
                    <button 
                        onClick={() => handleOAuthLogin('google')}
                        className="flex-1 py-4 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-3 active:scale-95"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Google
                    </button>
                </div>


                <p className="mt-7 text-center text-sm text-slate-500">
                    Don't have an account yet?{' '}
                    <a href="/register" className="text-sky-600 font-semibold hover:underline">
                        Sign up here
                    </a>
                </p>
            </motion.div>
        </div>
    );
}
