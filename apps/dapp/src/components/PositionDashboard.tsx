"use client";

import styles from './PositionDashboard.module.css';
import { TrenchData } from '@/lib/mockData';
import { useRouter } from 'next/navigation';

interface PositionDashboardProps {
    trench: TrenchData;
    onBoost: () => void;
}

export default function PositionDashboard({ trench, onBoost }: PositionDashboardProps) {
    const router = useRouter();

    // Find user's rank
    const userParticipant = trench.participants.find(p => p.handle === '@you');
    const rank = userParticipant ? trench.participants.indexOf(userParticipant) + 1 : 0;
    const beliefScore = userParticipant?.beliefScore || 0;
    const boostPoints = userParticipant?.boostPoints || 0;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.statusDot}></span>
                <span className={styles.statusText}>YOU ARE IN THE {trench.level} TRENCH</span>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statBox}>
                    <span className={styles.label}>QUEUE POSITION</span>
                    <span className={styles.value}>#{rank}</span>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.label}>BELIEF SCORE</span>
                    <span className={styles.value}>{beliefScore}</span>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.label}>BOOST POINTS</span>
                    <span className={styles.value}>{boostPoints}</span>
                </div>
            </div>

            <div className={styles.actions}>
                <button className={styles.actionBtn} onClick={() => router.push('/profile')}>
                    <span className={styles.btnIcon}>⚡</span>
                    <span className={styles.btnText}>DO TASKS (+BOOST)</span>
                </button>
                <button className={styles.actionBtn} onClick={onBoost}>
                    <span className={styles.btnIcon}>🤝</span>
                    <span className={styles.btnText}>VALIDATE PEERS (+BOOST)</span>
                </button>
            </div>
        </div>
    );
}
