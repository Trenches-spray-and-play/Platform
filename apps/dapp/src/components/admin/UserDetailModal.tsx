"use client";

import { useState, useEffect } from 'react';
import styles from './UserDetailModal.module.css';

interface UserDetail {
    id: string;
    handle: string;
    email: string | null;
    wallet: string | null;
    walletEvm: string | null;
    walletSol: string | null;
    beliefScore: number;
    balance: number;
    createdAt: string;
    telegramHandle: string | null;
    referralCode: string | null;
    referrer: { id: string; handle: string } | null;
    referrals: { id: string; handle: string; createdAt: string }[];
    deposits: {
        id: string;
        chain: string;
        asset: string;
        amount: string;
        amountUsd: string;
        status: string;
        txHash: string | null;
        createdAt: string;
    }[];
    depositAddresses: {
        chain: string;
        address: string;
        cachedBalance: string | null;
        cachedBalanceAt: string | null;
    }[];
    participants: {
        id: string;
        trenchId: string;
        status: string;
        boostPoints: number;
        entryAmount: number;
        maxPayout: number;
        receivedAmount: number;
        trench: { name: string; level: string };
    }[];
    sprayEntries: {
        id: string;
        amount: string;
        status: string;
        createdAt: string;
        trench: { name: string };
    }[];
    userTasks: {
        id: string;
        completedAt: string;
        task: { title: string; reward: number; link: string | null };
    }[];
    postSubmissions: {
        id: string;
        platform: string;
        url: string;
        contentType: string;
        status: string;
        endorsements: number;
        createdAt: string;
    }[];
    campaignWaitlists: {
        id: string;
        campaignId: string;
        hasDeposited: boolean;
        depositAmount: string | null;
        queueNumber: number | null;
        joinedAt: string;
        campaign: { id: string; name: string; startsAt: string | null };
    }[];
    stats: {
        totalDepositsUsd: number;
        depositsByChain: Record<string, { count: number; totalUsd: number }>;
        totalReceived: number;
        totalBoostPoints: number;
        pendingPayoutTotal: number;
        profitLoss: number;
        sprayCount: number;
        taskCount: number;
        postCount: number;
        referralCount: number;
        waitlistCount: number;
    };
}

interface UserDetailModalProps {
    userId: string | null;
    onClose: () => void;
    onUserClick?: (userId: string) => void;
}

