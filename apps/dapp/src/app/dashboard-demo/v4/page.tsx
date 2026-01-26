"use client";

import styles from "./page.module.css";
import { Zap, Activity, Shield, TrendingUp } from "lucide-react";

export default function ZenithGlassV4() {
    return (
        <main className={styles.container}>
            <div className={styles.blob1}></div>
            <div className={styles.blob2}></div>

            <div className={styles.glassPanel}>
                <header className={styles.header}>
                    <div className={styles.info}>
                        <span className={styles.label}>CONNECTED_ACCESS</span>
                        <h2>ZENITH_ENVIRONMENT_04</h2>
                    </div>
                    <div className={styles.stats}>
                        <div className={styles.sBlock}>
                            <span className={styles.sLabel}>BELIEF</span>
                            <span className={styles.sVal}>1,240</span>
                        </div>
                        <div className={styles.sBlock}>
                            <span className={styles.sLabel}>BOOST</span>
                            <span className={styles.sVal}>+450</span>
                        </div>
                    </div>
                </header>

                <section className={styles.tableWrap}>
                    <div className={styles.rowHead}>
                        <span>POSITION_INTEL</span>
                        <span>REALTIME_FEED</span>
                    </div>

                    <div className={styles.table}>
                        {[
                            { trench: 'DEEP', entry: '$500', roi: '1.5x', status: 'ACTIVE' },
                            { trench: 'MID', entry: '$200', roi: '1.5x', status: 'QUEUED' },
                            { trench: 'RAPID', entry: '$0', roi: '---', status: 'PENDING' },
                        ].map((pos, i) => (
                            <div key={i} className={styles.row}>
                                <div className={styles.trenchIcon}><Shield size={16} /></div>
                                <div className={styles.cell}>
                                    <span className={styles.cLabel}>{pos.trench}_TRENCH</span>
                                    <span className={styles.cVal}>{pos.status}</span>
                                </div>
                                <div className={styles.cell}>
                                    <span className={styles.cLabel}>DEPLOYED</span>
                                    <span className={styles.cVal}>{pos.entry}</span>
                                </div>
                                <div className={styles.cell}>
                                    <span className={styles.cLabel}>RETURN</span>
                                    <span className={styles.cValSuccess}>{pos.roi}</span>
                                </div>
                                <button className={styles.actionBtn}>BOOST</button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
