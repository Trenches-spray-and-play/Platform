"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";
import { Shield, Zap, Cpu, Activity, Sun, Moon, X, ChevronRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import OnboardingModal from "@/components/OnboardingModal";
import WaitlistDashboard from "@/components/WaitlistDashboard";
import {
    Logo,
    useTheme,
    TacticalButton,
    GoogleIcon,
    CountdownTimer,
    RadialProgress
} from "@trenches/ui";

/**
 * [UI] Standardized Animation Presets
 * Purpose: Codifies the "Institutional Elite" motion standard.
 */
const springConfig = { type: "spring", stiffness: 300, damping: 30, mass: 1 } as const;

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { ...springConfig, duration: 0.6 }
} as const;

/**
 * [UI] Countdown Timer
 * Purpose: Re-introduces launch-critical transparency with Super Scale aesthetic.
 */

export default function WelcomePage() {
    // 1. Core Auth Hooks
    const { user, signInWithGoogle, signOut, isLoading: authLoading } = useAuth();

    // 2. Universal Theme Hook
    const { isDarkMode, toggleTheme } = useTheme();

    // 3. Local State
    const [userSession, setUserSession] = useState<any>(null);
    const [isDetermining, setIsDetermining] = useState(true);
    const [config, setConfig] = useState<any>(null);
    const [activeMission, setActiveMission] = useState(0);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const missionStatements = [
        "Turn Belief into Profit.",
        "The Future of Community Rewards.",
        "Turn $1000 into $1500 in 24 hours.",
        "Direct payouts. Pure profit."
    ];

    // 3. Effects: Config & Session Sync
    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error('Failed to fetch config:', err));
    }, []);

    useEffect(() => {
        const cached = localStorage.getItem('user_session');
        console.log('WelcomePage: Mount cached session:', cached ? 'YES' : 'NO');
        if (cached) {
            try { setUserSession(JSON.parse(cached)); }
            catch (e) { console.error("Failed to parse cached session"); }
        }
        if (!authLoading && !user) setIsDetermining(false);
    }, [authLoading, user]);

    useEffect(() => {
        if (user && !userSession) {
            setIsDetermining(true);
            console.log('Syncing user session for:', user.id);
            fetch(`/api/user/sync?supabaseId=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    console.log('Sync result:', { exists: data.exists, hasUser: !!data.user });
                    if (data.exists && data.user) {
                        setUserSession(data.user);
                        localStorage.setItem('user_session', JSON.stringify(data.user));
                    } else if (user) {
                        setIsOnboardingOpen(true);
                    }
                })
                .catch(err => console.error("Sync error:", err))
                .finally(() => setIsDetermining(false));
        } else if (!authLoading && !user) {
            setIsDetermining(false);
        } else if (user && userSession) {
            setIsDetermining(false);
        }
    }, [user, authLoading, userSession]);

    // 4. UI Rotation Effect
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveMission(prev => (prev + 1) % missionStatements.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [missionStatements.length]);

    // 5. Handlers
    const handleEnlist = async () => {
        if (!user) {
            setIsAuthenticating(true);
            try { await signInWithGoogle(); }
            catch (err) { console.error("Login failed:", err); }
            finally { setIsAuthenticating(false); }
            return;
        }
        setIsOnboardingOpen(true);
    };

    const handleOnboardingComplete = (userData: any) => {
        console.log('Onboarding complete received:', userData);
        setUserSession(userData);
        localStorage.setItem('user_session', JSON.stringify(userData));
        setIsOnboardingOpen(false);
    };

    const handleLogout = async () => {
        await signOut();
        setUserSession(null);
        localStorage.removeItem('user_session');
    };

    // 6. Early Returns
    if (userSession) {
        return (
            <>
                <WaitlistDashboard userSession={userSession} onLogout={handleLogout} />

                {/* Dashboard-level Theme Toggle for UX parity */}
                <button
                    className={styles.themeToggle}
                    style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100 }}
                    onClick={toggleTheme}
                    aria-label="Toggle Theme"
                >
                    {isDarkMode ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
                </button>
            </>
        );
    }

    const targetDate = config?.deploymentDate ? new Date(config.deploymentDate) : null;
    const platformName = config?.platformName || "TRENCHES";

    return (
        <>
            <header className={styles.v6Meta}>
                <Logo platformName={platformName} />

                <div className={styles.v6MetaRight}>
                    <AnimatePresence mode="wait">
                        {authLoading || isDetermining ? (
                            <motion.div
                                key="loader"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={styles.headerSkeleton}
                                aria-hidden="true"
                            />
                        ) : (
                            <motion.div
                                key="status"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={styles.statusBadge}
                            >
                                <span className={styles.statusPulse} />
                                System Online
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        className={styles.themeToggle}
                        onClick={toggleTheme}
                        aria-label="Toggle Theme"
                    >
                        {isDarkMode ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
                    </button>

                    <TacticalButton
                        variant="primary"
                        className={styles.v6MetaCTA}
                        onClick={handleEnlist}
                        disabled={isAuthenticating}
                    >
                        <GoogleIcon /> {isAuthenticating ? "..." : "Get Started"}
                    </TacticalButton>
                </div>
            </header>

            <main className={styles.v6Main}>
                {/* 1. HERO NARRATIVE */}
                <section className={`${styles.v6Section} ${styles.v6Hero}`} aria-label="Hero Narrative">
                    <div className={styles.v6TagSection}>
                        <span className={styles.v6Tag}>[ Protocol Activated ]</span>
                    </div>

                    <CountdownTimer targetDate={targetDate} />

                    <div className="h-[200px] flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.h1
                                key={activeMission}
                                className={styles.v6H1}
                                initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            >
                                {missionStatements[activeMission].split(' ').map((word, i) => (
                                    <React.Fragment key={i}>
                                        {word}
                                        {i === 1 && <br />}
                                        {' '}
                                    </React.Fragment>
                                ))}
                            </motion.h1>
                        </AnimatePresence>
                    </div>

                    <motion.p
                        className={styles.v6P}
                        {...fadeUp}
                        transition={{ delay: 0.2 }}
                    >
                        Put $1000 in, get $1500 out in 24 hours. Start with as low as $5.<br />
                        No complicated trading. Just direct payouts backed by the community.
                    </motion.p>

                    <TacticalButton
                        variant="hybrid"
                        className={styles.v6CTA}
                        onClick={handleEnlist}
                        disabled={isAuthenticating}
                    >
                        <GoogleIcon /> {isAuthenticating ? "..." : "Join waitlist"}
                    </TacticalButton>

                    {/* [UI] Partner Trust Strip */}
                    <motion.div
                        className={styles.v6TrustStrip}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <span className={styles.v6TrustLabel}>Enterprise Infrastructure //</span>
                        <div className={styles.v6TrustLogos}>
                            {['Solana', 'Base', 'Google Cloud', 'HyperEVM', 'AnyWallet'].map(partner => (
                                <span key={partner} className={styles.v6TrustLogo}>{partner}</span>
                            ))}
                        </div>
                    </motion.div>
                </section>

                {/* 2. THE WHY */}
                <section className={styles.v6Section} aria-label="Project Objectives">
                    <div className={styles.sectionHeader}>
                        <span className={styles.v6Tag}>The Objective</span>
                        <h2>Better<br />by Design.</h2>
                    </div>
                    <div className={styles.featureGrid}>
                        {[
                            { num: "01", title: "Get Early Access", icon: <Cpu strokeWidth={1.5} />, desc: "Join projects before they go viral. Secure your spot at the best price before everyone else." },
                            { num: "02", title: "Help Projects Grow", icon: <Activity strokeWidth={1.5} />, desc: "Share a post, verify others, and get paid for your support. Your activity moves you forward." },
                            { num: "03", title: "Rebuild Trust", icon: <Shield strokeWidth={1.5} />, desc: "Bring projects back to life by working together with your community to rebuild market value." }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                className={styles.featureCard}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-10%" }}
                                transition={{ delay: i * 0.1, ...springConfig }}
                            >
                                <span className={styles.cardNumber}>{feature.num}</span>
                                <div className={styles.featureIcon}>{feature.icon}</div>
                                <h3>{feature.title}</h3>
                                <p>{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* 3. THE CYCLE */}
                <section className={styles.v6Section} aria-label="The Coordination Cycle">
                    <div className={styles.sectionHeader}>
                        <span className={styles.v6Tag}>The Mechanism</span>
                        <h2>Three-Step<br />Cycle.</h2>
                    </div>
                    <div className={styles.featureGrid}>
                        {[
                            { num: "01", title: "Spray", icon: <Zap strokeWidth={1.5} />, desc: "Put your tokens into the project fund with as low as $5 to start your 24h timer." },
                            { num: "02", title: "Play", icon: <Activity strokeWidth={1.5} />, desc: "Help the project grow on social media to verify your spot and stay in the game." },
                            { num: "03", title: "Collect", icon: <Shield strokeWidth={1.5} />, desc: "Collect your 50% Profit sent instantly to your account when the timer hits zero." }
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                className={styles.featureCard}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-10%" }}
                                transition={{ delay: i * 0.1, ...springConfig }}
                            >
                                <span className={styles.cardNumber}>{step.num}</span>
                                <div className={styles.featureIcon}>{step.icon}</div>
                                <h3>{step.title}</h3>
                                <p>{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* 4. THE GAME */}
                <section className={styles.v6Section} aria-label="Platform Sustainability">
                    <div className={styles.mechanicContainer}>
                        <div className={styles.mechanicContent}>
                            <div className={styles.v6TagSection}>
                                <span className={styles.v6Tag}>Profit Protected</span>
                            </div>
                            <h2 className={styles.v6H1} style={{ fontSize: '5rem', letterSpacing: '-3px' }}>The Game Never Stops.</h2>
                            <p className={styles.v6P} style={{ margin: '0 0 4rem 0' }}>
                                Every project sets aside a dedicated reward fund.
                                This ensures the community payouts continue fairly even if
                                new users slow down.
                            </p>
                            <div className={styles.statusBadge} style={{ width: 'fit-content' }}>
                                <span className={styles.statusPulse} />
                                Payouts Flowing
                            </div>
                        </div>
                        <div className={styles.mechanicMetrics}>
                            <RadialProgress percentage={config?.reservePercentage || 15} label="Rewards Ready to Pay Out" />
                        </div>
                    </div>
                </section>

                {/* 5. FOOTER (V5 Parity) */}
                <footer className={styles.v5Footer}>
                    <div className={styles.v5FooterContent}>
                        <div className={styles.v5FooterLinks}>
                            <a href={config?.docsUrl || "#"} className={styles.v5FooterLink}>Documentation</a>
                            <a href={config?.twitterUrl || "#"} className={styles.v5FooterLink}>X (Twitter)</a>
                            <a href={config?.telegramUrl || "#"} className={styles.v5FooterLink}>Telegram</a>
                            <a href="#" className={styles.v5FooterLink}>Terms</a>
                        </div>
                        <div className={styles.v5FooterRight}>
                            <span className={styles.v5FooterTagline}>POWERED BY BELIEF // SPRAY & PLAY</span>
                            <span className={styles.v5FooterCopyright}>© 2026 {platformName} Network. All rights reserved.</span>
                        </div>
                    </div>
                </footer>
            </main>

            <OnboardingModal
                isOpen={isOnboardingOpen}
                onClose={() => setIsOnboardingOpen(false)}
                onComplete={handleOnboardingComplete}
            />
        </>
    );
}
