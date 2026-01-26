"use client";

import { useEffect, useState } from 'react';
import styles from '../styles/Countdown.module.css';

interface CountdownProps {
    initialMinutes: number;
}

export default function Countdown({ initialMinutes }: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <span className={styles.timer}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
    );
}
