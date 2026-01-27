"use client";

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './TacticalButton.module.css';

interface TacticalButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: 'primary' | 'secondary' | 'hybrid';
    disabled?: boolean;
}

export default function TacticalButton({
    children,
    onClick,
    className = '',
    variant = 'hybrid',
    disabled = false
}: TacticalButtonProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initial audio setup
    useEffect(() => {
        // High-frequency mechanical blip
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audioRef.current.volume = 0.4;
        audioRef.current.preload = 'auto';
    }, []);

    const triggerTacticalFeedback = () => {
        if (disabled) return;

        // 1. Haptic Feedback (Tactical Double-Tap)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([10, 30, 10]);
        }

        // 2. Audio Feedback
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => console.log('Audio disabled by browser policy'));
        }

        // 3. Execution
        if (onClick) onClick();
    };

    return (
        <motion.button
            className={`${styles.button} ${styles[variant]} ${className}`}
            onClick={triggerTacticalFeedback}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={disabled}
        >
            <span className={styles.label}>{children}</span>

            {/* The Hybrid Animation Layers */}
            {variant === 'hybrid' && (
                <>
                    <div className={styles.shimmer} />
                    <div className={styles.pulse} />
                </>
            )}

            {/* Click Flash effect */}
            <motion.div
                className={styles.flash}
                initial={{ opacity: 0 }}
                whileTap={{ opacity: 0.2 }}
                transition={{ duration: 0.1 }}
            />
        </motion.button>
    );
}
