'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('Processing your invitation...');
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleAuth = async () => {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            );

            console.log('Auth callback - URL:', window.location.href);
            console.log('Auth callback - Hash:', window.location.hash);
            console.log('Auth callback - Search:', window.location.search);

            // Try hash fragment first (standard OAuth flow)
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            let accessToken = hashParams.get('access_token');
            let refreshToken = hashParams.get('refresh_token');
            let type = hashParams.get('type');

            // Also check query params (some Supabase flows use these)
            if (!accessToken) {
                accessToken = searchParams.get('access_token');
                refreshToken = searchParams.get('refresh_token');
                type = searchParams.get('type');
            }

            // Check for error in URL
            const errorParam = searchParams.get('error') || hashParams.get('error');
            const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');

            if (errorParam) {
                console.error('Auth error:', errorParam, errorDescription);
                setError(errorDescription || 'Authentication failed');
                return;
            }

            if (accessToken && refreshToken) {
                console.log('Found tokens, setting session...');
                const { data, error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });

                if (sessionError) {
                    console.error('Session error:', sessionError);
                    setError('Failed to verify your invitation. Please contact support.');
                    return;
                }

                if (data.session) {
                    console.log('Session established, checking profile status...');

                    // Check if user needs onboarding (status = pending)
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('status')
                        .eq('id', data.session.user.id)
                        .single();

                    if (profile?.status === 'pending') {
                        setStatus('Invitation verified! Redirecting to complete your profile...');
                        setTimeout(() => router.push('/onboarding'), 1500);
                    } else {
                        setStatus('Welcome back! Redirecting to dashboard...');
                        setTimeout(() => router.push('/'), 1500);
                    }
                }
            } else {
                console.log('No tokens in URL, checking existing session...');
                // Check if there's already a session (user may have been redirected after auth)
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    console.log('Found existing session, checking profile...');
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('status')
                        .eq('id', session.user.id)
                        .single();

                    if (profile?.status === 'pending') {
                        router.push('/onboarding');
                    } else {
                        router.push('/');
                    }
                } else {
                    console.log('No session found');
                    setError('No valid session found. Please try clicking the invitation link again.');
                }
            }
        };

        handleAuth();
    }, [router, searchParams]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9fafb',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}>
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '48px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                maxWidth: '400px'
            }}>
                {error ? (
                    <>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                        <h1 style={{ color: '#dc2626', fontSize: '20px', marginBottom: '8px' }}>Invitation Error</h1>
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>{error}</p>
                    </>
                ) : (
                    <>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid #e5e7eb',
                            borderTopColor: '#2563EB',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 24px'
                        }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        <h1 style={{ color: '#111827', fontSize: '18px', marginBottom: '8px' }}>{status}</h1>
                        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Please wait...</p>
                    </>
                )}
            </div>
        </div>
    );
}
