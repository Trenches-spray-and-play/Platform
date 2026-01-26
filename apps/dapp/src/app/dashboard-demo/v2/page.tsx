"use client";

import styles from "./page.module.css";
import { Zap, Activity, Circle } from "lucide-react";

export default function MinimalistEliteV2() {
    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div className={styles.brand}>ELITE_ACCESS</div>
                <div className={styles.profile}>
                    <div className={styles.avatar}></div>
                    <span className={styles.handle}>@operator_01</span>
                </div>
            </header>

            <div className={styles.metrics}>
                <div className={styles.metric}>
                    <span className={styles.label}>BELIEF</span>
                    <span className={styles.value}>1.2K</span>
                </div>
                <div className={styles.metric}>
                    <span className={styles.label}>BOOST</span>
                    <span className={styles.value}>+450</span>
                </div>
            </div>

            <section className={styles.content}>
                <div className={styles.tableHeader}>
                    <span>MY_TRENCHES</span>
                    <div className={styles.line}></div>
                </div>

                <div className={styles.rows}>
                    {[
                        { type: 'DEEP', entry: '$500', roi: '1.5x', status: 'ACTIVE' },
                        { type: 'MID', entry: '$200', roi: '1.5x', status: 'QUEUED' },
                        { type: 'RAPID', entry: '$0', roi: '---', status: 'PENDING' },
                    ].map((row, i) => (
                        <div key={i} className={styles.row}>
                            <div className={styles.rowMain}>
                                <div className={styles.rowType}>
                                    <Zap size={12} className={styles.zap} />
                                    <span>{row.type}</span>
                                </div>
                                <div className={styles.rowEntry}>
                                    <span className={styles.rowLabel}>ENTRY</span>
                                    <span>{row.entry}</span>
                                </div>
                                <div className={styles.rowRoi}>
                                    <span className={styles.rowLabel}>ROI</span>
                                    <span>{row.roi}</span>
                                </div>
                                <div className={styles.rowStatus}>
                                    <Circle size={8} fill={row.status === 'ACTIVE' ? '#00ff66' : '#333'} stroke="none" />
                                    <span>{row.status}</span>
                                </div>
                            </div>
                            <button className={styles.boostBtn}>BOOST_SIGNAL</button>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
