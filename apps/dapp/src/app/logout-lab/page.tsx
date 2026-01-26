"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './LogoutLab.module.css';
import Logo from '@/components/Logo';

const SkeletonDashboard = () => (
    <div className={styles.skeletonContainer}>
        <div className={styles.skeletonCard}>
            <div className={`${styles.skeletonLine} ${styles.short}`} />
            <div className={`${styles.skeletonLine} ${styles.long}`} />
            <div className={`${styles.skeletonLine} ${styles.medium}`} />
        </div>
        <div className={styles.skeletonCard}>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
        </div>
        <div className={styles.skeletonCard}>
            <div className={`${styles.skeletonLine} ${styles.short}`} />
            <div className={`${styles.skeletonLine} ${styles.long}`} />
        </div>
    </div>
);

const Variation = ({ title, children, label }: { title: string, children: React.ReactNode, label: string }) => (
    <div className={styles.variationWrapper}>
        <div className={styles.variationLabel}>{label}</div>
        <div className={styles.viewContent}>
            <SkeletonDashboard />
            {children}
        </div>
    </div>
);

export default function LogoutLab() {
    return (
        <main className={styles.labContainer}>
            <header className={styles.labHeader}>
                <h1 className={styles.labTitle}>LOGOUT PROTOCOL LAB</h1>
                <p className={styles.labSubtitle}>UNAUTHENTICATED STATE MATRIX // V1.0</p>
            </header>

            <div className={styles.matrixGrid}>

                {/* 1. The Institutional Gatekeeper */}
                <Variation title="Gatekeeper" label="01_INSTITUTIONAL_GATEKEEPER">
                    <div className={`${styles.overlay} ${styles.frostedGate}`}>
                        <h2 className="heading-l" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>RESTRICTED ACCESS</h2>
                        <p className="label-s" style={{ marginBottom: '2rem', maxWidth: '300px' }}>Authentication required to sync terminal data.</p>
                        <Link href="/login" className="premium-button">DECRYPT →</Link>
                    </div>
                </Variation>

                {/* 2. Cyber-Pulse Lock */}
                <Variation title="CyberPulse" label="02_CYBER_PULSE_LOCK">
                    <div className={`${styles.overlay} ${styles.cyberPulse}`}>
                        <div className={styles.scanline} />
                        <div style={{ color: 'var(--lock-gold)', fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>🔒</div>
                        <h2 style={{ color: 'var(--lock-gold)', fontFamily: 'var(--font-header)', fontSize: '1.2rem', letterSpacing: '4px', marginBottom: '2rem' }}>SECURE LINK REQUIRED</h2>
                        <Link href="/login" className="premium-button" style={{ background: 'var(--lock-gold)', border: 'none' }}>AUTHORIZE</Link>
                    </div>
                </Variation>

                {/* 3. Redacted Profile */}
                <Variation title="Redacted" label="03_REDACTED_PROFILE">
                    <div className={styles.overlay} style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'grayscale(1)' }}>
                        <div style={{ width: '100%', maxWidth: '300px' }}>
                            <div className={styles.redactedBar} />
                            <div className={styles.redactedBar} style={{ width: '60%' }} />
                            <div className={styles.redactedBar} style={{ width: '80%' }} />
                        </div>
                        <div style={{ marginTop: '2rem' }}>
                            <Link href="/login" className="premium-button">IDENTIFY YOURSELF</Link>
                        </div>
                    </div>
                </Variation>

                {/* 4. Terminal Protocol */}
                <Variation title="Terminal" label="04_TERMINAL_PROTOCOL">
                    <div className={`${styles.overlay} ${styles.terminal}`}>
                        <div>[SYSTEM] INITIALIZING GUEST HANDSHAKE...</div>
                        <div>[WARN] IDENTITY_TOKEN_NULL</div>
                        <div>[ERROR] INSUFFICIENT_PRIVILEGES</div>
                        <div style={{ marginTop: '1rem' }}>RUN command: auth --login<span className={styles.cursor} /></div>
                        <div style={{ marginTop: '2rem' }}>
                            <Link href="/login" style={{ color: '#00ff66', border: '1px solid #00ff66', padding: '0.5rem 1rem', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 900 }}>LOGIN.EXE</Link>
                        </div>
                    </div>
                </Variation>

                {/* 5. Zenith Vault */}
                <Variation title="Vault" label="05_ZENITH_VAULT">
                    <div className={styles.overlay} style={{ backgroundColor: '#000' }}>
                        <div className={styles.vaultIcon}>⚜️</div>
                        <h2 className="heading-l" style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1rem' }}>ENTER THE VAULT</h2>
                        <p className="label-s" style={{ marginBottom: '2.5rem' }}>Elite access only.</p>
                        <Link href="/login" className="premium-button">UNLOCK</Link>
                    </div>
                </Variation>

                {/* 6. Progressive Blur */}
                <Variation title="Blur" label="06_PROGRESSIVE_BLUR">
                    <div className={styles.overlay} style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,1) 100%)',
                        backdropFilter: 'blur(8px)',
                        justifyContent: 'flex-start',
                        paddingTop: '6rem'
                    }}>
                        <h2 className="heading-l" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>COMMAND CENTER</h2>
                        <Link href="/login" className="premium-button">SIGN IN TO REVEAL</Link>
                    </div>
                </Variation>

                {/* 7. Institutional Grid */}
                <Variation title="Grid" label="07_INSTITUTIONAL_GRID">
                    <div className={`${styles.overlay} ${styles.titaniumGrid}`}>
                        <div className={styles.accessBadge}>LEVEL 4 REQUIRED</div>
                        <h2 className="label-s" style={{ color: '#fff', fontSize: '1rem', marginBottom: '2rem' }}>SECURITY OVERRIDE DETECTED</h2>
                        <Link href="/login" className="premium-button" style={{ borderRadius: '0', border: '1px solid #333', background: '#050505', color: '#fff' }}>AUTHENTICATE ↵</Link>
                    </div>
                </Variation>

                {/* 8. The Shadow Position */}
                <Variation title="Shadow" label="08_SHADOW_POSITION">
                    <div className={styles.overlay} style={{ background: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', paddingBottom: '4rem' }}>
                        <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <p className="label-s" style={{ marginBottom: '1.5rem' }}>Sync your wallet to track deployments</p>
                            <Link href="/login" className="premium-button" style={{ width: '100%' }}>SYNC NOW</Link>
                        </div>
                    </div>
                </Variation>

                {/* 9. Interactive Gating */}
                <Variation title="Interactive" label="09_INTERACTIVE_GATING">
                    <div className={styles.overlay} style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.9) 100%)' }}>
                        <button className={styles.neonGlowCta} onClick={() => window.location.href = '/login'}>
                            VERIFY IDENTITY
                        </button>
                    </div>
                </Variation>

                {/* 10. Minimalist Sentinel */}
                <Variation title="Minimal" label="10_MINIMALIST_SENTINEL">
                    <div className={styles.overlay} style={{ background: '#020202' }}>
                        <div style={{ opacity: 0.5, marginBottom: '2rem' }}>
                            <Logo variant="horizontal" />
                        </div>
                        <Link href="/login" style={{ color: '#fff', textDecoration: 'none', letterSpacing: '5px', fontSize: '0.8rem', fontWeight: 900 }}>[ DECRYPT ACCESS ]</Link>
                    </div>
                </Variation>

            </div>

            <div style={{ marginTop: '6rem', textAlign: 'center' }}>
                <Link href="/" className="label-s" style={{ textDecoration: 'none', color: 'var(--accent-primary)' }}>↵ RETURN TO TRENCHES</Link>
            </div>
        </main>
    );
}
