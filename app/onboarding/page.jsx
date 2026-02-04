'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        job_title: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkSession = async () => {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            );

            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/login');
                return;
            }

            setUser(session.user);
            setFormData(prev => ({
                ...prev,
                full_name: session.user.user_metadata?.full_name || ''
            }));
            setLoading(false);
        };

        checkSession();
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setSaving(true);

        try {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            );

            // 1. Update password
            const { error: passwordError } = await supabase.auth.updateUser({
                password: formData.password
            });

            if (passwordError) throw passwordError;

            // 2. Update profile in database
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    job_title: formData.job_title,
                    status: 'active'
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 3. Redirect to dashboard
            router.push('/');

        } catch (err) {
            console.error('Onboarding error:', err);
            setError(err.message || 'Failed to complete profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9fafb'
            }}>
                <p style={{ color: '#6b7280' }}>Loading...</p>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9fafb',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '48px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                maxWidth: '480px',
                width: '100%'
            }}>
                {/* Logo Placeholder */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: '#2563EB',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <span style={{ color: '#fff', fontSize: '24px', fontWeight: '700' }}>V</span>
                    </div>
                    <h1 style={{ color: '#111827', fontSize: '24px', margin: '0 0 8px 0', fontWeight: '600' }}>
                        Complete Your Profile
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                        Welcome to Verytis! Set up your account to get started.
                    </p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        marginBottom: '24px',
                        color: '#dc2626',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '6px'
                        }}>
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '6px'
                        }}>
                            Job Title
                        </label>
                        <input
                            type="text"
                            value={formData.job_title}
                            onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                            placeholder="e.g. Product Manager"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '6px'
                        }}>
                            Create Password
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            required
                            minLength={8}
                            placeholder="Minimum 8 characters"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '6px'
                        }}>
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: saving ? '#93c5fd' : '#2563EB',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {saving ? 'Saving...' : 'Complete Setup & Join Workspace'}
                    </button>
                </form>
            </div>
        </div>
    );
}
