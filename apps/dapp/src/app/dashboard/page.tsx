"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';
import { useAuth } from '@/components/AuthProvider';
import Logo from '@/components/Logo';
import CountdownTimer from '@/components/CountdownTimer';
import {
    Zap,
    Clock,
    CheckCircle2,
    AlertCircle,
    Activity,
    TrendingUp,
    Search
} from 'lucide-react';

interface Position {
    id: string;
    type: 'active' | 'secured' | 'enlisted';
    trenchId?: string;
    trenchName?: string;
    trenchLevel: string;
    status: string;
    joinedAt: string;
    boostPoints?: number;
    entryAmount?: number;
    maxPayout?: number;
    receivedAmount?: number;
    expiresAt?: string | null;
    // Time-based fields (Protocol-V1)
    expectedPayoutAt?: string;
    formattedCountdown?: string;
    remainingTime?: {
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        isReady: boolean;
    };
    payoutTxHash?: string | null;
    // Waitlist specific
    campaignId?: string;
    campaignName?: string;
    depositAmount?: number;
    roiMultiplier?: number;
    queueNumber?: number | null;
    startsAt?: string | null;
}

interface UserProfile {
    id: string;
    handle: string;
    referralCode?: string;
    beliefScore: number;
    boostPoints: number;
    stats?: {
        referrals: number;
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
    taskType: 'ONE_TIME' | 'RECURRING';
    isActive: boolean;
}

interface ContentCampaign {
    id: string;
    brand: string;
    name: string;
    platforms: string[];
    beliefPointsPer1k: number;
    icon: string | null;
}

interface Raid {
    id: string;
    title: string;
    platform: string;
    url: string;
    reward: number;
    completions: number;
}

export default function DashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [positions, setPositions] = useState<Position[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [platformConfig, setPlatformConfig] = useState<{ referralDomain?: string } | null>(null);

    // Earn Hub state
    const [expandedHub, setExpandedHub] = useState<string | null>(null);
    const [taskTab, setTaskTab] = useState<'oneTime' | 'recurring'>('oneTime');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [campaigns, setCampaigns] = useState<ContentCampaign[]>([]);
    const [raids, setRaids] = useState<Raid[]>([]);
    const [completedRaids, setCompletedRaids] = useState<Set<string>>(new Set());
    const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
    const [claimingRaid, setClaimingRaid] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [submissionUrl, setSubmissionUrl] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [filterText, setFilterText] = useState('');

    useEffect(() => {
        if (!authLoading && user) {
            fetchData();
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [authLoading, user]);

    const fetchData = async () => {
        try {
            const [positionsRes, profileRes, tasksRes, raidsRes, campaignsRes, completedTasksRes, configRes] = await Promise.all([
                fetch('/api/user/positions'),
                fetch('/api/user'),
                fetch('/api/tasks'),
                fetch('/api/raids'),
                fetch('/api/content-campaigns'),
                fetch('/api/user/tasks'),
                fetch('/api/config'),
            ]);

            const positionsData = await positionsRes.json();
            const profileData = await profileRes.json();
            const tasksData = await tasksRes.json();
            const raidsData = await raidsRes.json();
            const campaignsData = await campaignsRes.json();
            const completedTasksData = await completedTasksRes.json();
            const configData = await configRes.json();

            if (positionsData.data) setPositions(positionsData.data);
            if (profileData.data) setProfile(profileData.data);
            if (configData) setPlatformConfig(configData);
            if (tasksData.data) setTasks(tasksData.data);
            if (raidsData.data) setRaids(raidsData.data);
            if (campaignsData.data) setCampaigns(campaignsData.data);

            const completedIds = new Set<string>(
                (completedTasksData.data || []).map((t: { taskId: string }) => t.taskId)
            );
            setCompletedTaskIds(completedIds);

            if (user) {
                try {
                    const completedRaidsRes = await fetch('/api/user/raids', {
                        headers: { 'x-user-id': user.id }
                    });
                    const completedRaidsData = await completedRaidsRes.json();
                    if (completedRaidsData.data) {
                        setCompletedRaids(new Set(completedRaidsData.data.map((r: { raidId: string }) => r.raidId)));
                    }
                } catch (e) {
                    console.error('Failed to fetch completed raids:', e);
                }
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleHub = (id: string) => {
        setExpandedHub(expandedHub === id ? null : id);
    };

    const handleClaimRaid = async (raidId: string) => {
        if (!user) return;
        setClaimingRaid(raidId);
        try {
            const res = await fetch('/api/user/raids', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
                body: JSON.stringify({ raidId })
            });
            const data = await res.json();
            if (data.success) {
                setCompletedRaids(prev => new Set([...prev, raidId]));
                const profileRes = await fetch('/api/user');
                const profileData = await profileRes.json();
                if (profileData.data) setProfile(profileData.data);
            }
        } catch (error) {
            console.error('Failed to claim raid:', error);
        } finally {
            setClaimingRaid(null);
        }
    };

    const handleSubmitContent = async (campaignId: string, platform: string) => {
        if (!user || !submissionUrl[campaignId]) return;
        setSubmitting(campaignId);
        try {
            const res = await fetch('/api/user/content-submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
                body: JSON.stringify({ campaignId, url: submissionUrl[campaignId], platform })
            });
            const data = await res.json();
            if (data.success) {
                setSubmissionUrl(prev => ({ ...prev, [campaignId]: '' }));
                alert('Content submitted for review!');
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to submit content:', error);
        } finally {
            setSubmitting(null);
        }
    };

    const handleTaskComplete = async (taskId: string) => {
        if (!user) return;
        try {
            const res = await fetch('/api/user/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId }),
            });
            const data = await res.json();
            if (data.success) {
                setCompletedTaskIds(prev => new Set([...prev, taskId]));
                const profileRes = await fetch('/api/user');
                const profileData = await profileRes.json();
                if (profileData.data) setProfile(profileData.data);
            }
        } catch (error) {
            console.error('Failed to complete task:', error);
        }
    };

    const oneTimeTasks = tasks.filter(t => t.taskType === 'ONE_TIME' && t.isActive);
    const recurringTasks = tasks.filter(t => t.taskType === 'RECURRING' && t.isActive);

    const handleCopy = () => {
        const referralDomain = platformConfig?.referralDomain || 'playtrenches.xyz';
        const referralCode = profile?.referralCode || 'CORE';
        navigator.clipboard.writeText(`https://${referralDomain}/ref/${referralCode}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (authLoading) {
        return <div className={styles.loading}>LOADING COMMAND...</div>;
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
                    <div className={styles.vaultIcon}>
                        <Logo variant="icon" width={100} color="#d4af37" />
                    </div>
                    <h1 className={styles.vaultTitle}>COMMAND CENTER</h1>
                    <p className={styles.vaultSubtitle}>
                        Identity verification required. Sync protocol to access deployment console.
                    </p>
                    <Link href="/login" className="premium-button">LOGIN</Link>
                </div>
            </main>
        );
    }

    if (loading) {
        return <div className={styles.loading}>LOADING COMMAND...</div>;
    }

    const getStatusIcon = (status: string, isReady?: boolean) => {
        if (status === 'paid') return <CheckCircle2 size={14} className={styles.iconSuccess} />;
        if (isReady) return <Clock size={14} className={styles.iconQueued} />;
        if (status === 'active') return <Activity size={14} className={styles.iconActive} />;
        return <AlertCircle size={14} className={styles.iconPending} />;
    };

    const getStatusText = (pos: Position) => {
        if (pos.status === 'paid') return 'COMPLETED';
        if (pos.remainingTime?.isReady) return 'PROCESSING';
        if (pos.type === 'active') return 'ACTIVE';
        if (pos.type === 'secured') return 'QUEUED';
        return 'PENDING';
    };

    const getTypeClass = (type: string) => {
        switch (type) {
            case 'active': return styles.typeSpray;
            case 'secured': return styles.typeSecure;
            case 'enlisted': return styles.typeEnlist;
            default: return '';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'active': return 'SPRAY';
            case 'secured': return 'SECURE';
            case 'enlisted': return 'ENLIST';
            default: return type.toUpperCase();
        }
    };

    const getLevelClass = (level: string) => {
        const l = level.toUpperCase();
        if (l === 'RAPID') return styles.levelRapid;
        if (l === 'DEEP') return styles.levelDeep;
        return styles.levelMid;
    };

    const filteredPositions = positions.filter(pos => {
        if (!filterText) return true;
        const search = filterText.toLowerCase();
        return pos.trenchLevel.toLowerCase().includes(search) ||
               pos.type.toLowerCase().includes(search);
    });

    const activePositions = filteredPositions.filter(p => p.status !== 'paid');
    const historyPositions = filteredPositions.filter(p => p.status === 'paid');
    const displayPositions = activeTab === 'active' ? activePositions : historyPositions;

    return (
        <main className={styles.container}>
            <header className={styles.header_minimal}>
                <div className="desktop-hidden">
                    <Logo variant="horizontal" />
                </div>
                <div className="status-indicator">ONLINE</div>
            </header>

            {/* New Stats Header */}
            <div className={styles.headerStats}>
                <div className={styles.userBrief}>
                    <div className={styles.userStat}>
                        <span className={styles.statLabel}>BELIEF_SCORE</span>
                        <span className={styles.statValue}>{(profile?.beliefScore || 0).toLocaleString()}</span>
                    </div>
                    <div className={styles.userStat}>
                        <span className={styles.statLabel}>BOOST_POINT</span>
                        <span className={styles.statValue}>+{(profile?.boostPoints || 0).toLocaleString()}</span>
                    </div>
                </div>
                <div className={styles.userMeta}>
                    <span className={styles.handle}>{profile?.handle || '@user'}</span>
                    <span className={styles.refCount}>{profile?.stats?.referrals || 0} REFERRALS</span>
                    <button className={styles.pillBtn} onClick={handleCopy}>
                        {copied ? 'COPIED' : 'COPY LINK'}
                    </button>
                </div>
            </div>

            {/* Positions Table Section */}
            <section className={styles.section}>
                <div className={styles.tableControls}>
                    <div className={styles.tabs}>
                        <button
                            className={activeTab === 'active' ? styles.tabActive : styles.tab}
                            onClick={() => setActiveTab('active')}
                        >
                            ACTIVE_POSITIONS ({activePositions.length})
                        </button>
                        <button
                            className={activeTab === 'history' ? styles.tabActive : styles.tab}
                            onClick={() => setActiveTab('history')}
                        >
                            HISTORY ({historyPositions.length})
                        </button>
                    </div>
                    <div className={styles.searchBox}>
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="FILTER_TRENCHES..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                    </div>
                </div>

                {displayPositions.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>{activeTab === 'active' ? 'NO ACTIVE DEPLOYMENTS FOUND' : 'NO HISTORY YET'}</p>
                        {activeTab === 'active' && (
                            <Link href="/" className={styles.sprayBtn}>INITIATE SPRAY</Link>
                        )}
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.positionTable}>
                            <thead>
                                <tr>
                                    <th>TRENCH_TYPE</th>
                                    <th>ENTRY</th>
                                    <th>EXIT_EST</th>
                                    <th>ROI</th>
                                    <th>STATUS / METRICS</th>
                                    <th>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayPositions.map((pos) => {
                                    const entryAmount = pos.entryAmount || pos.depositAmount || 0;
                                    const exitAmount = pos.maxPayout || Math.floor(entryAmount * (pos.roiMultiplier || 1.5));
                                    const roi = entryAmount > 0 ? (exitAmount / entryAmount).toFixed(1) + 'x' : '---';
                                    const statusText = getStatusText(pos);

                                    return (
                                        <tr key={pos.id} className={styles.tableRow}>
                                            <td data-label="TRENCH_TYPE">
                                                <div className={styles.trenchCell}>
                                                    <span className={`${styles.typeBadge} ${getTypeClass(pos.type)}`}>
                                                        {getTypeLabel(pos.type)}
                                                    </span>
                                                    <span className={`${styles.levelText} ${getLevelClass(pos.trenchLevel)}`}>{pos.trenchLevel}_TRENCH</span>
                                                </div>
                                            </td>
                                            <td data-label="ENTRY / EXIT">
                                                <div className={styles.amountCell}>
                                                    <span className={styles.amount}>${entryAmount}</span>
                                                    <span className={styles.amountDivider}>/</span>
                                                    <span className={styles.amountExitMobile}>${exitAmount}</span>
                                                    <span className={styles.currency}>USD</span>
                                                </div>
                                            </td>
                                            <td data-label="EXIT_EST">
                                                <div className={styles.amountCell}>
                                                    <span className={styles.amountExit}>${exitAmount}</span>
                                                    <span className={styles.currency}>USD</span>
                                                </div>
                                            </td>
                                            <td data-label="ROI">
                                                <div className={styles.roiCell}>
                                                    <TrendingUp size={12} className={roi !== '---' ? styles.roiIcon : styles.roiIconDisabled} />
                                                    <span>{roi}</span>
                                                </div>
                                            </td>
                                            <td data-label="STATUS">
                                                <div className={styles.statusCell}>
                                                    <div className={styles.statusPrimary}>
                                                        {getStatusIcon(pos.status, pos.remainingTime?.isReady)}
                                                        <span>{statusText}</span>
                                                    </div>
                                                    <div className={styles.statusSecondary}>
                                                        {pos.type === 'active' && pos.expectedPayoutAt && pos.status !== 'paid' && (
                                                            <div className={styles.metric}>
                                                                <Clock size={10} />
                                                                <CountdownTimer
                                                                    targetDate={new Date(pos.expectedPayoutAt)}
                                                                    compact
                                                                />
                                                            </div>
                                                        )}
                                                        {pos.queueNumber && (
                                                            <div className={styles.metric}>
                                                                <Activity size={10} />
                                                                <span>#{pos.queueNumber}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="ACTION">
                                                {pos.status === 'paid' ? (
                                                    pos.payoutTxHash ? (
                                                        <a
                                                            href={`https://explorer.hyperliquid.xyz/tx/${pos.payoutTxHash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`${styles.tableBoostBtn} ${styles.completed}`}
                                                        >
                                                            <CheckCircle2 size={14} />
                                                            <span>VIEW TX</span>
                                                        </a>
                                                    ) : (
                                                        <span className={`${styles.tableBoostBtn} ${styles.completed}`}>
                                                            <CheckCircle2 size={14} />
                                                            <span>PAID</span>
                                                        </span>
                                                    )
                                                ) : (
                                                    <button className={styles.tableBoostBtn}>
                                                        <Zap size={14} />
                                                        <span>BOOST</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>


            {/* Earn Boost Points Hub */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Earn Boost Points</h2>
                <div className={styles.earnHub}>

                    {/* Protocol Tasks */}
                    <div className={`${styles.hubCategory} ${expandedHub === 'tasks' ? styles.active : ''}`}>
                        <button className={styles.hubBtn} onClick={() => toggleHub('tasks')}>
                            <div className={styles.hubBtnContent}>
                                <span className={styles.hubBtnTitle}>PROTOCOL TASKS ({oneTimeTasks.length + recurringTasks.length})</span>
                                <span className={styles.hubBtnDesc}>Complete one-time or recurring missions to increase your protocol standing.</span>
                            </div>
                            <span className={styles.chevron}>{expandedHub === 'tasks' ? '▲' : '▼'}</span>
                        </button>
                        {expandedHub === 'tasks' && (
                            <div className={`${styles.hubContent} ${styles.animate}`}>
                                <div className={styles.tabSwitcher}>
                                    <button className={taskTab === 'oneTime' ? styles.activeTab : ''} onClick={() => setTaskTab('oneTime')}>
                                        ONE-TIME MISSIONS ({oneTimeTasks.length})
                                    </button>
                                    <button className={taskTab === 'recurring' ? styles.activeTab : ''} onClick={() => setTaskTab('recurring')}>
                                        RECURRING OPS ({recurringTasks.length})
                                    </button>
                                </div>
                                <div className={styles.taskGrid}>
                                    {(taskTab === 'oneTime' ? oneTimeTasks : recurringTasks).map(t => {
                                        const isCompleted = completedTaskIds.has(t.id);
                                        return (
                                            <div key={t.id} className={styles.miniTaskCard} style={{ opacity: isCompleted ? 0.5 : 1 }}>
                                                <div className={styles.taskReward}>+{t.reward} BP</div>
                                                <div className={styles.taskInfo}>
                                                    <h3>{t.title}</h3>
                                                    <p>{t.description || 'Complete this mission to earn boost points.'}</p>
                                                </div>
                                                {isCompleted ? (
                                                    <span className={styles.completedTag}>COMPLETED ✓</span>
                                                ) : (
                                                    <button className={styles.executeBtn} onClick={() => { if (t.link) window.open(t.link, '_blank'); handleTaskComplete(t.id); }}>
                                                        EXECUTE
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {(taskTab === 'oneTime' ? oneTimeTasks : recurringTasks).length === 0 && (
                                        <div className={styles.emptyHub}>No tasks available</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Market */}
                    <div className={`${styles.hubCategory} ${expandedHub === 'market' ? styles.active : ''}`}>
                        <button className={styles.hubBtn} onClick={() => toggleHub('market')}>
                            <div className={styles.hubBtnContent}>
                                <span className={styles.hubBtnTitle}>CONTENT MARKET ({campaigns.length})</span>
                                <span className={styles.hubBtnDesc}>Syndicate brand content and earn Belief Points for verified engagement.</span>
                            </div>
                            <span className={styles.chevron}>{expandedHub === 'market' ? '▲' : '▼'}</span>
                        </button>
                        {expandedHub === 'market' && (
                            <div className={`${styles.hubContent} ${styles.animate}`}>
                                {campaigns.length === 0 ? (
                                    <div className={styles.emptyHub}>No active campaigns</div>
                                ) : (
                                    <div className={styles.campaignGrid}>
                                        {campaigns.map(c => (
                                            <div key={c.id} className={styles.studioCampaignCard}>
                                                <div className={styles.campaignHeader}>
                                                    <span className={styles.campaignIcon}>{c.icon || '🎯'}</span>
                                                    <div>
                                                        <h3>{c.brand}</h3>
                                                        <p>{c.name}</p>
                                                    </div>
                                                </div>
                                                <div className={styles.campaignYield}>
                                                    <span>{c.platforms.join(' • ')}</span>
                                                    <span className={styles.accentText}>+{c.beliefPointsPer1k} Belief Points / 1k views</span>
                                                </div>
                                                <div className={styles.submissionBox}>
                                                    <input
                                                        type="text"
                                                        placeholder="Paste your status link..."
                                                        className={styles.subInput}
                                                        value={submissionUrl[c.id] || ''}
                                                        onChange={(e) => setSubmissionUrl(prev => ({ ...prev, [c.id]: e.target.value }))}
                                                    />
                                                    <button
                                                        className={styles.subBtn}
                                                        onClick={() => handleSubmitContent(c.id, c.platforms[0])}
                                                        disabled={submitting === c.id || !submissionUrl[c.id]}
                                                    >
                                                        {submitting === c.id ? '...' : 'SUBMIT'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Raid Campaigns */}
                    <div className={`${styles.hubCategory} ${expandedHub === 'raids' ? styles.active : ''}`}>
                        <button className={styles.hubBtn} onClick={() => toggleHub('raids')}>
                            <div className={styles.hubBtnContent}>
                                <span className={styles.hubBtnTitle}>RAID CAMPAIGNS ({raids.length})</span>
                                <span className={styles.hubBtnDesc}>Amplify the frontline by raiding and amplifying approved community content.</span>
                            </div>
                            <span className={styles.chevron}>{expandedHub === 'raids' ? '▲' : '▼'}</span>
                        </button>
                        {expandedHub === 'raids' && (
                            <div className={`${styles.hubContent} ${styles.animate}`}>
                                {raids.length === 0 ? (
                                    <div className={styles.emptyHub}>No active raids</div>
                                ) : (
                                    <div className={styles.raidList}>
                                        {raids.map(r => {
                                            const isCompleted = completedRaids.has(r.id);
                                            return (
                                                <div key={r.id} className={styles.raidItem} style={{ opacity: isCompleted ? 0.5 : 1 }}>
                                                    <div className={styles.raidMain}>
                                                        <span className={styles.raidPlatform}>{r.platform}</span>
                                                        <span className={styles.raidTitle}>{r.title}</span>
                                                    </div>
                                                    <div className={styles.raidAction}>
                                                        <span className={styles.raidReward}>+{r.reward} BP</span>
                                                        {isCompleted ? (
                                                            <span className={styles.completedTag}>COMPLETED ✓</span>
                                                        ) : (
                                                            <button
                                                                className={styles.raidBtn}
                                                                onClick={() => { window.open(r.url, '_blank'); handleClaimRaid(r.id); }}
                                                                disabled={claimingRaid === r.id}
                                                            >
                                                                {claimingRaid === r.id ? 'CLAIMING...' : 'RAID & AMPLIFY'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
