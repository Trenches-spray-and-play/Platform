import { cookies } from 'next/headers';
import Layout from "../components/Layout";
import DashboardClient from "./DashboardClient";
import Link from "next/link";
import styles from "./page.module.css";
import { ComplianceDisclaimer } from "@trenches/ui";

async function getDashboardData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token'); // Assuming Supabase or similar

  // Mocking internal API call for SSR
  // In a real app, you'd call a service directly or use fetch with headers
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const [positionsRes, profileRes] = await Promise.all([
      fetch(`${baseUrl}/api/user/positions`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/user`, { cache: 'no-store' }),
    ]);

    const positionsData = await positionsRes.json();
    const profileData = await profileRes.json();

    return {
      user: profileData.data || null,
      positions: positionsData.data || []
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
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
      <Layout>
        <UnauthenticatedDashboard />
        <ComplianceDisclaimer variant="footer" />
      </Layout>
    );
  }

  return (
    <Layout>
      <DashboardClient initialUser={user} initialPositions={positions} />
      <ComplianceDisclaimer variant="footer" />
    </Layout>
  );
}
