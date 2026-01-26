"use client";

import styles from './CampaignCard.module.css';
import { useState, useEffect } from 'react';
import SprayModal from './SprayModal';

export type CampaignPhase = 'WAITLIST' | 'ACCEPTING' | 'LIVE' | 'PAUSED';

interface CampaignCardProps {
    id: string;
    name: string;
    level: 'RAPID' | 'MID' | 'DEEP';
    tokenSymbol: string;
    tokenAddress: string;
    chainName: string;
    reserves: string | null;
    roiMultiplier: string;
    entryRange: { min: number; max: number };
    // Campaign phase props
    phase?: CampaignPhase;
    startsAt?: string | null;
    isPaused?: boolean;
    participantCount?: number;
}

export default function CampaignCard({
    id,
    name,
    level,
    tokenSymbol,
    tokenAddress,
    chainName,
    reserves,
    roiMultiplier,
    entryRange,
    phase = 'LIVE',
    startsAt,
    isPaused = false,
    participantCount = 0,
}: CampaignCardProps) {
    const [showSprayModal, setShowSprayModal] = useState(false);
    const [countdown, setCountdown] = useState<string>('');

    // Countdown timer effect
    useEffect(() => {
        if (!startsAt) return;

        const updateCountdown = () => {
            const now = new Date().getTime();
            const target = new Date(startsAt).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setCountdown('');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                setCountdown(`${days}D ${hours}H ${mins}M`);
            } else if (hours > 0) {
                setCountdown(`${hours}H ${mins}M`);
            } else {
                setCountdown(`${mins}M`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [startsAt]);

    const getLevelColor = () => {
        switch (level) {
            case 'RAPID': return 'var(--accent-rapid)';
            case 'MID': return 'var(--accent-mid)';
            case 'DEEP': return 'var(--accent-deep)';
            default: return 'var(--accent-primary)';
        }
    };

    const getButtonText = () => {
        switch (phase) {
            case 'WAITLIST': return 'ENLIST';
            case 'ACCEPTING': return 'SECURE SPOT';
            case 'PAUSED': return 'PAUSED';
            case 'LIVE':
            default: return 'SPRAY';
        }
    };

    const getButtonDisabled = () => {
        return false; // Action is always allowed even if paused
    };

    const getPhaseIndicator = () => {
        if (countdown && (phase === 'WAITLIST' || phase === 'ACCEPTING')) {
            return (
                <div className={styles.countdownBadge}>
                    <span className={styles.countdownLabel}>STARTS IN</span>
                    <span className={styles.countdownValue}>{countdown}</span>
                </div>
            );
        }
        if (phase === 'LIVE' && participantCount > 0) {
            return (
                <div className={styles.liveBadge}>
                    <span className={styles.liveIndicator}></span>
                    {participantCount} ACTIVE
                </div>
            );
        }
        if (phase === 'PAUSED') {
            return (
                <div className={styles.pausedBadge}>PAUSED</div>
            );
        }
        return null;
    };

    const handleSprayClick = () => {
        if (phase === 'PAUSED') return;
        setShowSprayModal(true);
    };

    // Prepare trench data for SprayModal
    const trenchData = {
        id: id,
        name: name,
        level: level,
        minEntry: entryRange.min,
        maxEntry: entryRange.max,
        roiMultiplier: parseFloat(roiMultiplier) || 1.5,
        roiCap: `${roiMultiplier}x`,
        cadence: level === 'RAPID' ? '1 day' : level === 'MID' ? '7 days' : '30 days',
        reserves: reserves || 'N/A',
    };

    const hasHeaderBadge = !!(countdown && (phase === 'WAITLIST' || phase === 'ACCEPTING')) ||
        (phase === 'LIVE' && participantCount > 0) ||
        (phase === 'PAUSED');

    const getTierClass = () => {
        switch (level) {
            case 'DEEP': return styles.v_deep_cyber;
            case 'MID': return styles.v_mid_titanium;
            case 'RAPID': return styles.v_rapid_plasma;
            default: return '';
        }
    };

    const getPhaseClass = () => {
        switch (phase) {
            case 'WAITLIST': return styles.state_enlist;
            case 'ACCEPTING': return styles.state_secure;
            case 'LIVE': return styles.state_spray;
            default: return '';
        }
    };

    return (
        <>
            <div className={`${styles.card} ${getTierClass()} ${getPhaseClass()} glass-panel animate-fade-in`}>
                <div className={styles.nameRow}>
                    <div className={styles.tokenInfo}>
                        <h3 className={styles.name}>{name}</h3>
                        <div className={styles.addressWrap}>
                            <span className={styles.symbol}>${tokenSymbol}</span>
                            <span
                                className={styles.address}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(tokenAddress);
                                }}
                            >
                                {tokenAddress.slice(0, 6)}...
                            </span>
                        </div>
                    </div>
                    <div className={styles.tierTag}>{level}</div>
                </div>

                <div className={styles.metricsGrid}>
                    <div className={styles.metric}>
                        <span className={styles.metricLabel}>RESERVES</span>
                        <span className={styles.metricValue}>{reserves || '0.00'}</span>
                    </div>
                    <div className={styles.metric}>
                        <span className={styles.metricLabel}>AVG. PAYOUT</span>
                        <span className={styles.metricValue}>{trenchData.cadence}</span>
                    </div>
                    <div className={styles.metric}>
                        <span className={styles.metricLabel}>ROI</span>
                        <span className={styles.metricValue} style={{
                            color: level === 'DEEP' ? '#d4af37' : level === 'RAPID' ? '#00FF66' : '#fff'
                        }}>
                            {roiMultiplier}x
                        </span>
                    </div>
                    {countdown && (phase === 'WAITLIST' || phase === 'ACCEPTING') ? (
                        <div className={styles.metric}>
                            <span className={styles.metricLabel}>STARTS IN</span>
                            <span className={styles.countdownValue}>{countdown}</span>
                        </div>
                    ) : (
                        <div className={styles.metric}>
                            <span className={styles.metricLabel} style={{ opacity: 0.1 }}>STATUS</span>
                            <span className={styles.metricValue} style={{ opacity: 0.2, fontSize: '0.8rem' }}>
                                {phase === 'LIVE' ? 'ACTIVE' : phase}
                            </span>
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <div className={styles.entryRange}>
                        ${entryRange.min.toLocaleString()} - ${entryRange.max.toLocaleString()}
                    </div>
                    <button
                        className={styles.sprayButton}
                        onClick={handleSprayClick}
                        disabled={getButtonDisabled()}
                    >
                        {getButtonText()}
                    </button>
                </div>
            </div>

            {showSprayModal && (
                <SprayModal
                    isOpen={showSprayModal}
                    trench={trenchData}
                    phase={phase}
                    onClose={() => setShowSprayModal(false)}
                    onConfirm={() => setShowSprayModal(false)}
                />
            )}
        </>
    );
}
