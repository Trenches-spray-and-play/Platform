"use client";

import React, { useState, useEffect } from "react";
import styles from "./demo.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Monitor, User } from "lucide-react";
import { Logo } from "@trenches/ui";

const scripts = {
    institutional: {
        title: "Airdrops, But Smarter",
        scenes: [
            {
                text: "AIRDROPS WORK.",
                subtext: "But they're messy. Bots. Spam. Luck.",
                duration: 4000,
                visual: "Tweets Montage Simulation"
            },
            {
                text: "TOO RANDOM.",
                subtext: "Bad for users. Worse for projects.",
                duration: 4000,
                visual: "Task List X-Red"
            },
            {
                text: "TRENCHES CHANGES THE GAME.",
                subtext: "Distribution with 1.5x Certainty.",
                duration: 5000,
                visual: "Dashboard Glow"
            },
            {
                text: "$1,000 ➡️ $1,500",
                subtext: "1.5x Fixed Settlement. Institutional Grade.",
                duration: 4000,
                visual: "Tiers: RAPID / MID / DEEP"
            },
            {
                text: "LIQUIDITY PROTECTION.",
                subtext: "Stop the extraction. Join the coordinate.",
                duration: 5000,
                visual: "Anti-Extraction Shield"
            },
            {
                text: "COORDINATION LEAD.",
                subtext: "Manage the Trench. Guide the Belief.",
                duration: 5000,
                visual: "Lead Dashboard"
            }
        ]
    },
    newbie: {
        title: "The 'Join Waitlist' Formula",
        scenes: [
            {
                text: "$10,000,000",
                subtext: "Airdrops are actually Marketing Funds.",
                duration: 4000,
                visual: "Giveaway Multiplier"
            },
            {
                text: "$100 ➡️ $150",
                subtext: "Fixed 50% Profit. No Trading. No Risk.",
                duration: 4000,
                visual: "ROI Calculator Step"
            },
            {
                text: "DAILY HUSTLE?",
                subtext: "Turn $1k into $1,500 in 24 Hours.",
                duration: 4000,
                visual: "RAPID TRENCH Card"
            },
            {
                text: "LOCK YOUR POSITION.",
                subtext: "Join the Waitlist. Receive Settlement.",
                duration: 4000,
                visual: "CTA Button Glow"
            },
            {
                text: "TRUST THE PROCESS.",
                subtext: "Your deposit buys the project's token.",
                duration: 5000,
                visual: "Token Purchase Flow"
            },
            {
                text: "SUCCESS COACH.",
                subtext: "Help others. Receive more settlements.",
                duration: 5000,
                visual: "Coach Roadmap"
            }
        ]
    }
};

