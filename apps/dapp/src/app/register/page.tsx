"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './register.module.css';
import { getReferralCode, clearReferralCode } from '@/lib/referral-cookie';

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const refApplied = searchParams.get('refApplied');
    
    const [username, setUsername] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [referralInfo, setReferralInfo] = useState<{ referrerHandle: string } | null>(null);

    // Check if referral was already applied via auth callback
    useEffect(() => {
        if (refApplied === 'true') {
            setReferralInfo({ referrerHandle: 'your referrer' });
            // Clear all referral storage since it's been applied
            clearReferralCode();
        } else {
            // Check if there's a pending referral code in storage
            const pendingCode = getReferralCode();
            if (pendingCode) {
                // Validate and show referrer info
                fetch(`/api/referral?code=${pendingCode}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.valid && data.referrer) {
                            setReferralInfo({ referrerHandle: data.referrer.handle });
                        }
                    })
                    .catch(console.error);
            }
        }
    }, [refApplied]);

    // Debounced username check
    const checkUsername = useCallback(async (value: string) => {
        if (value.length < 3) {
            setIsAvailable(null);
            setErrorMessage(value.length > 0 ? 'Username must be at least 3 characters' : '');
            return;
        }

        setIsChecking(true);
        try {
            const res = await fetch(`/api/user/username?check=${encodeURIComponent(value)}`);
            const data = await res.json();
            setIsAvailable(data.available);
            setErrorMessage(data.reason || '');
        } catch {
            setErrorMessage('Failed to check username');
        } finally {
            setIsChecking(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (username) {
                checkUsername(username);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [username, checkUsername]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAvailable || isSubmitting) return;

        setIsSubmitting(true);
        
        // Get referral code from storage (as backup in case cookie didn't work)
        const referralCode = getReferralCode();

        try {
            const res = await fetch('/api/user/username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    referralCode: referralCode || undefined
                })
            });
            const data = await res.json();

            if (data.success) {
                // Clear referral code from all storage after successful registration
                clearReferralCode();
                
                router.push('/dashboard');
            } else {
                setErrorMessage(data.error || 'Failed to set username');
            }
        } catch {
            setErrorMessage('Failed to set username');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusIcon = () => {
        if (isChecking) return <span className={`${styles.checking} animate-spin`}>⟳</span>;
        if (isAvailable === true) return <span className={styles.available}>✓</span>;
        if (isAvailable === false) return <span className={styles.taken}>✗</span>;
        return null;
    };

    return (
        <main className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>CHOOSE YOUR IDENTITY</h1>
                    <p className={styles.subtitle}>Pick a unique username to enter the trenches</p>
                    
                    {referralInfo && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1rem',
                            background: 'rgba(0, 255, 102, 0.1)',
                            border: '1px solid rgba(0, 255, 102, 0.3)',
                            borderRadius: '8px',
                            color: '#00FF66',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                        }}>
                            ✓ Referred by @{referralInfo.referrerHandle}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputWrapper}>
                        <span className={styles.atSymbol}>@</span>
                        <input
                            type="text"
                            className={styles.input}
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="your_username"
                            maxLength={20}
                            autoFocus
                        />
                        <div className={styles.statusIcon}>
                            {getStatusIcon()}
                        </div>
                    </div>

                    {errorMessage && (
                        <p className={styles.error}>{errorMessage}</p>
                    )}

                    <div className={styles.rules}>
                        <p>• 3-20 characters</p>
                        <p>• Letters, numbers, and underscores only</p>
                        <p>• This cannot be changed later</p>
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={!isAvailable || isSubmitting}
                    >
                        {isSubmitting ? 'CLAIMING...' : 'CLAIM USERNAME'}
                    </button>
                </form>
            </div>
        </main>
    );
}
