"use client";

import { useState, useEffect } from 'react';
import styles from './CountdownTimer.module.css';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownTimerProps {
    targetDate: Date;
    label?: string;
    compact?: boolean;
    simple?: boolean;
}

export default function CountdownTimer({ targetDate, label, compact = false, simple = false }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = targetDate.getTime() - new Date().getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();

        return () => clearInterval(timer);
    }, [targetDate]);

    // Don't render until client-side time is calculated to avoid hydration mismatch
    if (!timeLeft) return null;

    const formatNumber = (num: number) => num.toString().padStart(2, '0');

    const segments = [
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hours' },
        { value: timeLeft.minutes, label: 'Mins' },
        { value: timeLeft.seconds, label: 'Secs' },
    ];

    if (simple) {
        return (
            <div className={`${styles.container} ${styles.simple}`}>
                <span className={styles.simpleValue}>
                    {formatNumber(timeLeft.days)} : {formatNumber(timeLeft.hours)} : {formatNumber(timeLeft.minutes)} : {formatNumber(timeLeft.seconds)}
                </span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {segments.map((seg, i) => (
                <div key={seg.label} className={styles.timeBox}>
                    <AnimatePresence mode="popLayout">
                        <motion.span
                            key={seg.value}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={styles.value}
                        >
                            {formatNumber(seg.value)}
                        </motion.span>
                    </AnimatePresence>
                    <span className={styles.unit}>{seg.label}</span>
                </div>
            ))}
        </div>
    );
}
