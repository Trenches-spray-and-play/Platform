"use client";

import React, { useEffect, useState } from 'react';
import styles from './PayoutPauseBanner.module.css';

interface QueueStats {
    pendingCount: number;
    pendingAmountTotal: number;
    pendingAmountUsd: number;
    oldestPendingAt: string | null;
    lastPayoutAt: string | null;
    failedCount: number;
    lastFailedAt: string | null;
    isPaused: boolean;
    tokenSymbol: string;
}

interface PayoutPauseBannerProps {
    campaignId: string;
    isPaused: boolean;
    onResume?: () => void;
}

function formatTimeAgo(dateString: string | null): string {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

export default function PayoutPauseBanner({ campaignId, isPaused, onResume }: PayoutPauseBannerProps) {
    const [stats, setStats] = useState<QueueStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!campaignId) return;

        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/admin/campaigns/${campaignId}/queue-stats`);
                const data = await res.json();
                if (data.success) {
                    setStats(data.data);
                } else {
                    setError(data.error);
                }
            } catch {
                setError('Failed to load queue stats');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        // Refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [campaignId]);

    // Only show if paused or has failed payouts
    if (!isPaused && (!stats || stats.failedCount === 0)) {
        return null;
    }

    if (loading) {
        return (
            <div className={styles.banner}>
                <div className={styles.loading}>Loading queue stats...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.banner}>
                <div className={styles.error}>{error}</div>
            </div>
        );
    }

    if (!stats) return null;

    const hasFailures = stats.failedCount > 0;

    return (
        <div className={`${styles.banner} ${isPaused ? styles.paused : ''} ${hasFailures ? styles.hasFailures : ''}`}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.icon}>
                    {isPaused ? '⏸️' : hasFailures ? '⚠️' : '✓'}
                </div>
                <div className={styles.title}>
                    {isPaused ? 'PAYOUTS PAUSED' : 'PAYOUT ISSUES DETECTED'}
                </div>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={styles.stat}>
                    <span className={styles.statValue}>{stats.pendingCount}</span>
                    <span className={styles.statLabel}>Pending</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statValue}>
                        {stats.pendingAmountTotal.toLocaleString()} {stats.tokenSymbol}
                    </span>
                    <span className={styles.statLabel}>In Queue</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statValue}>${stats.pendingAmountUsd.toLocaleString()}</span>
                    <span className={styles.statLabel}>USD Value</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statValue}>{formatTimeAgo(stats.lastPayoutAt)}</span>
                    <span className={styles.statLabel}>Last Payout</span>
                </div>
            </div>

            {/* Failures Alert */}
            {hasFailures && (
                <div className={styles.failureAlert}>
                    <span className={styles.failureIcon}>❌</span>
                    <span className={styles.failureText}>
                        {stats.failedCount} failed payout{stats.failedCount > 1 ? 's' : ''}
                        {stats.lastFailedAt && ` (last: ${formatTimeAgo(stats.lastFailedAt)})`}
                    </span>
                </div>
            )}

            {/* Actions */}
            {isPaused && onResume && (
                <div className={styles.actions}>
                    <button className={styles.resumeBtn} onClick={onResume}>
                        RESUME PAYOUTS
                    </button>
                </div>
            )}

            {/* Oldest waiting */}
            {stats.oldestPendingAt && (
                <div className={styles.footer}>
                    Oldest pending payout waiting since {formatTimeAgo(stats.oldestPendingAt)}
                </div>
            )}
        </div>
    );
}
