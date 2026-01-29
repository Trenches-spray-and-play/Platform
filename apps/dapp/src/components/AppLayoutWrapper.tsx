"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@trenches/ui";
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
    const isStandalonePage = pathname === '/join' || pathname === '/branding-preview' || pathname === '/layout-exploration' || pathname === '/newbie-dashboard' || pathname === '/comprehensive-lab' || pathname?.startsWith('/sample-light') || pathname?.startsWith('/sample-v2');
    const isAdminPage = pathname?.startsWith('/admin');

    if (isLoginPage || isWelcomePage || isStandalonePage || isAdminPage) {
        return (
            <ThemeProvider>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
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
        </ThemeProvider>
    );
}

