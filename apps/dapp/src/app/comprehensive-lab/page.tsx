"use client";

import React, { useState } from 'react';
import {
    Logo,
    TacticalButton,
    CountdownTimer,
    RadialProgress,
    useTheme
} from '@trenches/ui';
import {
    Zap,
    Clock,
    TrendingUp,
    Shield,
    Target,
    Users,
    ChevronRight,
    LayoutGrid,
    PlusCircle,
    Sun,
    Moon,
    Activity,
    MessageSquare,
    ZapOff,
    Trophy,
    Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ComprehensiveLab.module.css';

type Variation = 'command' | 'flow' | 'hub';

export default function ComprehensiveLab() {
    const [variation, setVariation] = useState<Variation>('command');
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <div className={styles.labContainer}>
            <header className={styles.labHeader}>
                <div className={styles.labBrand}>
                    <Logo variant="icon" width={32} />
                    <h1>Comprehensive Lab</h1>
                </div>

                <div className={styles.headerActions}>
                    <button onClick={toggleTheme} className={styles.themeToggle}>
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', fontWeight: 950, opacity: 0.3, letterSpacing: '2px' }}>V6_INTEGRATED_V_2.0</div>
                        <div style={{ fontSize: '10px', fontWeight: 950, color: 'var(--accent-zenith)', textTransform: 'uppercase' }}>{variation} Mode Active</div>
                    </div>
                </div>
            </header>

            <nav className={styles.floatingDock}>
                {[
                    { id: 'command', icon: <Activity size={20} />, label: 'Command' },
                    { id: 'flow', icon: <TrendingUp size={20} />, label: 'Flow' },
                    { id: 'hub', icon: <Users size={20} />, label: 'Hub' },
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

            <main className={styles.variationContainer}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={variation}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* GLOBAL VITALS STRIP - ALWAYS SHOWN IN DEMO */}
                        <div className={styles.vitalsStrip}>
                            <div className={styles.vitalCard}>
                                <span className={styles.vitalLabel}>Belief Score</span>
                                <span className={styles.vitalValue}>420</span>
                                <span className={styles.vitalTrend}>Top 5% Sprayers</span>
                            </div>
                            <div className={styles.vitalCard}>
                                <span className={styles.vitalLabel}>Trust Score</span>
                                <span className={styles.vitalValue} style={{ color: 'var(--accent-zenith)' }}>9.4</span>
                                <span className={styles.vitalTrend}>Validated Node</span>
                            </div>
                            <div className={styles.vitalCard}>
                                <span className={styles.vitalLabel}>Active Boost</span>
                                <span className={styles.vitalValue}>1.5X</span>
                                <span className={styles.vitalTrend}>24h Cycle Lock</span>
                            </div>
                        </div>

                        {variation === 'command' && <CommandConsole />}
                        {variation === 'flow' && <LinearFlow />}
                        {variation === 'hub' && <CitizenHub />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

/**
 * VARIATION 01: THE COMMAND CONSOLE
 * Purpose: High-density modular dashboard with status alerts.
 */
function CommandConsole() {
    return (
        <div className={styles.commandGrid}>
            <div className={`${styles.widget} ${styles.span8}`}>
                <div className={styles.widgetHeader}>
                    <h2 className={styles.widgetTitle}><Zap size={18} /> Active Deployments</h2>
                    <TacticalButton variant="secondary" className="text-[10px] py-[0.4rem] px-4">REBALANCE</TacticalButton>
                </div>
                <div className="flex flex-col gap-4">
                    {[
                        { id: 'S-441', amt: '$1,000', target: '$1,500', status: 'In Progress', time: '12:44:01' },
                        { id: 'S-442', amt: '$2,500', target: '$3,750', status: 'Matured', time: 'RESOLVED' }
                    ].map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-8 bg-white/5 dark:bg-black/20 rounded-[2rem] border border-white/5 transition-all hover:border-[var(--accent-zenith)]/30">
                            <div className="flex flex-col gap-3">
                                <div className="font-black text-2xl uppercase tracking-tighter text-white dark:text-white">#{s.id} // {s.amt}</div>
                                <div className="text-[11px] opacity-40 font-black tracking-[3px] uppercase">PROJECTED PAYOUT: {s.target}</div>
                            </div>
                            <div className="flex flex-col items-end gap-4">
                                <div className={`${s.status === 'Matured' ? styles.badgeActive : styles.badgePending} inline-block px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest`}>{s.status}</div>
                                <div className="font-mono text-[12px] opacity-30 font-black tracking-widest">{s.time}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`${styles.widget} ${styles.span4}`}>
                <div className={styles.widgetHeader}>
                    <h2 className={styles.widgetTitle}><Flame size={18} /> Elite Raids</h2>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="p-4 bg-[var(--accent-zenith)]/10 rounded-xl border border-[var(--accent-zenith)]/20">
                        <div className="font-black text-sm text-[var(--accent-zenith)]">RAID #99: BULL MARKET RAGE</div>
                        <p className="text-[10px] mt-2 opacity-70">Engagement required on X. 100 BP Reward.</p>
                        <TacticalButton variant="hybrid" className="w-full mt-4 text-[10px]">JOIN RAID</TacticalButton>
                    </div>
                </div>
            </div>

            <div className={`${styles.widget} ${styles.span6}`}>
                <div className={styles.widgetHeader}>
                    <h2 className={styles.widgetTitle}><MessageSquare size={18} /> Content Creation</h2>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <span className="text-xs font-bold font-mono">LITEPAPER_REACTION_VIDEO.mp4</span>
                        <div className={styles.badgePending}>Under Review</div>
                    </div>
                    <TacticalButton variant="secondary" className="w-full text-[10px]"><PlusCircle size={14} /> NEW SUBMISSION</TacticalButton>
                </div>
            </div>

            <div className={`${styles.widget} ${styles.span6}`}>
                <div className={styles.widgetHeader}>
                    <h2 className={styles.widgetTitle}><Clock size={18} /> Trench Lifecycle</h2>
                </div>
                <div className={styles.durationTable}>
                    {[
                        { level: 'Rapid', time: '24 Hours', roi: '1.2X' },
                        { level: 'Mid', time: '7 Days', roi: '1.5X' },
                        { level: 'Deep', time: '30 Days', roi: '2.0X' }
                    ].map((d, i) => (
                        <div key={i} className={styles.durationRow}>
                            <span className={styles.durationLevel}>{d.level}</span>
                            <span className={styles.durationTime}>{d.time}</span>
                            <span className="text-[10px] font-black opacity-40">{d.roi} ROI</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`${styles.widget} ${styles.span6}`}>
                <div className={styles.widgetHeader}>
                    <h2 className={styles.widgetTitle}><Users size={14} /> Recent Victories</h2>
                </div>
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <span className="text-xs font-bold font-mono">User_04{i}</span>
                            <span className="text-[var(--accent-zenith)] font-black text-xs">+ $1,500</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * VARIATION 02: LINEAR FLOW
 * Purpose: Sequential "To-Do" style list.
 */
function LinearFlow() {
    return (
        <div className={styles.flowContainer}>
            <div className={styles.flowItem}>
                <div className={styles.flowTimeline}><div className={styles.flowNode} /></div>
                <div className={styles.flowContent}>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Ongoing Deployment</span>
                        <Clock size={14} className="opacity-30" />
                    </div>
                    <h3 className="text-xl font-black">SPRAY_441 is maturing in 12h.</h3>
                    <p className="text-sm opacity-50 mt-2">Maintain active engagement to ensure 1.5X payout priority.</p>
                    <div className="mt-10 p-8 bg-white/5 rounded-[2rem] border border-white/5 flex items-center justify-between">
                        <div className="text-[11px] font-black opacity-40 uppercase tracking-[3px]">CURRENT ROI STATUS</div>
                        <div className="text-[var(--accent-zenith)] font-black text-lg tracking-tight">STABLE (1.5X)</div>
                    </div>
                </div>
            </div>

            <div className={styles.flowItem}>
                <div className={styles.flowTimeline} style={{ height: '100px' }}><div className={styles.flowNode} style={{ background: '#ffa500', boxShadow: '0 0 10px #ffa500' }} /></div>
                <div className={styles.flowContent} style={{ borderColor: 'rgba(255,165,0,0.2)' }}>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Urgent Mission</span>
                        <Flame size={14} className="text-orange-500" />
                    </div>
                    <h3 className="text-xl font-black">Raid Active: Trench Signal Alpha</h3>
                    <p className="text-sm opacity-50 mt-2">The community is moving. Increase your belief score by joining the raid.</p>
                    <TacticalButton variant="hybrid" className="mt-6 w-full !bg-[#ffa500] !text-black">OPEN RAID CENTER</TacticalButton>
                </div>
            </div>

            <div className={styles.flowItem}>
                <div className={styles.flowTimeline}><div className={styles.flowNode} style={{ background: '#666', boxShadow: 'none' }} /></div>
                <div className={styles.flowContent} style={{ opacity: 0.6 }}>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Next Milestone</span>
                        <Trophy size={14} />
                    </div>
                    <h3 className="text-xl font-black">Reach 500 Belief Score</h3>
                    <p className="text-sm opacity-50 mt-2">Unlock "Elite Commando" status and 1.6X payout capability.</p>
                </div>
            </div>
        </div>
    );
}

/**
 * VARIATION 03: CITIZEN HUB
 * Purpose: Trust-centric bento grid with heavy visualizers.
 */
function CitizenHub() {
    return (
        <div className={styles.hubGrid}>
            <div className={`${styles.widget} ${styles.trustVisualizer}`}>
                <div className={styles.vitalLabel}>Global Trust Positioning</div>
                <div className={styles.trustScoreLarge}>9.4</div>
                <p className="font-black text-sm opacity-50 uppercase tracking-[4px]">Verified Sovereign Entity</p>
                <div className="flex justify-center mt-12 gap-8">
                    <RadialProgress percentage={94} label="SOCIAL PROOF" size={120} />
                    <RadialProgress percentage={88} label="DEPLOYMENT DEPTH" size={120} />
                    <RadialProgress percentage={100} label="IDENTITY" size={120} />
                </div>
            </div>

            <div className={`${styles.widget}`}>
                <h2 className={styles.widgetTitle}><Trophy size={18} /> Reputation Perks</h2>
                <ul className="mt-6 flex flex-col gap-4 text-sm font-bold">
                    <li className="flex items-center gap-2 text-[var(--accent-zenith)]"><Zap size={14} /> Priority Payout Selection</li>
                    <li className="flex items-center gap-2 text-[var(--accent-zenith)]"><Zap size={14} /> Exclusive Raid Access</li>
                    <li className="flex items-center gap-2 opacity-30"><ZapOff size={14} /> Multi-Chain Spraying (LOCKED)</li>
                </ul>
            </div>

            <div className={`${styles.widget}`}>
                <h2 className={styles.widgetTitle}><Users size={18} /> Referral Network</h2>
                <div className="mt-6">
                    <div className="text-3xl font-black">12</div>
                    <div className="text-[10px] font-black opacity-40 uppercase mt-1">Active Recruits</div>
                    <div className="mt-8 flex gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="bg-[var(--accent-zenith)] h-full w-[70%]" />
                        </div>
                    </div>
                    <div className="text-[10px] font-black opacity-40 mt-2">70% TO NEXT PERK</div>
                </div>
            </div>

            <div className={`${styles.widget} flex flex-col justify-center items-center text-center`}>
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <PlusCircle size={24} className="opacity-30" />
                </div>
                <div className="font-black text-xs opacity-50 uppercase">Explore All Systems</div>
                <TacticalButton variant="secondary" className="mt-6 w-full text-[10px]">SYSTEM DIRECTORY</TacticalButton>
            </div>
        </div>
    );
}
