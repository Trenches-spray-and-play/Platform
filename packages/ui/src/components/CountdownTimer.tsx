"use client";

import { useState, useEffect } from 'react';
import styles from '../styles/CountdownTimer.module.css';

interface CountdownTimerProps {
    targetDate: Date;
    label?: string;
    compact?: boolean;
}

export default function CountdownTimer({ targetDate, label, compact = false }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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

    const formatNumber = (num: number) => num.toString().padStart(2, '0');

    if (compact) {
        return (
            <div className={styles.compactContainer}>
                {label && <span className={styles.compactLabel}>{label}:</span>}
                <span className={styles.compactValue}>
                    {formatNumber(timeLeft.days)}d : {formatNumber(timeLeft.hours)}h : {formatNumber(timeLeft.minutes)}m
                </span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {label && <h3 className={styles.label}>{label}</h3>}
            <div className={styles.timerGrid}>
                <div className={styles.timeBox}>
                    <span className={styles.value}>{formatNumber(timeLeft.days)}</span>
                    <span className={styles.unit}>DAYS</span>
                </div>
                <div className={styles.divider}>:</div>
                <div className={styles.timeBox}>
                    <span className={styles.value}>{formatNumber(timeLeft.hours)}</span>
                    <span className={styles.unit}>HOURS</span>
                </div>
                <div className={styles.divider}>:</div>
                <div className={styles.timeBox}>
                    <span className={styles.value}>{formatNumber(timeLeft.minutes)}</span>
                    <span className={styles.unit}>MINS</span>
                </div>
                <div className={styles.divider}>:</div>
                <div className={styles.timeBox}>
                    <span className={styles.value}>{formatNumber(timeLeft.seconds)}</span>
                    <span className={styles.unit}>SECS</span>
                </div>
            </div>
        </div>
    );
}
