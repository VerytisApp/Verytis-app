'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import icareLogo from '@/components/image/Gemini-Generated-Image-_14_.svg';

export default function Navigation() {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
    }, []);

    const authPages = ['/login', '/register', '/signup'];
    const isAuthPage = authPages.includes(pathname);

    if (!isAuthPage) return null;

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200 py-3 shadow-sm'
            : 'bg-transparent border-transparent py-6'
            }`}>
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                {/* Logo + Texte (Constant) */}
                <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
                    <Image
                        src={icareLogo}
                        alt="VERYTIS"
                        width={50}
                        height={50}
                        className="h-10 w-auto object-contain"
                    />
                    <span className="font-bold text-2xl tracking-tighter text-slate-900 uppercase">
                        VERYTIS
                    </span>
                </Link>

                {/* Menu de Navigation (Masqué sur Login/Register) */}
                {pathname !== '/login' && pathname !== '/register' && (
                    <div className="hidden md:flex items-center gap-8">
                        {/* Ajoutez ici vos liens de navigation habituels si nécessaire */}
                        <Link href="/pricing" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
                        <Link href="/login" className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all">
                            Sign In
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
