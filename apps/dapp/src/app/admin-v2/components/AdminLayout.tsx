"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminLayout.module.css";

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
  section?: string;
}

const navItems: NavItem[] = [
  { path: "/admin-v2", label: "Dashboard", icon: "□", section: "Overview" },
  { path: "/admin-v2/campaigns", label: "Campaigns", icon: "◆", section: "Management" },
  { path: "/admin-v2/tasks", label: "Tasks", icon: "▲", section: "Management" },
  { path: "/admin-v2/raids", label: "Raids", icon: "⚡", section: "Management" },
  { path: "/admin-v2/content", label: "Content", icon: "◈", section: "Management" },
  { path: "/admin-v2/submissions", label: "Submissions", icon: "📝", section: "Management" },
  { path: "/admin-v2/users", label: "Users", icon: "👥", section: "Data" },
  { path: "/admin-v2/deposits", label: "Deposits", icon: "💰", section: "Data" },
  { path: "/admin-v2/trenches", label: "Trenches", icon: "🎯", section: "Data" },
  { path: "/admin-v2/payouts", label: "Payouts", icon: "💸", section: "Operations" },
  { path: "/admin-v2/settings", label: "Settings", icon: "⚙️", section: "System" },
];

const sectionOrder = ["Overview", "Management", "Data", "Operations", "System"];

export default function AdminLayout({ children, pageTitle }: AdminLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ handle: string } | null>(null);

  useEffect(() => {
    // Verify admin auth
    const verifyAdmin = async () => {
      try {
        const res = await fetch('/api/admin/verify');
        if (!res.ok) {
          window.location.href = '/admin-v2/login';
          return;
        }
        // Get user info for display
        const userRes = await fetch('/api/user');
        const userData = await userRes.json();
        if (userData.data) {
          setAdminUser(userData.data);
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
      }
    };
    verifyAdmin();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === "/admin-v2") {
      return pathname === "/admin-v2" || pathname === "/admin-v2/";
    }
    return pathname.startsWith(path);
  };

  // Group nav items by section
  const groupedNav = sectionOrder.map((section) => ({
    section,
    items: navItems.filter((item) => item.section === section),
  }));

  return (
    <div className={styles.layout}>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className={styles.overlay} onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/admin-v2" className={styles.logo}>
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
            <span className={styles.adminBadge}>Admin</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          {groupedNav.map(
            ({ section, items }) =>
              items.length > 0 && (
                <div key={section} className={styles.navSection}>
                  <div className={styles.navSectionTitle}>{section}</div>
                  {items.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`${styles.navItem} ${
                        isActive(item.path) ? styles.navItemActive : ""
                      }`}
                    >
                      <span className={styles.navIcon}>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/sample-v2" className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 12L10 8L6 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Exit to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.topHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 4H14M2 8H14M2 12H14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <h1 className={styles.pageTitle}>{pageTitle}</h1>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                {adminUser?.handle?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>
                  {adminUser?.handle || "Admin"}
                </span>
                <span className={styles.userRole}>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
