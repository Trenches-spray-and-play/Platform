"use client";

import { useState, useEffect } from 'react';
import styles from './DesignLab.module.css';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useAuth } from '@/components/AuthProvider';

// Interfaces for API data
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

interface UserProfile {
    id: string;
    beliefScore: number;
    boostPoints: number;
}

interface Position {
    id: string;
    trenchLevel: string;
    queuePosition: number;
    entryAmount: number;
    maxPayout: number;
    status: string;
}

export default function DesignLab() {
    const { user } = useAuth();
    const [expandedHub, setExpandedHub] = useState<string | null>(null);
    const [taskTab, setTaskTab] = useState<'oneTime' | 'recurring'>('oneTime');

    // Real data state
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [campaigns, setCampaigns] = useState<ContentCampaign[]>([]);
    const [raids, setRaids] = useState<Raid[]>([]);
    const [completedRaids, setCompletedRaids] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [claimingRaid, setClaimingRaid] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [submissionUrl, setSubmissionUrl] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchAllData();
    }, [user]);

    const fetchAllData = async () => {
        try {
            const [tasksRes, raidsRes, campaignsRes, profileRes, positionsRes] = await Promise.all([
                fetch('/api/tasks'),
                fetch('/api/raids'),
                fetch('/api/content-campaigns'),
                user ? fetch('/api/user') : Promise.resolve(null),
                user ? fetch('/api/user/positions') : Promise.resolve(null),
            ]);

            const tasksData = await tasksRes.json();
            const raidsData = await raidsRes.json();
            const campaignsData = await campaignsRes.json();

            if (tasksData.data) setTasks(tasksData.data);
            if (raidsData.data) setRaids(raidsData.data);
            if (campaignsData.data) setCampaigns(campaignsData.data);

            if (profileRes) {
                const profileData = await profileRes.json();
                if (profileData.data) setProfile(profileData.data);
            }

            if (positionsRes) {
                const positionsData = await positionsRes.json();
                if (positionsData.data) setPositions(positionsData.data);
            }

            // Get user's completed raids
            if (user) {
                const completedRes = await fetch('/api/user/raids', {
                    headers: { 'x-user-id': user.id }
                });
                const completedData = await completedRes.json();
                if (completedData.data) {
                    setCompletedRaids(new Set(completedData.data.map((r: { raidId: string }) => r.raidId)));
                }
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimRaid = async (raidId: string) => {
        if (!user) return;
        setClaimingRaid(raidId);
        try {
            const res = await fetch('/api/user/raids', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify({ raidId })
            });
            const data = await res.json();
            if (data.success) {
                setCompletedRaids(prev => new Set([...prev, raidId]));
                // Refresh profile to show updated BP
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
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify({
                    campaignId,
                    url: submissionUrl[campaignId],
                    platform: platform
                })
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

    const toggleHub = (id: string) => {
        setExpandedHub(expandedHub === id ? null : id);
    };

    // Filter tasks by type
    const oneTimeTasks = tasks.filter(t => t.taskType === 'ONE_TIME' && t.isActive);
    const recurringTasks = tasks.filter(t => t.taskType === 'RECURRING' && t.isActive);

    if (loading) {
        return (
            <div className={styles.labContainer}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#666' }}>
                    LOADING EARN HUB...
                </div>
            </div>
        );
    }

    return (
        <div className={styles.labContainer}>
            <header className={styles.labHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <Logo variant="icon" width={40} color="#fff" />
                    <div className={styles.headerTitle}>
                        <h1>CREATIVE STUDIO</h1>
                        <p>Live Data Integration // Earn Hub v2.0</p>
                    </div>
                </div>
                <Link href="/dashboard" className={styles.backLink}>
                    ← BACK TO DAPP
                </Link>
            </header>

            <main className={styles.previewArea}>
                {/* Global HUD */}
                <div className={styles.topBar}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Belief Score</span>
                        <span className={styles.statValue}>{profile?.beliefScore || 0}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Boost Points</span>
                        <span className={styles.statValue}>{(profile?.boostPoints || 0).toLocaleString()}</span>
                    </div>
                </div>

                {/* Active Trenches Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Active Deployments ({positions.length})</h2>
                    {positions.length === 0 ? (
                        <div style={{ color: '#666', padding: '2rem', textAlign: 'center' }}>
                            No active deployments. <Link href="/" style={{ color: '#00FF66' }}>Initiate Spray →</Link>
                        </div>
                    ) : (
                        <div className={styles.deploymentGrid}>
                            {positions.map(d => (
                                <div key={d.id} className={styles.studioCard}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.cardType}>{d.trenchLevel} TRENCH</span>
                                        <span className={styles.cardQueue}>#{d.queuePosition}</span>
                                    </div>
                                    <div className={styles.cardMain}>
                                        <div className={styles.cardROI}>{(d.maxPayout / d.entryAmount).toFixed(1)}x ROI</div>
                                        <div className={styles.cardFlow}>${d.entryAmount} → ${d.maxPayout}</div>
                                    </div>
                                    <button className={styles.studioBtn}>BOOST +</button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* EARN BOOST POINTS HUB */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Earn Boost Points</h2>
                    <div className={styles.earnHub}>

                        {/* 1. TASKS CATEGORY */}
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
                                        <button
                                            className={taskTab === 'oneTime' ? styles.activeTab : ''}
                                            onClick={() => setTaskTab('oneTime')}
                                        >
                                            ONE-TIME MISSIONS ({oneTimeTasks.length})
                                        </button>
                                        <button
                                            className={taskTab === 'recurring' ? styles.activeTab : ''}
                                            onClick={() => setTaskTab('recurring')}
                                        >
                                            RECURRING OPS ({recurringTasks.length})
                                        </button>
                                    </div>
                                    <div className={styles.taskGrid}>
                                        {(taskTab === 'oneTime' ? oneTimeTasks : recurringTasks).map(t => (
                                            <div key={t.id} className={styles.miniTaskCard}>
                                                <div className={styles.taskReward}>+{t.reward} BP</div>
                                                <div className={styles.taskInfo}>
                                                    <h3>{t.title}</h3>
                                                    <p>{t.description || 'Complete this mission to earn boost points.'}</p>
                                                </div>
                                                <button
                                                    className={styles.executeBtn}
                                                    onClick={() => t.link && window.open(t.link, '_blank')}
                                                >
                                                    EXECUTE
                                                </button>
                                            </div>
                                        ))}
                                        {(taskTab === 'oneTime' ? oneTimeTasks : recurringTasks).length === 0 && (
                                            <div style={{ color: '#666', padding: '2rem' }}>No tasks available</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. CONTENT MARKET CATEGORY */}
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
                                        <div style={{ color: '#666', padding: '2rem' }}>No active campaigns</div>
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
                                                        <span className={styles.accentText}>+{c.beliefPointsPer1k} Belief / 1k views</span>
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

                        {/* 3. RAID CAMPAIGNS CATEGORY */}
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
                                        <div style={{ color: '#666', padding: '2rem' }}>No active raids</div>
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
                                                                <span style={{ color: '#00FF66', fontSize: '0.75rem', fontWeight: 900 }}>COMPLETED ✓</span>
                                                            ) : (
                                                                <button
                                                                    className={styles.raidBtn}
                                                                    onClick={() => {
                                                                        window.open(r.url, '_blank');
                                                                        handleClaimRaid(r.id);
                                                                    }}
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
        </div>
    );
}
