"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";
import Logo from "@/components/Logo";

interface PlatformConfig {
    twitterUrl: string;
    telegramUrl: string;
    platformName: string;
}

export default function Sidebar() {
    const pathname = usePathname();
    const [config, setConfig] = useState<PlatformConfig | null>(null);

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error('Failed to fetch config:', err));
    }, []);

    const isActive = (path: string) => pathname === path;

    // Hide sidebar on welcome/login/admin pages if needed, 
    // but layout wrapper handles the high-level toggle.

    return (
        <aside className={styles.sidebar}>
            <div className={styles.top}>
                <div className={styles.logoContainer}>
                    <Link href="/">
                        <Logo variant="horizontal" width={180} platformName={config?.platformName} />
                    </Link>
                </div>

                <nav className={styles.nav}>

                    <Link
                        href="/dashboard"
                        className={`${styles.navItem} ${isActive('/dashboard') ? styles.active : ''}`}
                    >
                        <span className={styles.icon}>□</span>
                        <span className={styles.label}>DASHBOARD</span>
                    </Link>

                    <Link
                        href="/profile"
                        className={`${styles.navItem} ${isActive('/profile') ? styles.active : ''}`}
                    >
                        <span className={styles.icon}>△</span>
                        <span className={styles.label}>PROFILE</span>
                    </Link>

                </nav>
            </div>

            <div className={styles.bottom}>
                <div className={styles.socialLinks}>
                    <a
                        href={config?.twitterUrl || "#"}
                        className={styles.socialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        𝕏
                    </a>
                    <a
                        href={config?.telegramUrl || "#"}
                        className={styles.socialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        TG
                    </a>
                </div>
                <div className={styles.version}>
                    v1.0.4-BETA
                </div>
            </div>
        </aside>
    );
}
