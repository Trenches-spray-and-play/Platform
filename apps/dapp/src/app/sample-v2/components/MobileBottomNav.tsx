"use client";

import { usePathname, useRouter } from "next/navigation";
import styles from "./MobileBottomNav.module.css";

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: "/sample-v2", label: "Campaigns", icon: "◆" },
  { path: "/sample-v2/dashboard-v2", label: "Dashboard", icon: "□" },
  { path: "/sample-v2/earn-v2", label: "Earn", icon: "▲" },
  { path: "/sample-v2/deposit", label: "Deposit", icon: "↓" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === "/sample-v2") {
      return pathname === path || pathname === "/sample-v2/";
    }
    return pathname?.startsWith(path);
  };

  return (
    <nav className={styles.container} role="navigation" aria-label="Mobile navigation">
      {navItems.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`${styles.item} ${active ? styles.active : ""}`}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
          >
            <span className={styles.icon} aria-hidden="true">{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
            {active && <span className={styles.indicator} aria-hidden="true" />}
          </button>
        );
      })}
    </nav>
  );
}
