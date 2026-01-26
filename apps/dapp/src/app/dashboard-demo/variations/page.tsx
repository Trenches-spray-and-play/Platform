"use client";

import Link from "next/link";
import styles from "./page.module.css";

const variations = [
    { title: "V1: COMMAND CENTER", desc: "Tactical, terminal-inspired, scans and data-heavy.", path: "/dashboard-demo/v1" },
    { title: "V2: MINIMALIST ELITE", desc: "Clean, spacious, ultra-minimal razor design.", path: "/dashboard-demo/v2" },
    { title: "V3: BENTO GRID", desc: "Modular chunks, modern structured data layout.", path: "/dashboard-demo/v3" },
    { title: "V4: ZENITH GLASS", desc: "Premium blurs, ambient glows, frosted institutional look.", path: "/dashboard-demo/v4" },
    { title: "V5: PULSE ACTIVITY", desc: "Live-centric, high-energy activity feeds and tickers.", path: "/dashboard-demo/v5" },
];

export default function VariationsOverviewPage() {
    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1>DASHBOARD VARIATIONS</h1>
                <p>Select a design direction to explore the future of Trenches UI.</p>
            </header>

            <div className={styles.grid}>
                {variations.map((v, i) => (
                    <Link href={v.path} key={i} className={styles.card}>
                        <div className={styles.number}>0{i + 1}</div>
                        <h3>{v.title}</h3>
                        <p>{v.desc}</p>
                        <div className={styles.action}>ENTER_PREVIEW</div>
                    </Link>
                ))}
            </div>
        </main>
    );
}
