"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/components/AuthProvider";
import styles from "./AppLayoutWrapper.module.css";

export default function AppLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Only hide navigation on login/welcome/standalone pages
    const isLoginPage = pathname === '/login';
    const isWelcomePage = pathname === '/welcome';
    const isStandalonePage = pathname === '/join' || pathname === '/branding-preview';
    const isAdminPage = pathname?.startsWith('/admin');

    if (isLoginPage || isWelcomePage || isStandalonePage || isAdminPage) {
        return (
            <AuthProvider>
                {children}
            </AuthProvider>
        );
    }

    return (
        <AuthProvider>
            <div className={styles.layout}>
                <div className={styles.sidebarWrapper}>
                    <Sidebar />
                </div>

                <div className={styles.mainWrapper}>
                    <main className={styles.content}>
                        {children}
                    </main>

                    <div className={styles.bottomNavWrapper}>
                        <BottomNav />
                    </div>
                </div>
            </div>
        </AuthProvider>
    );
}

