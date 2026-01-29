"use client";

import React from "react";
import styles from "../styles/Logo.module.css";

interface LogoProps {
    variant?: "icon" | "horizontal";
    width?: number | string;
    color?: string;
    className?: string;
    platformName?: string;
}

const Icon: React.FC<{ iconWidth: string | number; color: string }> = ({ iconWidth, color }) => (
    <svg
        width={iconWidth}
        viewBox="0 0 100 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
    >
        <rect x="25" y="10" width="50" height="4" fill={color} />
        <rect x="35" y="20" width="30" height="4" fill={color} opacity="0.6" />
        <rect x="42" y="30" width="16" height="20" fill={color} opacity="0.3" />
    </svg>
);

export const Logo: React.FC<LogoProps> = ({
    variant = "horizontal",
    width,
    color = "currentColor",
    className = "",
    platformName
}) => {
    const iconWidth = variant === "icon" ? (width || "2em") : (width || "1.8em");

    if (variant === "icon") {
        return <Icon iconWidth={iconWidth} color={color} />;
    }

    return (
        <div className={`${styles.container} ${className}`}>
            <Icon iconWidth={iconWidth} color={color} />
            <span
                className={styles.logoText}
                style={{ color: color === "currentColor" ? "var(--text-primary)" : color }}
            >
                {platformName || "TRENCHES"}
            </span>
        </div>
    );
};

export default Logo;