export default function UserDetailModal({ userId, onClose, onUserClick }: UserDetailModalProps) {
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'deposits' | 'tasks' | 'referrals' | 'waitlist'>('overview');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            fetchUser();
        }
    }, [userId]);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`);
            const data = await res.json();
            if (data.success) {
                setUser(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!userId) return null;

    const handleReferralClick = (refUserId: string) => {
        if (onUserClick) {
            onUserClick(refUserId);
        }
    };

    const handleDeleteWaitlist = async (waitlistId: string, hasDeposited: boolean, depositAmount: string | null) => {
        if (!confirm(`Delete this waitlist entry?${hasDeposited ? ` $${depositAmount} will be refunded to balance.` : ''}`)) return;
        setActionLoading(waitlistId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/waitlist/${waitlistId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchUser();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to delete waitlist:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleForceExit = async (participantId: string, entryAmount: number) => {
        if (!confirm(`Force exit this position? $${entryAmount} will be refunded to balance.`)) return;
        setActionLoading(participantId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/positions/${participantId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchUser();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to force exit:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleAdjustPoints = async (type: 'belief' | 'boost', delta: number) => {
        const newValue = type === 'belief'
            ? (user?.beliefScore || 0) + delta
            : (user?.stats.totalBoostPoints || 0) + delta;
        if (!confirm(`Set ${type} to ${newValue}?`)) return;
        setActionLoading(type);
        try {
            const res = await fetch(`/api/admin/users/${userId}/points`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, delta }),
            });
            const data = await res.json();
            if (data.success) {
                fetchUser();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to adjust points:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleAdjustBalance = async () => {
        const delta = prompt('Enter amount to add (negative to subtract):');
        if (!delta) return;
        const amount = parseFloat(delta);
        if (isNaN(amount)) return alert('Invalid amount');
        setActionLoading('balance');
        try {
            const res = await fetch(`/api/admin/users/${userId}/balance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ delta: amount }),
            });
            const data = await res.json();
            if (data.success) {
                fetchUser();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to adjust balance:', error);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>

                {loading ? (
                    <div className={styles.loading}>LOADING USER DATA...</div>
                ) : user ? (
                    <>
                        {/* Header */}
                        <div className={styles.header}>
                            <div className={styles.avatar}>{user.handle?.charAt(1)?.toUpperCase() || 'U'}</div>
                            <div className={styles.identity}>
                                <h2 className={styles.handle}>{user.handle}</h2>
                                <div className={styles.meta}>
                                    {user.email && <span>{user.email}</span>}
                                    {user.telegramHandle && <span>@{user.telegramHandle}</span>}
                                </div>
                            </div>
                            <div className={styles.scores}>
                                <div className={styles.scoreBox}>
                                    <span className={styles.scoreLabel}>BELIEF</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <button onClick={() => handleAdjustPoints('belief', -10)} disabled={actionLoading === 'belief'} style={{ padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer' }}>-</button>
                                        <span className={styles.scoreValue}>{user.beliefScore}</span>
                                        <button onClick={() => handleAdjustPoints('belief', 10)} disabled={actionLoading === 'belief'} style={{ padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer' }}>+</button>
                                    </div>
                                </div>
                                <div className={styles.scoreBox}>
                                    <span className={styles.scoreLabel}>BOOST</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <button onClick={() => handleAdjustPoints('boost', -50)} disabled={actionLoading === 'boost'} style={{ padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer' }}>-</button>
                                        <span className={styles.scoreValue}>{user.stats.totalBoostPoints}</span>
                                        <button onClick={() => handleAdjustPoints('boost', 50)} disabled={actionLoading === 'boost'} style={{ padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer' }}>+</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>BALANCE</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span className={styles.statValue}>${Number(user.balance).toFixed(2)}</span>
                                    <button onClick={handleAdjustBalance} disabled={actionLoading === 'balance'} style={{ padding: '2px 8px', fontSize: '0.65rem', cursor: 'pointer', background: '#333', border: '1px solid #555', borderRadius: '4px', color: '#00FF66' }}>±</button>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>TOTAL DEPOSITED</span>
                                <span className={styles.statValue}>${user.stats.totalDepositsUsd.toFixed(2)}</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>TOTAL RECEIVED</span>
                                <span className={styles.statValue}>${user.stats.totalReceived.toFixed(2)}</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>P&L</span>
                                <span className={styles.statValue} style={{ color: user.stats.profitLoss >= 0 ? '#00FF66' : '#ff4444' }}>
                                    {user.stats.profitLoss >= 0 ? '+' : ''}${user.stats.profitLoss.toFixed(2)}
                                </span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>SPRAYS</span>
                                <span className={styles.statValue}>{user.stats.sprayCount}</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>PENDING PAYOUT</span>
                                <span className={styles.statValue}>${user.stats.pendingPayoutTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Wallets Section */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>WALLETS</h3>
                            <div className={styles.walletGrid}>
                                {user.walletEvm && (
                                    <div className={styles.walletCard}>
                                        <span className={styles.walletLabel}>EVM (Base/Arb/Hyper)</span>
                                        <span className={styles.walletAddress}>{user.walletEvm}</span>
                                    </div>
                                )}
                                {user.walletSol && (
                                    <div className={styles.walletCard}>
                                        <span className={styles.walletLabel}>Solana</span>
                                        <span className={styles.walletAddress}>{user.walletSol}</span>
                                    </div>
                                )}
                                {user.depositAddresses.map((addr) => (
                                    <div key={addr.chain} className={styles.walletCard}>
                                        <span className={styles.walletLabel}>{addr.chain} Deposit</span>
                                        <span className={styles.walletAddress}>{addr.address}</span>
                                        {addr.cachedBalance && (
                                            <span className={styles.cachedBalance}>
                                                Balance: {Number(addr.cachedBalance).toFixed(6)}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className={styles.tabs}>
                            {(['overview', 'waitlist', 'deposits', 'tasks', 'referrals'] as const).map(tab => (
                                <button
                                    key={tab}
                                    className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab.toUpperCase()}{tab === 'waitlist' && user.campaignWaitlists?.length ? ` (${user.campaignWaitlists.length})` : ''}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className={styles.tabContent}>
                            {activeTab === 'overview' && (
                                <div className={styles.overview}>
                                    {/* Positions */}
                                    <h4>Active Positions ({user.participants.filter(p => p.status !== 'exited' && p.status !== 'paid').length})</h4>
                                    {user.participants.filter(p => p.status !== 'exited' && p.status !== 'paid').length === 0 ? (
                                        <p className={styles.empty}>No active positions</p>
                                    ) : (
                                        <div className={styles.positionList}>
                                            {user.participants.filter(p => p.status !== 'exited' && p.status !== 'paid').map((p) => (
                                                <div key={p.id} className={styles.positionCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <span className={styles.positionTrench}>{p.trench.name}</span>
                                                        <span className={styles.positionStatus}>{p.status}</span>
                                                        <span>Entry: ${p.entryAmount}</span>
                                                        <span>Received: ${p.receivedAmount}</span>
                                                    </div>
                                                    {p.status !== 'paid' && p.status !== 'exited' && (
                                                        <button
                                                            onClick={() => handleForceExit(p.id, p.entryAmount)}
                                                            disabled={actionLoading === p.id}
                                                            style={{ padding: '4px 8px', fontSize: '0.65rem', background: '#ff4444', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
                                                        >
                                                            {actionLoading === p.id ? '...' : 'FORCE EXIT'}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Recent Posts */}
                                    <h4>Recent Posts ({user.postSubmissions.length})</h4>
                                    {user.postSubmissions.length === 0 ? (
                                        <p className={styles.empty}>No posts submitted</p>
                                    ) : (
                                        <div className={styles.postList}>
                                            {user.postSubmissions.slice(0, 5).map((p) => (
                                                <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className={styles.postLink}>
                                                    {p.platform} - {p.contentType} ({p.endorsements} endorsements)
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'deposits' && (
                                <div className={styles.depositList}>
                                    {/* Deposits by chain summary */}
                                    <div className={styles.chainSummary}>
                                        {Object.entries(user.stats.depositsByChain).map(([chain, data]) => (
                                            <div key={chain} className={styles.chainCard}>
                                                <span className={styles.chainName}>{chain}</span>
                                                <span>{data.count} deposits</span>
                                                <span>${data.totalUsd.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* All deposits */}
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Chain</th>
                                                <th>Asset</th>
                                                <th>Amount</th>
                                                <th>USD</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {user.deposits.map((d) => (
                                                <tr key={d.id}>
                                                    <td>{d.chain}</td>
                                                    <td>{d.asset}</td>
                                                    <td>{Number(d.amount).toFixed(6)}</td>
                                                    <td>${Number(d.amountUsd).toFixed(2)}</td>
                                                    <td>{d.status}</td>
                                                    <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'waitlist' && (
                                <div className={styles.taskList}>
                                    <p className={styles.taskSummary}>
                                        {user.campaignWaitlists?.length || 0} waitlist entries
                                    </p>
                                    {(!user.campaignWaitlists || user.campaignWaitlists.length === 0) ? (
                                        <p className={styles.empty}>No waitlist entries</p>
                                    ) : (
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th>Campaign</th>
                                                    <th>Status</th>
                                                    <th>Deposit</th>
                                                    <th>Queue #</th>
                                                    <th>Joined</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {user.campaignWaitlists.map((w) => (
                                                    <tr key={w.id}>
                                                        <td>{w.campaign?.name || 'Unknown'}</td>
                                                        <td style={{ color: w.hasDeposited ? '#FFD700' : '#888' }}>
                                                            {w.hasDeposited ? 'SECURED' : 'ENLISTED'}
                                                        </td>
                                                        <td>{w.depositAmount ? `$${Number(w.depositAmount).toFixed(2)}` : '-'}</td>
                                                        <td>{w.queueNumber || '-'}</td>
                                                        <td>{new Date(w.joinedAt).toLocaleDateString()}</td>
                                                        <td>
                                                            <button
                                                                onClick={() => handleDeleteWaitlist(w.id, w.hasDeposited, w.depositAmount)}
                                                                disabled={actionLoading === w.id}
                                                                style={{ padding: '3px 6px', fontSize: '0.6rem', background: '#ff4444', border: 'none', borderRadius: '3px', color: '#fff', cursor: 'pointer' }}
                                                            >
                                                                {actionLoading === w.id ? '...' : 'DELETE'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}

                            {activeTab === 'tasks' && (
                                <div className={styles.taskList}>
                                    <p className={styles.taskSummary}>
                                        Completed {user.userTasks.length} tasks
                                    </p>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Task</th>
                                                <th>Reward</th>
                                                <th>Link</th>
                                                <th>Completed</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {user.userTasks.map((t) => (
                                                <tr key={t.id}>
                                                    <td>{t.task.title}</td>
                                                    <td>{t.task.reward} BP</td>
                                                    <td>
                                                        {t.task.link ? (
                                                            <a href={t.task.link} target="_blank" rel="noopener noreferrer">
                                                                View ↗
                                                            </a>
                                                        ) : '-'}
                                                    </td>
                                                    <td>{new Date(t.completedAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'referrals' && (
                                <div className={styles.referralList}>
                                    <div className={styles.referralInfo}>
                                        <p>Referral Code: <strong>{user.referralCode || 'Not generated'}</strong></p>
                                        {user.referrer && (
                                            <p>
                                                Referred by:
                                                <button
                                                    className={styles.userLink}
                                                    onClick={() => handleReferralClick(user.referrer!.id)}
                                                >
                                                    @{user.referrer.handle}
                                                </button>
                                            </p>
                                        )}
                                    </div>

                                    <h4>Referrals ({user.referrals.length})</h4>
                                    {user.referrals.length === 0 ? (
                                        <p className={styles.empty}>No referrals yet</p>
                                    ) : (
                                        <div className={styles.referralGrid}>
                                            {user.referrals.map((r) => (
                                                <button
                                                    key={r.id}
                                                    className={styles.referralCard}
                                                    onClick={() => handleReferralClick(r.id)}
                                                >
                                                    <span className={styles.referralHandle}>@{r.handle}</span>
                                                    <span className={styles.referralDate}>
                                                        {new Date(r.createdAt).toLocaleDateString()}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer meta */}
                        <div className={styles.footer}>
                            <span>User ID: {user.id}</span>
                            <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                    </>
                ) : (
                    <div className={styles.error}>Failed to load user data</div>
                )}
            </div>
        </div>
    );
}
