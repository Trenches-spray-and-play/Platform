'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './dashboard-lab.module.css';
import Logo from '@/components/Logo';

// Mock data for the lab
const mockPositions = [
    {
        id: '1',
        trenchLevel: 'MID',
        queuePosition: 1,
        entryAmount: 300,
        maxPayout: 350,
        roi: '1.2x'
    },
    {
        id: '2',
        trenchLevel: 'RAPID',
        queuePosition: 1,
        entryAmount: 20,
        maxPayout: 30,
        roi: '1.5x'
    }
];

export default function DashboardLab() {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText('https://playtrenches.xyz/ref/HJBA255V');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <main className={styles.container}>
            <header className={styles.topHeader}>
                <Logo platformName="TRENCHES" />
            </header>

            {/* Redesigned Identity Hub - Bento Style */}
            <div className={`${styles.bentoHub} ${styles.glass}`}>
                <div className={styles.profileSide}>
                    <span className={styles.handle}>@izecube</span>
                </div>

                <div className={styles.statsCenter}>
                    <div className={styles.statGroup}>
                        <span className={styles.statLabel}>BELIEF SCORE</span>
                        <span className={`${styles.statValue} ${styles.prominent}`}>750</span>
                    </div>
                    <div className={styles.statGroup}>
                        <span className={styles.statLabel}>BOOST POINTS</span>
                        <span className={`${styles.statValue} ${styles.secondary}`}>12,450</span>
                    </div>
                </div>

                <div className={styles.hubActions}>
                    <button className={styles.pillBtn} onClick={handleCopy}>
                        {copied ? 'COPIED' : 'COPY LINK'}
                    </button>
                    <button className={styles.logoutBtn}>
                        LOGOUT
                    </button>
                </div>
            </div>

            {/* Active Deployments Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>ACTIVE DEPLOYMENTS ({mockPositions.length})</h2>
                <div className={styles.deploymentGrid}>
                    {mockPositions.map(pos => (
                        <div key={pos.id} className={styles.heroCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.trenchInfo}>
                                    <span className={styles.trenchLabel}>{pos.trenchLevel} TRENCH</span>
                                </div>
                                <span className={styles.cardQueue}>${pos.entryAmount} - ${pos.maxPayout}</span>
                            </div>

                            <div className={styles.cardMain}>
                                <span className={styles.roiLabel}>QUEUE POSITION</span>
                                <span className={styles.roiValue}>#{pos.queuePosition}</span>
                            </div>

                            <div className={styles.cardActions} style={{ flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                                <span className={styles.cardFlow}>ROI: {pos.roi}</span>
                                <button className={styles.boostBtn}>BOOST QUEUE</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>





            {/* Placeholder for Earn Hub to show spacing */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>PROTOCOL EARN HUB</h2>
                <div style={{ padding: '3rem', border: '1px dashed #222', borderRadius: '16px', textAlign: 'center', color: '#444', fontWeight: 600 }}>
                    EARN HUB COMPONENTS (UNCHANGED PER REQUEST)
                </div>
            </section>

            <footer style={{ marginTop: 'auto', padding: '2rem', opacity: 0.3, fontSize: '0.6rem', letterSpacing: '2px', textAlign: 'center' }}>
                ZENITH_DASHBOARD_LAB_V1.0 // S-PR_PROTO
            </footer>
        </main>
    );
}
