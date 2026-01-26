"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BottomNav.module.css";

export default function BottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    if (pathname?.startsWith('/welcome')) return null;
    if (pathname?.startsWith('/admin')) return null;

    return (
        <nav className={styles.nav}>
            <Link href="/" className={`${styles.item} ${isActive('/') ? styles.active : ''}`}>
                <span className={styles.icon}>○</span>
                <span className={styles.label}>TRENCHES</span>
            </Link>

            <Link href="/dashboard" className={`${styles.item} ${isActive('/dashboard') ? styles.active : ''}`}>
                <span className={styles.icon}>□</span>
                <span className={styles.label}>DASHBOARD</span>
            </Link>

            <Link href="/profile" className={`${styles.item} ${isActive('/profile') ? styles.active : ''}`}>
                <span className={styles.icon}>△</span>
                <span className={styles.label}>PROFILE</span>
            </Link>
        </nav>
    );
}

