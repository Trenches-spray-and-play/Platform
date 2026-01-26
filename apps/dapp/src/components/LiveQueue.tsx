"use client";

import { useEffect, useState } from 'react';
import styles from './LiveQueue.module.css';

interface QueueItem {
    id: string;
    handle: string;
    avatar: string;
    action: string;
}

const MOCK_QUEUE: QueueItem[] = [
    { id: '1', handle: '@alpha_king', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', action: 'JOINED' },
    { id: '2', handle: '@sol_whale', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', action: 'SPRAYED' },
    { id: '3', handle: '@crypto_babe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', action: 'JOINED' },
    { id: '4', handle: '@degen_joe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4', action: 'VALIDATED' },
    { id: '5', handle: '@moon_shot', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5', action: 'SPRAYED' },
    { id: '6', handle: '@nft_god', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6', action: 'JOINED' },
    { id: '7', handle: '@ape_master', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7', action: 'VALIDATED' },
    { id: '8', handle: '@wagmi_lord', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8', action: 'SPRAYED' },
];

export default function LiveQueue() {
    const [queue, setQueue] = useState(MOCK_QUEUE);

    // Simulate real-time queue updates
    useEffect(() => {
        const interval = setInterval(() => {
            setQueue(prev => {
                const newQueue = [...prev];
                const first = newQueue.shift()!;
                newQueue.push(first);
                return newQueue;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.label}>LIVE SPRAY QUEUE</div>
            <div className={styles.queueWrapper}>
                <div className={styles.scrollArea}>
                    {queue.map((item, index) => (
                        <div key={`${item.id}-${index}`} className={styles.queueItem}>
                            <img src={item.avatar} alt={item.handle} className={styles.avatar} />
                            <div className={styles.info}>
                                <span className={styles.handle}>{item.handle}</span>
                                <span className={styles.action}>{item.action}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
