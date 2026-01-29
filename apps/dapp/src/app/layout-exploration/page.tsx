"use client";

import React, { useState } from 'react';
import {
    TacticalButton,
    Logo,
    useTheme,
    XIcon,
    TelegramIcon,
    CountdownTimer,
    RadialProgress
} from '@trenches/ui';
import {
    Activity,
    Shield,
    Zap,
    TrendingUp,
    LayoutGrid,
    Terminal,
    Wallet,
    Users,
    Crosshair,
    Home,
    MessageSquare,
    Info,
    HelpCircle,
    Sun,
    Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Exploration.module.css';

type Variation = 'smart' | 'dashboard' | 'signals' | 'focus' | 'hub';

export default function LayoutLab() {
    const [variation, setVariation] = useState<Variation>('smart');
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <div className={styles.labContainer}>
            <header className={styles.labHeader}>
                <div className={styles.labTitle}>
                    <Logo variant="icon" width={32} />
                    <h1>Zenith V6 Exploration</h1>
                </div>

                <div className={styles.flexRow} style={{ alignItems: 'center', gap: '1.5rem' }}>
                    <button
                        onClick={toggleTheme}
                        className={styles.themeToggle}
                        aria-label="Toggle Theme"
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <div style={{ height: '1rem', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <div className={styles.flexCol} style={{ gap: '2px' }}>
                        <span className="text-[10px]" style={{ fontWeight: 900, opacity: 0.3, letterSpacing: '4px' }}>PLATFORM_LAB_V6</span>
                        <span className="text-[10px]" style={{ fontWeight: 900, color: 'var(--accent-zenith)', letterSpacing: '2px', textTransform: 'uppercase' }}>{variation} MODE</span>
                    </div>
                </div>
            </header>

            {/* NEWBIE FRIENDLY: FLOATING DOCK */}
            <nav className={styles.floatingDock}>
                {[
                    { id: 'smart', icon: <Terminal size={20} />, label: 'Terminal' },
                    { id: 'dashboard', icon: <Wallet size={20} />, label: 'Portfolio' },
                    { id: 'signals', icon: <Activity size={20} />, label: 'Signals' },
                    { id: 'focus', icon: <Zap size={20} />, label: 'Spray' },
                    { id: 'hub', icon: <LayoutGrid size={20} />, label: 'Hub' },
                ].map((item) => (
                    <div
                        key={item.id}
                        className={`${styles.dockItem} ${variation === item.id ? styles.dockActive : ''}`}
                        onClick={() => setVariation(item.id as Variation)}
                        title={item.label}
                    >
                        {item.icon}
                    </div>
                ))}
            </nav>

            <main className={styles.variationWrapper}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={variation}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {variation === 'smart' && <SmartTerminal />}
                        {variation === 'dashboard' && <HeroDashboard />}
                        {variation === 'signals' && <SignalFeed />}
                        {variation === 'focus' && <OneTapDeployment />}
                        {variation === 'hub' && <WelcomeHub />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

/**
 * VARIATION 01: SMART TERMINAL (GUIDED)
 * Purpose: Jargon-free advanced interface with tooltips.
 */
function SmartTerminal() {
    return (
        <div className={styles.terminalGrid}>
            <div className={`${styles.terminalPanel} ${styles.glass}`}>
                <div className={styles.smartTip}>
                    <div className={styles.tipHeader}><Info size={12} /> What is a Spray?</div>
                    <p className={styles.tipContent}>
                        A "Spray" is your active deployment into the liquidity vortex.
                        Targeting a fixed 1.5X ROI within 24 hours.
                    </p>
                </div>

                <div className={styles.terminalHeader}>
                    <span className={styles.terminalPulse} /> System Health
                </div>
                <div className={styles.dataList}>
                    {[
                        { label: 'Platform Liquidity', value: '$4.2M' },
                        { label: 'Global Confidence', value: 'High (0.94)' },
                    ].map((item, i) => (
                        <div key={i} className={styles.dataItem}>
                            <span className={styles.dataLabel}>{item.label}</span>
                            <span className={styles.dataValue}>{item.value}</span>
                        </div>
                    ))}
                </div>

                <div className={styles.terminalPrompt}>
                    [SYSTEM]: Waiting for user input. Click "Initiate" to begin the 24h cycle.
                </div>
            </div>

            <div className={styles.terminalMain}>
                <div className={`${styles.chartPlaceholder} ${styles.glass}`} style={{ flex: 1 }}>
                    <div className={styles.terminalHeader} style={{ position: 'absolute', top: '1.5rem', left: '1.5rem' }}>
                        <Activity size={14} /> Expected Payout Path
                    </div>
                    <div className={styles.chartLine} />
                    <span style={{ fontSize: '0.6rem', opacity: 0.3, letterSpacing: '4px' }}>ANALYZING MARKET TURBULENCE</span>
                </div>

                <div className={`${styles.p8} ${styles.glass} ${styles.flexCol} ${styles.gap4}`}>
                    <div className={styles.terminalInput}>
                        <div>
                            <label>YOUR DEPLOYMENT</label>
                            <div>$ 1,000.00</div>
                        </div>
                        <HelpCircle size={16} style={{ opacity: 0.4 }} />
                    </div>
                    <TacticalButton variant="hybrid" className="w-full">
                        INITIATE 24H CYCLE
                    </TacticalButton>
                </div>
            </div>

            <div className={`${styles.terminalPanel} ${styles.glass}`}>
                <div className={styles.terminalHeader}>
                    <Users size={14} /> Recent Victories
                </div>
                <div className={styles.dataList}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={styles.dataItem}>
                            <span className={styles.dataLabel}>User_04{i} // SECURED</span>
                            <span className={styles.dataValue} style={{ color: 'var(--accent-zenith)' }}>+ $1,500.00</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * VARIATION 02: HERO DASHBOARD
 * Purpose: High-vis "Wins" and "Next Step" for beginners.
 */
function HeroDashboard() {
    return (
        <div className={styles.portfolioGrid}>
            <div className={styles.statsRow}>
                <div className={`${styles.statCard} ${styles.glass}`}>
                    <label>TOTAL PROFIT</label>
                    <div className={styles.statValue}>+ $4,240</div>
                    <div className={styles.statTrend}>↑ SECURED & LIQUID</div>
                </div>
                <div className={`${styles.statCard} ${styles.glass}`} style={{ border: '1px solid var(--accent-zenith)' }}>
                    <label>NEXT PAYOUT</label>
                    <div className={styles.statValue} style={{ color: 'var(--accent-zenith)' }}>$1,500</div>
                    <div className={styles.statTrend} style={{ color: 'var(--text-primary)' }}>MATURES IN 12H</div>
                </div>
                <div className={`${styles.statCard} ${styles.glass}`}>
                    <label>YOUR STATUS</label>
                    <div className={styles.statValue}>ELITE</div>
                    <div className={styles.statTrend} style={{ color: 'var(--text-secondary)' }}>TOP 3% OF SPRAYERS</div>
                </div>
            </div>

            <div className={`${styles.assetSection} ${styles.glass}`}>
                <div className={styles.assetHeader}>
                    <h2>Your Active Sprays</h2>
                    <div className="text-[10px]" style={{ opacity: 0.4, fontWeight: 900 }}>STABLE_CONNECTION_PROIFIED</div>
                </div>

                <div className={styles.flexCol} style={{ gap: '1rem' }}>
                    {[
                        { id: 'S-7721', amt: '$1,000', target: '$1,500', progress: 65, time: '12:00:00' },
                        { id: 'S-7722', amt: '$2,000', target: '$3,000', progress: 12, time: '22:15:00' },
                    ].map((spray, i) => (
                        <div key={i} className={styles.flexRow} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div className={styles.flexRow} style={{ alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '2.5rem', height: '2.5rem', background: 'rgba(0,255,102,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Zap size={16} color="var(--accent-zenith)" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 900, fontSize: '0.875rem' }}>SPRAY #{spray.id}</div>
                                    <div style={{ fontSize: '10px', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{spray.amt} DEPLOYED</div>
                                </div>
                            </div>
                            <div style={{ flex: 1, maxWidth: '200px', margin: '0 3rem' }}>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: 'var(--accent-zenith)', width: `${spray.progress}%` }} />
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--accent-zenith)' }}>{spray.target}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', opacity: 0.4 }}>{spray.time} REMAINING</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * VARIATION 03: SIGNAL FEED
 * Purpose: Beginner-friendly alerts and social proof.
 */
function SignalFeed() {
    return (
        <div className={styles.socialGrid}>
            <div className={styles.socialFeed}>
                <div className={styles.smartTip}>
                    <div className={styles.tipHeader}><TrendingUp size={12} /> Hot Signal Detected</div>
                    <p className={styles.tipContent}>
                        The "Base Vortex" is seeing 80% higher success rates today. Follow the elite sprays below.
                    </p>
                </div>

                {[
                    { user: 'Anon_771', action: 'JUST SPRAYED $10,000', time: '2m ago', score: '9.8', msg: 'The rhythm is perfect today. Don\'t miss the vortex.' },
                    { user: 'WhaleWatcher', action: 'BELIEVE SIGNAL DETECTED', time: '5m ago', score: '8.4', msg: 'Big liquidity incoming. 1.5X is practically guaranteed.' },
                ].map((post, i) => (
                    <div key={i} className={`${styles.feedItem} ${styles.glass}`}>
                        <div className={styles.beliefPulse}>CONVICTION {post.score}</div>
                        <div className={styles.userAvatar} />
                        <div className={styles.feedContent}>
                            <div className={styles.feedMeta}>
                                <span className={styles.userName}>{post.user}</span>
                                <span className={styles.feedTimestamp}>{post.time}</span>
                            </div>
                            <div className={styles.feedAction} style={{ fontWeight: 950, color: 'var(--accent-zenith)' }}>{post.action}</div>
                            <p style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: '1.5rem', fontStyle: 'italic' }}>"{post.msg}"</p>
                            <div className={styles.flexRow} style={{ gap: '1rem' }}>
                                <TacticalButton variant="secondary" className="py-[0.6rem] px-8 text-[0.7rem]">
                                    FOLLOW THIS SPRAY
                                </TacticalButton>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.flexCol} style={{ gap: '2rem' }}>
                <div className={`${styles.sidebarCard} ${styles.glass}`}>
                    <div className={styles.terminalHeader}><Shield size={14} /> Trust Signals</div>
                    <div className={styles.flexCol} style={{ gap: '1rem' }}>
                        <div className={styles.flexRow} style={{ alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '2rem', height: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={12} /></div>
                            <div>
                                <div style={{ fontSize: '10px', fontWeight: 900 }}>VOLATILITY</div>
                                <div style={{ fontSize: '12px', color: 'var(--accent-zenith)' }}>LOW / STABLE</div>
                            </div>
                        </div>
                        <div className={styles.flexRow} style={{ alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '2rem', height: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={12} /></div>
                            <div>
                                <div style={{ fontSize: '10px', fontWeight: 900 }}>USERS ACTIVE</div>
                                <div style={{ fontSize: '12px' }}>4,290 ELITE</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * VARIATION 04: ONE-TAP DEPLOYMENT (MINIMAL)
 * Purpose: Single-action focus for effortless onboarding.
 */
function OneTapDeployment() {
    return (
        <div className={styles.minimalContainer}>
            <div className={styles.focusLabel}>Ready for your 1.5X?</div>
            <div className={styles.focusAmount}>$1,500</div>

            <div className={styles.minimalActions}>
                <TacticalButton variant="hybrid" className="h-[100px] text-2xl !rounded-3xl w-full">
                    SPRAY $1,000
                </TacticalButton>

                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, opacity: 0.3, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Simple Secure Payout</div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>No fees. No jargon. Just ROI.</div>
                </div>
            </div>

            <div className={styles.flexRow} style={{ marginTop: '5rem', gap: '3rem', opacity: 0.3 }}>
                <div className={styles.flexCol} style={{ alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={20} />
                    <span style={{ fontSize: '8px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Verified</span>
                </div>
                <div className={styles.flexCol} style={{ alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={20} />
                    <span style={{ fontSize: '8px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Instant</span>
                </div>
                <div className={styles.flexCol} style={{ alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={20} />
                    <span style={{ fontSize: '8px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>24H Cycle</span>
                </div>
            </div>
        </div>
    );
}

/**
 * VARIATION 05: WELCOME HUB (BENTO)
 * Purpose: Comprehensive but guided overview for new members.
 */
function WelcomeHub() {
    return (
        <div className={styles.bentoGrid}>
            <div className={`${styles.bentoItem} ${styles.glass} ${styles.span2} ${styles.spanRow2}`}>
                <div className={styles.bentoHeader}>
                    <span>Global Payout Status</span>
                    <Activity size={12} />
                </div>
                <div className={styles.bentoCenter}>
                    <RadialProgress percentage={96} label="NETWORK TRUST" size={160} />
                    <p style={{ fontSize: '10px', opacity: 0.4, fontWeight: 900, textAlign: 'center', padding: '0 3rem', marginTop: '2rem' }}>
                        96% OF SPRAYS IN THE LAST 24H REACHED FULL 1.5X ROI
                    </p>
                </div>
            </div>

            <div className={`${styles.bentoItem} ${styles.glass} ${styles.span2}`}>
                <div className={styles.smartTip} style={{ margin: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div className={styles.tipHeader}><HelpCircle size={12} /> Need Help?</div>
                    <p className={styles.tipContent}>
                        New to the Trenches? Read our Litepaper to understand how Believe drives the 24h cycle.
                    </p>
                    <TacticalButton variant="secondary" className="mt-4 w-fit py-2 px-4 text-[10px]">
                        OPEN LITEPAPER
                    </TacticalButton>
                </div>
            </div>

            <div className={`${styles.bentoItem} ${styles.glass}`}>
                <div className={styles.bentoHeader}>
                    <span>Next Cycle</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '1rem' }}>24:00:00</div>
                <div className={styles.bentoFooter} style={{ opacity: 0.4 }}>STABLE WINDOW</div>
            </div>

            <div className={`${styles.bentoItem} ${styles.glass}`}>
                <div className={styles.bentoHeader}>
                    <span>Community</span>
                    <Users size={12} />
                </div>
                <div className={styles.flexCol} style={{ marginTop: '1rem', gap: '0.5rem' }}>
                    <TacticalButton variant="secondary" className="p-2 text-[10px] w-full">
                        <XIcon size={12} /> TWITTER
                    </TacticalButton>
                    <TacticalButton variant="secondary" className="p-2 text-[10px] w-full">
                        <TelegramIcon size={12} /> TELEGRAM
                    </TacticalButton>
                </div>
            </div>

            <div className={`${styles.bentoItem} ${styles.glass} ${styles.span2}`}>
                <div className={styles.bentoHeader}>
                    <span>Start Your First Spray</span>
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '12px', opacity: 0.5, marginBottom: '1rem' }}>
                        Deposit $1,000 once and experience the power of the Trenches workflow.
                    </p>
                    <TacticalButton variant="hybrid" className="w-full text-sm">
                        GET STARTED NOW
                    </TacticalButton>
                </div>
            </div>
        </div>
    );
}
