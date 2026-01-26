"use client";

import styles from './FlowChart.module.css';

export default function FlowChart() {
    return (
        <div className={styles.container}>
            <div className={styles.phaseGrid}>
                {/* Phase 1 */}
                <div className={styles.phaseCard}>
                    <div className={styles.phaseHeader}>PHASE 1: THE SPRAY</div>
                    <div className={styles.visual}>
                        <div className={styles.userBox}>USER A</div>
                        <div className={styles.actionArrow}>⬇ $100</div>
                        <div className={styles.queueBox}>ENTRY QUEUE</div>
                    </div>
                    <p className={styles.desc}>User A enters the queue with $100.</p>
                </div>

                <div className={styles.connector}>→</div>

                {/* Phase 2 */}
                <div className={styles.phaseCard}>
                    <div className={styles.phaseHeader}>PHASE 2: COORDINATION</div>
                    <div className={styles.visual}>
                        <div className={styles.multiUsers}>
                            <div className={styles.userBoxSmall}>USER B</div>
                            <div className={styles.userBoxSmall}>USER C</div>
                        </div>
                        <div className={styles.actionArrow}>⬇ ENLISTING</div>
                        <div className={styles.queueBox}>BUILDING LIQUIDITY</div>
                    </div>
                    <p className={styles.desc}>User B and User C join the queue.</p>
                </div>

                <div className={styles.connector}>→</div>

                {/* Phase 3 */}
                <div className={styles.phaseCard}>
                    <div className={styles.phaseHeader}>PHASE 3: THE PAYOUT</div>
                    <div className={styles.visual}>
                        <div className={styles.payoutFlow}>
                            <div className={styles.sourceUsers}>
                                <div className={styles.userBoxTiny}>B</div>
                                <div className={styles.userBoxTiny}>C</div>
                            </div>
                            <div className={styles.crossArrow}>↗ $75 ↖ $75</div>
                            <div className={styles.userBoxGold}>USER A</div>
                        </div>
                    </div>
                    <p className={styles.desc}>B & C send $75 each directly to A.</p>
                </div>

                <div className={styles.connector}>→</div>

                {/* Phase 4 */}
                <div className={styles.phaseCard}>
                    <div className={styles.phaseHeader}>RESULT: 50% ROI</div>
                    <div className={styles.visual}>
                        <div className={styles.userBoxLarge}>USER A</div>
                        <div className={styles.profitBadge}>+$150</div>
                        <div className={styles.statusBadge}>COMPLETE</div>
                    </div>
                    <p className={styles.desc}>User A exits with $150 (50% ROI).</p>
                </div>
            </div>

            <div className={styles.projectBackingSection}>
                <div className={styles.backingHeader}>
                    <span className={styles.shieldIcon}>🛡️</span> SAFETY NET: PROJECT RESERVE BACKING
                </div>
                <div className={styles.backingContent}>
                    <div className={styles.backingVisual}>
                        <div className={styles.projectVault}>
                            <div className={styles.vaultLabel}>PROJECT SUPPLY</div>
                            <div className={styles.vaultValue}>15% ALLOCATED</div>
                        </div>
                        <div className={styles.injectionArrow}>⬇ INJECTED IF SLOW ⬇</div>
                        <div className={styles.momentumPulse}>MOMENTUM PRESERVED</div>
                    </div>
                    <p className={styles.backingDesc}>
                        The project backs the game with a dedicated allocation of supply.
                        This ensures the P2P settlement window continues to scale even if organic user participation slows down.
                        The game never stops.
                    </p>
                </div>
            </div>

            <div className={styles.disclaimer}>
                <span className={styles.alertIcon}>⚠️</span>
                NON-CUSTODIAL: Trenches never touches your funds. You send and receive directly to/from other humans.
            </div>
        </div>
    );
}
