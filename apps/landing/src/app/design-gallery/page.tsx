"use client";

import styles from './DesignGallery.module.css';
import Image from 'next/image';

const mockData = {
    handle: "@IZECUBE",
    referral: "playtrenches.xyz/ref/HJBA255V",
    queue: "#6",
    beliefScore: 0,
    boostPoints: 0,
    timer: "25 : 03 : 28 : 12"
};

export default function DesignGallery() {
    return (
        <main className={styles.galleryContainer}>
            {/* 1. Tactical Command */}
            <section className={`${styles.sampleSection} ${styles.tacticalCommand}`}>
                <span className={styles.sampleLabel}>1. Tactical Command (Horizontal Split)</span>
                <div className={styles.tcHeader}>
                    <p className={styles.label}>OPERATOR: {mockData.handle} | REF: {mockData.referral}</p>
                </div>
                <div className={styles.tcGrid}>
                    <div className={`${styles.card460} ${styles.glass}`}>
                        <div>
                            <p className={styles.label}>QUEUE POSITION</p>
                            <p className={styles.value}>{mockData.queue}</p>
                        </div>
                        <div className={styles.timer}>{mockData.timer}</div>
                    </div>
                    <div className={`${styles.card460} ${styles.glass}`}>
                        <p className={styles.label}>TACTICAL INTEL</p>
                        <p style={{ fontSize: '0.8rem', color: '#888' }}>Overtake the competition by creating high-value content.</p>
                    </div>
                </div>
            </section>

            {/* 2. Focused Aura */}
            <section className={`${styles.sampleSection} ${styles.focusedAura}`}>
                <span className={styles.sampleLabel}>2. Focused Aura (Centered Stack)</span>
                <div className={styles.faProfile}>
                    <p className={styles.label}>{mockData.handle}</p>
                    <p className={styles.label} style={{ color: '#fff' }}>{mockData.referral}</p>
                </div>
                <div className={`${styles.card460} ${styles.glass} ${styles.faHeroCard}`}>
                    <p className={styles.label}>ZENITH PROTOCOL</p>
                    <div style={{ textAlign: 'center' }}>
                        <p className={styles.label}>QUEUE</p>
                        <p style={{ fontSize: '6rem', fontWeight: 950, letterSpacing: '-5px' }}>{mockData.queue}</p>
                    </div>
                    <div className={styles.timer} style={{ fontSize: '1.5rem', textAlign: 'center' }}>{mockData.timer}</div>
                </div>
            </section>

            {/* 3. Mission Briefing */}
            <section className={`${styles.sampleSection} ${styles.missionBriefing}`}>
                <span className={styles.sampleLabel}>3. Mission Briefing (Modern Asymmetric)</span>
                <div className={styles.mbProfile}>
                    <div style={{ borderLeft: '2px solid #39FF14', paddingLeft: '1rem' }}>
                        <p className={mockData.handle} style={{ fontSize: '1.5rem', fontWeight: 900 }}>{mockData.handle}</p>
                        <p className={styles.label}>REF: {mockData.referral}</p>
                    </div>
                </div>
                <div className={`${styles.card460} ${styles.glass} ${styles.mbCard}`}>
                    <p className={styles.label}>POSITION STATUS: ENLISTED</p>
                    <p className={styles.value}>QUEUE #{mockData.queue}</p>
                    <div style={{ background: '#111', padding: '1rem', borderRadius: '10px' }} className={styles.timer}>
                        {mockData.timer}
                    </div>
                </div>
            </section>

            {/* 4. Bento Grid */}
            <section className={`${styles.sampleSection} ${styles.bentoGrid}`}>
                <span className={styles.sampleLabel}>4. Bento Grid (Unified Pro)</span>
                <div className={`${styles.bentoHub} ${styles.glass}`}>
                    <p style={{ fontWeight: 900 }}>{mockData.handle}</p>
                    <p className={styles.label} style={{ color: '#fff' }}>{mockData.referral}</p>
                    <button className={styles.copyBtn}>COPY</button>
                </div>
                <div className={styles.bentoCards}>
                    <div className={`${styles.card460} ${styles.glass}`}>
                        <p className={styles.label}>COLLECTED POINTS</p>
                        <p className={styles.value}>{mockData.beliefScore} BELIEF</p>
                    </div>
                    <div className={`${styles.card460} ${styles.glass}`}>
                        <p className={styles.label}>TIMER</p>
                        <p className={styles.timer}>{mockData.timer}</p>
                    </div>
                </div>
            </section>

            {/* 5. Glass Horizon */}
            <section className={`${styles.sampleSection} ${styles.glassHorizon}`}>
                <span className={styles.sampleLabel}>5. Glass Horizon (Parallax Depth)</span>
                <div className={styles.ghProfile}>
                    <span style={{ fontSize: '2rem', fontWeight: 950 }}>{mockData.handle}</span>
                    <span className={styles.label} style={{ alignSelf: 'center' }}>{mockData.referral}</span>
                </div>
                <div className={`${styles.card460} ${styles.glass} ${styles.ghCard}`}>
                    <p className={styles.label}>TRANSPARENCY MODE</p>
                    <p style={{ fontSize: '4rem', fontWeight: 950, opacity: 0.2 }}>{mockData.timer}</p>
                    <p className={styles.value}>QUEUED #{mockData.queue}</p>
                </div>
            </section>

            {/* 6. Terminal Ledger */}
            <section className={`${styles.sampleSection} ${styles.terminalLedger}`}>
                <span className={styles.sampleLabel}>6. Terminal Ledger (Developer-First)</span>
                <div className={styles.tlHeader}>
                    <p>// ID: {mockData.handle}</p>
                    <p>// RECRUIT_URL: {mockData.referral}</p>
                </div>
                <div className={`${styles.card460} ${styles.tlCard}`}>
                    <p>[ STATUS: WAITLISTED ]</p>
                    <p>RANK: {mockData.queue}</p>
                    <p>TIME_TO_LAUNCH: {mockData.timer}</p>
                    <div style={{ height: '4px', background: '#39FF14', width: '60%', marginTop: 'auto' }}></div>
                </div>
            </section>

            {/* 7. Cinematic Hero */}
            <section className={`${styles.sampleSection} ${styles.cinematicHero}`}>
                <span className={styles.sampleLabel}>7. Cinematic Hero (Wide Vista)</span>
                <div className={styles.chHero}>
                    <h1 style={{ fontSize: '4rem', fontWeight: 950, letterSpacing: '-4px' }}>{mockData.handle}</h1>
                    <p className={styles.label}>{mockData.referral}</p>
                </div>
                <div className={styles.chCarousel}>
                    <div className={`${styles.card460} ${styles.glass}`}>
                        <p className={styles.label}>POSITION</p>
                        <p className={styles.value}>{mockData.queue}</p>
                    </div>
                    <div className={`${styles.card460} ${styles.glass}`}>
                        <p className={styles.label}>TIMER</p>
                        <p className={styles.timer}>{mockData.timer}</p>
                    </div>
                </div>
            </section>

            {/* 8. Elite Sidebar */}
            <section className={`${styles.sampleSection} ${styles.eliteSidebar}`}>
                <span className={styles.sampleLabel}>8. Elite Sidebar (SaaS Pro)</span>
                <div className={styles.esNav}>
                    <p style={{ fontWeight: 900, marginBottom: '2rem' }}>{mockData.handle}</p>
                    <p className={styles.label}>{mockData.referral}</p>
                    <div style={{ marginTop: '4rem' }} className={styles.label}>DASHBOARD</div>
                    <div className={styles.label} style={{ color: '#fff' }}>INTEL</div>
                </div>
                <div className={styles.esMain}>
                    <div className={`${styles.card460} ${styles.glass}`}>
                        <p className={styles.label}>LIVE POSITION</p>
                        <p className={styles.value} style={{ fontSize: '4rem' }}>{mockData.queue}</p>
                        <div className={styles.timer} style={{ fontSize: '1rem' }}>{mockData.timer}</div>
                    </div>
                </div>
            </section>

            {/* 9. Digital Vault */}
            <section className={`${styles.sampleSection} ${styles.digitalVault}`}>
                <span className={styles.sampleLabel}>9. Digital Vault (Centric Lock)</span>
                <div className={`${styles.card460} ${styles.dvCard}`}>
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '2rem' }}>🔒</span>
                    </div>
                    <p className={styles.label} style={{ textAlign: 'center' }}>VAULT KEY: {mockData.queue}</p>
                    <div className={styles.timer} style={{ textAlign: 'center', color: '#ffd700' }}>{mockData.timer}</div>
                </div>
            </section>

            {/* 10. Minimalism Zenith */}
            <section className={`${styles.sampleSection} ${styles.minimalismZenith}`}>
                <span className={styles.sampleLabel}>10. Minimalism Zenith (Essentialist)</span>
                <div style={{ marginBottom: '4rem' }}>
                    <p className={styles.label}>{mockData.handle}</p>
                    <p className={styles.label}>{mockData.referral}</p>
                </div>
                <div className={`${styles.card460} ${styles.mzCard}`}>
                    <div className={styles.timer} style={{ color: '#39FF14' }}>{mockData.timer}</div>
                    <p className={styles.label} style={{ color: '#fff' }}>QUEUE: {mockData.queue}</p>
                </div>
            </section>
        </main>
    );
}
