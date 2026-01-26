"use client";

import { useState, useEffect } from 'react';
import styles from './CampaignDetailModal.module.css';

interface WaitlistUser {
    id: string;
    position: number;
    user: { id: string; handle: string; email: string | null };
    depositAmount?: number;
    joinedAt: string;
}

interface CampaignDetail {
    id: string;
    name: string;
    tokenSymbol: string;
    chainName: string;
    phase: 'WAITLIST' | 'ACCEPTING' | 'LIVE' | 'PAUSED';
    startsAt: string | null;
    isPaused: boolean;
    acceptDepositsBeforeStart: boolean;
    payoutIntervalSeconds: number;
    stats: {
        totalSprays: number;
        totalDeposits: number;
        totalDepositedUsd: number;
    };
    waitlistStats: {
        totalInWaitlist: number;
        waitingNoDeposit: number;
        waitingWithDeposit: number;
        totalDepositedInWaitlist: number;
    };
    waitlistUsers: {
        waiting: WaitlistUser[];
        deposited: WaitlistUser[];
    };
}

interface CampaignDetailModalProps {
    campaignId: string;
    onClose: () => void;
}

export default function CampaignDetailModal({ campaignId, onClose }: CampaignDetailModalProps) {
    const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<string>('');

    useEffect(() => {
        fetchCampaignDetails();
    }, [campaignId]);

    // Countdown timer effect
    useEffect(() => {
        if (!campaign?.startsAt) return;

        const updateCountdown = () => {
            const now = new Date().getTime();
            const target = new Date(campaign.startsAt!).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setCountdown('STARTED');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown(`${days}D ${hours}H ${mins}M ${secs}S`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [campaign?.startsAt]);

    const fetchCampaignDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/campaigns/${campaignId}`);
            const data = await res.json();
            if (data.success) {
                setCampaign(data.data);
            } else {
                setError(data.error || 'Failed to load campaign');
            }
        } catch (err) {
            setError('Failed to fetch campaign details');
        } finally {
            setLoading(false);
        }
    };

    const getPhaseLabel = () => {
        switch (campaign?.phase) {
            case 'WAITLIST': return 'WAITLIST OPEN';
            case 'ACCEPTING': return 'ACCEPTING DEPOSITS';
            case 'LIVE': return 'LIVE';
            case 'PAUSED': return 'PAUSED';
            default: return 'UNKNOWN';
        }
    };

    const getPhaseColor = () => {
        switch (campaign?.phase) {
            case 'WAITLIST': return 'var(--accent-mid)';
            case 'ACCEPTING': return 'var(--accent-blt)';
            case 'LIVE': return 'var(--accent-green)';
            case 'PAUSED': return 'var(--accent-error)';
            default: return 'var(--text-muted)';
        }
    };

    if (loading) {
        return (
            <div className={styles.overlay} onClick={onClose}>
                <div className={styles.modal} onClick={e => e.stopPropagation()}>
                    <div className={styles.loading}>LOADING...</div>
                </div>
            </div>
        );
    }

    if (error || !campaign) {
        return (
            <div className={styles.overlay} onClick={onClose}>
                <div className={styles.modal} onClick={e => e.stopPropagation()}>
                    <div className={styles.error}>{error || 'Campaign not found'}</div>
                    <button className={styles.closeBtn} onClick={onClose}>CLOSE</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.titleRow}>
                        <h2 className={styles.title}>{campaign.name}</h2>
                        <span
                            className={styles.phaseBadge}
                            style={{ background: getPhaseColor() }}
                        >
                            {getPhaseLabel()}
                        </span>
                    </div>
                    <div className={styles.subtitle}>
                        ${campaign.tokenSymbol} on {campaign.chainName}
                    </div>
                    <button className={styles.closeX} onClick={onClose}>×</button>
                </div>

                {/* Countdown Timer */}
                {campaign.startsAt && campaign.phase !== 'LIVE' && (
                    <div className={styles.countdownSection}>
                        <span className={styles.countdownLabel}>STARTS IN</span>
                        <span className={styles.countdownValue}>{countdown}</span>
                    </div>
                )}

                {/* Stats Grid */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{campaign.stats.totalSprays}</span>
                        <span className={styles.statLabel}>TOTAL SPRAYS</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>${campaign.stats.totalDepositedUsd.toFixed(2)}</span>
                        <span className={styles.statLabel}>TOTAL DEPOSITED</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{campaign.waitlistStats.totalInWaitlist}</span>
                        <span className={styles.statLabel}>IN WAITLIST</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{campaign.payoutIntervalSeconds}s</span>
                        <span className={styles.statLabel}>PAYOUT INTERVAL</span>
                    </div>
                </div>

                {/* Waitlist Section */}
                {campaign.waitlistStats.totalInWaitlist > 0 && (
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>WAITLIST</h3>

                        {/* Deposited Users */}
                        {campaign.waitlistUsers.deposited.length > 0 && (
                            <div className={styles.userGroup}>
                                <div className={styles.groupHeader}>
                                    <span>DEPOSITED ({campaign.waitlistStats.waitingWithDeposit})</span>
                                    <span style={{ color: 'var(--accent-green)' }}>
                                        ${campaign.waitlistStats.totalDepositedInWaitlist.toFixed(2)}
                                    </span>
                                </div>
                                <div className={styles.userList}>
                                    {campaign.waitlistUsers.deposited.slice(0, 10).map(u => (
                                        <div key={u.id} className={styles.userRow}>
                                            <span className={styles.position}>#{u.position}</span>
                                            <span className={styles.handle}>{u.user.handle}</span>
                                            <span className={styles.amount}>${u.depositAmount?.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {campaign.waitlistUsers.deposited.length > 10 && (
                                        <div className={styles.moreUsers}>
                                            +{campaign.waitlistUsers.deposited.length - 10} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Waiting Users (no deposit) */}
                        {campaign.waitlistUsers.waiting.length > 0 && (
                            <div className={styles.userGroup}>
                                <div className={styles.groupHeader}>
                                    <span>WAITING ({campaign.waitlistStats.waitingNoDeposit})</span>
                                </div>
                                <div className={styles.userList}>
                                    {campaign.waitlistUsers.waiting.slice(0, 5).map(u => (
                                        <div key={u.id} className={styles.userRow}>
                                            <span className={styles.position}>#{u.position}</span>
                                            <span className={styles.handle}>{u.user.handle}</span>
                                            <span className={styles.waiting}>No deposit</span>
                                        </div>
                                    ))}
                                    {campaign.waitlistUsers.waiting.length > 5 && (
                                        <div className={styles.moreUsers}>
                                            +{campaign.waitlistUsers.waiting.length - 5} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <button className={styles.closeBtn} onClick={onClose}>CLOSE</button>
            </div>
        </div>
    );
}
