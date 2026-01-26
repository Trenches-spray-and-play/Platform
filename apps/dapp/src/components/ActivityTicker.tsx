"use client";

import styles from "./ActivityTicker.module.css";

const EVENTS = [
    "@cryptoknight sprayed 1000 $BLT into Rapid Trench",
    "@whale_watcher exited Deep Trench with +20% ROI",
    "Payout Distributed: Round #452 Complete",
    "@wagmi_girl verified identity +200 Belief",
    "New Campaign 'Moonshot' queued for launch"
];

export default function ActivityTicker() {
    return (
        <div className={styles.tickerContainer}>
            <div className={styles.track}>
                {[...EVENTS, ...EVENTS].map((event, i) => (
                    <span key={i} className={styles.item}>
                        <span className={styles.dot}>•</span>
                        {event}
                    </span>
                ))}
            </div>
        </div>
    );
}
