"use client";

import React, { useState, useEffect, lazy, Suspense } from "react";
import styles from "./page.module.css";
import { Shield, Zap, Cpu, Activity, Sun, Moon } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
    Logo,
    useTheme,
    TacticalButton,
    GoogleIcon,
    CountdownTimer,
    RadialProgress
} from "@trenches/ui";

// Lazy load heavy components to reduce initial bundle
const OnboardingModal = lazy(() => import("@/components/OnboardingModal"));
const WaitlistDashboard = lazy(() => import("@/components/WaitlistDashboard"));

// Lightweight animation - only fade, no heavy motion
const fadeUpStyle = {
    animation: "fadeUp 0.6s ease-out forwards",
};

// Mission statements
const missionStatements = [
    "Turn Belief into Profit.",
    "The Future of Community Rewards.",
    "Turn $1000 into $1500 in 24 hours.",
    "Direct payouts. Structured rewards."
];

// Feature data
const features = [
    { num: "01", title: "Get Early Access", icon: <Cpu strokeWidth={1.5} />, desc: "Join projects before they go viral. Secure your spot at the best price before everyone else." },
    { num: "02", title: "Help Projects Grow", icon: <Activity strokeWidth={1.5} />, desc: "Share a post, verify others, and receive rewards for your support. Your activity moves you forward." },
    { num: "03", title: "Rebuild Trust", icon: <Shield strokeWidth={1.5} />, desc: "Bring projects back to life by working together with your community to rebuild market value." }
];

const steps = [
    { num: "01", title: "Spray", icon: <Zap strokeWidth={1.5} />, desc: "Put your tokens into the project fund with as low as $5 to start your 24h timer." },
    { num: "02", title: "Play", icon: <Activity strokeWidth={1.5} />, desc: "Help the project grow on social media to verify your spot and stay in the game." },
    { num: "03", title: "Collect", icon: <Shield strokeWidth={1.5} />, desc: "Receive your settlement sent instantly to your account when the timer hits zero." }
];

// Simple CSS-based animation component (no JS overhead)
function AnimatedSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1, rootMargin: "-10%" }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(30px)",
                transition: `opacity 0.5s ease-out ${delay}s, transform 0.5s ease-out ${delay}s`,
            }}
        >
            {children}
        </div>
    );
}

// Mission rotator with minimal re-renders
function MissionRotator() {
    const [activeMission, setActiveMission] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setActiveMission(prev => (prev + 1) % missionStatements.length);
                setIsAnimating(false);
            }, 300);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="h-[200px] flex items-center justify-center overflow-hidden">
            <h1
                className={styles.v6H1}
                style={{
                    opacity: isAnimating ? 0 : 1,
                    transform: isAnimating ? "translateY(-10px)" : "translateY(0)",
                    transition: "opacity 0.3s ease, transform 0.3s ease",
                }}
            >
                {missionStatements[activeMission].split(' ').map((word, i) => (
                    <React.Fragment key={i}>
                        {word}
                        {i === 1 && <br />}
                        {' '}
                    </React.Fragment>
                ))}
            </h1>
        </div>
    );
}

