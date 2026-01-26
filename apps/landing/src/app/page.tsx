"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./page.module.css";
import CountdownTimer from "@/components/CountdownTimer";
import OnboardingModal from "@/components/OnboardingModal";
import WaitlistDashboard from "@/components/WaitlistDashboard";
import { useAuth } from "@/components/AuthProvider";
import { Twitter, Shield, Zap, Cpu, Activity, ArrowRight, CornerDownRight, Box, Terminal, ChevronRight, Activity as ActivityIcon } from "lucide-react";
import Logo from "@/components/Logo";
import TacticalButton from "@/components/TacticalButton";

const RadialProgress = ({ percentage, label }: { percentage: number, label: string }) => {
    const strokeDasharray = 2 * Math.PI * 45;
    const strokeDashoffset = strokeDasharray * ((100 - percentage) / 100);

    return (
        <div className={styles.radialWrapper}>
            <svg width="200" height="200" viewBox="0 0 100 100">
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                />
                <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="var(--accent-zenith)"
                    strokeWidth="8"
                    strokeDasharray={strokeDasharray}
                    initial={{ strokeDashoffset: strokeDasharray }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 2, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black">{percentage}%</span>
            </div>
            <span className={styles.radialLabel}>{label}</span>
        </div>
    );
};

export default function WelcomePage() {
    const { user, signInWithGoogle, signOut, isLoading: authLoading } = useAuth();
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [userSession, setUserSession] = useState<any>(null);
    const [isDetermining, setIsDetermining] = useState(true);
    const [config, setConfig] = useState<any>(null);
    const [missionIndex, setMissionIndex] = useState(0);
    const [tagIndex, setTagIndex] = useState(0);

    const tags = ["[ LAYER_01_COORDINATION ]", "[ SPRAY & PLAY ]"];

    const missions = [
        "The first high-frequency P2P settlement layer for brand amplification.",
        "Earn 50% more on your tokens just for being social. Complete missions to skip the queue and get paid faster.",
        "The first non-custodial coordination layer for token incubation and community distribution."
    ];

    useEffect(() => {
        const missionInterval = setInterval(() => {
            setMissionIndex((prev) => (prev + 1) % missions.length);
        }, 10000); // 10 seconds

        const tagInterval = setInterval(() => {
            setTagIndex((prev) => (prev + 1) % tags.length);
        }, 30000); // 30 seconds

        return () => {
            clearInterval(missionInterval);
            clearInterval(tagInterval);
        };
    }, [missions.length, tags.length]);

    // Initial session check from localStorage to prevent flicker
    useEffect(() => {
        const cached = localStorage.getItem('user_session');
        if (cached) {
            try {
                setUserSession(JSON.parse(cached));
            } catch (e) {
                console.error("Failed to parse cached session");
            }
        }
        // If no user in Supabase yet, we can stop determining early
        if (!authLoading && !user) {
            setIsDetermining(false);
        }
    }, [authLoading, user]);

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error('Failed to fetch config:', err));
    }, []);

    useEffect(() => {
        if (user && !userSession) {
            setIsDetermining(true);
            // Check if user exists in DB
            fetch(`/api/user/sync?supabaseId=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.exists && data.user) {
                        setUserSession(data.user);
                        localStorage.setItem('user_session', JSON.stringify(data.user));
                    } else if (user) {
                        // User exists in Supabase but not in DB yet (signing in)
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

    const getTargetDate = () => {
        if (config?.deploymentDate) {
            return new Date(config.deploymentDate);
        }
        return null;
    };

    const handleEnlist = async () => {
        if (!user) {
            setIsAuthenticating(true);
            try {
                await signInWithGoogle();
            } catch (err) {
                console.error("Login failed:", err);
            } finally {
                setIsAuthenticating(false);
            }
            return;
        }
        setIsOnboardingOpen(true);
    };

    const handleOnboardingComplete = (userData: any) => {
        setUserSession(userData);
        localStorage.setItem('user_session', JSON.stringify(userData));
        setIsOnboardingOpen(false);
    };

    const handleLogout = async () => {
        await signOut();
        setUserSession(null);
        localStorage.removeItem('user_session');
    };

    if (userSession) {
        return <WaitlistDashboard userSession={userSession} onLogout={handleLogout} />;
    }

    return (
        <main className={`${styles.container} scroll-container`}>
            {/* HER0 SECTION */}
            <section className="scroll-section">
                <nav className={styles.navbar}>
                    <Logo platformName={config?.platformName} />
                    <div className={styles.statusBadge}>
                        <span className="status-pulse" />
                        NETWORK_ACTIVE
                    </div>
                </nav>

                <div className={styles.hero}>
                    <div className="neon-tag" style={{ height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={tagIndex}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.8 }}
                            >
                                {tags[tagIndex]}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                    <motion.h1
                        className="zenith-h1"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        Where Tokens<br />Earn Belief
                    </motion.h1>

                    <div style={{ margin: '2rem 0', minHeight: '3.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={missionIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 1 }}
                                style={{ margin: 0 }}
                            >
                                {missions[missionIndex]}
                            </motion.p>
                        </AnimatePresence>
                    </div>

                    <TacticalButton
                        onClick={handleEnlist}
                        disabled={isAuthenticating || authLoading}
                    >
                        {isAuthenticating || authLoading ? "AUTHENTICATING..." : "JOIN THE WAITLIST"}
                    </TacticalButton>
                </div>
            </section>

            <section className="scroll-section">
                <div className="flex justify-center w-full">
                    {getTargetDate() && (
                        <CountdownTimer targetDate={getTargetDate()!} />
                    )}
                </div>
            </section>

            <section className={`${styles.section} scroll-section`}>
                <div className={styles.sectionHeader}>
                    <h2>Why the Trenches?</h2>
                    <p>Engineered for hyper-visibility and pre-market growth.</p>
                </div>

                <div className={styles.featureGrid}>
                    {[
                        { num: "01", title: "Pre-Market Incubation", icon: <Cpu />, desc: "Build a massive, verified holder base before the token even hits the open market." },
                        { num: "02", title: "Hyper-Visibility", icon: <ActivityIcon />, desc: "Force social engagement. No post = no payout. Direct belief coordination." },
                        { num: "03", title: "Community CTOs", icon: <Shield />, desc: "Revive 'dead' tokens by restructuring distribution through verified belief." }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            className={styles.featureCard}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <span className={styles.cardNumber}>{feature.num}</span>
                            <div className={styles.featureIcon}>{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            <section className={`${styles.section} scroll-section`}>
                <div className={styles.sectionHeader}>
                    <h2>Three-Step Cycle</h2>
                    <p>A simple three-step cycle to solidify community conviction.</p>
                </div>

                <div className={styles.featureGrid}>
                    {[
                        { num: "01", title: "Spray", icon: <Zap />, desc: "Choose your entry in project tokens to begin the incubation cycle." },
                        { num: "02", title: "Play", icon: <Activity />, desc: "Complete mandatory social tasks and verify peer activity in real-time." },
                        { num: "03", title: "Earn", icon: <Shield />, desc: "Receive a 50% ROI paid in tokens directly from other participants." }
                    ].map((step, i) => (
                        <motion.div
                            key={i}
                            className={styles.featureCard}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <span className={styles.cardNumber}>{step.num}</span>
                            <div className={styles.featureIcon}>{step.icon}</div>
                            <h3>{step.title}</h3>
                            <p>{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            <section className={`${styles.section} ${styles.mechanicSection} scroll-section`}>
                <div className={styles.mechanicContainer}>
                    <div className={styles.mechanicContent}>
                        <div className={styles.pillBadge} style={{ marginBottom: '2rem', width: 'fit-content' }}>
                            <Shield size={14} /> SAFETY_NET_ENABLED
                        </div>
                        <h2>The Game<br />Never Stops.</h2>
                        <p>
                            The project backs the game with a dedicated allocation of supply.
                            This ensures the P2P settlement window continues to scale even if
                            organic user participation slows down.
                        </p>
                        <div className={styles.badgeList}>
                            <div className={styles.pillBadge}>
                                <Activity size={12} /> MOMENTUM_STABLE
                            </div>
                        </div>
                    </div>
                    <div className={styles.mechanicMetrics}>
                        <RadialProgress percentage={15} label="RESERVE_ALLOCATED" />
                    </div>
                </div>
            </section>

            <footer className={`${styles.footer} scroll-section`}>
                <div className={styles.footerGrid}>
                    <Logo />
                    <div className={styles.footerLinks}>
                        <a href={config?.twitterUrl || "#"} target="_blank" rel="noopener noreferrer">X (TWITTER)</a>
                        <a href={config?.telegramUrl || "#"} target="_blank" rel="noopener noreferrer">TELEGRAM</a>
                        <a href={config?.docsUrl || "#"} target="_blank" rel="noopener noreferrer">DOCS</a>
                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <div>© 2026 {config?.platformName || "TRENCHES"} NETWORK</div>
                    <div>CORE_STABLE_V1.0.4</div>
                    <div className={styles.poweredBy}>POWERED_BY_BELIEF</div>
                </div>
            </footer>

            <OnboardingModal
                isOpen={isOnboardingOpen}
                onClose={() => setIsOnboardingOpen(false)}
                onComplete={handleOnboardingComplete}
            />
        </main>
    );
}
