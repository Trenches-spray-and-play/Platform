"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface Position {
    id: string;
    type: "active" | "secured" | "enlisted";
    trenchLevel: string;
    status: string;
    campaignName?: string;
    entryAmount?: number;
    maxPayout?: number;
    roiMultiplier?: number;
    remainingTime?: { days: number; hours: number; minutes: number; isReady: boolean };
    queueNumber?: number | null;
    autoBoost?: boolean;
}

interface UserProfile {
    id: string;
    handle: string;
    referralCode?: string;
    beliefScore: number;
    boostPoints: number;
    balance: string;
    walletEvm?: string;
    walletSol?: string;
    stats?: { referrals: number };
}

// Status toast component
function StatusToast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
    return (
        <div className={`${styles.statusToast} ${styles[type]}`}>
            <span className={styles.statusIcon}>{type === 'success' ? '✓' : '✕'}</span>
            <span className={styles.statusMessage}>{message}</span>
            <button className={styles.statusClose} onClick={onClose}>×</button>
        </div>
    );
}

// Helper to format handle without double @
function formatHandle(handle: string | undefined): string {
    if (!handle) return "@user";
    return handle.startsWith("@") ? handle : `@${handle}`;
}

export default function DashboardClient({
    initialUser,
    initialPositions
}: {
    initialUser: UserProfile;
    initialPositions: Position[];
}) {
    const [user, setUser] = useState<UserProfile>(initialUser);
    const [positions, setPositions] = useState<Position[]>(initialPositions);
    const [copied, setCopied] = useState(false);
    const [togglingBoost, setTogglingBoost] = useState<string | null>(null);
    const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleCopyReferral = () => {
        if (!user?.referralCode) return;
        navigator.clipboard.writeText(`https://playtrenches.xyz/ref/${user.referralCode}`);
        setCopied(true);
        setStatus({ message: 'Referral link copied to clipboard', type: 'success' });
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleAutoBoost = async (positionId: string, currentValue: boolean) => {
        setTogglingBoost(positionId);
        try {
            const res = await fetch(`/api/user/positions/${positionId}/auto-boost`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: !currentValue }),
            });

            if (res.ok) {
                setStatus({
                    message: `Auto-boost ${!currentValue ? 'enabled' : 'disabled'}`,
                    type: 'success'
                });
                setPositions(prev => prev.map(p =>
                    p.id === positionId ? { ...p, autoBoost: !currentValue } : p
                ));
            } else {
                throw new Error("Failed to toggle auto-boost");
            }
        } catch (error) {
            setStatus({ message: 'Failed to update auto-boost', type: 'error' });
        } finally {
            setTogglingBoost(null);
        }
    };

    const formatTime = (pos: Position) => {
        if (pos.remainingTime?.isReady) return "Ready";
        if (!pos.remainingTime) return "--";
        const { days, hours, minutes } = pos.remainingTime;
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const activePositions = positions.filter((p) => p.status !== "paid");
    const totalInvested = activePositions.reduce((sum, p) => sum + (p.entryAmount || 0), 0);
    const totalReturn = activePositions.reduce((sum, p) => {
        const entry = p.entryAmount || 0;
        return sum + (p.maxPayout || Math.floor(entry * (p.roiMultiplier || 1.5)));
    }, 0);

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Status Toast */}
                {status && (
                    <StatusToast
                        message={status.message}
                        type={status.type}
                        onClose={() => setStatus(null)}
                    />
                )}

                {/* Welcome Header */}
                <div className={styles.welcomeSection}>
                    <div className={styles.welcomeContent}>
                        <span className={styles.welcomeLabel}>Welcome back</span>
                        <h1 className={styles.welcomeTitle}>{formatHandle(user.handle)}</h1>
                    </div>
                    <div className={styles.welcomeActions}>
                        <Link href="/sample-v2/spray" className={styles.sprayBtn}>
                            <span>◆</span>
                            Spray
                        </Link>
                        <Link href="/sample-v2/deposit" className={styles.depositBtn}>
                            <span>+</span>
                            Deposit
                        </Link>
                    </div>
                </div>

                {/* Main Balance Card */}
                <div className={styles.balanceCard}>
                    <div className={styles.balanceMain}>
                        <div className={styles.balanceInfo}>
                            <span className={styles.balanceLabel}>Platform Balance</span>
                            <span className={styles.balanceValue}>${parseFloat(user.balance || "0").toFixed(2)}</span>
                        </div>
                    </div>
                    <div className={styles.balanceStats}>
                        <div className={styles.balanceStat}>
                            <span className={styles.balanceStatLabel}>Invested</span>
                            <span className={styles.balanceStatValue}>${totalInvested.toLocaleString()}</span>
                        </div>
                        <div className={styles.balanceStatDivider} />
                        <div className={styles.balanceStat}>
                            <span className={styles.balanceStatLabel}>Expected Return</span>
                            <span className={`${styles.balanceStatValue} ${styles.positive}`}>${totalReturn.toLocaleString()}</span>
                        </div>
                        <div className={styles.balanceStatDivider} />
                        <div className={styles.balanceStat}>
                            <span className={styles.balanceStatLabel}>Net Profit</span>
                            <span className={`${styles.balanceStatValue} ${styles.positive}`}>+${(totalReturn - totalInvested).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIconWrapper}>
                            <span className={styles.statIcon}>◆</span>
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Belief Score</span>
                            <span className={styles.statValue}>{user.beliefScore || 0}</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIconWrapper} ${styles.boost}`}>
                            <span className={styles.statIcon}>⚡</span>
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Boost Points</span>
                            <span className={`${styles.statValue} ${styles.boostValue}`}>{user.boostPoints || 0}</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIconWrapper}>
                            <span className={styles.statIcon}>👥</span>
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Referrals</span>
                            <span className={styles.statValue}>{user.stats?.referrals || 0}</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIconWrapper}>
                            <span className={styles.statIcon}>◈</span>
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Positions</span>
                            <span className={styles.statValue}>{activePositions.length}</span>
                        </div>
                    </div>
                </div>

                {/* Referral Card */}
                <div className={styles.infoSection}>
                    <div className={styles.infoCard}>
                        <div className={styles.infoCardHeader}>
                            <h3>Referral Program</h3>
                            <span className={styles.referralReward}>Earn 10%</span>
                        </div>
                        <p className={styles.referralDesc}>Earn 10% of referrals&apos; Belief Points forever</p>
                        <div className={styles.referralCodeBox}>
                            <code className={styles.referralCode}>playtrenches.xyz/ref/{user.referralCode || "..."}</code>
                            <button className={styles.copyBtn} onClick={handleCopyReferral}>
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Positions Grid */}
                <div className={styles.positionsSection}>
                    <h2>Active Positions</h2>
                    {activePositions.length === 0 ? (
                        <p className={styles.emptyText}>No active positions.</p>
                    ) : (
                        <div className={styles.positionsGrid}>
                            {activePositions.map((pos) => (
                                <div key={pos.id} className={styles.positionCard}>
                                    <div className={styles.positionCardHeader}>
                                        <h3>{pos.campaignName || "Campaign"}</h3>
                                        <span className={`${styles.positionType} ${styles[pos.type]}`}>{pos.type}</span>
                                    </div>
                                    <div className={styles.positionFooter}>
                                        <label className={styles.toggleLabel}>
                                            <input
                                                type="checkbox"
                                                checked={pos.autoBoost || false}
                                                onChange={() => toggleAutoBoost(pos.id, pos.autoBoost || false)}
                                                disabled={togglingBoost === pos.id}
                                            />
                                            <span className={styles.toggle} />
                                            <span className={styles.toggleText}>Auto-Boost</span>
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
