"use client";

import styles from './TrenchCard.module.css';

// BLT Contract Address - move to env or config later
const BLT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_BLT_CONTRACT_ADDRESS || "0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF";

interface Campaign {
    id: string;
    name: string;
    tokenSymbol: string;
    tokenAddress: string;
    chainName: string;
    reserves: string | null;
    roiMultiplier: string;
}

interface TrenchProps {
    level: 'RAPID' | 'MID' | 'DEEP';
    entrySize: string;
    roiCap: string;
    cadence: string;
    reserves: string;
    campaignCount?: number;
    campaigns?: Campaign[];
    onClick: () => void;
}

export default function TrenchCard({
    level,
    entrySize,
    roiCap,
    cadence,
    reserves,
    campaignCount = 0,
    campaigns = [],
    onClick
}: TrenchProps) {

    const getLevelColor = () => {
        switch (level) {
            case 'RAPID': return 'var(--accent-rapid)';
            case 'MID': return 'var(--accent-mid)';
            case 'DEEP': return 'var(--accent-deep)';
            default: return 'var(--text-primary)';
        }
    };

    return (
        <div
            className={styles.card}
            onClick={onClick}
            style={{ borderColor: getLevelColor() } as React.CSSProperties}
        >
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title} style={{ color: getLevelColor() }}>
                        {"//"}{level} TRENCH
                    </h3>
                    <div
                        className={styles.tokenInfo}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(BLT_CONTRACT_ADDRESS);
                            alert('Contract Copied: ' + BLT_CONTRACT_ADDRESS);
                        }}
                    >
                        <span className={styles.tokenLabel}>$BLT:</span>
                        <span className={styles.contractAddr}>
                            {BLT_CONTRACT_ADDRESS.slice(0, 6)}...{BLT_CONTRACT_ADDRESS.slice(-4)}
                        </span>
                        <span className={styles.copyIcon}>📋</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {campaignCount > 0 && (
                        <span style={{
                            background: getLevelColor(),
                            color: '#000',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            fontFamily: 'var(--font-mono)',
                        }}>
                            {campaignCount} CAMPAIGN{campaignCount > 1 ? 'S' : ''}
                        </span>
                    )}
                    <span className={styles.status}>ACTIVE</span>
                </div>
            </div>

            {/* Show campaign names if multiple */}
            {campaigns.length > 0 && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.25rem',
                    marginBottom: '0.5rem',
                }}>
                    {campaigns.slice(0, 3).map((campaign) => (
                        <span
                            key={campaign.id}
                            style={{
                                background: 'var(--bg-tertiary)',
                                padding: '2px 6px',
                                borderRadius: '2px',
                                fontSize: '0.65rem',
                                color: 'var(--text-secondary)',
                                fontFamily: 'var(--font-mono)',
                            }}
                        >
                            {campaign.name} ({campaign.tokenSymbol})
                        </span>
                    ))}
                    {campaigns.length > 3 && (
                        <span style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                        }}>
                            +{campaigns.length - 3} more
                        </span>
                    )}
                </div>
            )}

            <div className={styles.stats}>
                <div className={styles.statRow}>
                    <span className={styles.label}>ENTRY</span>
                    <span className={styles.value}>{entrySize}</span>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.label}>ROI CAP</span>
                    <span className={styles.value}>{roiCap}</span>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.label}>WAIT TIME</span>
                    <span className={styles.value}>{cadence}</span>
                </div>
            </div>

            <div className={styles.reserveBarContainer}>
                <div className={styles.reserveLabel}>
                    <span>RESERVES: {reserves}</span>
                </div>
                <div className={styles.reserveTrack}>
                    <div className={styles.reserveFill} style={{ width: '65%', background: getLevelColor() }}></div>
                </div>
            </div>

            <div className={styles.action}>
                <span className={styles.cta}>SPRAY TO ENTER &gt;</span>
            </div>
        </div>
    );
}

