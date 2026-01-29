"use client";

import React from "react";
import { motion } from "framer-motion";
import styles from "../styles/RadialProgress.module.css";

interface RadialProgressProps {
    percentage: number;
    label: string;
    size?: number;
}

export const RadialProgress: React.FC<RadialProgressProps> = ({ percentage, label, size = 100 }) => {
    const strokeDasharray = 2 * Math.PI * 45;
    const strokeDashoffset = strokeDasharray * ((100 - percentage) / 100);

    return (
        <div className={styles.radialWrapper} style={{ width: size, height: size }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" className={styles.radialSvg}>
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                />
                <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="var(--accent-zenith)"
                    strokeWidth="8"
                    strokeDasharray={strokeDasharray}
                    initial={{ strokeDashoffset: strokeDasharray }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 2, ease: "easeOut" }}
                />
            </svg>
            <div className={styles.radialContent}>
                <span className={styles.radialPercentage}>{percentage}%</span>
            </div>
            <span className={styles.radialLabel}>{label}</span>
        </div>
    );
};

export default RadialProgress;
