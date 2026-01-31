import { cookies } from 'next/headers';

import DashboardClient from "./DashboardClient";
import Link from "next/link";
export const dynamic = "force-dynamic";
import styles from "./page.module.css";
import { ComplianceDisclaimer } from "@trenches/ui";

import { getSession } from "@/lib/auth";
import { getUserProfile, getUserPositions } from "@/services/userService";

async function getDashboardData() {
  console.log('[DEBUG] getDashboardData: starting...');
  const session = await getSession();
  console.log('[DEBUG] getDashboardData: session:', session?.id);
  
  if (!session) {
    console.log('[DEBUG] getDashboardData: no session, returning empty');
    return { user: null, positions: [] };
  }

  try {
    console.log('[DEBUG] getDashboardData: fetching user and positions for', session.id);
    const [user, positions] = await Promise.all([
      getUserProfile(session.id),
      getUserPositions(session.id)
    ]);
    
    console.log('[DEBUG] getDashboardData: user:', user?.handle);
    console.log('[DEBUG] getDashboardData: positions count:', positions?.length);

    return {
      user,
      positions: positions || []
    };
  } catch (error) {
    console.error("[DEBUG] getDashboardData: Failed to fetch dashboard data:", error);
    return { user: null, positions: [] };
  }
}

// Unauthenticated State
function UnauthenticatedDashboard() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.unauthHero}>
          <h1 className={styles.unauthTitle}>Your Dashboard Awaits</h1>
          <p className={styles.unauthSubtitle}>Connect your account to track your positions.</p>
          <Link href="/login" className={styles.unauthCta}>Connect Account</Link>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const { user, positions } = await getDashboardData();

  if (!user) {
    return (
      <>
        <UnauthenticatedDashboard />
        <ComplianceDisclaimer variant="footer" />
      </>
    );
  }

  return (
    <>
      <DashboardClient initialUser={user} initialPositions={positions} />
      <ComplianceDisclaimer variant="footer" />
    </>
  );
}
