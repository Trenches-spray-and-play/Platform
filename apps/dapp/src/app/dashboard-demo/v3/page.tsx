"use client";

import styles from "./page.module.css";
import { Search, Zap, Activity, Users, Clock, ArrowRight } from "lucide-react";

export default function BentoGridV3() {
    return (
        <main className={styles.container}>
            <div className={styles.bento}>
                {/* Stats Section */}
                <div className={`${styles.card} ${styles.belief}`}>
                    <span className={styles.label}>BELIEF_SCORE</span>
                    <div className={styles.mainVal}>1,240</div>
                    <div className={styles.trend}>+12.5% THIS WEEK</div>
                </div>

                <div className={`${styles.card} ${styles.boost}`}>
                    <span className={styles.label}>BOOST_POINT</span>
                    <div className={styles.mainVal}>+450</div>
                    <div className={styles.subtext}>RANK: ELITE</div>
                </div>

                <div className={`${styles.card} ${styles.referrals}`}>
                    <span className={styles.label}>REFERRALS</span>
                    <div className={styles.mainVal}>12</div>
                    <Users size={24} className={styles.icon} />
                </div>

                {/* Main Content */}
                <div className={`${styles.card} ${styles.mainTable}`}>
                    <div className={styles.tableHead}>
                        <h2>ACTIVE_TRENCHES</h2>
                        <div className={styles.search}>
                            <Search size={14} />
                        </div>
                    </div>

                    <div className={styles.list}>
                        {[
                            { trench: 'DEEP', entry: '$500', roi: '1.5x', status: 'ACTIVE', time: '24h 12m' },
                            { trench: 'MID', entry: '$200', roi: '1.5x', status: 'QUEUED', time: '---' },
                            { trench: 'RAPID', entry: '$0', roi: '---', status: 'PENDING', time: '72h 00m' },
                        ].map((row, i) => (
                            <div key={i} className={styles.item}>
                                <div className={styles.itemInfo}>
                                    <span className={styles.itemTrench}>{row.trench}</span>
                                    <span className={styles.itemMeta}>{row.status} // {row.time}</span>
                                </div>
                                <div className={styles.itemData}>
                                    <div className={styles.dataPoint}>
                                        <span className={styles.dLabel}>ENTRY</span>
                                        <span className={styles.dVal}>{row.entry}</span>
                                    </div>
                                    <div className={styles.dataPoint}>
                                        <span className={styles.dLabel}>ROI</span>
                                        <span className={styles.dVal}>{row.roi}</span>
                                    </div>
                                </div>
                                <button className={styles.goBtn}><Zap size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Queue Insight */}
                <div className={`${styles.card} ${styles.queue}`}>
                    <span className={styles.label}>QUEUE_DYNAMIC</span>
                    <div className={styles.queueViz}>
                        <div className={styles.bar} style={{ height: '40%' }}></div>
                        <div className={styles.bar} style={{ height: '70%', background: '#00ff66' }}></div>
                        <div className={styles.bar} style={{ height: '50%' }}></div>
                        <div className={styles.bar} style={{ height: '90%' }}></div>
                    </div>
                    <p>Current Momentum: HIGH</p>
                </div>

                <div className={`${styles.card} ${styles.cta}`}>
                    <p>WANT DEEPER TRENCHES?</p>
                    <button className={styles.ctaBtn}>UPGRADE <ArrowRight size={14} /></button>
                </div>
            </div>
        </main>
    );
}
