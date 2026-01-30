"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "./components/AdminLayout";
import StatCard from "./components/StatCard";
import PageHeader from "./components/PageHeader";
import styles from "./page.module.css";

interface DashboardStats {
  totalUsers: number;
  totalCampaigns: number;
  totalDeposits: number;
  totalPayouts: number;
  activeCampaigns: number;
  pendingPayouts: number;
  recentUsers: number;
  activeRaids: number;
}

interface RecentActivity {
  id: string;
  type: "user" | "deposit" | "campaign" | "payout";
  title: string;
  description: string;
  time: string;
}

const quickLinks = [
  {
    href: "/admin-v2/campaigns",
    icon: "◆",
    title: "Campaigns",
    description: "Manage spray campaigns",
  },
  {
    href: "/admin-v2/users",
    icon: "👥",
    title: "Users",
    description: "View user accounts",
  },
  {
    href: "/admin-v2/deposits",
    icon: "💰",
    title: "Deposits",
    description: "Track fund deposits",
  },
  {
    href: "/admin-v2/payouts",
    icon: "💸",
    title: "Payouts",
    description: "Process withdrawals",
  },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch multiple stats in parallel
      const [usersRes, campaignsRes, depositsRes, payoutsRes] = await Promise.all([
        fetch("/api/admin/users?limit=1"),
        fetch("/api/admin/campaigns"),
        fetch("/api/admin/balance"),
        fetch("/api/payouts?stats=true"),
      ]);

      const usersData = await usersRes.json();
      const campaignsData = await campaignsRes.json();
      const depositsData = await depositsRes.json();
      const payoutsData = await payoutsRes.json();

      const campaigns = campaignsData.data || [];
      const activeCampaigns = campaigns.filter((c: { isActive: boolean }) => c.isActive).length;

      setStats({
        totalUsers: usersData.meta?.total || 0,
        totalCampaigns: campaigns.length,
        totalDeposits: depositsData.data?.totals?.totalDepositsUsd || 0,
        totalPayouts: payoutsData.data?.totalPaidUsd || 0,
        activeCampaigns,
        pendingPayouts: payoutsData.data?.pending || 0,
        recentUsers: 0, // Would need additional API
        activeRaids: 0, // Would need additional API
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout pageTitle="Dashboard">
      <div className={styles.dashboard}>
        <PageHeader
          title="Dashboard Overview"
          subtitle="Welcome back to the Trenches admin panel"
        />

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <StatCard
            label="Total Users"
            value={stats?.totalUsers.toLocaleString() || "-"}
            icon="👥"
            variant="accent"
            subValue="Platform users"
          />
          <StatCard
            label="Active Campaigns"
            value={stats?.activeCampaigns.toLocaleString() || "-"}
            icon="◆"
            variant="info"
            subValue={`of ${stats?.totalCampaigns || 0} total`}
          />
          <StatCard
            label="Total Deposits"
            value={stats ? `$${stats.totalDeposits.toLocaleString()}` : "-"}
            icon="💰"
            variant="warning"
            subValue="USD value"
          />
          <StatCard
            label="Pending Payouts"
            value={stats?.pendingPayouts.toLocaleString() || "-"}
            icon="💸"
            variant={stats && stats.pendingPayouts > 0 ? "danger" : "default"}
            subValue="Require action"
          />
        </div>

        {/* Quick Links */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.quickLinks}>
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.quickLink}>
                <div className={styles.quickLinkIcon}>{link.icon}</div>
                <div className={styles.quickLinkContent}>
                  <div className={styles.quickLinkTitle}>{link.title}</div>
                  <div className={styles.quickLinkDesc}>{link.description}</div>
                </div>
                <div className={styles.quickLinkArrow}>→</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className={styles.twoColumn}>
          {/* System Status */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>System Status</h2>
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon}>✓</div>
                <div className={styles.activityContent}>
                  <div className={styles.activityTitle}>Platform Operational</div>
                  <div className={styles.activityMeta}>All systems running normally</div>
                </div>
                <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                  Active
                </span>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon}>🔄</div>
                <div className={styles.activityContent}>
                  <div className={styles.activityTitle}>Payout Processor</div>
                  <div className={styles.activityMeta}>Processing queue: {stats?.pendingPayouts || 0} pending</div>
                </div>
                <span
                  className={`${styles.statusBadge} ${
                    stats && stats.pendingPayouts > 0
                      ? styles.statusPending
                      : styles.statusActive
                  }`}
                >
                  {stats && stats.pendingPayouts > 0 ? "Processing" : "Active"}
                </span>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon}>🔗</div>
                <div className={styles.activityContent}>
                  <div className={styles.activityTitle}>Blockchain Connections</div>
                  <div className={styles.activityMeta}>HyperEVM, Ethereum, Base, Solana</div>
                </div>
                <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                  Connected
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Quick Stats</h2>
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <div className={styles.activityContent}>
                  <div className={styles.activityTitle}>Total Payouts Processed</div>
                  <div className={styles.activityMeta}>
                    ${stats?.totalPayouts.toLocaleString() || "0"} USD
                  </div>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityContent}>
                  <div className={styles.activityTitle}>Campaign Types</div>
                  <div className={styles.activityMeta}>Rapid, Mid, Deep trenches</div>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityContent}>
                  <div className={styles.activityTitle}>Content Platforms</div>
                  <div className={styles.activityMeta}>X, TikTok, Instagram, YouTube</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
