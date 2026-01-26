"use client";

import { useState, useEffect } from 'react';
import styles from './PointsWidget.module.css';

interface PointsWidgetProps {
    userId: string;
    beliefScore?: number;
    boostPoints?: number;
    compact?: boolean;
}

interface UserStats {
    beliefScore: number;
    postsSubmitted: number;
    validationsGiven: number;
}

export default function PointsWidget({ userId, beliefScore: propBeliefScore, boostPoints = 0, compact = false }: PointsWidgetProps) {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) fetchStats();
    }, [userId]);

    const fetchStats = async () => {
        try {
            const res = await fetch(`/api/user/stats?userId=${userId}`);
            const data = await res.json();

            if (data.success) {
                setStats(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const beliefScore = propBeliefScore ?? stats?.beliefScore ?? 0;

    return (
        <div className={`${styles.container} ${compact ? styles.compact : ''} animate-slide-up`}>
            <div className={styles.mainScores}>
                <div className={styles.scoreItem}>
                    <span className={`${styles.value} ${styles.belief_color}`}>{beliefScore}</span>
                    <span className={styles.label}>BELIEF SCORE</span>
                </div>
                <div className={styles.divider} />
                <div className={styles.scoreItem}>
                    <span className={styles.value}>{boostPoints}</span>
                    <span className={styles.label}>BOOST POINTS</span>
                </div>
            </div>
        </div>
    );
}
