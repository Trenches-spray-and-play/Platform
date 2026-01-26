
"use client";

import { useState } from 'react';
import styles from './ui-refresh.module.css';
import Logo from '@/components/Logo';

export default function UIRefreshDemo() {
    const [expandedTask, setExpandedTask] = useState<string | null>(null);
    const [completed, setCompleted] = useState<Set<string>>(new Set());

    const toggleTask = (id: string) => {
        setExpandedTask(expandedTask === id ? null : id);
    };

    const handleVerify = (id: string) => {
        setCompleted(prev => new Set([...prev, id]));
        setExpandedTask(null);
    };

    return (
        <div className={styles.container}>
            <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Logo variant="horizontal" />
                <h1 style={{ fontSize: '0.8rem', color: '#444', marginTop: '1rem', letterSpacing: '4px' }}>UI REFRESH PROPOSAL</h1>
            </header>

            {/* Section 1: Timer Centering */}
            <section className={styles.demoSection}>
                <h2 className={styles.sectionTitle}>1. Position Card Centering Fix</h2>
                <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '2rem' }}>
                    Ensuring the payout timer is perfectly centered relative to the card geometry.
                </p>
                <div className={styles.heroCard}>
                    <div className={styles.cardHeader}>
                        <span className={styles.trenchLabel}>RAPID TRENCH</span>
                        <span style={{ color: '#00FF66', fontSize: '1rem', fontWeight: 800 }}>$50 - $100</span>
                    </div>

                    <div className={styles.cardMain}>
                        <span className={styles.roiLabel}>PAYOUT IN</span>
                        <div style={{
                            fontSize: '4rem',
                            fontWeight: 950,
                            color: '#fff',
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '-2px'
                        }}>
                            23h : 44m
                        </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <button style={{
                            background: '#fff',
                            color: '#000',
                            border: 'none',
                            padding: '10px 40px',
                            borderRadius: '100px',
                            fontWeight: 950,
                            fontSize: '0.7rem'
                        }}>BOOST TIME</button>
                    </div>
                </div>
            </section>

            {/* Section 2: Overhauled Task Experience */}
            <section className={styles.demoSection}>
                <h2 className={styles.sectionTitle}>2. Task Instructions & Verification Flow</h2>
                <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '2rem' }}>
                    Clicking "GO" will now expand instructions instead of immediate completion.
                </p>

                <div className={styles.modalPreview}>
                    <h3 className={styles.modalTitle}>COMPLETE TASKS</h3>

                    <div className={styles.taskList}>
                        {/* Task 1 */}
                        <div className={styles.taskItem} style={{ opacity: completed.has('t1') ? 0.4 : 1 }}>
                            <div className={styles.taskHeader} onClick={() => !completed.has('t1') && toggleTask('t1')}>
                                <div className={styles.taskInfo}>
                                    <span className={styles.taskTitle}>FOLLOW TRABORA ON X</span>
                                    <span className={styles.taskReward}>+100 BOOST POINTS</span>
                                </div>
                                {completed.has('t1') ? (
                                    <span style={{ color: '#00FF66', fontWeight: 900 }}>✓</span>
                                ) : (
                                    <button className={styles.goBtn}>GO</button>
                                )}
                            </div>

                            {expandedTask === 't1' && (
                                <div className={styles.taskInstructions}>
                                    <div className={styles.instructionStep}>
                                        1. Click the button below to open Twitter.<br />
                                        2. Follow @traboraofficial.<br />
                                        3. Return here and click VERIFY to finalize.
                                    </div>
                                    <button
                                        className={styles.verifyBtn}
                                        onClick={() => handleVerify('t1')}
                                    >
                                        VERIFY COMPLETION
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Task 2 */}
                        <div className={styles.taskItem} style={{ opacity: completed.has('t2') ? 0.4 : 1 }}>
                            <div className={styles.taskHeader} onClick={() => !completed.has('t2') && toggleTask('t2')}>
                                <div className={styles.taskInfo}>
                                    <span className={styles.taskTitle}>JOIN COMMAND CENTER</span>
                                    <span className={styles.taskReward}>+50 BOOST POINTS</span>
                                </div>
                                {completed.has('t2') ? (
                                    <span style={{ color: '#00FF66', fontWeight: 900 }}>✓</span>
                                ) : (
                                    <button className={styles.goBtn}>GO</button>
                                )}
                            </div>

                            {expandedTask === 't2' && (
                                <div className={styles.taskInstructions}>
                                    <div className={styles.instructionStep}>
                                        1. Join our official Telegram group.<br />
                                        2. Introduce yourself to the squad.<br />
                                        3. Click VERIFY below.
                                    </div>
                                    <button
                                        className={styles.verifyBtn}
                                        onClick={() => handleVerify('t2')}
                                    >
                                        VERIFY COMPLETION
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button disabled style={{
                        width: '100%',
                        padding: '1.5rem',
                        background: '#1a1a1a',
                        color: '#444',
                        border: 'none',
                        borderRadius: '16px',
                        fontWeight: 950,
                        letterSpacing: '2px'
                    }}>
                        {completed.size === 2 ? 'JOIN QUEUE' : 'COMPLETE ALL TASKS'}
                    </button>
                </div>
            </section>

            {/* Section 3: Mobile View Optimizations Explanation */}
            <section className={styles.demoSection}>
                <h2 className={styles.sectionTitle}>3. Mobile UX & Text Visibility</h2>
                <div style={{ color: '#888', lineHeight: '1.8', fontSize: '0.9rem' }}>
                    <p>• <strong>Maximized Vertical Space</strong>: Modals will use <code>95vh</code> and subtle padding to ensure task lists aren't compressed.</p>
                    <p>• <strong>Text Expansion</strong>: Task titles now use flexible layouts to prevent truncation on smaller screens.</p>
                    <p>• <strong>Touch Targets</strong>: "GO" and "VERIFY" buttons are scaled for thumb ergonomics.</p>
                </div>
            </section>
        </div>
    );
}
