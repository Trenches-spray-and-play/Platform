"use client";

import styles from "./StatCard.module.css";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  subValue?: string;
  variant?: "default" | "accent" | "warning" | "danger" | "info";
  size?: "compact" | "default" | "large";
  trend?: {
    direction: "up" | "down";
    value: string;
  };
}

export default function StatCard({
  label,
  value,
  icon,
  subValue,
  variant = "default",
  size = "default",
  trend,
}: StatCardProps) {
  return (
    <div className={`${styles.card} ${styles[variant]} ${styles[size]}`}>
      <div className={styles.iconWrapper}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.content}>
        <div className={styles.label}>{label}</div>
        <div className={styles.value}>{value}</div>
        {subValue && <div className={styles.subValue}>{subValue}</div>}
        {trend && (
          <div
            className={`${styles.trend} ${
              trend.direction === "up" ? styles.trendUp : styles.trendDown
            }`}
          >
            {trend.direction === "up" ? "↑" : "↓"} {trend.value}
          </div>
        )}
      </div>
    </div>
  );
}
