"use client";

import React from 'react';
import styles from './preview.module.css';
import Logo from '@/components/Logo';

export default function BrandingPreview() {
    return (
        <div className={styles.container}>
            {/* Load Fonts */}
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&family=Plus+Jakarta+Sans:wght@700;800&family=Space+Mono&display=swap" rel="stylesheet" />

            <header className={styles.logoWrapper}>
                <Logo variant="horizontal" width={240} />
            </header>

            <div className={styles.previewGrid}>

                {/* --- LEFT SIDE: ZENITH LANDING STYLE --- */}
                <div className={styles.previewColumn}>
                    <h2 className={styles.sectionTitle}>// ZENITH LANDING MODE</h2>
                    <div className={styles.heroContent}>
                        <h1 className={styles.heroTitle}>
                            WHERE TOKENS <br />
                            <span className={styles.glowGreen}>EARN BELIEF</span>
                        </h1>
                        <p style={{ color: '#999', fontSize: '1.2rem', marginBottom: '2.5rem', maxWidth: '500px' }}>
                            The first non-custodial coordination layer for token incubation and community distribution.
                        </p>
                        <button className={styles.mockButton}>
                            SIGN UP WITH X
                        </button>
                    </div>

                    <div style={{ marginTop: '3rem' }}>
                        <p className={styles.statLabel}>PROTOCOL INITIALIZATION</p>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Space Mono' }}>
                            29D : 14H : 55M : 03S
                        </div>
                    </div>
                </div>

                {/* --- RIGHT SIDE: DAPP FUSION STYLE --- */}
                <div className={styles.previewColumn}>
                    <h2 className={styles.sectionTitle}>// DAPP FUSION DASHBOARD</h2>

                    <div className={styles.trenchCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '1.5rem' }}>
                 //RAPID TRENCH
                            </h3>
                            <span style={{ background: '#39FF14', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                                ACTIVE
                            </span>
                        </div>

                        <div className={styles.statsGrid}>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>ENTRY SIZE</span>
                                <span className={styles.statValue}>0.5 - 2.0 SOL</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>ROI CAP</span>
                                <span className={styles.statValue}>1.5X</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>WAIT TIME</span>
                                <span className={styles.statValue}>NO WAIT</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span className={styles.statLabel}>RESERVE LEVEL</span>
                                <span className={styles.glowGreen} style={{ fontFamily: 'Space Mono', fontSize: '0.8rem' }}>14.2 SOL / 15.0 SOL</span>
                            </div>
                            <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                                <div style={{ height: '100%', width: '94%', background: '#39FF14', boxShadow: '0 0 10px #39FF14' }}></div>
                            </div>
                        </div>

                        <button className={styles.mockButton} style={{ width: '100%', background: '#39FF14', color: '#000' }}>
                            SPRAY TO ENTER
                        </button>
                    </div>

                    <div className={styles.card}>
                        <h4 className={styles.statLabel} style={{ marginBottom: '1rem' }}>ACTIVE CAMPAIGNS</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ borderLeft: '2px solid #39FF14', paddingLeft: '1rem' }}>
                                <div style={{ fontWeight: 700 }}>BLT LAUNCH CAMPAIGN</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>$BLT PROJECT // SOLANA</div>
                            </div>
                            <div style={{ borderLeft: '2px solid rgba(255,255,255,0.2)', paddingLeft: '1rem' }}>
                                <div style={{ fontWeight: 700 }}>PEPE LIQUIDITY BOOST</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>$PEPE // ETHEREUM</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className={styles.premiumSection}>
                <h2 style={{ fontFamily: 'var(--font-header)', fontWeight: 900, fontSize: '2.5rem', marginBottom: '3rem', textAlign: 'center', letterSpacing: '-2px' }}>
                    // ZENITH-ELITE REFINEMENT // SAMPLE
                </h2>

                <div
                    className={styles.eliteCard}
                    onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                        e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
                    }}
                >
                    <div className={styles.eliteHeader}>PREMIUM<br />PROTOCOL</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
                        <div>
                            <div className={styles.eliteLabel}>TOTAL SETTLED</div>
                            <div className={styles.eliteStat}>$4,520,039</div>
                        </div>
                        <div>
                            <div className={styles.eliteLabel}>RELAY EFFICIENCY</div>
                            <div className={styles.eliteStat}>99.9%</div>
                        </div>
                    </div>
                </div>
            </div>

            <footer style={{ marginTop: '6rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', color: '#444', fontFamily: 'Space Mono', fontSize: '0.7rem' }}>
                TRENCHES PROTOCOL // CORE_ENGINE_V2.1 // ZENITH_FUSION_MOCKUP
            </footer>
        </div>
    );
}
