"use client";

import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import styles from "./page.module.css";

interface Task {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  link: string | null;
  taskType: "ONE_TIME" | "RECURRING";
  isActive: boolean;
}

interface Raid {
  id: string;
  title: string;
  platform: string;
  url: string;
  reward: number;
}

interface ContentCampaign {
  id: string;
  brand: string;
  name: string;
  description: string | null;
  platforms: string[];
  beliefPointsPer1k: number;
  usdPer1k: number | null;
  icon: string | null;
  submissions: number;
}

interface ContentSubmission {
  id: string;
  campaignId: string;
  brand: string;
  campaignName: string;
  url: string;
  platform: string;
  viewCount: number;
  beliefAwarded: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export default function EarnPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [raids, setRaids] = useState<Raid[]>([]);
  const [contentCampaigns, setContentCampaigns] = useState<ContentCampaign[]>([]);
  const [mySubmissions, setMySubmissions] = useState<ContentSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<"tasks" | "raids" | "content">("tasks");

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<ContentCampaign | null>(null);
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitPlatform, setSubmitPlatform] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, raidsRes, contentRes, submissionsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/raids"),
        fetch("/api/content-campaigns"),
        fetch("/api/user/content-submissions"),
      ]);

      const tasksData = await tasksRes.json();
      const raidsData = await raidsRes.json();
      const contentData = await contentRes.json();
      const submissionsData = await submissionsRes.json();

      if (tasksData.data) setTasks(tasksData.data);
      if (raidsData.data) setRaids(raidsData.data);
      if (contentData.data) setContentCampaigns(contentData.data);
      if (submissionsData.data) setMySubmissions(submissionsData.data);
    } catch (error) {
      console.error("Failed to fetch earn data:", error);
    }
  };

  const handleSubmitContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !submitUrl || !submitPlatform) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/user/content-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: selectedCampaign.id,
          url: submitUrl,
          platform: submitPlatform,
        }),
      });

      if (res.ok) {
        setShowSubmitModal(false);
        setSubmitUrl("");
        setSubmitPlatform("");
        setSelectedCampaign(null);
        fetchData(); // Refresh submissions
      }
    } catch (error) {
      console.error("Failed to submit content:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmitModal = (campaign: ContentCampaign) => {
    setSelectedCampaign(campaign);
    setSubmitPlatform(campaign.platforms[0] || "");
    setShowSubmitModal(true);
  };

  const oneTimeTasks = tasks.filter((t) => t.taskType === "ONE_TIME" && t.isActive);
  const recurringTasks = tasks.filter((t) => t.taskType === "RECURRING" && t.isActive);

  const pendingSubmissions = mySubmissions.filter((s) => s.status === "pending");
  const approvedSubmissions = mySubmissions.filter((s) => s.status === "approved");

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <h1>Earn Points</h1>
            <p>Complete tasks, raids, and content campaigns to earn Boost Points and Belief</p>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "tasks" ? styles.active : ""}`}
              onClick={() => setActiveTab("tasks")}
            >
              Protocol Tasks
              <span className={styles.tabCount}>{tasks.length}</span>
            </button>
            <button
              className={`${styles.tab} ${activeTab === "raids" ? styles.active : ""}`}
              onClick={() => setActiveTab("raids")}
            >
              Raids
              <span className={styles.tabCount}>{raids.length}</span>
            </button>
            <button
              className={`${styles.tab} ${activeTab === "content" ? styles.active : ""}`}
              onClick={() => setActiveTab("content")}
            >
              Content Lab
              <span className={styles.tabCount}>{contentCampaigns.length}</span>
            </button>
          </div>

          {/* Content */}
          {activeTab === "tasks" ? (
            <div className={styles.content}>
              {/* One-Time Tasks */}
              <section className={styles.section}>
                <h2>One-Time Missions</h2>
                <div className={styles.taskGrid}>
                  {oneTimeTasks.map((task) => (
                    <div key={task.id} className={styles.taskCard}>
                      <div className={styles.taskReward}>+{task.reward} BP</div>
                      <h3>{task.title}</h3>
                      <p>{task.description || "Complete this task to earn Boost Points"}</p>
                      <button
                        className={styles.taskBtn}
                        onClick={() => task.link && window.open(task.link, "_blank")}
                      >
                        Complete
                      </button>
                    </div>
                  ))}
                  {oneTimeTasks.length === 0 && (
                    <div className={styles.empty}>No one-time tasks available</div>
                  )}
                </div>
              </section>

              {/* Recurring Tasks */}
              <section className={styles.section}>
                <h2>Recurring Operations</h2>
                <div className={styles.taskGrid}>
                  {recurringTasks.map((task) => (
                    <div key={task.id} className={styles.taskCard}>
                      <div className={styles.taskReward}>+{task.reward} BP</div>
                      <h3>{task.title}</h3>
                      <p>{task.description || "Complete this task to earn Boost Points"}</p>
                      <button
                        className={styles.taskBtn}
                        onClick={() => task.link && window.open(task.link, "_blank")}
                      >
                        Complete
                      </button>
                    </div>
                  ))}
                  {recurringTasks.length === 0 && (
                    <div className={styles.empty}>No recurring tasks available</div>
                  )}
                </div>
              </section>
            </div>
          ) : activeTab === "raids" ? (
            <div className={styles.content}>
              <div className={styles.raidList}>
                {raids.map((raid) => (
                  <div key={raid.id} className={styles.raidCard}>
                    <div className={styles.raidInfo}>
                      <span className={styles.raidPlatform}>{raid.platform}</span>
                      <h3>{raid.title}</h3>
                    </div>
                    <div className={styles.raidAction}>
                      <span className={styles.raidReward}>+{raid.reward} BP</span>
                      <button
                        className={styles.raidBtn}
                        onClick={() => window.open(raid.url, "_blank")}
                      >
                        Raid
                      </button>
                    </div>
                  </div>
                ))}
                {raids.length === 0 && (
                  <div className={styles.empty}>No active raids</div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.content}>
              {/* My Submissions */}
              {mySubmissions.length > 0 && (
                <section className={styles.section}>
                  <h2>My Submissions</h2>
                  <div className={styles.submissionsList}>
                    {pendingSubmissions.map((sub) => (
                      <div key={sub.id} className={`${styles.submissionCard} ${styles.pending}`}>
                        <div className={styles.submissionInfo}>
                          <span className={styles.submissionBrand}>{sub.brand}</span>
                          <h4>{sub.campaignName}</h4>
                          <span className={styles.submissionPlatform}>{sub.platform}</span>
                        </div>
                        <div className={styles.submissionStatus}>
                          <span className={styles.statusBadge}>Pending Review</span>
                        </div>
                      </div>
                    ))}
                    {approvedSubmissions.map((sub) => (
                      <div key={sub.id} className={`${styles.submissionCard} ${styles.approved}`}>
                        <div className={styles.submissionInfo}>
                          <span className={styles.submissionBrand}>{sub.brand}</span>
                          <h4>{sub.campaignName}</h4>
                          <span className={styles.submissionPlatform}>{sub.platform}</span>
                        </div>
                        <div className={styles.submissionReward}>
                          <span className={styles.beliefAwarded}>+{sub.beliefAwarded} Belief</span>
                          <span className={styles.statusBadge}>Approved</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Available Campaigns */}
              <section className={styles.section}>
                <h2>Available Campaigns</h2>
                <div className={styles.campaignGrid}>
                  {contentCampaigns.map((campaign) => (
                    <div key={campaign.id} className={styles.contentCampaignCard}>
                      <div className={styles.campaignHeader}>
                        <span className={styles.campaignIcon}>{campaign.icon || "📝"}</span>
                        <div className={styles.campaignBrand}>
                          <span className={styles.brandName}>{campaign.brand}</span>
                          <h3>{campaign.name}</h3>
                        </div>
                      </div>
                      <p className={styles.campaignDescription}>
                        {campaign.description || `Submit ${campaign.platforms.join("/")} content to earn Belief Points`}
                      </p>
                      <div className={styles.campaignPlatforms}>
                        {campaign.platforms.map((platform) => (
                          <span key={platform} className={styles.platformTag}>{platform}</span>
                        ))}
                      </div>
                      <div className={styles.campaignReward}>
                        <div className={styles.rewardItem}>
                          <span className={styles.rewardValue}>{campaign.beliefPointsPer1k}</span>
                          <span className={styles.rewardLabel}>Belief / 1k views</span>
                        </div>
                        {campaign.usdPer1k && (
                          <div className={styles.rewardItem}>
                            <span className={styles.rewardValue}>${campaign.usdPer1k}</span>
                            <span className={styles.rewardLabel}>USD / 1k views</span>
                          </div>
                        )}
                      </div>
                      <button
                        className={styles.submitBtn}
                        onClick={() => openSubmitModal(campaign)}
                      >
                        Submit Content
                      </button>
                    </div>
                  ))}
                  {contentCampaigns.length === 0 && (
                    <div className={styles.empty}>No active content campaigns</div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Submit Content Modal */}
      {showSubmitModal && selectedCampaign && (
        <div className={styles.modalOverlay} onClick={() => setShowSubmitModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Submit Content</h3>
              <button className={styles.modalClose} onClick={() => setShowSubmitModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitContent} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Campaign</label>
                <div className={styles.formValue}>{selectedCampaign.name}</div>
              </div>
              <div className={styles.formGroup}>
                <label>Platform</label>
                <select
                  value={submitPlatform}
                  onChange={(e) => setSubmitPlatform(e.target.value)}
                  required
                  className={styles.select}
                >
                  {selectedCampaign.platforms.map((platform) => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Content URL</label>
                <input
                  type="url"
                  value={submitUrl}
                  onChange={(e) => setSubmitUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowSubmitModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
