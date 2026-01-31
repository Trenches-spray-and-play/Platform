'use client';

import { Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';

function LoadingState() {
    return (
        <div className={styles.page}>
            <div className={styles.loadingContent}>
                <div className={styles.loadingLogo}>◆</div>
                <div className={styles.loadingText}>Loading...</div>
            </div>
        </div>
    );
}

function LoginContent() {
    const { signInWithGoogle, isLoading, user } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const urlError = searchParams.get('error');

    useEffect(() => {
        if (urlError) {
            const errorMap: Record<string, string> = {
                'auth_failed': 'Sign in failed. Please try again.',
                'unauthorized': 'Access denied. Please contact support.'
            };
            setError(errorMap[urlError] || urlError);
        }
    }, [urlError]);

    // Redirect if already logged in
    if (user) {
        return (
            <div className={styles.page}>
                <div className={styles.card}>
                    <div className={styles.successIcon}>✓</div>
                    <h1 className={styles.title}>You&apos;re Signed In</h1>
                    <p className={styles.subtitle}>Welcome back to Trenches</p>
                    <Link href="/sample-v2/dashboard-v2" className={styles.primaryButton}>
                        Go to Dashboard
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </Link>
                </div>
            </div>
        );
    }

    const handleSignIn = async () => {
        try {
            setError(null);
            await signInWithGoogle();
        } catch (err: any) {
            const errorMsg = err.message || 'Sign in failed';
            setError(errorMsg);
        }
    };

    if (isLoading) {
        return <LoadingState />;
    }

    return (
        <div className={styles.page}>
            {/* Background gradient effect */}
            <div className={styles.background} />
            
            <div className={styles.content}>
                {/* Logo */}
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>◆</span>
                    <span className={styles.logoText}>Trenches</span>
                </div>

                {/* Main Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.liveBadge}>
                            <span className={styles.pulse} />
                            Protocol Live
                        </span>
                        <h1 className={styles.title}>Welcome Back</h1>
                        <p className={styles.subtitle}>
                            Sign in to access your dashboard and manage your positions
                        </p>
                    </div>

                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    <button
                        className={styles.googleButton}
                        onClick={handleSignIn}
                        type="button"
                        disabled={isLoading}
                    >
                        <svg className={styles.googleIcon} viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>Continue with Google</span>
                    </button>

                    <div className={styles.divider}>
                        <span>Secure & encrypted</span>
                    </div>

                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <span className={styles.check}>✓</span>
                            <span>No password needed</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.check}>✓</span>
                            <span>Your keys, your crypto</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.check}>✓</span>
                            <span>Instant account recovery</span>
                        </div>
                    </div>
                </div>

                {/* Footer Links */}
                <div className={styles.footer}>
                    <Link href="https://docs.playtrenches.xyz" target="_blank" rel="noopener noreferrer">
                        Documentation
                    </Link>
                    <span className={styles.dot}>•</span>
                    <Link href="https://x.com/traboraofficial" target="_blank" rel="noopener noreferrer">
                        Twitter
                    </Link>
                    <span className={styles.dot}>•</span>
                    <Link href="https://t.me/trenchesprotocol" target="_blank" rel="noopener noreferrer">
                        Telegram
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <LoginContent />
        </Suspense>
    );
}
