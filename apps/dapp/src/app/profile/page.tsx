"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import Logo from "@/components/Logo";
import TaskList from "@/components/TaskList";
import DepositPortal from "@/components/DepositPortal";
import { useAuth } from "@/components/AuthProvider";
import { Shield, Edit3, Check, X } from "lucide-react";

interface UserProfile {
    id: string;
    handle: string;
    email: string | null;
    wallet: string | null;
    walletEvm: string | null;
    walletSol: string | null;
    beliefScore: number;
    boostPoints: number;
    balance: number; // USD-normalized balance
    stats: {
        sprays: number;
        exits: number;
        earnings: number;
        tasksCompleted: number;
        postsSubmitted: number;
    };
}

interface Task {
    id: string;
    title: string;
    description: string | null;
    reward: number;
    link: string | null;
    status: 'pending' | 'completed';
}

export default function Profile() {
    const { user, isLoading: authLoading } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [walletEvmInput, setWalletEvmInput] = useState('');
    const [walletSolInput, setWalletSolInput] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [savingWallet, setSavingWallet] = useState(false);

    // Referral state
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [referralLink, setReferralLink] = useState<string | null>(null);
    const [referralCount, setReferralCount] = useState(0);
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    useEffect(() => {
        if (!authLoading && user) {
            fetchProfile();
            fetchTasks();
            fetchReferral();
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [authLoading, user]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/user');
            const data = await res.json();
            if (data.data) {
                setProfile(data.data);
                setWalletEvmInput(data.data.walletEvm || '');
                setWalletSolInput(data.data.walletSol || '');
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    const fetchReferral = async () => {
        try {
            const res = await fetch('/api/referral');
            const data = await res.json();
            if (data.success && data.data) {
                setReferralCode(data.data.code);
                setReferralLink(data.data.link);
                setReferralCount(data.data.referralCount);
            }
        } catch (error) {
            console.error('Failed to fetch referral:', error);
        }
    };

    const copyToClipboard = async (text: string, type: 'code' | 'link') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'code') {
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
            } else {
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
            }
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const fetchTasks = async () => {
        try {
            const tasksRes = await fetch('/api/tasks');
            const tasksData = await tasksRes.json();
            const completedRes = await fetch('/api/user/tasks');
            const completedData = await completedRes.json();

            const completedIds = new Set<string>(
                (completedData.data || []).map((t: { taskId: string }) => t.taskId)
            );
            setCompletedTaskIds(completedIds);

            const mergedTasks = (tasksData.data || []).map((task: Task) => ({
                ...task,
                status: completedIds.has(task.id) ? 'completed' : 'pending',
            }));
            setTasks(mergedTasks);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskComplete = async (taskId: string, reward: number) => {
        try {
            const res = await fetch('/api/user/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId }),
            });
            const data = await res.json();

            if (data.success) {
                setCompletedTaskIds(prev => new Set([...prev, taskId]));
                setTasks(prev => prev.map(t =>
                    t.id === taskId ? { ...t, status: 'completed' as const } : t
                ));
                fetchProfile();
            }
        } catch (error) {
            console.error('Failed to complete task:', error);
        }
    };

    const saveWallets = async () => {
        setSavingWallet(true);
        try {
            const res = await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletEvm: walletEvmInput || null,
                    walletSol: walletSolInput || null,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setProfile(prev => prev ? {
                    ...prev,
                    walletEvm: walletEvmInput || null,
                    walletSol: walletSolInput || null,
                } : null);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Failed to save wallets:', error);
        } finally {
            setSavingWallet(false);
        }
    };

    if (authLoading || loading) {
        return (
            <main className={styles.container}>
                <div style={{ textAlign: 'center', padding: '4rem', fontWeight: 900, letterSpacing: '4px', color: '#111' }}>INITIALIZING...</div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className={styles.container}>
                <header className={styles.header_minimal}>
                    <div className="desktop-hidden">
                        <Logo variant="horizontal" />
                    </div>
                    <div className="status-indicator offline">OFFLINE</div>
                </header>

                <div className={styles.vaultContainer}>
                    <div className={styles.vaultOverlay} />
                    <div className={styles.vaultIcon}>
                        <Logo variant="icon" width={100} color="#d4af37" />
                    </div>
                    <h1 className={styles.vaultTitle}>PROFILE</h1>
                    <p className={styles.vaultSubtitle}>
                        Profile mask active. Authenticate to reveal your institutional handle and score.
                    </p>
                    <Link href="/login" className="premium-button">LOGIN</Link>
                </div>
            </main>
        );
    }

    const { signOut } = useAuth();

    return (
        <main className={styles.container}>
            <header className={styles.header_minimal} style={{ marginBottom: '4rem' }}>
                <div className="desktop-hidden">
                    <Logo variant="horizontal" />
                </div>
                <div className="status-indicator">ONLINE</div>
            </header>
            <div className={`${styles.header} animate-slide-up`}>
                <button className={styles.logoutBtn} onClick={() => signOut()}>LOGOUT</button>
                <div className={styles.avatar}>{profile?.handle?.charAt(1)?.toUpperCase() || 'U'}</div>
                <div className={styles.identity}>
                    <h1 className={styles.username}>
                        {profile?.handle || '@user'}
                    </h1>
                    <div className={styles.scoreContainer}>
                        <div className={styles.scoreBox}>
                            <span className={styles.scoreLabel}>BELIEF SCORE</span>
                            <span className={styles.scoreValue}>
                                {profile?.beliefScore || 0}
                            </span>
                        </div>
                        <div className={styles.scoreBox}>
                            <span className={styles.scoreLabel}>BOOST POINTS</span>
                            <span className={styles.scoreValue}>
                                {profile?.boostPoints || 0}
                            </span>
                        </div>
                    </div>

                    {referralCode && (
                        <div className={styles.topReferral}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <span className={styles.scoreLabel} style={{ display: 'block', marginBottom: '8px' }}>Invite friends</span>
                                    <input
                                        type="text"
                                        className={styles.walletInput}
                                        value={referralLink || ''}
                                        readOnly
                                        style={{ fontSize: '0.75rem', padding: '0.75rem' }}
                                    />
                                </div>
                                <button
                                    onClick={() => copyToClipboard(referralLink || '', 'link')}
                                    className="premium-button"
                                    style={{ padding: '0.75rem 1.5rem', fontSize: '0.65rem', marginTop: '1.5rem' }}
                                >
                                    {copiedLink ? 'COPIED' : 'COPY'}
                                </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="label-s">ref: <span style={{ color: 'var(--accent-primary)' }}>{referralCount}</span></span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <DepositPortal
                userId={profile?.id || ''}
                currentBalance={profile?.balance || 0}
            />

            <section className={`${styles.section} animate-fade-in`} style={{ animationDelay: '0.1s' }}>
                <h2 className={styles.sectionTitle}>PAYOUT CONFIG</h2>

                {/* Compact Payout Strip - Zenith Spec V1 */}
                <div className={`${styles.payoutStrip} ${isEditing ? styles.editing : ''}`}>
                    <div className={styles.stripLabel}>
                        <Shield size={14} style={{ color: 'var(--accent-primary)' }} />
                        <span>PAYOUT_NODES</span>
                    </div>

                    <div className={styles.divider}></div>

                    <div className={styles.nodeGroup}>
                        <span className={styles.nodePrefix}>EVM</span>
                        {!isEditing ? (
                            <span className={styles.nodeText}>
                                {profile?.walletEvm ? `${profile.walletEvm.slice(0, 6)}...${profile.walletEvm.slice(-4)}` : 'NOT_SET'}
                            </span>
                        ) : (
                            <input
                                className={styles.stripInput}
                                value={walletEvmInput}
                                onChange={e => setWalletEvmInput(e.target.value)}
                                placeholder="0x..."
                            />
                        )}
                    </div>

                    <div className={styles.divider}></div>

                    <div className={styles.nodeGroup}>
                        <span className={styles.nodePrefix}>SOL</span>
                        {!isEditing ? (
                            <span className={styles.nodeText}>
                                {profile?.walletSol ? `${profile.walletSol.slice(0, 6)}...${profile.walletSol.slice(-4)}` : 'NOT_SET'}
                            </span>
                        ) : (
                            <input
                                className={styles.stripInput}
                                value={walletSolInput}
                                onChange={e => setWalletSolInput(e.target.value)}
                                placeholder="Address..."
                            />
                        )}
                    </div>

                    <div className={styles.divider}></div>

                    <div className={styles.stripActions}>
                        {!isEditing ? (
                            <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                                <Edit3 size={16} />
                            </button>
                        ) : (
                            <>
                                <button className={styles.saveBtn} onClick={saveWallets} disabled={savingWallet}>
                                    {savingWallet ? '...' : <Check size={16} />}
                                </button>
                                <button className={styles.cancelBtn} onClick={() => {
                                    setIsEditing(false);
                                    setWalletEvmInput(profile?.walletEvm || '');
                                    setWalletSolInput(profile?.walletSol || '');
                                }}>
                                    <X size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <section className={`${styles.section} animate-fade-in`} style={{ animationDelay: '0.2s' }}>
                <h2 className={styles.sectionTitle}>SOCIAL PROTOCOLS</h2>
                <div className={styles.socialGrid}>
                    <div className={`${styles.socialCard} glass-panel`}>
                        <span className={styles.socialIcon}>𝕏</span>
                        <div className="label-s" style={{ color: "var(--accent-primary)" }}>VERIFIED</div>
                    </div>
                </div>
            </section>

            <section className={`${styles.section} animate-fade-in`} style={{ animationDelay: '0.3s' }}>
                <h2 className={styles.sectionTitle}>PERFORMANCE MATRIX</h2>
                <div className={styles.statGrid}>
                    <div className={`${styles.statBox} glass-panel`}>
                        <div className={styles.statValue}>{profile?.stats?.sprays || 0}</div>
                        <div className={styles.statLabel}>SPRAYS</div>
                    </div>
                    <div className={`${styles.statBox} glass-panel`}>
                        <div className={styles.statValue}>{profile?.stats?.exits || 0}</div>
                        <div className={styles.statLabel}>EXITS</div>
                    </div>
                    <div className={`${styles.statBox} glass-panel`}>
                        <div className={styles.statValue}>${Number(profile?.balance || 0).toFixed(2)}</div>
                        <div className={styles.statLabel}>BALANCE</div>
                    </div>
                </div>
            </section>

            <div style={{ marginTop: "6rem", textAlign: "center", borderTop: '1px solid #111', paddingTop: '3rem' }}>
                <Link href="/" style={{
                    color: "var(--text-muted)",
                    textDecoration: "none",
                    fontSize: "0.85rem",
                    fontWeight: 900,
                    letterSpacing: '2px'
                }}>
                    RETURN TO TRENCHES ↵
                </Link>
            </div>
        </main>
    );
}
