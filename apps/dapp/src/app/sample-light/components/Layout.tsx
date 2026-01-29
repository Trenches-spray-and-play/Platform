"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Layout.module.css";

interface User {
  id: string;
  handle: string;
  beliefScore: number;
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setUser(data.data);
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { path: "/sample-light", label: "Campaigns", icon: "🎯" },
    { path: "/sample-light/dashboard", label: "My Dashboard", icon: "📊" },
    { path: "/sample-light/earn", label: "Earn Points", icon: "⭐" },
  ];

  return (
    <div className={styles.layout}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.container}>
          <Link href="/sample-light" className={styles.logo}>
            <span className={styles.logoIcon}>🌱</span>
            <span className={styles.logoText}>Trenches</span>
          </Link>

          <nav className={styles.desktopNav}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.navLink} ${pathname === item.path ? styles.active : ""}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.userSection}>
            {user ? (
              <Link href="/sample-light/dashboard" className={styles.userBadge}>
                <div className={styles.userAvatar}>{user.handle.charAt(0).toUpperCase()}</div>
                <span className={styles.userName}>{user.handle}</span>
              </Link>
            ) : (
              <Link href="/login" className={styles.connectBtn}>
                Connect Wallet
              </Link>
            )}
          </div>

          <button
            className={styles.menuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.mobileNavLink} ${pathname === item.path ? styles.active : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={styles.main}>{children}</main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div>
              <span className={styles.footerLogo}>🌱 Trenches</span>
              <p className={styles.footerTagline}>The friendly way to grow your crypto</p>
            </div>
            <div className={styles.footerLinks}>
              <a href="https://docs.playtrenches.xyz" target="_blank" rel="noopener noreferrer">Docs</a>
              <a href="https://t.me/trenchesprotocol" target="_blank" rel="noopener noreferrer">Support</a>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2025 Trenches Protocol</span>
            <span className={styles.statusBadge}>✓ System Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
