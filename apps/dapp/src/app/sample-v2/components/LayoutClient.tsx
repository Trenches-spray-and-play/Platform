"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Layout.module.css";
import { MobileBottomNav } from "./MobileBottomNav";
import { useUser } from "@/hooks/useQueries";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";

interface User {
    id: string;
    handle: string;
    beliefScore: number;
    balance: string;
}

interface LayoutClientProps {
    children: React.ReactNode;
    initialUser: User | null;
}

const navItems = [
    { path: "/sample-v2", label: "Campaigns", icon: "◆" },
    { path: "/sample-v2/dashboard-v2", label: "Dashboard", icon: "□" },
    { path: "/sample-v2/portfolio", label: "Portfolio", icon: "◈" },
    { path: "/sample-v2/earn-v2", label: "Earn", icon: "▲" },
];

export default function LayoutClient({ children, initialUser }: LayoutClientProps) {
    const pathname = usePathname();
    // Use initialData to prevent duplicate fetch when SSR provides data
    const { data: user } = useUser(initialUser);
    const setUser = useAuthStore((state) => state.setUser);

    // UI Store states
    const activeModal = useUIStore((state) => state.activeModal);
    const closeModal = useUIStore((state) => state.closeModal);

    // Local state for layout-specific UI is still fine, 
    // but we can move mobile menu to store if we want it global
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        if (user) {
            setUser(user as any);
        }
    }, [user, setUser]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isActive = (path: string) => pathname === path;

    return (
        <div className={styles.layout}>
            <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
                <div className={styles.headerContent}>
                    <Link href="/sample-v2" className={styles.logo}>
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 100 100"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={styles.logoSvg}
                        >
                            <rect x="20" y="20" width="60" height="8" rx="2" fill="currentColor" />
                            <rect x="35" y="36" width="30" height="6" rx="2" fill="currentColor" opacity="0.6" />
                            <rect x="44" y="48" width="12" height="32" rx="2" fill="currentColor" opacity="0.4" />
                        </svg>
                        <span className={styles.logoText}>TRENCHES</span>
                    </Link>

                    <nav className={styles.desktopNav}>
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`${styles.navLink} ${isActive(item.path) ? styles.active : ""}`}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className={styles.userSection}>
                        {user ? (
                            <>
                                <Link href="/sample-v2/deposit" className={styles.depositBtn}>
                                    + Deposit
                                </Link>
                                <Link href="/sample-v2/dashboard-v2" className={styles.balanceChip}>
                                    <span className={styles.balanceLabel}>BALANCE</span>
                                    <span className={styles.balanceValue}>${parseFloat(user.balance || "0").toFixed(2)}</span>
                                </Link>
                            </>
                        ) : (
                            <Link href="/login" className={styles.connectBtn}>Connect</Link>
                        )}
                    </div>

                    <button
                        className={styles.menuBtn}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span className={`${styles.menuLine} ${mobileMenuOpen ? styles.open : ""}`} />
                        <span className={`${styles.menuLine} ${mobileMenuOpen ? styles.open : ""}`} />
                        <span className={`${styles.menuLine} ${mobileMenuOpen ? styles.open : ""}`} />
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className={styles.mobileMenu}>
                        <nav className={styles.mobileNav}>
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`${styles.mobileNavLink} ${isActive(item.path) ? styles.active : ""}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className={styles.navIcon}>{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                )}
            </header>

            <main className={styles.main}>{children}</main>

            <MobileBottomNav />

            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerLeft}>
                        <div className={styles.footerLogo}>
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 100 100"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className={styles.footerLogoSvg}
                            >
                                <rect x="20" y="20" width="60" height="8" rx="2" fill="currentColor" />
                                <rect x="35" y="36" width="30" height="6" rx="2" fill="currentColor" opacity="0.6" />
                                <rect x="44" y="48" width="12" height="32" rx="2" fill="currentColor" opacity="0.4" />
                            </svg>
                            <span>TRENCHES</span>
                        </div>
                        <span className={styles.footerTag}>Powered by Belief</span>
                    </div>
                    <div className={styles.footerLinks}>
                        <a href="https://docs.playtrenches.xyz" target="_blank" rel="noopener noreferrer">Docs</a>
                        <a href="https://x.com/traboraofficial" target="_blank" rel="noopener noreferrer">Twitter</a>
                        <a href="https://t.me/trenchesprotocol" target="_blank" rel="noopener noreferrer">Telegram</a>
                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <span>v2.0.0-BETA</span>
                    <span className={styles.statusIndicator}>
                        <span className={styles.statusDot} />
                        System Operational
                    </span>
                </div>
            </footer>
        </div>
    );
}
