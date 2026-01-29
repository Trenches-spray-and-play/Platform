"use client";

import { useState, useEffect } from "react";
import styles from './WaitlistDashboard.module.css';
import { Logo, TacticalButton, XIcon, TelegramIcon, CountdownTimer } from '@trenches/ui';
import { Share2 } from 'lucide-react';

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
    userSession: {
        handle?: string;
        position?: string | number;
        referralCount?: number;
        referralCode?: string;
    };
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
    const statusMessage = config?.waitlistStatusMessage || 'SYSTEM LIVE // READY';

    const shareUrl = `https://${referralDomain}/ref/${referralCode}`;

    const handleShare = async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: 'Join Trenches',
                    text: 'Join the waitlist for Trenches: Spray & Play',
                    url: shareUrl,
                });
                return;
            } catch {
                console.log('User cancelled or share failed, falling back to copy');
            }
        }

        // Fallback to clipboard
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <main className={styles.container}>
            <header className={styles.topHeader}>
                <Logo platformName={config?.platformName} />
            </header>

            {/* Bento Identity Hub */}
            <div className={`${styles.bentoHub} ${styles.glass}`} aria-label="User Stats">
                <div className={styles.profileSide}>
                    <span className={styles.handle}>{handle}</span>
                    <span className={styles.referralStat}>REFERRALS: <span>{referralCount}</span></span>
                </div>

                <span className={styles.referral}>
                    {referralDomain}/ref/{referralCode}
                </span>

                <div className={styles.hubActions}>
                    <TacticalButton
                        onClick={handleShare}
                        className={styles.copyBtn}
                    >
                        {copied ? (
                            <>COPIED</>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Share2 size={12} strokeWidth={2.5} /> SHARE
                            </div>
                        )}
                    </TacticalButton>

                    {onLogout && (
                        <TacticalButton
                            variant="primary"
                            className={styles.logoutBtn}
                            onClick={onLogout}
                        >
                            [ Logout ]
                        </TacticalButton>
                    )}
                </div>
            </div>

            {/* Zenith Hero Card */}
            <div className={`${styles.heroCard} ${styles.glass}`} aria-label="Waitlist Position">
                <div className={styles.customCopy}>
                    Invite friends or create contents about <br /> Trenches to move ahead in the queue
                </div>

                <div className={styles.queueBox}>
                    <p className={styles.queueLabel}>QUEUE POSITION</p>
                    <p className={styles.queueValue}>
                        <span>#</span>{queuePosition}
                    </p>
                </div>

                <div className={styles.timerFooter}>
                    {getDeploymentTime() && (
                        <CountdownTimer targetDate={getDeploymentTime()!} simple={true} />
                    )}
                </div>
            </div>

            <footer className={styles.footer}>
                <div className={styles.footerLinks}>
                    <a href={config?.twitterUrl || "#"} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
                        <XIcon size={12} /> TWITTER
                    </a>
                    <a href={config?.telegramUrl || "#"} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
                        <TelegramIcon size={12} /> TELEGRAM
                    </a>
                    <a href={config?.docsUrl || "#"} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>DOCS</a>
                </div>
                <p className={styles.footerText}>
                    {statusMessage} {"//"} CORE_STABLE_V6_ELITE
                </p>
            </footer>
        </main>
    );
}
