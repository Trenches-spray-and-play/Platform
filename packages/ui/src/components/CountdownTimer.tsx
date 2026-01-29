"use client";

import React, { useState, useEffect } from "react";
import styles from "../styles/CountdownTimer.module.css";

interface CountdownTimerProps {
    targetDate: Date | null;
    simple?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, simple = false }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

    useEffect(() => {
        if (!targetDate) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;

            if (distance < 0) {
                clearInterval(timer);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) return null;

    if (simple) {
        return (
            <div className={styles.simpleTimer}>
                {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </div>
        );
    }

    return (
        <div className={styles.v6Timer} aria-label="Launch Countdown">
            <div className={styles.v6TimerUnits}>
                {Object.entries(timeLeft).map(([unit, val]) => (
                    <div key={unit} className={styles.v6TimerUnit}>
                        <span className={styles.v6TimerVal}>{val.toString().padStart(2, '0')}</span>
                    </div>
                ))}
            </div>
            <div className={styles.v6TimerGlobalLabel}>(24h Cycle)</div>
        </div>
    );
};

export default CountdownTimer;
