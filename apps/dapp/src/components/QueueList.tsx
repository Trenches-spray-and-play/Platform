"use client";

import styles from './QueueList.module.css';
import { Participant } from '@/lib/mockData';
import Countdown from './Countdown';
import StatusBadge from './StatusBadge';

interface QueueListProps {
    participants: Participant[];
    currentUserId?: string;
    onBoost?: (id: string) => void;
}

export default function QueueList({ participants, currentUserId, onBoost }: QueueListProps) {
    // Find user's position in queue
    const userIndex = participants.findIndex(p => p.handle === '@you' || p.id === currentUserId);
    const userPosition = userIndex >= 0 ? userIndex + 1 : null;
    const positionsUntilTurn = userIndex >= 0 ? userIndex : null;

    // Determine status type for StatusBadge
    const getStatusType = (p: Participant, index: number): 'active' | 'pending' | 'exited' | 'on_clock' => {
        if (index === 0 && p.isTurn) return 'on_clock';
        if (p.status === 'exited') return 'exited';
        if (p.status === 'pending') return 'pending';
        return 'active';
    };

    return (
        <div className={styles.container}>
            {/* User Position Summary */}
            {userPosition !== null && (
                <div className={styles.positionSummary}>
                    <span className={styles.positionLabel}>YOUR POSITION</span>
                    <span className={styles.positionValue}>
                        {positionsUntilTurn === 0 ? (
                            <span className={styles.yourTurn}>YOUR TURN</span>
                        ) : (
                            <>{positionsUntilTurn} until your turn</>
                        )}
                    </span>
                </div>
            )}

            <h3 className={styles.title}>LIVE QUEUE</h3>

            <div className={styles.list}>
                {participants.map((p, index) => {
                    const isCurrentUser = p.handle === '@you' || p.id === currentUserId;

                    return (
                        <div
                            key={p.id}
                            className={`${styles.item} ${styles[p.status]} ${isCurrentUser ? styles.currentUser : ''}`}
                        >
                            <div className={styles.rank}>
                                <span className={styles.rankNumber}>#{index + 1}</span>
                                <StatusBadge status={getStatusType(p, index)} showLabel={false} />
                            </div>

                            <div className={styles.info}>
                                <span className={styles.handle}>
                                    {p.handle}
                                    {isCurrentUser && <span className={styles.youTag}> (YOU)</span>}
                                </span>
                                {p.isTurn && index === 0 && (
                                    <span className={styles.turnLabel}>ON THE CLOCK</span>
                                )}
                            </div>

                            {p.isTurn && index === 0 && <Countdown initialMinutes={15} />}

                            <div className={styles.stats}>
                                <span className={styles.score}>BEL: {p.beliefScore}</span>
                                <span className={styles.amount}>{p.entryAmount} $BLT</span>
                                {isCurrentUser && onBoost && (
                                    <button className={styles.boostBtn} onClick={() => onBoost(p.id)}>
                                        ⚡ BOOST
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
