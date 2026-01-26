'use client';

import { useState, useEffect } from 'react';
import styles from './AdminComponents.module.css';

interface Submission {
    id: string;
    userId: string;
    userHandle: string;
    campaignId: string;
    brand: string;
    campaignName: string;
    url: string;
    platform: string;
    viewCount: number;
    beliefAwarded: number;
    status: string;
    createdAt: string;
    verifiedAt: string | null;
}

export default function ContentSubmissionsManager() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('pending');
    const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchSubmissions();
    }, [filter]);

    const fetchSubmissions = async () => {
        try {
            const res = await fetch(`/api/admin/content-submissions?status=${filter}`);
            const data = await res.json();
            if (data.success) {
                setSubmissions(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        const viewCount = viewCounts[id];
        if (!viewCount || viewCount <= 0) {
            alert('Please enter a valid view count');
            return;
        }

        setProcessing(id);
        try {
            const res = await fetch('/api/admin/content-submissions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'approved', viewCount })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Approved! Awarded ${data.data.beliefAwarded.toFixed(2)} belief points`);
                fetchSubmissions();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to approve:', error);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Reject this submission?')) return;

        setProcessing(id);
        try {
            const res = await fetch('/api/admin/content-submissions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'rejected' })
            });
            const data = await res.json();
            if (data.success) {
                fetchSubmissions();
            }
        } catch (error) {
            console.error('Failed to reject:', error);
        } finally {
            setProcessing(null);
        }
    };

    const handlePromoteToRaid = async (id: string) => {
        const reward = prompt('Enter BP reward for raid (default: 50)', '50');
        if (reward === null) return;

        setProcessing(id);
        try {
            const res = await fetch('/api/admin/content-submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId: id, reward: parseInt(reward) || 50 })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Promoted to raid: ${data.data.title}`);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to promote:', error);
        } finally {
            setProcessing(null);
        }
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;

    return (
        <div className={styles.managerContainer}>
            <div className={styles.managerHeader}>
                <h2>Content Submissions</h2>
                <div className={styles.filterTabs}>
                    {['pending', 'approved', 'rejected'].map(status => (
                        <button
                            key={status}
                            className={`${styles.filterTab} ${filter === status ? styles.activeFilter : ''}`}
                            onClick={() => setFilter(status)}
                        >
                            {status.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {submissions.length === 0 ? (
                <div className={styles.emptyState}>No {filter} submissions</div>
            ) : (
                <div className={styles.submissionsList}>
                    {submissions.map(sub => (
                        <div key={sub.id} className={styles.submissionCard}>
                            <div className={styles.submissionHeader}>
                                <span className={styles.userHandle}>@{sub.userHandle}</span>
                                <span className={`${styles.statusBadge} ${styles[sub.status]}`}>
                                    {sub.status}
                                </span>
                            </div>

                            <div className={styles.submissionDetails}>
                                <div className={styles.detailRow}>
                                    <span className={styles.label}>Campaign:</span>
                                    <span>{sub.brand} - {sub.campaignName}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.label}>Platform:</span>
                                    <span className={styles.platform}>{sub.platform}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.label}>URL:</span>
                                    <a href={sub.url} target="_blank" rel="noopener noreferrer" className={styles.urlLink}>
                                        {sub.url.slice(0, 50)}...
                                    </a>
                                </div>
                                {sub.status === 'approved' && (
                                    <>
                                        <div className={styles.detailRow}>
                                            <span className={styles.label}>Views:</span>
                                            <span>{sub.viewCount.toLocaleString()}</span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.label}>Belief Awarded:</span>
                                            <span className={styles.beliefPoints}>{sub.beliefAwarded.toFixed(2)}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {sub.status === 'pending' && (
                                <div className={styles.submissionActions}>
                                    <input
                                        type="number"
                                        placeholder="View count"
                                        className={styles.viewInput}
                                        value={viewCounts[sub.id] || ''}
                                        onChange={(e) => setViewCounts(prev => ({
                                            ...prev,
                                            [sub.id]: parseInt(e.target.value) || 0
                                        }))}
                                    />
                                    <button
                                        className={styles.approveBtn}
                                        onClick={() => handleApprove(sub.id)}
                                        disabled={processing === sub.id}
                                    >
                                        {processing === sub.id ? '...' : 'APPROVE'}
                                    </button>
                                    <button
                                        className={styles.rejectBtn}
                                        onClick={() => handleReject(sub.id)}
                                        disabled={processing === sub.id}
                                    >
                                        REJECT
                                    </button>
                                </div>
                            )}

                            {sub.status === 'approved' && (
                                <div className={styles.submissionActions}>
                                    <button
                                        className={styles.promoteBtn}
                                        onClick={() => handlePromoteToRaid(sub.id)}
                                        disabled={processing === sub.id}
                                    >
                                        {processing === sub.id ? '...' : '🚀 PROMOTE TO RAID'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
