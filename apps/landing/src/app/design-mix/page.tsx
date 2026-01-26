"use client";

import styles from './DesignMix.module.css';

const mockData = {
    handle: "@IZECUBE",
    referral: "playtrenches.xyz/ref/HJBA255V",
    queue: "#323456",
    referralCount: 12,
    timer: "25 : 03 : 28 : 12"
};

export default function DesignMix() {
    return (
        <main className={styles.mixContainer}>
            {/* Identity Hub - Refined with Logout Action */}
            <div className={`${styles.bentoHub} ${styles.glass}`}>
                <div className={styles.profileSide}>
                    <span className={styles.handle}>{mockData.handle}</span>
                    <span className={styles.referralStat}>REFERRALS: <span>{mockData.referralCount}</span></span>
                </div>

                <span className={styles.referral}>{mockData.referral}</span>

                <div className={styles.hubActions}>
                    <button className={styles.copyBtn}>COPY LINK</button>
                    <button className={styles.logoutBtn}>LOGOUT</button>
                </div>
            </div>

            {/* Centered Hero Card - Refined Layout with Spacing */}
            <div className={`${styles.heroCard} ${styles.glass}`}>
                <div className={styles.customCopy}>
                    Overtake the competition by <br /> creating high-value content.
                </div>

                <div className={styles.queueBox}>
                    <p className={styles.queueLabel}>QUEUE POSITION</p>
                    <p className={styles.queueValue}>{mockData.queue}</p>
                </div>

                <div className={styles.timerFooter}>
                    {mockData.timer}
                </div>
            </div>

            <p style={{ marginTop: 'auto', fontSize: '0.6rem', color: '#222', letterSpacing: '2px' }}>WORLD-CLASS TACTICAL INTERFACE // DESIGN MIX V2.1</p>
        </main>
    );
}
