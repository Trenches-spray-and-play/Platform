"use client";

import { useState } from "react";
export const dynamic = "force-dynamic";
import {
  useTasks,
  useRaids,
  useContentCampaigns,
  useSubmissions,
  useSubmitContent,
  useCompleteTask,
  useCompleteRaid,
  useUserTasks,
  useUserRaids
} from "@/hooks/useQueries";
import { ComplianceDisclaimer } from "@trenches/ui";
import styles from "./page.module.css";
import { useUIStore } from "@/store/uiStore";

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
  const { data: tasks = [] } = useTasks();
  const { data: raids = [] } = useRaids();
  const { data: contentCampaigns = [] } = useContentCampaigns();
  const { data: mySubmissions = [] } = useSubmissions();
  const { data: userTasks = [] } = useUserTasks();
  const { data: userRaids = [] } = useUserRaids();
  const completeTask = useCompleteTask();
  const completeRaid = useCompleteRaid();

  const openModal = useUIStore((state) => state.openModal);

  const [activeTab, setActiveTab] = useState<"tasks" | "raids" | "content">("tasks");
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [pendingRaidId, setPendingRaidId] = useState<string | null>(null);

  const isTaskCompleted = (taskId: string) => userTasks.some((ut: any) => ut.taskId === taskId);
  const isRaidCompleted = (raidId: string) => userRaids.some((ur: any) => ur.raidId === raidId);

  const handleTaskStart = (task: Task) => {
    if (task.link) {
      window.open(task.link, "_blank");
    }
    setPendingTaskId(task.id);
  };

  const handleTaskComplete = (taskId: string) => {
    completeTask.mutate({ taskId }, {
      onSuccess: () => setPendingTaskId(null)
    });
  };

  const handleRaidStart = (raid: Raid) => {
    if (raid.url) {
      window.open(raid.url, "_blank");
    }
    setPendingRaidId(raid.id);
  };

  const handleRaidComplete = (raidId: string) => {
    completeRaid.mutate(raidId, {
      onSuccess: () => setPendingRaidId(null)
    });
  };

  const openSubmitModal = (campaign: any) => {
    openModal('SUBMIT_CONTENT', campaign);
  };

  const oneTimeTasks = (tasks as Task[]).filter((t: Task) => t.taskType === "ONE_TIME" && t.isActive);
  const recurringTasks = (tasks as Task[]).filter((t: Task) => t.taskType === "RECURRING" && t.isActive);

  const pendingSubmissions = (mySubmissions as ContentSubmission[]).filter((s: ContentSubmission) => s.status === "pending");
  const approvedSubmissions = (mySubmissions as ContentSubmission[]).filter((s: ContentSubmission) => s.status === "approved");

  // Separate tasks and raids for Step 3
  const availableOneTime = oneTimeTasks.filter(t => !isTaskCompleted(t.id));
  const completedOneTime = oneTimeTasks.filter(t => isTaskCompleted(t.id));

  const availableRecurring = recurringTasks.filter(t => !isTaskCompleted(t.id));
  const completedRecurring = recurringTasks.filter(t => isTaskCompleted(t.id));

  const availableRaids = (raids as Raid[]).filter(r => !isRaidCompleted(r.id));
  const completedRaids = (raids as Raid[]).filter(r => isRaidCompleted(r.id));

  return (
    <>
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
              className={`${styles.tab} ${activeTab === "tasks" ? styles.active : ""} `}
              onClick={() => setActiveTab("tasks")}
            >
              Protocol Tasks
              <span className={styles.tabCount}>{tasks.length}</span>
            </button>
            <button
              className={`${styles.tab} ${activeTab === "raids" ? styles.active : ""} `}
              onClick={() => setActiveTab("raids")}
              title="Coordinated social media posts to boost community engagement"
            >
              Raids (?)
              <span className={styles.tabCount}>{raids.length}</span>
            </button>
            <button
              className={`${styles.tab} ${activeTab === "content" ? styles.active : ""} `}
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
                  {availableOneTime.map((task) => {
                    const isPending = pendingTaskId === task.id;
                    return (
                      <div key={task.id} className={styles.taskCard}>
                        <div className={styles.taskReward}>+{task.reward} BP</div>
                        <h3>{task.title}</h3>
                        <p>{task.description || "Complete this task to earn Boost Points"}</p>

                        {isPending ? (
                          <button
                            className={styles.completeBtn}
                            onClick={() => handleTaskComplete(task.id)}
                            disabled={completeTask.isPending}
                          >
                            {completeTask.isPending ? "Verifying..." : "Mark Complete ✓"}
                          </button>
                        ) : (
                          <button
                            className={styles.taskBtn}
                            onClick={() => handleTaskStart(task)}
                            disabled={completeTask.isPending}
                          >
                            Start Task
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {availableOneTime.length === 0 && (
                    <div className={styles.empty}>No new one-time tasks available</div>
                  )}
                </div>
              </section>

              {/* Recurring Tasks */}
              <section className={styles.section}>
                <h2>Daily Operations</h2>
                <div className={styles.taskGrid}>
                  {availableRecurring.map((task) => {
                    const isPending = pendingTaskId === task.id;
                    return (
                      <div key={task.id} className={styles.taskCard}>
                        <div className={styles.taskReward}>+{task.reward} BP</div>
                        <h3>{task.title}</h3>
                        <p>{task.description || "Complete this task to earn Boost Points"}</p>

                        {isPending ? (
                          <button
                            className={styles.completeBtn}
                            onClick={() => handleTaskComplete(task.id)}
                            disabled={completeTask.isPending}
                          >
                            {completeTask.isPending ? "Verifying..." : "Mark Complete ✓"}
                          </button>
                        ) : (
                          <button
                            className={styles.taskBtn}
                            onClick={() => handleTaskStart(task)}
                            disabled={completeTask.isPending}
                          >
                            Start Task
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {availableRecurring.length === 0 && (
                    <div className={styles.empty}>Daily tasks completed! Check back later.</div>
                  )}
                </div>
              </section>

              {/* Completed Tasks */}
              {(completedOneTime.length > 0 || completedRecurring.length > 0) && (
                <section className={styles.section}>
                  <h2>Completed Missions</h2>
                  <div className={styles.taskGrid}>
                    {[...completedOneTime, ...completedRecurring].map((task) => (
                      <div key={task.id} className={`${styles.taskCard} ${styles.completed}`}>
                        <div className={styles.taskReward}>+{task.reward} BP Earned</div>
                        <h3>{task.title}</h3>
                        <div className={styles.completedBadge}>✓ Completed</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : activeTab === "raids" ? (
            <div className={styles.content}>
              {/* Available Raids */}
              <div className={styles.raidList}>
                {availableRaids.map((raid) => {
                  const isPending = pendingRaidId === raid.id;

                  return (
                    <div key={raid.id} className={styles.raidCard}>
                      <div className={styles.raidInfo}>
                        <span className={styles.raidPlatform}>{raid.platform}</span>
                        <h3>{raid.title}</h3>
                      </div>
                      <div className={styles.raidAction}>
                        <span className={styles.raidReward}>+{raid.reward} BP</span>

                        {isPending ? (
                          <button
                            className={styles.completeBtn}
                            onClick={() => handleRaidComplete(raid.id)}
                            disabled={completeRaid.isPending}
                          >
                            {completeRaid.isPending ? "..." : "Claim ✓"}
                          </button>
                        ) : (
                          <button
                            className={styles.raidBtn}
                            onClick={() => handleRaidStart(raid)}
                            disabled={completeRaid.isPending}
                          >
                            Raid
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {availableRaids.length === 0 && (
                  <div className={styles.empty}>No active raids available</div>
                )}
              </div>

              {/* Completed Raids */}
              {completedRaids.length > 0 && (
                <section className={styles.section} style={{ marginTop: 'var(--space-8)' }}>
                  <h2>Completed Raids</h2>
                  <div className={styles.raidList}>
                    {completedRaids.map((raid) => (
                      <div key={raid.id} className={`${styles.raidCard} ${styles.completed}`}>
                        <div className={styles.raidInfo}>
                          <span className={styles.raidPlatform}>{raid.platform}</span>
                          <h3>{raid.title}</h3>
                        </div>
                        <div className={styles.raidAction}>
                          <span className={styles.raidReward}>+{raid.reward} BP Earned</span>
                          <div className={styles.completedBadge}>✓ Complete</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className={styles.content}>
              {/* My Submissions */}
              {mySubmissions.length > 0 && (
                <section className={styles.section}>
                  <h2>My Submissions</h2>
                  <div className={styles.submissionsList}>
                    {pendingSubmissions.map((sub) => (
                      <div key={sub.id} className={`${styles.submissionCard} ${styles.pending} `}>
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
                      <div key={sub.id} className={`${styles.submissionCard} ${styles.approved} `}>
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
                        {campaign.platforms.map((platform: string) => (
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

      <ComplianceDisclaimer variant="footer" />
    </>
  );
}
