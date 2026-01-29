'use client';

import { Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';

function LoadingState() {
    return (
        <div className={styles.loadingContainer}>
            <svg width="64" height="64" viewBox="0 0 100 100" fill="none">
                <rect x="20" y="20" width="60" height="8" rx="2" fill="#22c55e" />
                <rect x="35" y="36" width="30" height="6" rx="2" fill="#22c55e" opacity="0.6" />
                <rect x="44" y="48" width="12" height="32" rx="2" fill="#22c55e" opacity="0.4" />
            </svg>
            <div className={styles.scanner} />
            <div className={styles.loadingText}>
                INITIALIZING_PROTOCOL<span className={styles.loadingDots}></span>
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
                'auth_failed': 'AUTHENTICATION_FAILED',
                'unauthorized': 'ACCESS_DENIED'
            };
            setError(errorMap[urlError] || urlError);
        }
    }, [urlError]);

    // Redirect if already logged in
    if (user) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.logoSection}>
                        <svg width="64" height="64" viewBox="0 0 100 100" fill="none" className={styles.logoSvg}>
                            <rect x="20" y="20" width="60" height="8" rx="2" fill="currentColor" />
                            <rect x="35" y="36" width="30" height="6" rx="2" fill="currentColor" opacity="0.6" />
                            <rect x="44" y="48" width="12" height="32" rx="2" fill="currentColor" opacity="0.4" />
                        </svg>
                    </div>
                    <div className={styles.terminalHeader}>
                        <div className={styles.commandLine}>$ status</div>
                        <h1 className={styles.title}>ALREADY_AUTHENTICATED</h1>
                        <p className={styles.subtitle}>You are already logged in</p>
                    </div>
                    <Link href="/sample-v2/dashboard-v2" className={styles.googleButton}>
                        GO_TO_DASHBOARD →
                    </Link>
                </div>
            </div>
        );
    }

    const handleSignIn = async () => {
        try {
            setError(null);
            console.log('Starting Google sign in...');
            console.log('Origin:', window.location.origin);
            await signInWithGoogle();
            console.log('Sign in initiated successfully');
        } catch (err: any) {
            console.error('Sign in error:', err);
            const errorMsg = err.message || err.error_description || err.error_msg || 'AUTHENTICATION_FAILED';
            setError(errorMsg.toUpperCase().replace(/\s/g, '_'));
            // Log raw error for debugging
            console.log('Raw login error:', JSON.stringify(err));
        }
    };

    if (isLoading) {
        return <LoadingState />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {/* Corner accents */}
                <div className={`${styles.corner} ${styles.cornerTL}`} />
                <div className={`${styles.corner} ${styles.cornerTR}`} />
                <div className={`${styles.corner} ${styles.cornerBL}`} />
                <div className={`${styles.corner} ${styles.cornerBR}`} />

                {/* Logo Section */}
                <div className={styles.logoSection}>
                    <svg
                        width="64"
                        height="64"
                        viewBox="0 0 100 100"
                        fill="none"
                        className={styles.logoSvg}
                    >
                        {/* T-Shape Logo - Top bar */}
                        <rect x="20" y="20" width="60" height="8" rx="2" fill="currentColor" />
                        {/* T-Shape Logo - Middle accent bar */}
                        <rect x="35" y="36" width="30" height="6" rx="2" fill="currentColor" opacity="0.6" />
                        {/* T-Shape Logo - Vertical stem */}
                        <rect x="44" y="48" width="12" height="32" rx="2" fill="currentColor" opacity="0.4" />
                    </svg>

                    <div className={styles.protocolBadge}>
                        <span className={styles.statusDot} />
                        PROTOCOL_V2.0_LIVE
                    </div>
                </div>

                {/* Terminal Header */}
                <div className={styles.terminalHeader}>
                    <div className={styles.commandLine}>$ authenticate --method=oauth2</div>
                    <h1 className={styles.title}>SECURE_ACCESS</h1>
                    <p className={styles.subtitle}>
                        Enter the trenches. Deploy capital. Earn yield.
                    </p>
                </div>

                {/* Auth Section */}
                <div className={styles.authSection}>
                    {error && <div className={styles.error}>{error}</div>}

                    <button
                        className={styles.googleButton}
                        onClick={handleSignIn}
                        type="button"
                        disabled={isLoading}
                    >
                        <svg className={styles.googleIcon} viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className={styles.divider}>Or access via</div>

                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>◆</span>
                            <span>Non-custodial wallet integration</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>◆</span>
                            <span>Military-grade encryption</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>◆</span>
                            <span>Instant account recovery</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className={styles.footerInfo}>
                <span className={styles.footerItem}>End-to-end encrypted</span>
                <span className={styles.footerItem}>No private keys stored</span>
                <span className={styles.footerItem}>SOC2 Compliant</span>
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

