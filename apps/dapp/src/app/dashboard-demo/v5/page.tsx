"use client";

import styles from "./page.module.css";
import { Activity, Clock, Zap, MessageSquare, TrendingUp, Users } from "lucide-react";

export default function PulseActivityV5() {
    return (
        <main className={styles.container}>
            <div className={styles.sidebar}>
                <div className={styles.pulseLogo}>PULSE</div>
                <div className={styles.nav}>
                    <div className={styles.navActive}><Activity size={18} /></div>
                    <div><Users size={18} /></div>
                    <div><Zap size={18} /></div>
                </div>
            </div>

            <div className={styles.main}>
                <header className={styles.topBar}>
                    <div className={styles.status}>
                        <div className={styles.pulseDot}></div>
                        <span>NETWORK_LIVE // ACTIVE_NODES: 1,402</span>
                    </div>
                    <div className={styles.user}>
                        <span>OPERATOR_01</span>
                        <div className={styles.points}>1240 XP</div>
                    </div>
                </header>

                <div className={styles.grid}>
                    {/* Live Activity */}
                    <div className={styles.feed}>
                        <div className={styles.cardHeader}>LIVE_SETTLEMENT_FEED</div>
                        <div className={styles.feedItems}>
                            {[
                                { user: '0x4f...892', type: 'SPRAY', amount: '$450', time: '2s ago' },
                                { user: '0x12...a90', type: 'EXIT', amount: '$750', time: '12s ago' },
                                { user: '0xb3...c21', type: 'BOOST', amount: '+12 PTS', time: '45s ago' },
                                { user: '0x88...f44', type: 'SPRAY', amount: '$100', time: '1m ago' },
                            ].map((item, i) => (
                                <div key={i} className={styles.feedItem}>
                                    <span className={styles.itemUser}>{item.user}</span>
                                    <span className={styles.itemType}>{item.type}</span>
                                    <span className={styles.itemVal}>{item.amount}</span>
                                    <span className={styles.itemTime}>{item.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Positions */}
                    <div className={styles.positions}>
                        <div className={styles.cardHeader}>YOUR_ACTIVE_Missions</div>
                        <div className={styles.positionCards}>
                            {[
                                { trench: 'DEEP', entry: '$500', roi: '1.5x', q: '12' },
                                { trench: 'MID', entry: '$200', roi: '1.5x', q: '145' },
                            ].map((pos, i) => (
                                <div key={i} className={styles.posCard}>
                                    <div className={styles.posTop}>
                                        <span className={styles.posTrench}>{pos.trench}_TRENCH</span>
                                        <span className={styles.posQ}>POS_#{pos.q}</span>
                                    </div>
                                    <div className={styles.posMain}>
                                        <div className={styles.posEntry}>
                                            <span className={styles.posLabel}>DEPLOYED</span>
                                            <span className={styles.posVal}>{pos.entry}</span>
                                        </div>
                                        <div className={styles.posRoi}>
                                            <TrendingUp size={14} />
                                            <span>{pos.roi}</span>
                                        </div>
                                    </div>
                                    <button className={styles.pulseBtn}>BOOST_SIGNAL</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Charts/Viz */}
                    <div className={styles.stats}>
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>BOOST_POWER</span>
                            <div className={styles.statMain}>+450</div>
                            <div className={styles.statVisual}>
                                <div className={styles.wave}></div>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>BELIEF_SCORE</span>
                            <div className={styles.statMain}>1,240</div>
                            <div className={styles.ranking}>TOP 5% GLOBALLY</div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
