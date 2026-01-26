"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import styles from './login.module.css';

export default function AdminLogin() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checking, setChecking] = useState(true);
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check if user is already logged in
    useEffect(() => {
        const checkExistingSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user?.email) {
                    // Verify admin status via API
                    const res = await fetch('/api/admin/verify');
                    if (res.ok) {
                        router.push('/admin');
                        return;
                    }
                }
            } catch (err) {
                console.error('Session check error:', err);
            }
            setChecking(false);
        };

        checkExistingSession();
    }, [router, supabase]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Use standard callback with next=/admin to trigger admin flow
                    redirectTo: `${window.location.origin}/auth/callback?next=/admin`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) {
                setError(error.message);
                setLoading(false);
            }
        } catch (err) {
            setError('Failed to initiate login');
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className={styles.container}>
                <div className={styles.form}>
                    <h1 className={styles.title}>VERIFYING ACCESS...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.form}>
                <h1 className={styles.title}>COMMAND ACCESS</h1>

                {error && (
                    <div style={{
                        padding: '10px',
                        background: 'rgba(255, 68, 68, 0.1)',
                        border: '1px solid #ff4444',
                        color: '#ff4444',
                        fontSize: '0.8rem',
                        textAlign: 'center',
                    }}>
                        {error}
                    </div>
                )}

                <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    margin: '0.5rem 0',
                }}>
                    Admin access restricted to authorized accounts
                </p>

                <button
                    type="button"
                    className={styles.button}
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                    }}
                >
                    {loading ? 'AUTHENTICATING...' : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            AUTHENTICATE WITH GOOGLE
                        </>
                    )}
                </button>

                <p style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    marginTop: '1rem',
                    opacity: 0.7,
                }}>
                    Only authorized emails can access the admin panel
                </p>
            </div>
        </div>
    );
}
