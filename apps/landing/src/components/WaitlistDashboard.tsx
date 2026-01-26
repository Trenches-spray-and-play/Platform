"use client";

import { useState, useEffect } from "react";
import styles from './WaitlistDashboard.module.css';
import CountdownTimer from './CountdownTimer';
import Logo from './Logo';

interface PlatformConfig {
    deploymentDate: string | null;
    referralDomain: string;
    docsUrl: string;
    twitterUrl: string;
    telegramUrl: string;
    waitlistStatusMessage: string;
    platformName: string;
}

interface WaitlistDashboardProps {
    userSession: any;
    onLogout?: () => void;
}

export default function WaitlistDashboard({ userSession, onLogout }: WaitlistDashboardProps) {
    const [config, setConfig] = useState<PlatformConfig | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error('Failed to fetch config:', err));
    }, []);

    const getDeploymentTime = () => {
        if (config?.deploymentDate) {
            return new Date(config.deploymentDate);
        }
        return null;
    };

    const queuePosition = userSession?.position ?? '--';
    const referralCount = userSession?.referralCount ?? 0;
    const referralCode = userSession?.referralCode || 'LOADING';
    const handle = userSession?.handle || '@user';
    const referralDomain = config?.referralDomain || 'playtrenches.xyz';
    const statusMessage = config?.waitlistStatusMessage || 'WAITLIST PROTOCOL ACTIVE';

    const handleCopy = () => {
        navigator.clipboard.writeText(`https://${referralDomain}/ref/${referralCode}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <main className={styles.container}>
            <header className={styles.topHeader}>
                <Logo platformName={config?.platformName} />
            </header>
            {/* Compact Identity Hub - Refined Bento Style */}
            <div className={`${styles.bentoHub} ${styles.glass}`}>
                <div className={styles.profileSide}>
                    <span className={styles.handle}>{handle}</span>
                    <span className={styles.referralStat}>REFERRALS: <span>{referralCount}</span></span>
                </div>

                <span className={styles.referral}>{referralDomain}/ref/{referralCode}</span>

                <div className={styles.hubActions}>
                    <button className={styles.copyBtn} onClick={handleCopy}>
                        {copied ? 'COPIED' : 'COPY LINK'}
                    </button>
                    {onLogout && (
                        <button className={styles.logoutBtn} onClick={onLogout}>
                            LOGOUT
                        </button>
                    )}
                </div>
            </div>

            {/* Centered Hero Card - Zenith Elite Standard */}
            <div className={`${styles.heroCard} ${styles.glass}`}>
                <div className={styles.customCopy}>
                    Overtake the competition by <br /> creating high-value content.
                </div>

                <div className={styles.queueBox}>
                    <p className={styles.queueLabel}>QUEUE POSITION</p>
                    <p className={styles.queueValue}>#{queuePosition}</p>
                </div>

                <div className={styles.timerFooter}>
                    {getDeploymentTime() && (
                        <CountdownTimer targetDate={getDeploymentTime()!} simple={true} />
                    )}
                </div>
            </div>

            <footer className={styles.footer}>
                <div className={styles.footerLinks} style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.7rem', opacity: 0.6 }}>
                    <a href={config?.twitterUrl || "#"} target="_blank" rel="noopener noreferrer">𝕏 TWITTER</a>
                    <a href={config?.telegramUrl || "#"} target="_blank" rel="noopener noreferrer">TELEGRAM</a>
                    <a href={config?.docsUrl || "#"} target="_blank" rel="noopener noreferrer">DOCS</a>
                </div>
                <p className={styles.footerText}>{statusMessage} // CORE_STABLE_V1.1_ELITE</p>
            </footer>
        </main>
    );
}
