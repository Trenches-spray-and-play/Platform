import { Metadata } from "next";
import SprayForm from "./components/SprayForm";
import ErrorBoundary from "../components/ErrorBoundary";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Spray Liquidity | Trenches v2",
  description: "Deploy funds across Rapid, Mid, and Deep trenches.",
};

import { getTrenchGroups } from "@/services/trenchService";
import { getUserProfile } from "@/services/userService";
import { getSession } from "@/lib/auth";

async function getCampaigns() {
  try {
    const data = await getTrenchGroups();

    // Flatten trench groups into a single campaign list
    return data.flatMap((group: any) =>
      group.campaigns.map((c: any) => ({
        ...c,
        level: group.level,
        entryRange: group.entryRange
      }))
    );
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    return [];
  }
}

async function getUser() {
  try {
    const session = await getSession();
    if (!session) return null;
    return await getUserProfile(session.id);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
}

export default async function SprayPage() {
  const [campaigns, user] = await Promise.all([
    getCampaigns(),
    getUser()
  ]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Page Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <span className={styles.category}>Deploy Liquidity</span>
            <h1 className={styles.title}>Spray Portal</h1>
            <p className={styles.subtitle}>
              Select a campaign trench and deploy funds to start earning.
            </p>
          </div>
        </div>

        <ErrorBoundary>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.statusDot} />
              <h3>PROTOCOL_EXECUTION_FLOW</h3>
            </div>
            <div className={styles.cardContent}>
              <SprayForm campaigns={campaigns} user={user} />
            </div>
          </div>
        </ErrorBoundary>

        {/* Guidelines */}
        <div className={styles.guidelines}>
          <div className={styles.guideItem}>
            <span className={styles.guideIcon}>▲</span>
            <div className={styles.guideText}>
              <h4>Choose Intensity</h4>
              <p>Rapid (1d), Mid (7d), or Deep (30d) trenches based on your ROI goals.</p>
            </div>
          </div>
          <div className={styles.guideItem}>
            <span className={styles.guideIcon}>⚡</span>
            <div className={styles.guideText}>
              <h4>Boost Strategy</h4>
              <p>Complete tasks after spraying to reduce your lock-in period.</p>
            </div>
          </div>
          <div className={styles.guideItem}>
            <span className={styles.guideIcon}>◈</span>
            <div className={styles.guideText}>
              <h4>Auto-Boost</h4>
              <p>Enable auto-boost on the dashboard to compound your returns.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