export default function DemoSuite() {
    const [mode, setMode] = useState<'institutional' | 'newbie'>('newbie');
    const [currentScene, setCurrentScene] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);

    const script = scripts[mode];
    const scene = script.scenes[currentScene];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        if (currentScene < script.scenes.length - 1) {
                            setCurrentScene(s => s + 1);
                        } else {
                            setCurrentScene(0);
                        }
                        return 0;
                    }
                    return prev + (100 / (scene.duration / 100));
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentScene, mode, scene.duration]);

    const handleModeSwitch = (newMode: 'institutional' | 'newbie') => {
        setMode(newMode);
        setCurrentScene(0);
        setProgress(0);
    };

    return (
        <div className={styles.demoContainer}>
            <header className={styles.demoHeader}>
                <Logo variant="horizontal" width={140} />
                <div className={styles.demoSuiteTitle}>Marketing Demo Suite</div>
            </header>

            <main className={styles.demoMain}>
                <section className={styles.videoSection}>
                    <div className={styles.videoFrame}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${mode}-${currentScene}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.5 }}
                                className={styles.videoContent}
                            >
                                <div className={styles.overlay} />
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className={styles.sceneText}
                                >
                                    {scene.text.split(' ').map((word, i) => (
                                        <span key={i} className={word.includes('$') || word.includes('1.5X') || word.includes('1.5x') ? styles.accentGreen : ''}>
                                            {word}{' '}
                                        </span>
                                    ))}
                                </motion.div>
                                <motion.div
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className={styles.sceneSubtext}
                                >
                                    {scene.subtext}
                                </motion.div>

                                {scene.visual === "Tweets Montage Simulation" && (
                                    <div className={styles.visualContainer}>
                                        <motion.div
                                            animate={{ y: [-20, -100] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            className={styles.tweetScroll}
                                        >
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className={styles.tweetCard}>
                                                    <div className={styles.tweetUser} />
                                                    <div className={styles.tweetContent}>$JUP Claimed! Trenches ⚡</div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    </div>
                                )}

                                {scene.visual === "Task List X-Red" && (
                                    <div className={styles.visualContainer}>
                                        <div className={styles.taskList}>
                                            <div className={styles.taskItem}>Join 50 Discords ❌</div>
                                            <div className={styles.taskItem}>Follow 100 Accounts ❌</div>
                                            <div className={styles.taskItem}>No Luck ❌</div>
                                        </div>
                                    </div>
                                )}

                                {scene.visual === "Coach Roadmap" && (
                                    <div className={styles.visualContainer}>
                                        <div className={styles.roadmap}>
                                            <div className={styles.roadmapItem}>1. Setup Wallet ✅</div>
                                            <div className={styles.roadmapItem}>2. Onramp Crypto ✅</div>
                                            <div className={styles.roadmapItem}>3. Help 5 Friends 👥</div>
                                            <div className={styles.roadmapItemActive}>4. Earn Bounties 💎</div>
                                        </div>
                                    </div>
                                )}

                                {scene.visual === "Anti-Extraction Shield" && (
                                    <div className={styles.visualContainer}>
                                        <div className={styles.shieldVisual}>
                                            <div className={styles.shieldIcon}>🛡️</div>
                                            <div className={styles.shieldTitle}>ANTI-EXTRACTION</div>
                                            <div className={styles.shieldLine}>No CEX Fees</div>
                                            <div className={styles.shieldLine}>Direct Distribution</div>
                                        </div>
                                    </div>
                                )}

                                {scene.visual === "Lead Dashboard" && (
                                    <div className={styles.visualContainer}>
                                        <div className={styles.leadDash}>
                                            <div className={styles.dashHeader}>LEAD COORDINATOR</div>
                                            <div className={styles.dashStat}>Active Nodes: 12</div>
                                            <div className={styles.dashStat}>Managed Capital: $450k</div>
                                        </div>
                                    </div>
                                )}

                                {scene.visual === "Dashboard Glow" && (
                                    <div className={styles.visualContainer}>
                                        <div className={styles.dashboardGlow}>
                                            <div className={styles.glowLogo}><Logo variant="horizontal" width={100} /></div>
                                            <div className={styles.glowScore}>Belief Score: 98/100</div>
                                        </div>
                                    </div>
                                )}

                                {scene.visual === "Tiers: RAPID / MID / DEEP" && (
                                    <div className={styles.visualContainer}>
                                        <div className={styles.tierGrid}>
                                            <div className={styles.tierSmall}>RAPID (1.5x)</div>
                                            <div className={styles.tierSmall}>MID (1.5x)</div>
                                            <div className={styles.tierSmall}>DEEP (1.5x)</div>
                                        </div>
                                    </div>
                                )}

                                {scene.visual === "Giveaway Multiplier" && (
                                    <div className={styles.visualContainer}>
                                        <div className={styles.moneyCircle}>
                                            <div className={styles.moneyValue}>$1,500</div>
                                            <div className={styles.moneyLabel}>FROM $1,000</div>
                                        </div>
                                    </div>
                                )}

                                {scene.visual === "ROI Calculator Step" && (
                                    <div className={styles.visualContainer}>
                                        <div className={styles.roiCalc}>
                                            <div className={styles.roiBox}>IN: $100</div>
                                            <div className={styles.roiArrow}>➡️</div>
                                            <div className={styles.roiBoxGreen}>OUT: $150</div>
                                        </div>
                                    </div>
                                )}

                                {scene.visual === "RAPID TRENCH Card" && (
                                    <div className={styles.visualContainer}>
                                        <div className={styles.rapidCard}>
                                            <div className={styles.rapidTitle}>RAPID TRENCH</div>
                                            <div className={styles.rapidTime}>24 HOURS</div>
                                            <div className={styles.rapidPayout}>50% REWARD</div>
                                        </div>
                                    </div>
                                )}

                                {scene.visual === "CTA Button Glow" && (
                                    <div className={styles.visualContainer}>
                                        <motion.button
                                            animate={{ scale: [1, 1.05, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className={styles.ctaButtonLarge}
                                        >
                                            JOIN THE WAITLIST
                                        </motion.button>
                                    </div>
                                )}

                                {scene.visual === "Token Purchase Flow" && (
                                    <div className={styles.visualContainer}>
                                        <div className={styles.tokenFlow}>
                                            <div className={styles.flowStep}>DEPOSIT 💰</div>
                                            <div className={styles.flowArrow}>➡️</div>
                                            <div className={styles.flowStep}>TOKEN 🎫</div>
                                            <div className={styles.flowArrow}>➡️</div>
                                            <div className={styles.flowStep}>VALUE 🚀</div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        <div className={styles.timeline}>
                            <div
                                className={styles.progress}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className={styles.controls}>
                        <button
                            className={`${styles.controlBtn} ${mode === 'institutional' ? styles.controlBtnActive : ''}`}
                            onClick={() => handleModeSwitch('institutional')}
                        >
                            <Monitor size={16} style={{ marginRight: 8 }} /> INSTITUTIONAL
                        </button>
                        <button
                            className={`${styles.controlBtn} ${mode === 'newbie' ? styles.controlBtnActive : ''}`}
                            onClick={() => handleModeSwitch('newbie')}
                        >
                            <User size={16} style={{ marginRight: 8 }} /> NEWBIE
                        </button>
                        <button
                            className={styles.controlBtn}
                            onClick={() => setIsPlaying(!isPlaying)}
                        >
                            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <button
                            className={styles.controlBtn}
                            onClick={() => { setCurrentScene(0); setProgress(0); }}
                        >
                            <RotateCcw size={16} />
                        </button>
                    </div>
                </section>

                <aside className={styles.infoSection}>
                    <div className={styles.infoTitle}>Script Breakdown</div>
                    <div className={styles.scriptDetails}>
                        <div className={styles.detailItem}>
                            <h4>Current Video</h4>
                            <p>{script.title}</p>
                        </div>
                        <div className={styles.detailItem}>
                            <h4>Scene {currentScene + 1} of {script.scenes.length}</h4>
                            <p>{scene.subtext}</p>
                        </div>
                        <div className={styles.detailItem}>
                            <h4>Logic Applied</h4>
                            <p>
                                {mode === 'newbie'
                                    ? "Focuses on high-energy ROI, jargon-free earnings, and the 'Marketing Fund' narrative."
                                    : "Emphasizes structural integrity, mathematical certainty, and anti-extraction."}
                            </p>
                        </div>
                        <div className={styles.detailItem}>
                            <h4>Target Payout</h4>
                            <p className={styles.accentGreen}>1.5X FIXED SETTLEMENT</p>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
}
