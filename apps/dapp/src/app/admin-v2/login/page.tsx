"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/verify");
        const data = await res.json();
        if (data.authenticated) {
          // Already authenticated, redirect to dashboard
          router.push("/admin-v2");
        }
      } catch (err) {
        // Not authenticated, stay on login page
      }
    };
    checkAuth();
  }, [router]);

  const handleLogin = () => {
    // Redirect to the existing admin login flow
    window.location.href = "/admin/login";
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="20" y="20" width="60" height="8" rx="2" fill="currentColor" />
            <rect x="35" y="36" width="30" height="6" rx="2" fill="currentColor" opacity="0.6" />
            <rect x="44" y="48" width="12" height="32" rx="2" fill="currentColor" opacity="0.4" />
          </svg>
        </div>

        <h1 className={styles.title}>Admin Access</h1>
        <p className={styles.subtitle}>
          Secure administrative portal for the Trenches platform
        </p>

        <button className={styles.loginBtn} onClick={handleLogin}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
              fill="currentColor"
            />
          </svg>
          Authenticate with Google
        </button>

        <div className={styles.footer}>
          <a href="/sample-v2" className={styles.backLink}>
            ← Back to App
          </a>
          <span className={styles.version}>v2.0.0</span>
        </div>
      </div>
    </div>
  );
}
