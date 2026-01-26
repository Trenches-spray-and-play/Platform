"use client";

import { useState } from "react";
import styles from "./page.module.css";
import {
    Zap,
    Shield,
    Activity,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    ChevronRight,
    Search
} from "lucide-react";
import Logo from "@/components/Logo";

interface DashboardPosition {
    id: string;
    type: 'ENLIST' | 'SECURE' | 'SPRAY';
    trenchLevel: 'RAPID' | 'MID' | 'DEEP';
    entryAmount: number;
    exitAmount: number;
    roi: string;
    status: {
        time?: string;
        payoutStatus: 'PENDING' | 'COMPLETED' | 'ACTIVE' | 'QUEUED';
        queuePosition?: number;
    };
}

const mockPositions: DashboardPosition[] = [
    {
        id: "1",
        type: 'SPRAY',
        trenchLevel: 'DEEP',
        entryAmount: 500,
        exitAmount: 750,
        roi: "1.5x",
        status: {
            payoutStatus: 'ACTIVE',
            queuePosition: 12,
            time: "24:12:05"
        }
    },
    {
        id: "2",
        type: 'SECURE',
        trenchLevel: 'MID',
        entryAmount: 200,
        exitAmount: 300,
        roi: "1.5x",
        status: {
            payoutStatus: 'QUEUED',
            queuePosition: 145,
            time: "--:--:--"
        }
    },
    {
        id: "3",
        type: 'ENLIST',
        trenchLevel: 'RAPID',
        entryAmount: 0,
        exitAmount: 0,
        roi: "---",
        status: {
            payoutStatus: 'PENDING',
            queuePosition: 1205,
            time: "72:00:00"
        }
    },
    {
        id: "4",
        type: 'SPRAY',
        trenchLevel: 'MID',
        entryAmount: 100,
        exitAmount: 150,
        roi: "1.5x",
        status: {
            payoutStatus: 'COMPLETED',
            queuePosition: 0,
            time: "00:00:00"
        }
    }
];

export default function DashboardDemoPage() {
    const [positions] = useState<DashboardPosition[]>(mockPositions);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 size={14} className={styles.iconSuccess} />;
            case 'ACTIVE': return <Activity size={14} className={styles.iconActive} />;
            case 'QUEUED': return <Clock size={14} className={styles.iconQueued} />;
            default: return <AlertCircle size={14} className={styles.iconPending} />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'SPRAY': return styles.typeSpray;
            case 'SECURE': return styles.typeSecure;
            case 'ENLIST': return styles.typeEnlist;
            default: return '';
        }
    };

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <div className={styles.userBrief}>
                        <div className={styles.userStat}>
                            <span className={styles.statLabel}>BELIEF_SCORE</span>
                            <span className={styles.statValue}>1,240</span>
                        </div>
                        <div className={styles.userStat}>
                            <span className={styles.statLabel}>BOOST_POINT</span>
                            <span className={styles.statValue}>+450</span>
                        </div>
                    </div>
                </div>
            </header>

            <section className={styles.dashboardSection}>
                <div className={styles.tableControls}>
                    <div className={styles.tabs}>
                        <button className={styles.tabActive}>ACTIVE_POSITIONS</button>
                        <button className={styles.tab}>HISTORY</button>
                    </div>
                    <div className={styles.searchBox}>
                        <Search size={16} />
                        <input type="text" placeholder="FILTER_TRENCHES..." />
                    </div>
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.positionTable}>
                        <thead>
                            <tr>
                                <th>TRENCH_TYPE</th>
                                <th>ENTRY</th>
                                <th>EXIT_EST</th>
                                <th>ROI</th>
                                <th>STATUS / METRICS</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {positions.map((pos) => (
                                <tr key={pos.id} className={styles.row}>
                                    <td>
                                        <div className={styles.trenchCell}>
                                            <span className={`${styles.typeBadge} ${getTypeColor(pos.type)}`}>
                                                {pos.type}
                                            </span>
                                            <span className={styles.levelText}>{pos.trenchLevel}_TRENCH</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.amountCell}>
                                            <span className={styles.amount}>${pos.entryAmount}</span>
                                            <span className={styles.currency}>USD</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.amountCell}>
                                            <span className={styles.amountExit}>${pos.exitAmount}</span>
                                            <span className={styles.currency}>USD</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.roiCell}>
                                            <TrendingUp size={12} className={pos.roi !== '---' ? styles.roiIcon : styles.roiIconDisabled} />
                                            <span>{pos.roi}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.statusCell}>
                                            <div className={styles.statusPrimary}>
                                                {getStatusIcon(pos.status.payoutStatus)}
                                                <span>{pos.status.payoutStatus}</span>
                                            </div>
                                            <div className={styles.statusSecondary}>
                                                <div className={styles.metric}>
                                                    <Clock size={10} />
                                                    <span>{pos.status.time}</span>
                                                </div>
                                                <div className={styles.metric}>
                                                    <Activity size={10} />
                                                    <span>#{pos.status.queuePosition}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <button className={styles.boostBtn}>
                                            <Zap size={14} />
                                            <span>BOOST</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <footer className={styles.footer}>
            </footer>
        </main>
    );
}
