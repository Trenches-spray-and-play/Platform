"use client";

import React from "react";
import styles from "../lab.module.css";
import Logo from "@/components/Logo";
import { motion } from "framer-motion";
import { ArrowDown, Info, ArrowRight, Sun, Moon } from "lucide-react";

export default function MinimalVariation() {
    const [isDarkMode, setIsDarkMode] = React.useState(true);
    const [depositAmount, setDepositAmount] = React.useState(1000);
    const [selectedTier, setSelectedTier] = React.useState('RAPID');

    const tiers = {
        'RAPID': { duration: '24 HOURS', min: 5, cap: 1000, desc: 'ENTRY_LEVEL' },
        'MID': { duration: '7 DAYS', min: 100, cap: 10000, desc: 'STRATEGIC_DEPTH' },
        'DEEP': { duration: '30 DAYS', min: 10000, cap: 100000, desc: 'INSTITUTIONAL' }
    };

    const sections = [
        {
            title: "THE_ROI_CALCULATOR",
            heading: "See the Result.",
            custom: (
                <div className={styles.v5Calculator}>
                    <div className={styles.v5TierSelector}>
                        {Object.keys(tiers).map(t => (
                            <button
                                key={t}
                                onClick={() => {
                                    setSelectedTier(t);
                                    const tierData = (tiers as any)[t];
                                    if (depositAmount > tierData.cap) setDepositAmount(tierData.cap);
                                    if (depositAmount < tierData.min) setDepositAmount(tierData.min);
                                }}
                                className={`${styles.v5TierBtn} ${selectedTier === t ? styles.v5TierBtnActive : ''}`}
                                aria-pressed={selectedTier === t}
                                aria-label={`${t} tier: ${(tiers as any)[t].desc}, duration ${(tiers as any)[t].duration}`}
                            >
                                <span className={styles.v5TierLabel}>{t}</span>
                                <span className={styles.v5TierSub}>{(tiers as any)[t].desc}</span>
                            </button>
                        ))}
                    </div>

                    <div className={styles.v5CalcInputs}>
                        <div className={styles.v5CalcGroup}>
                            <div className={styles.v5LabelFlex}>
                                <label>YOUR_DEPOSIT</label>
                                <span className={styles.v5CapLabel}>
                                    RANGE: ${(tiers as any)[selectedTier].min.toLocaleString()} - ${(tiers as any)[selectedTier].cap.toLocaleString()}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={(tiers as any)[selectedTier].min}
                                max={(tiers as any)[selectedTier].cap}
                                step={(tiers as any)[selectedTier].min === 5 ? 1 : 10}
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(Number(e.target.value))}
                                className={styles.v5Slider}
                                aria-label={`Deposit amount: $${depositAmount.toLocaleString()}`}
                                aria-valuemin={(tiers as any)[selectedTier].min}
                                aria-valuemax={(tiers as any)[selectedTier].cap}
                                aria-valuenow={depositAmount}
                            />
                            <div className={styles.v5CalcValue}>${depositAmount.toLocaleString()}</div>
                        </div>
                        <div className={styles.v5CalcArrow}><ArrowRight size={24} /></div>
                        <div className={styles.v5CalcGroup}>
                            <div className={styles.v5LabelFlex}>
                                <label>YOUR_PAYOUT</label>
                                <span className={styles.v5DurationLabel}>DURATION: {(tiers as any)[selectedTier].duration}</span>
                            </div>
                            <div
                                className={`${styles.v5CalcValue} ${styles.accentZEN}`}
                                aria-live="polite"
                                aria-label={`Your payout: $${(depositAmount * 1.5).toLocaleString()}`}
                            >
                                ${(depositAmount * 1.5).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "THE_LOGIC_FLOW",
            heading: "The Journey of a Dollar.",
            custom: (
                <div className={styles.v5LogicFlow}>
                    <div className={styles.v5Node}>YOUR_WALLET</div>
                    <div className={styles.v5Line}>
                        <motion.div
                            animate={{
                                x: [0, "var(--anim-x, 200px)", 0],
                                y: [0, "var(--anim-y, 0)", 0]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className={styles.v5Dot}
                        />
                    </div>
                    <div className={styles.v5Node}>RESERVE_FUND</div>
                    <div className={styles.v5Line}>
                        <motion.div
                            animate={{
                                x: [0, "var(--anim-x-rev, -200px)", 0],
                                y: [0, "var(--anim-y-rev, 0)", 0]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                            className={`${styles.v5Dot} ${styles.v5DotLarge}`}
                        />
                    </div>
                    <div className={styles.v5Node}>AUTOMATIC_PROFIT</div>
                </div>
            )
        },
        {
            title: "THE_COMPARISON",
            heading: "Better by Design.",
            custom: (
                <div className={styles.v5ComparisonGrid}>
                    <div className={styles.v5CompHeader}>TRADITIONAL_TRADING</div>
                    <div className={styles.v5CompHeader}>TRENCHES_PROTOCOL</div>
                    <div className={styles.v5CompItem}>High Volatility Risk</div>
                    <div className={styles.v5CompItem}>USD_VALUE_PROTECTION</div>
                    <div className={styles.v5CompItem}>Uncertain Exit Point</div>
                    <div className={styles.v5CompItem}>FIXED_1.5X_SETTLEMENT</div>
                    <div className={styles.v5CompItem}>Solo Market Timing</div>
                    <div className={styles.v5CompItem}>COMMUNITY_POWERED_SPEED</div>
                </div>
            )
        },
        {
            title: "THE_FUND",
            heading: "A Reward for your Support.",
            text: "Every project on Trenches sets aside a reward fund for you. It's a 'thank you' for helping them grow. By participating and sharing, you unlock value that is otherwise locked away.",
            stats: ["PROJECT_RESERVE", "AWARENESS_BOOST"]
        },
        {
            title: "THE_SECURITY",
            heading: "$100 In. $150 Out.",
            text: "We protect your money. Your original deposit is pegged to the dollar. Even if the coin price changes while you wait, your 50% profit is guaranteed based on the dollars you started with.",
            stats: ["USD_NORMALIZED", "ANTI_VOLATILITY"]
        },
        {
            title: "THE_MATH",
            heading: "Sustainable by Design.",
            text: "Example: 20,000 players join a $50M project. This creates a supply shock. The project reserves 10% ($5M) to pay you. The massive growth in value easily covers everyone's rewards.",
            stats: ["20,000+ PLAYERS", "$5,000,000 RESERVE"]
        },
        {
            title: "STEP_01",
            heading: "Connect & Setup.",
            text: "Log in with Google to create your identity. Then connect your personal wallet (MetaMask or Rabby). This is your private account where rewards are sent.",
            info: "Need help? [Learn how to create a personal wallet](https://support.metamask.io/hc/en-us/articles/360015489531-Getting-started-with-MetaMask)."
        },
        {
            title: "STEP_02",
            heading: "Deposit & Network Match.",
            text: "Use the 'Deposit' section. Match your network: SOL for Solana projects, EVM for Ethereum/Base. Balance reflects in 1-3 minutes.",
            info: "No crypto yet? [See how to buy crypto via P2P on Bybit](https://www.bybit.com/en-US/help-center/bybithc_article?language=en_US&id=000001889)."
        },
        {
            title: "STEP_03",
            heading: "Dominate with Tasks & Raids.",
            text: "Complete Tasks for Belief Points (rank) and join Raids for Boost Points (speed). Use the 'Spray' tool to move to the front of the line.",
            stats: ["BELIEF_POINTS", "BOOST_POINTS"]
        },
        {
            title: "STEP_04",
            heading: "Reach the Front & Collect.",
            text: "Once your timer reaches zero, the system automatically settles your spot. Your original deposit plus your 50% profit is sent instantly to your wallet.",
            stats: ["AUTOMATIC_PAYOUT", "FIXED_SETTLEMENT"]
        }
    ];

    return (
        <div className={styles.v5Container} data-theme={isDarkMode ? 'dark' : 'light'}>
            <div className={styles.v5Meta}>
                <Logo variant="horizontal" className={styles.v5Logo} />
                <div className={styles.v5MetaRight}>
                    <button className={styles.v5MetaCTA}>GET STARTED</button>
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={styles.themeToggle}
                        aria-pressed={isDarkMode}
                        aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                    >
                        <span className={styles.themeToggleText}>{isDarkMode ? 'LIGHT' : 'DARK'}</span>
                        <span className={styles.themeToggleIcon}>
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </span>
                    </button>
                </div>
            </div>

            <main className={styles.v5MainFull}>
                {/* Page 1: ROI Calculator */}
                <div className={styles.v5MobilePage} role="region" aria-label="ROI Calculator">
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10%" }}
                        className={styles.v5FullSection}
                    >
                        <span className={styles.v5SectionTag}>{sections[0].title}</span>
                        <h2>{sections[0].heading}</h2>
                        {sections[0].custom}
                    </motion.section>
                </div>

                {/* Page 2: Logic Flow */}
                <div className={styles.v5MobilePage} role="region" aria-label="How It Works">
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10%" }}
                        className={styles.v5FullSection}
                    >
                        <span className={styles.v5SectionTag}>{sections[1].title}</span>
                        <h2>{sections[1].heading}</h2>
                        {sections[1].custom}
                    </motion.section>
                </div>

                {/* Page 3: Comparison & Fund */}
                <div className={styles.v5MobilePage} role="region" aria-label="Comparison and Benefits">
                    {[2, 3].map(i => (
                        <motion.section
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-10%" }}
                            className={styles.v5FullSection}
                        >
                            <span className={styles.v5SectionTag}>{sections[i].title}</span>
                            <h2>{sections[i].heading}</h2>
                            {sections[i].text && <p>{sections[i].text}</p>}
                            {sections[i].custom}
                            {sections[i].stats && (
                                <div className={styles.v5SectionStats}>
                                    {sections[i].stats!.map((stat, j) => (
                                        <div key={j} className={styles.v5StatBox}>
                                            {stat}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.section>
                    ))}
                </div>

                {/* Page 4: Security & Math */}
                <div className={styles.v5MobilePage} role="region" aria-label="Security and Sustainability">
                    {[4, 5].map(i => (
                        <motion.section
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-10%" }}
                            className={styles.v5FullSection}
                        >
                            <span className={styles.v5SectionTag}>{sections[i].title}</span>
                            <h2>{sections[i].heading}</h2>
                            {sections[i].text && <p>{sections[i].text}</p>}
                            {sections[i].stats && (
                                <div className={styles.v5SectionStats}>
                                    {sections[i].stats!.map((stat, j) => (
                                        <div key={j} className={styles.v5StatBox}>
                                            {stat}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.section>
                    ))}
                </div>

                {/* Page 5: Steps 01 & 02 */}
                <div className={styles.v5MobilePage} role="region" aria-label="Getting Started Steps">
                    {[6, 7].map(i => (
                        <motion.section
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-10%" }}
                            className={styles.v5FullSection}
                        >
                            <span className={styles.v5SectionTag}>{sections[i].title}</span>
                            <h2>{sections[i].heading}</h2>
                            {sections[i].text && <p>{sections[i].text}</p>}
                            {sections[i].info && (
                                <div className={styles.v5InfoBox}>
                                    <Info size={14} />
                                    <div dangerouslySetInnerHTML={{
                                        __html: sections[i].info!.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                                    }} />
                                </div>
                            )}
                        </motion.section>
                    ))}
                </div>

                {/* Page 6: Steps 03 & 04 + Trust + Footer */}
                <div className={styles.v5MobilePage} role="region" aria-label="Advanced Steps and Call to Action">
                    {[8, 9].map(i => (
                        <motion.section
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-10%" }}
                            className={styles.v5FullSection}
                        >
                            <span className={styles.v5SectionTag}>{sections[i].title}</span>
                            <h2>{sections[i].heading}</h2>
                            {sections[i].text && <p>{sections[i].text}</p>}
                            {sections[i].stats && (
                                <div className={styles.v5SectionStats}>
                                    {sections[i].stats!.map((stat, j) => (
                                        <div key={j} className={styles.v5StatBox}>
                                            {stat}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.section>
                    ))}

                    <section className={styles.v5Trust}>
                        <div className={styles.v5TrustLogos}>
                            <span>POWERED_BY //</span>
                            <span>BELIEVE TRUST</span>
                            <span>HYPEREVM</span>
                            <span>SOLANA</span>
                            <span>GOOGLE_CLOUD</span>
                            <span>BASE</span>
                            <span>ANYWALLET</span>
                        </div>
                    </section>

                    <section className={styles.v5End}>
                        <button className={styles.v5CTA}>Get Started Now</button>
                        <p>Simple. Direct. Powerful.</p>
                    </section>

                    <footer className={styles.v5Footer}>
                        <div className={styles.v5FooterContent}>
                            <div className={styles.v5FooterLinks}>
                                <a href="#" className={styles.v5FooterLink}>Documentation</a>
                                <a href="#" className={styles.v5FooterLink}>Terms</a>
                                <a href="#" className={styles.v5FooterLink}>Privacy</a>
                                <a href="#" className={styles.v5FooterLink}>Support</a>
                            </div>
                            <div className={styles.v5FooterRight}>
                                <span className={styles.v5FooterTagline}>Spray & Play</span>
                                <span className={styles.v5FooterCopyright}>© 2025 Trenches Protocol. All rights reserved.</span>
                            </div>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}
