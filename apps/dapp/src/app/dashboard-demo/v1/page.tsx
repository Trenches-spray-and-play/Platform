"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { Terminal, Shield, Zap, Activity, Clock, TrendingUp, Search, AlertTriangle } from "lucide-react";

interface Position {
    id: string;
    trench: string;
    entry: string;
    exit: string;
    roi: string;
    status: string;
    queue: string;
}

const mockPositions: Position[] = [
    { id: "1", trench: "DEEP", entry: "500 USD", exit: "750 USD", roi: "1.5X", status: "ACTIVE", queue: "012" },
    { id: "2", trench: "MID", entry: "200 USD", exit: "300 USD", roi: "1.5X", status: "QUEUED", queue: "145" },
    { id: "3", trench: "RAPID", entry: "0 USD", exit: "0 USD", roi: "---", status: "PENDING", queue: "1205" },
];

export default function CommandCenterV1() {
    return (
        <main className={styles.container}>
            <div className={styles.scanline}></div>

            <header className={styles.header}>
                <div className={styles.systemInfo}>
                    <div className={styles.infoGroup}>
                        <span className={styles.label}>[ SYSTEM_INIT ]</span>
                        <span className={styles.value}>READY_v1.0.4</span>
                    </div>
                    <div className={styles.infoGroup}>
                        <span className={styles.label}>[ USER_CLASS ]</span>
                        <span className={styles.value}>ELITE_OPERATOR</span>
                    </div>
                </div>
            </header>

            <section className={styles.stats}>
                <div className={styles.statBox}>
                    <span className={styles.boxTitle}>BELIEF_SCORE</span>
                    <div className={styles.boxValue}>1,240 <span className={styles.unit}>PTS</span></div>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.boxTitle}>BOOST_POINT</span>
                    <div className={styles.boxValue}>+450 <span className={styles.unit}>PWR</span></div>
                </div>
            </section>

            <section className={styles.tableSection}>
                <div className={styles.tableHeader}>
                    <span className={styles.title}>ACTIVE_DEPLOYMENTS</span>
                    <div className={styles.hr}></div>
                </div>

                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>IDENTIFIER</th>
                            <th>ENTRY</th>
                            <th>EXIT_EST</th>
                            <th>ROI</th>
                            <th>STATUS</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockPositions.map((p) => (
                            <tr key={p.id}>
                                <td>
                                    <div className={styles.trenchId}>
                                        <span className={styles.indicator}></span>
                                        {p.trench}_TRENCH
                                    </div>
                                </td>
                                <td>{p.entry}</td>
                                <td className={styles.exitVal}>{p.exit}</td>
                                <td>{p.roi}</td>
                                <td>
                                    <div className={styles.statusWrap}>
                                        <span className={styles.statusText}>{p.status}</span>
                                        <span className={styles.queueText}>Q_{p.queue}</span>
                                    </div>
                                </td>
                                <td>
                                    <button className={styles.boostBtn}>
                                        BOOST_SQD_0{p.id}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <footer className={styles.footer}>
                <div className={styles.ticker}>
                    <span className={styles.tickerItem}>LIVE_PAYOUT_NODE: 0x4f...892 (+1.5x)</span>
                    <span className={styles.tickerDivider}>//</span>
                    <span className={styles.tickerItem}>TRENCH_VOL: 1.2M USD</span>
                    <span className={styles.tickerDivider}>//</span>
                    <span className={styles.tickerItem}>STATUS: ALL_SYSTEMS_GO</span>
                </div>
            </footer>
        </main>
    );
}
