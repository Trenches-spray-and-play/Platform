"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ReferralRedirect() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;
    const [status, setStatus] = useState<'validating' | 'valid' | 'invalid'>('validating');
    const [referrerHandle, setReferrerHandle] = useState<string | null>(null);

    useEffect(() => {
        async function validateAndRedirect() {
            if (!code) {
                router.push('/');
                return;
            }

            try {
                // Validate the referral code against the database
                const res = await fetch(`/api/referral/validate?code=${encodeURIComponent(code)}`);
                const data = await res.json();

                if (data.valid && data.referrer) {
                    // Valid code - store it and redirect
                    setStatus('valid');
                    setReferrerHandle(data.referrer.handle);
                    localStorage.setItem('referralCode', data.referrer.code);

                    // Short delay to show success message
                    setTimeout(() => {
                        router.push('/');
                    }, 1500);
                } else {
                    // Invalid code - show error and redirect anyway
                    setStatus('invalid');
                    // Clear any previous referral code
                    localStorage.removeItem('referralCode');

                    setTimeout(() => {
                        router.push('/');
                    }, 2000);
                }
            } catch (error) {
                console.error('Failed to validate referral:', error);
                setStatus('invalid');
                localStorage.removeItem('referralCode');

                setTimeout(() => {
                    router.push('/');
                }, 2000);
            }
        }

        validateAndRedirect();
    }, [code, router]);

    return (
        <main style={{
            minHeight: '100vh',
            background: '#000',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem',
            gap: '1rem',
        }}>
            {status === 'validating' && (
                <p style={{ letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase' }}>
                    VALIDATING REFERRAL CODE...
                </p>
            )}

            {status === 'valid' && (
                <>
                    <p style={{ letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase', color: '#39FF14' }}>
                        REFERRAL CODE ACCEPTED
                    </p>
                    {referrerHandle && (
                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                            Referred by {referrerHandle}
                        </p>
                    )}
                    <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '1rem' }}>
                        Redirecting to waitlist...
                    </p>
                </>
            )}

            {status === 'invalid' && (
                <>
                    <p style={{ letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase', color: '#FF4444' }}>
                        INVALID REFERRAL CODE
                    </p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '1rem' }}>
                        Redirecting to waitlist...
                    </p>
                </>
            )}
        </main>
    );
}
