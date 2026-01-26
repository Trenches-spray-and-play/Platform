"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';

function JoinContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const refCode = searchParams.get('ref');
    const [referrer, setReferrer] = useState<{ handle: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (refCode) {
            // Validate the referral code
            fetch(`/api/referral?code=${refCode}`)
                .then(res => res.json())
                .then(data => {
                    if (data.valid && data.referrer) {
                        setReferrer(data.referrer);
                        // Store in local storage for persistence
                        localStorage.setItem('referralCode', refCode);
                    } else {
                        setError(data.error || 'Invalid referral code');
                    }
                })
                .catch(() => setError('Failed to validate referral code'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [refCode]);

    return (
        <main style={{
            minHeight: '100vh',
            background: '#000',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
        }}>
            <Logo variant="horizontal" />

            <div style={{ marginTop: '3rem', maxWidth: '400px' }}>
                {loading ? (
                    <p style={{ color: '#666', letterSpacing: '2px', fontWeight: 700 }}>
                        VALIDATING REFERRAL...
                    </p>
                ) : error ? (
                    <>
                        <p style={{ color: '#ff4444', marginBottom: '2rem' }}>{error}</p>
                        <Link href="/login" style={{
                            display: 'inline-block',
                            background: '#fff',
                            color: '#000',
                            padding: '1rem 2rem',
                            fontWeight: 900,
                            textDecoration: 'none',
                            letterSpacing: '2px',
                            borderRadius: '8px',
                        }}>
                            CONTINUE WITHOUT REFERRAL
                        </Link>
                    </>
                ) : referrer ? (
                    <>
                        <h1 style={{
                            fontSize: '1.5rem',
                            fontWeight: 900,
                            letterSpacing: '-1px',
                            marginBottom: '1rem',
                        }}>
                            YOU&apos;VE BEEN INVITED
                        </h1>
                        <p style={{
                            color: '#00FF66',
                            fontWeight: 700,
                            fontSize: '1.2rem',
                            marginBottom: '0.5rem',
                        }}>
                            by @{referrer.handle}
                        </p>
                        <p style={{
                            color: '#666',
                            fontSize: '0.85rem',
                            marginBottom: '2rem',
                            lineHeight: 1.6,
                        }}>
                            Join Trenches and start spraying to earn. Your referrer will receive bonus points when you sign up.
                        </p>
                        <Link href="/login" style={{
                            display: 'inline-block',
                            background: '#00FF66',
                            color: '#000',
                            padding: '1.25rem 3rem',
                            fontWeight: 900,
                            textDecoration: 'none',
                            letterSpacing: '2px',
                            borderRadius: '8px',
                        }}>
                            ACCEPT INVITE
                        </Link>
                    </>
                ) : (
                    <>
                        <h1 style={{
                            fontSize: '1.5rem',
                            fontWeight: 900,
                            letterSpacing: '-1px',
                            marginBottom: '2rem',
                        }}>
                            JOIN TRENCHES
                        </h1>
                        <Link href="/login" style={{
                            display: 'inline-block',
                            background: '#fff',
                            color: '#000',
                            padding: '1.25rem 3rem',
                            fontWeight: 900,
                            textDecoration: 'none',
                            letterSpacing: '2px',
                            borderRadius: '8px',
                        }}>
                            GET STARTED
                        </Link>
                    </>
                )}
            </div>

            <div style={{ marginTop: '4rem' }}>
                <Link href="/" style={{
                    color: '#444',
                    textDecoration: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '2px',
                }}>
                    ← BACK TO HOME
                </Link>
            </div>
        </main>
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={
            <main style={{
                minHeight: '100vh',
                background: '#000',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <p style={{ letterSpacing: '2px', fontWeight: 700 }}>LOADING...</p>
            </main>
        }>
            <JoinContent />
        </Suspense>
    );
}