export default function WelcomePage() {
    const { user, signInWithGoogle, signOut, isLoading: authLoading } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();

    const [userSession, setUserSession] = useState<any>(null);
    const [isDetermining, setIsDetermining] = useState(true);
    const [config, setConfig] = useState<any>(null);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // Fetch config once on mount
    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error('Failed to fetch config:', err));
    }, []);

    // Session sync
    useEffect(() => {
        const cached = localStorage.getItem('user_session');
        if (cached) {
            try { setUserSession(JSON.parse(cached)); }
            catch (e) { console.error("Failed to parse cached session"); }
        }
        if (!authLoading && !user) setIsDetermining(false);
    }, [authLoading, user]);

    useEffect(() => {
        if (user && !userSession) {
            setIsDetermining(true);
            fetch(`/api/user/sync?supabaseId=${user.id}`)
                .then(res => res.json())
                .then(data => {
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
        setUserSession(userData);
        localStorage.setItem('user_session', JSON.stringify(userData));
        setIsOnboardingOpen(false);
    };

    const handleLogout = async () => {
        await signOut();
        setUserSession(null);
        localStorage.removeItem('user_session');
    };

    // Dashboard view
    if (userSession) {
        return (
            <div className={styles.v6Container} data-theme={isDarkMode ? 'dark' : 'light'}>
                <Suspense fallback={<div className="p-8">Loading dashboard...</div>}>
                    <WaitlistDashboard userSession={userSession} onLogout={handleLogout} />
                </Suspense>
                <button
                    className={styles.themeToggle}
                    style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100 }}
                    onClick={toggleTheme}
                    aria-label="Toggle Theme"
                >
                    {isDarkMode ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
                </button>
            </div>
        );
    }

    const targetDate = config?.deploymentDate ? new Date(config.deploymentDate) : null;
    const platformName = config?.platformName || "TRENCHES";

    return (
        <div className={styles.v6Container} data-theme={isDarkMode ? 'dark' : 'light'}>
            <header className={styles.v6Meta}>
                <Logo platformName={platformName} />
                <div className={styles.v6MetaRight}>
                    {authLoading || isDetermining ? (
                        <div className={styles.headerSkeleton} aria-hidden="true" />
                    ) : (
                        <div className={styles.statusBadge}>
                            <span className={styles.statusPulse} />
                            System Online
                        </div>
                    )}
                    <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle Theme">
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
                {/* HERO */}
                <section className={`${styles.v6Section} ${styles.v6Hero}`} aria-label="Hero Narrative">
                    <div className={styles.v6TagSection}>
                        <span className={styles.v6Tag}>[ Protocol Activated ]</span>
                    </div>

                    <CountdownTimer targetDate={targetDate} />
                    <MissionRotator />

                    <p className={styles.v6P} style={fadeUpStyle}>
                        Put $1000 in, get $1500 out in 24 hours. Start with as low as $5.<br />
                        No complicated trading. Just direct payouts backed by the community.
                    </p>

                    <TacticalButton
                        variant="hybrid"
                        className={styles.v6CTA}
                        onClick={handleEnlist}
                        disabled={isAuthenticating}
                    >
                        <GoogleIcon /> {isAuthenticating ? "..." : "Join waitlist"}
                    </TacticalButton>

                    <div className={styles.v6TrustStrip} style={{ opacity: 1 }}>
                        <span className={styles.v6TrustLabel}>Enterprise Infrastructure //</span>
                        <div className={styles.v6TrustLogos}>
                            {['Solana', 'Base', 'Google Cloud', 'HyperEVM', 'AnyWallet'].map(partner => (
                                <span key={partner} className={styles.v6TrustLogo}>{partner}</span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* THE WHY */}
                <section className={styles.v6Section} aria-label="Project Objectives">
                    <div className={styles.sectionHeader}>
                        <span className={styles.v6Tag}>The Objective</span>
                        <h2>Better<br />by Design.</h2>
                    </div>
                    <div className={styles.featureGrid}>
                        {features.map((feature, i) => (
                            <AnimatedSection key={i} delay={i * 0.1} className={styles.featureCard}>
                                <span className={styles.cardNumber}>{feature.num}</span>
                                <div className={styles.featureIcon}>{feature.icon}</div>
                                <h3>{feature.title}</h3>
                                <p>{feature.desc}</p>
                            </AnimatedSection>
                        ))}
                    </div>
                </section>

                {/* THE CYCLE */}
                <section className={styles.v6Section} aria-label="The Coordination Cycle">
                    <div className={styles.sectionHeader}>
                        <span className={styles.v6Tag}>The Mechanism</span>
                        <h2>Three-Step<br />Cycle.</h2>
                    </div>
                    <div className={styles.featureGrid}>
                        {steps.map((step, i) => (
                            <AnimatedSection key={i} delay={i * 0.1} className={styles.featureCard}>
                                <span className={styles.cardNumber}>{step.num}</span>
                                <div className={styles.featureIcon}>{step.icon}</div>
                                <h3>{step.title}</h3>
                                <p>{step.desc}</p>
                            </AnimatedSection>
                        ))}
                    </div>
                </section>

                {/* THE GAME */}
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

                {/* FOOTER */}
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

            <Suspense fallback={null}>
                {isOnboardingOpen && (
                    <OnboardingModal
                        isOpen={isOnboardingOpen}
                        onClose={() => setIsOnboardingOpen(false)}
                        onComplete={handleOnboardingComplete}
                    />
                )}
            </Suspense>
        </div>
    );
}
