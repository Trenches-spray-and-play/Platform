'use client';

import React, { useState, useEffect } from 'react';
import styles from './CheckDepositsButton.module.css';
import { toast } from 'react-hot-toast';

interface FoundDeposit {
    txHash: string;
    chain: string;
    asset: string;
    amountUsd: number;
}

interface CheckDepositsButtonProps {
    onDepositsFound?: (deposits: FoundDeposit[]) => void;
    selectedChain?: string;
}

type ButtonStatus = 'idle' | 'scanning' | 'finalizing' | 'success' | 'notFound' | 'error' | 'rateLimited';

/**
 * CheckDepositsButton component provides a user interface to trigger on-demand
 * deposit scans. It handles loading states, progress animations, and rate limits.
 */
export const CheckDepositsButton: React.FC<CheckDepositsButtonProps> = ({
    onDepositsFound,
    selectedChain = 'all'
}) => {
    const [status, setStatus] = useState<ButtonStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [retryAfter, setRetryAfter] = useState(0);
    const [foundAmount, setFoundAmount] = useState(0);

    // 1. Handle countdown for rate limit state
    useEffect(() => {
        if (retryAfter > 0) {
            const timer = setInterval(() => {
                setRetryAfter(prev => {
                    if (prev <= 1) {
                        if (status === 'rateLimited') setStatus('idle');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [retryAfter, status]);

    // 2. Handle progress bar animation based on status
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (status === 'scanning') {
            // Fast progress to 60%
            interval = setInterval(() => {
                setProgress(prev => (prev >= 60 ? 60 : prev + 5));
            }, 200);
        } else if (status === 'finalizing') {
            // Slower creep to 95%
            interval = setInterval(() => {
                setProgress(prev => (prev >= 95 ? 95 : prev + 1));
            }, 300);
        } else if (status === 'success' || status === 'notFound') {
            // Snap to 100%
            setProgress(100);
        } else if (status === 'idle') {
            // Reset
            setProgress(0);
        }

        return () => clearInterval(interval);
    }, [status]);

    /**
     * Triggers the scan API and handles responses
     */
    const handleCheck = async () => {
        // Only allow clicking in actionable states
        if (status !== 'idle' && status !== 'error' && status !== 'notFound') return;

        setStatus('scanning');
        setFoundAmount(0);

        // UI improvement: Transition to "finalizing" after 2s for perceived progress
        const finalizeTimer = setTimeout(() => {
            setStatus(prev => prev === 'scanning' ? 'finalizing' : prev);
        }, 2000);

        try {
            const res = await fetch('/api/deposits/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chain: selectedChain })
            });

            const data = await res.json();

            // Handle rate limit (429)
            if (res.status === 429) {
                setStatus('rateLimited');
                setRetryAfter(data.retryAfter || 30);
                toast.error(`Please wait ${data.retryAfter || 30}s before checking again.`);
                return;
            }

            if (!res.ok) throw new Error(data.error || 'Scan failed');

            if (data.found > 0) {
                // SUCCESS: Deposits found
                setStatus('success');
                const totalUsd = data.deposits.reduce((sum: number, d: any) => sum + (d.amountUsd || 0), 0);
                setFoundAmount(totalUsd);

                toast.success(`Found ${data.found} deposit${data.found > 1 ? 's' : ''}! +$${totalUsd.toFixed(2)} credited.`);

                // Notify parent to refresh lists
                if (onDepositsFound) onDepositsFound(data.deposits);

                // Reset to idle after a while
                setTimeout(() => setStatus('idle'), 5000);
            } else {
                // NOT FOUND: Scan complete but empty
                setStatus('notFound');
                toast("No deposit yet - try again soon", { icon: 'ℹ️' });
                setTimeout(() => setStatus('idle'), 3000);
            }

        } catch (err: any) {
            console.error('[CheckDeposits] Error:', err);
            setStatus('error');
            toast.error(err.message || "Failed to scan blockchain. Please try again.");
            setTimeout(() => setStatus('idle'), 3000);
        } finally {
            clearTimeout(finalizeTimer);
        }
    };

    /**
     * Determines button text based on internal state machine
     */
    const getButtonText = () => {
        switch (status) {
            case 'scanning': return 'Scanning blocks...';
            case 'finalizing': return 'Finalizing...';
            case 'success': return `Found $${foundAmount.toFixed(2)}!`;
            case 'notFound': return 'No deposit yet - try again soon';
            case 'rateLimited': return `Check again in ${retryAfter}s`;
            case 'error': return 'Error - Try again';
            default: return "I've Sent the Payment";
        }
    };

    return (
        <div className={styles.container}>
            <button
                className={`${styles.button} ${styles[status]}`}
                onClick={handleCheck}
                disabled={status === 'scanning' || status === 'finalizing' || status === 'rateLimited'}
            >
                {(status === 'scanning' || status === 'finalizing') && <div className={styles.spinner} />}
                <span>{getButtonText()}</span>

                {/* Progress bar overlay for active scanning/success states */}
                {(status === 'scanning' || status === 'finalizing' || status === 'success' || status === 'notFound') && (
                    <div className={styles.progressOverlay}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </button>

            <p className={styles.helperText}>
                {status === 'rateLimited'
                    ? `You can check once every 30 seconds to protect network resources.`
                    : `Click after sending. Finds payments across all chains in < 5s.`}
            </p>
        </div>
    );
};
