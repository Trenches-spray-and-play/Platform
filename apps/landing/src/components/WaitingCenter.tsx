"use client";

import { useState, useEffect } from "react";
import styles from './WaitingCenter.module.css';
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

interface UserSession {
    id: string;
    handle: string;
    referralCode: string;
    position: number;
    beliefScore: number;
    boostPoints: number;
    joinedAt: string;
    referralCount: number;
}

interface WaitingCenterProps {
    userSession: UserSession | null;
    onGoToDapp?: () => void;
    onLogout?: () => void;
}

export default function WaitingCenter({ userSession, onGoToDapp, onLogout }: WaitingCenterProps) {
    const [config, setConfig] = useState<PlatformConfig | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        fetch('/api/config')
            .then(res => {
                if (!res.ok) throw new Error('Config fetch failed');
                return res.json();
            })
            .then(data => setConfig(data))
            .catch(err => console.error('Failed to fetch config:', err));
    }, []);

    const getDeploymentTime = () => {
        if (config?.deploymentDate) {
            return new Date(config.deploymentDate);
        }
        // Return null if no deployment date is set
        return null;
    };

    const referralDomain = config?.referralDomain || 'playtrenches.xyz';
    const statusMessage = config?.waitlistStatusMessage || 'WAITLIST PROTOCOL ACTIVE';

    const handleCopy = () => {
        const link = `https://${referralDomain}/ref/${userSession?.referralCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <main className={styles.container}>
            <div className={styles.topBar}>
                <div className={styles.logo}>
                    <Logo platformName={config?.platformName} />
                </div>
                {onLogout && (
                    <button className={styles.logoutBtn} onClick={onLogout}>
                        [ LOGOUT ]
                    </button>
                )}
            </div>

            <header className={styles.header}>
                <div className={styles.userInfo}>
                    <h1 className={styles.title}>WAITING CENTER</h1>
                    <div className={styles.userHandle}>{userSession?.handle} // ID: 0x{userSession?.position}</div>
                </div>
                <div className={styles.statusBadge}>
                    <span className={styles.pulse}></span> ONLINE
                </div>
            </header>

            <section className={styles.dossierSection}>
                <div className={styles.dossierGrid}>
                    <div className={styles.dossierCard}>
                        <div className={styles.cardLabel}>QUEUE POSITION</div>
                        <div className={styles.cardValue}>#{userSession?.position || '--'}</div>
                        <div className={styles.cardSub}>BELIEVERS AHEAD OF YOU</div>
                    </div>
                    <div className={styles.dossierCard}>
                        <div className={styles.cardLabel}>DEPLOYMENT WINDOW</div>
                        <div className={styles.timerWrapper}>
                            {getDeploymentTime() ? (
                                <CountdownTimer targetDate={getDeploymentTime()!} />
                            ) : (
                                <span className={styles.pendingText}>PENDING</span>
                            )}
                        </div>
                        <div className={styles.cardSub}>INDIVIDUAL LAUNCH TIMER</div>
                    </div>
                    <div className={styles.dossierCard}>
                        <div className={styles.cardLabel}>RECRUITMENT LINK</div>
                        <div className={styles.referralBox}>
                            <span className={styles.refLink}>{referralDomain}/ref/{userSession?.referralCode}</span>
                            <button
                                className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                                onClick={handleCopy}
                            >
                                {copied ? 'COPIED!' : 'COPY'}
                            </button>
                        </div>
                        <div className={styles.cardSub}>RECRUIT SOLDIERS TO MOVE UP</div>
                    </div>
                </div>
            </section>

            <section className={styles.intelSection}>
                <div className={styles.intelHeader}>TACTICAL INTEL</div>
                <p className={styles.intelContent}>
                    Reduce your waiting time by <span className={styles.intelHighlight}>creating content and posting</span> about Trenches. Proactive believers can <span className={styles.intelHighlight}>overtake non-active users</span>. It's not about who came first, but who wants it more.
                </p>
            </section>

            <div className={styles.emptyState}>
                <h3 className={styles.noActiveTitle}>NO ACTIVE DEPLOYMENTS</h3>
                <p className={styles.emptyDesc}>You are currently in the reserve. Spray into an active trench once deployment begins.</p>

                {onGoToDapp && (
                    <button className={styles.launchBtn} onClick={onGoToDapp}>
                        ENTER DAPP AREA
                    </button>
                )}
            </div>

            <footer className={styles.footer}>
                <p>{statusMessage} // ENLISTED: {userSession?.joinedAt}</p>
            </footer>
        </main>
    );
}
