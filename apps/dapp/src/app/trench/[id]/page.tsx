"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import QueueList from '@/components/QueueList';
import SprayModal from '@/components/SprayModal';
import ValidationModal from '@/components/ValidationModal';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { ComplianceDisclaimer } from "@trenches/ui";

// BLT Contract Address
const BLT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_BLT_CONTRACT_ADDRESS || "0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF";

interface TrenchData {
    id: string;
    name: string;
    level: string;
    entrySize: string;
    roiCap: string;
    cadence: string;
    reserves: string;
    active: boolean;
    queue: QueueParticipant[];
    totalParticipants: number;
    tokenSymbol: string;
    tokenPrice: number | null;
}

interface QueueParticipant {
    position: number;
    id: string;
    handle: string;
    beliefScore: number;
    boostPoints: number;
    entryAmount: number;
    joinedAt: string;
    status: string;
}

export default function TrenchPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [trench, setTrench] = useState<TrenchData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isValidationOpen, setIsValidationOpen] = useState(false);

    const trenchId = params?.id as string;

    const fetchTrench = useCallback(async () => {
        if (!trenchId) return;
        try {
            const res = await fetch(`/api/trenches/${trenchId}`);
            const data = await res.json();
            if (data.data) {
                setTrench(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch trench:', err);
        } finally {
            setLoading(false);
        }
    }, [trenchId]);

    // Initial fetch
    useEffect(() => {
        fetchTrench();
    }, [fetchTrench]);

    // Polling every 5 seconds
    useEffect(() => {
        const interval = setInterval(fetchTrench, 5000);
        return () => clearInterval(interval);
    }, [fetchTrench]);

    const handleSprayClick = () => {
        if (!user) {
            router.push('/login');
        } else {
            setIsModalOpen(true);
        }
    };

    const handleSprayConfirm = async () => {
        // TODO: Implement actual spray transaction
        console.log('Spray confirmed for trench:', trench?.id);
        // Refresh data after spray
        fetchTrench();
    };

    // Check if current user is in queue
    const currentUserHandle = user ? `@${user.email?.split('@')[0] || 'user'}` : null;
    const userParticipant = trench?.queue?.find(p =>
        p.handle === currentUserHandle || p.handle === '@you'
    );

    if (loading || authLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>LOADING TRENCH DATA...</div>
                <Link href="/" className={styles.backLink}>&lt; RETURN TO BASE</Link>
            </div>
        );
    }

    if (!trench) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>TRENCH NOT FOUND</div>
                <Link href="/" className={styles.backLink}>&lt; RETURN TO BASE</Link>
            </div>
        );
    }

    const getLevelColor = () => {
        switch (trench.level) {
            case 'RAPID': return 'var(--accent-rapid)';
            case 'MID': return 'var(--accent-mid)';
            case 'DEEP': return 'var(--accent-deep)';
            default: return 'var(--text-primary)';
        }
    };

    // Map queue to format expected by QueueList
    const participants = trench.queue.map(p => ({
        id: p.id,
        handle: p.handle,
        beliefScore: p.beliefScore,
        boostPoints: p.boostPoints,
        entryAmount: p.entryAmount,
        timeAgo: new Date(p.joinedAt).toLocaleString(),
        status: p.status as 'active' | 'exited' | 'pending',
    }));

    return (
        <main className={styles.container}>
            {/* Spray Modal for New Entry */}
            <SprayModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleSprayConfirm}
                trench={{
                    id: trench.id,
                    name: trench.name,
                    level: trench.level as 'RAPID' | 'MID' | 'DEEP',
                    roiCap: trench.roiCap,
                    minEntry: trench.level === 'RAPID' ? 5 : trench.level === 'MID' ? 100 : 1000,
                    maxEntry: trench.level === 'RAPID' ? 1000 : trench.level === 'MID' ? 10000 : 100000,
                    roiMultiplier: parseFloat(trench.roiCap.replace('x', '')) || 1.5,
                }}
            />

            {/* Boost Validation Modal */}
            <ValidationModal
                isOpen={isValidationOpen}
                onComplete={() => {
                    setIsValidationOpen(false);
                    fetchTrench();
                }}
            />

            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backLink}>&lt; BACK</Link>
                <div>
                    <h1 className={styles.title} style={{ color: getLevelColor() }}>
                         //{trench.level} TRENCH
                    </h1>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            marginTop: '8px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-mono)'
                        }}
                        onClick={() => {
                            navigator.clipboard.writeText(BLT_CONTRACT_ADDRESS);
                            alert('Contract Copied: ' + BLT_CONTRACT_ADDRESS);
                        }}
                    >
                        <span style={{ color: 'var(--accent-blt)', fontWeight: 'bold' }}>${trench.tokenSymbol}:</span>
                        <span style={{ textDecoration: 'underline dotted' }}>
                            {BLT_CONTRACT_ADDRESS.slice(0, 8)}...{BLT_CONTRACT_ADDRESS.slice(-6)}
                        </span>
                        <span>📋</span>
                    </div>
                </div>
                <div className={styles.liveIndicator}>
                    <span className={styles.dot}></span> LIVE
                </div>
            </header>

            {/* Stats Grid */}
            <section className={styles.statsGrid}>
                <div className={styles.statBox}>
                    <span className={styles.label}>ENTRY</span>
                    <span className={styles.value}>{trench.entrySize}</span>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.label}>ROI CAP</span>
                    <span className={styles.value}>{trench.roiCap}</span>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.label}>WAIT TIME</span>
                    <span className={styles.value}>{trench.cadence}</span>
                </div>
            </section>

            {/* Reserve Bar */}
            <div className={styles.reserveSection} style={{ marginBottom: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>
                    <span>RESERVES</span>
                    <span>{trench.reserves} ${trench.tokenSymbol} LEFT</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '65%', background: getLevelColor() }}></div>
                </div>
            </div>

            {/* Queue Stats */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-md)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)'
            }}>
                <span>QUEUE: {trench.totalParticipants} PARTICIPANTS</span>
                <span style={{ color: 'var(--accent-blt)' }}>POLLING LIVE</span>
            </div>

            {/* Queue Visualization */}
            <QueueList
                participants={participants}
                onBoost={() => setIsValidationOpen(true)}
            />

            {/* Sticky Action Container */}
            <div className={styles.actionContainer}>
                {userParticipant ? (
                    <div style={{
                        background: 'var(--bg-secondary)',
                        border: `1px solid ${getLevelColor()}`,
                        padding: 'var(--spacing-md)',
                        borderRadius: '4px',
                        textAlign: 'center',
                    }}>
                        <div style={{ color: getLevelColor(), fontWeight: 'bold', marginBottom: '8px' }}>
                            YOUR POSITION: #{trench.queue.findIndex(p => p.id === userParticipant.id) + 1}
                        </div>
                        <button
                            className={styles.sprayButton}
                            onClick={() => setIsValidationOpen(true)}
                            style={{
                                borderColor: getLevelColor(),
                                color: getLevelColor(),
                            }}
                        >
                            BOOST QUEUE POSITION
                        </button>
                    </div>
                ) : (
                    <button
                        className={styles.sprayButton}
                        onClick={handleSprayClick}
                        style={{
                            borderColor: getLevelColor(),
                            color: getLevelColor(),
                            boxShadow: `0 0 10px ${getLevelColor()}40`
                        }}
                    >
                        SPRAY TO ENTER
                    </button>
                )}
            </div>
            <ComplianceDisclaimer variant="footer" />
        </main>
    );
}
