"use client";

import styles from './StatusBadge.module.css';

type Status = 'active' | 'pending' | 'exited' | 'expired' | 'on_clock';

interface StatusBadgeProps {
    status: Status;
    showLabel?: boolean;
}

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
    active: { label: 'ACTIVE', className: styles.active },
    pending: { label: 'PENDING', className: styles.pending },
    exited: { label: 'EXITED', className: styles.exited },
    expired: { label: 'EXPIRED', className: styles.expired },
    on_clock: { label: 'ON CLOCK', className: styles.onClock },
};

export default function StatusBadge({ status, showLabel = true }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    return (
        <span className={`${styles.badge} ${config.className}`}>
            <span className={styles.dot} />
            {showLabel && <span className={styles.label}>{config.label}</span>}
        </span>
    );
}
