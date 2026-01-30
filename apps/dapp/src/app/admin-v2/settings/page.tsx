"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "../components/PageHeader";
import styles from "../campaigns/page.module.css";
import localStyles from "./page.module.css";

interface PlatformConfig {
  id: string;
  deploymentDate: string | null;
  telegramUrl: string;
  twitterUrl: string;
  twitterHandle: string;
  onboardingTweetText: string;
  platformName: string;
  referralDomain: string;
  docsUrl: string;
  waitlistStatusMessage: string;
  deploymentStatusMessage: string;
  beliefTiers: Array<{ minScore: number; multiplier: number }>;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    deploymentDate: "",
    telegramUrl: "",
    twitterUrl: "",
    twitterHandle: "",
    onboardingTweetText: "",
    platformName: "",
    referralDomain: "",
    docsUrl: "",
    waitlistStatusMessage: "",
    deploymentStatusMessage: "",
  });

  const [beliefTiers, setBeliefTiers] = useState([
    { minScore: 0, multiplier: 0.5 },
    { minScore: 100, multiplier: 0.75 },
    { minScore: 500, multiplier: 0.9 },
    { minScore: 1000, multiplier: 1.0 },
  ]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/config");
      const data = await res.json();
      // Handle { success: true, config: {} } format
      const config = data.config || data.data;
      if (config) {
        setConfig(config);
        setFormData({
          deploymentDate: config.deploymentDate ? config.deploymentDate.slice(0, 16) : "",
          telegramUrl: config.telegramUrl || "",
          twitterUrl: config.twitterUrl || "",
          twitterHandle: config.twitterHandle || "",
          onboardingTweetText: config.onboardingTweetText || "",
          platformName: config.platformName || "",
          referralDomain: config.referralDomain || "",
          docsUrl: config.docsUrl || "",
          waitlistStatusMessage: config.waitlistStatusMessage || "",
          deploymentStatusMessage: config.deploymentStatusMessage || "",
        });
        if (config.beliefTiers && Array.isArray(config.beliefTiers)) {
          setBeliefTiers(config.beliefTiers);
        }
      }
    } catch (err) {
      console.error("Failed to fetch config:", err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          beliefTiers,
          deploymentDate: formData.deploymentDate || null,
          updatedBy: "admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchConfig();
        alert("Settings saved successfully");
      } else {
        alert(data.error || "Failed to save settings");
      }
    } catch (err) {
      console.error("Failed to save config:", err);
      alert("Failed to save settings");
    }
    setSaving(false);
  };

  return (
    <AdminLayout pageTitle="Settings">
      <div className={styles.page}>
        <PageHeader
          title="Platform Settings"
          subtitle="Configure global platform settings"
          actions={[
            {
              label: saving ? "Saving..." : "Save Changes",
              variant: "primary",
              onClick: handleSave,
              loading: saving,
              icon: "✓",
            },
          ]}
        />

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            Loading configuration...
          </div>
        ) : (
          <div className={localStyles.settingsGrid}>
            {/* General Settings */}
            <div className={localStyles.settingsCard}>
              <h3 className={localStyles.cardTitle}>General Settings</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Platform Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.platformName}
                    onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                    placeholder="Trenches"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Referral Domain</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.referralDomain}
                    onChange={(e) => setFormData({ ...formData, referralDomain: e.target.value })}
                    placeholder="playtrenches.xyz"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Deployment Date</label>
                  <input
                    type="datetime-local"
                    className={styles.formInput}
                    value={formData.deploymentDate}
                    onChange={(e) => setFormData({ ...formData, deploymentDate: e.target.value })}
                  />
                  <span className={styles.formHint}>Countdown target for waitlist</span>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Documentation URL</label>
                  <input
                    type="url"
                    className={styles.formInput}
                    value={formData.docsUrl}
                    onChange={(e) => setFormData({ ...formData, docsUrl: e.target.value })}
                    placeholder="https://docs.playtrenches.xyz"
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className={localStyles.settingsCard}>
              <h3 className={localStyles.cardTitle}>Social Links</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Telegram URL</label>
                  <input
                    type="url"
                    className={styles.formInput}
                    value={formData.telegramUrl}
                    onChange={(e) => setFormData({ ...formData, telegramUrl: e.target.value })}
                    placeholder="https://t.me/trenchesprotocol"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Twitter URL</label>
                  <input
                    type="url"
                    className={styles.formInput}
                    value={formData.twitterUrl}
                    onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                    placeholder="https://x.com/traboraofficial"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Twitter Handle</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.twitterHandle}
                    onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                    placeholder="@traboraofficial"
                  />
                </div>
                <div className={styles.formGroupFull}>
                  <label className={styles.formLabel}>Onboarding Tweet Text</label>
                  <textarea
                    className={styles.formTextarea}
                    value={formData.onboardingTweetText}
                    onChange={(e) => setFormData({ ...formData, onboardingTweetText: e.target.value })}
                    placeholder="Default tweet for onboarding"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Status Messages */}
            <div className={localStyles.settingsCard}>
              <h3 className={localStyles.cardTitle}>Status Messages</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Waitlist Status</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.waitlistStatusMessage}
                    onChange={(e) => setFormData({ ...formData, waitlistStatusMessage: e.target.value })}
                    placeholder="WAITLIST PROTOCOL ACTIVE"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Deployment Status</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.deploymentStatusMessage}
                    onChange={(e) => setFormData({ ...formData, deploymentStatusMessage: e.target.value })}
                    placeholder="DEPLOYMENT WINDOW OPEN"
                  />
                </div>
              </div>
            </div>

            {/* Belief Tiers */}
            <div className={localStyles.settingsCard}>
              <h3 className={localStyles.cardTitle}>Belief Score Tiers</h3>
              <p className={localStyles.cardDescription}>
                Configure entry cap multipliers based on user belief score. Higher tiers unlock larger entry amounts.
              </p>
              <div className={localStyles.tiersList}>
                {beliefTiers
                  .sort((a, b) => a.minScore - b.minScore)
                  .map((tier, idx) => (
                    <div key={idx} className={localStyles.tierRow}>
                      <div className={localStyles.tierInputs}>
                        <div className={localStyles.tierInput}>
                          <label>Min Score</label>
                          <input
                            type="number"
                            value={tier.minScore}
                            onChange={(e) => {
                              const updated = [...beliefTiers];
                              updated[idx] = { ...tier, minScore: parseInt(e.target.value) || 0 };
                              setBeliefTiers(updated);
                            }}
                          />
                        </div>
                        <div className={localStyles.tierInput}>
                          <label>Multiplier</label>
                          <input
                            type="number"
                            step="0.05"
                            value={tier.multiplier}
                            onChange={(e) => {
                              const updated = [...beliefTiers];
                              updated[idx] = { ...tier, multiplier: parseFloat(e.target.value) || 0 };
                              setBeliefTiers(updated);
                            }}
                          />
                        </div>
                      </div>
                      <button
                        className={localStyles.tierRemove}
                        onClick={() => setBeliefTiers(beliefTiers.filter((_, i) => i !== idx))}
                        disabled={beliefTiers.length <= 1}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                <button
                  className={localStyles.addTierBtn}
                  onClick={() => {
                    const maxScore = Math.max(...beliefTiers.map((t) => t.minScore));
                    setBeliefTiers([...beliefTiers, { minScore: maxScore + 500, multiplier: 1.0 }]);
                  }}
                >
                  + Add Tier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
