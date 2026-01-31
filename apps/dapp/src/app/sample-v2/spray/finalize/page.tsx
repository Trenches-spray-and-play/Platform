"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "../../components/Layout";
import styles from "./finalize.module.css";
import { ComplianceDisclaimer } from "@trenches/ui";

interface Task {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  taskType: "ONE_TIME" | "RECURRING";
  completed?: boolean;
}

interface SprayEntry {
  id: string;
  amount: number;
  status: string;
  trench: {
    level: string;
  };
}

function FinalizeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryId = searchParams.get("entryId");

  const [entry, setEntry] = useState<SprayEntry | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{
    queuePosition: number;
    maxPayout: number;
    participantId: string;
  } | null>(null);

  useEffect(() => {
    if (!entryId) {
      router.push("/sample-v2/dashboard-v2");
      return;
    }
    fetchData();
  }, [entryId]);

  const fetchData = async () => {
    try {
      // Fetch spray entry details
      const entryRes = await fetch(`/api/user/spray-entries/${entryId}`);
      if (!entryRes.ok) {
        throw new Error("Entry not found");
      }
      const entryData = await entryRes.json();
      setEntry(entryData.data);

      // Fetch tasks
      const tasksRes = await fetch("/api/tasks");
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        // Check which tasks are completed
        const tasksWithStatus = await Promise.all(
          (tasksData.data || []).map(async (task: Task) => {
            const checkRes = await fetch(`/api/user/tasks/${task.id}/status`);
            const checkData = await checkRes.json();
            return { ...task, completed: checkData.data?.completed || false };
          })
        );
        setTasks(tasksWithStatus);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!entryId) return;

    setFinalizing(true);
    setError(null);

    try {
      const res = await fetch("/api/spray/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprayEntryId: entryId }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle incomplete tasks error specifically
        if (data.remainingTasks) {
          throw new Error(
            `Complete all ${data.remainingTasks} tasks first: ${data.remainingTaskNames?.join(", ")}`
          );
        }
        throw new Error(data.error || "Failed to finalize");
      }

      setResult(data.data);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finalize");
    } finally {
      setFinalizing(false);
    }
  };

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const allTasksComplete = incompleteTasks.length === 0;

  if (loading) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.loading}>Loading entry details...</div>
        </div>
        <ComplianceDisclaimer variant="footer" />
      </Layout>
    );
  }

  if (success && result) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.successTitle}>Entry Confirmed!</h1>
            <p className={styles.successMessage}>
              Your position has been created in the {entry?.trench.level} trench.
            </p>

            <div className={styles.resultBox}>
              <div className={styles.resultRow}>
                <span>Queue Position</span>
                <span className={styles.resultValue}>#{result.queuePosition}</span>
              </div>
              <div className={styles.resultRow}>
                <span>Entry Amount</span>
                <span className={styles.resultValue}>
                  ${entry?.amount.toFixed(2)}
                </span>
              </div>
              <div className={styles.resultRow}>
                <span>Max Payout</span>
                <span className={`${styles.resultValue} ${styles.highlight}`}>
                  ${result.maxPayout.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              className={styles.dashboardBtn}
              onClick={() => router.push("/sample-v2/dashboard-v2")}
            >
              View Dashboard
            </button>
          </div>
        </div>
        <ComplianceDisclaimer variant="footer" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Complete Tasks</h1>
          <p className={styles.subtitle}>
            Finish all tasks to finalize your {entry?.trench.level} entry
          </p>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className={styles.errorClose}>
              ×
            </button>
          </div>
        )}

        <div className={styles.card}>
          {/* Entry Summary */}
          <div className={styles.entrySummary}>
            <div className={styles.entryRow}>
              <span>Entry Amount</span>
              <span className={styles.entryValue}>
                ${entry?.amount.toFixed(2)}
              </span>
            </div>
            <div className={styles.entryRow}>
              <span>Status</span>
              <span className={styles.statusBadge}>{entry?.status}</span>
            </div>
          </div>

          {/* Tasks List */}
          <div className={styles.tasksSection}>
            <h2 className={styles.tasksTitle}>
              Required Tasks ({tasks.filter((t) => t.completed).length}/{tasks.length})
            </h2>

            {tasks.length === 0 ? (
              <p className={styles.emptyTasks}>Loading tasks...</p>
            ) : (
              <div className={styles.taskList}>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`${styles.taskCard} ${task.completed ? styles.completed : ""}`}
                  >
                    <div className={styles.taskInfo}>
                      <div className={styles.taskHeader}>
                        <h3>{task.title}</h3>
                        {task.completed ? (
                          <span className={styles.completedBadge}>✓ Done</span>
                        ) : (
                          <span className={styles.pendingBadge}>Pending</span>
                        )}
                      </div>
                      {task.description && (
                        <p className={styles.taskDesc}>{task.description}</p>
                      )}
                      <span className={styles.taskReward}>+{task.reward} BP</span>
                    </div>
                    {!task.completed && (
                      <a
                        href={`/sample-v2/earn-v2?task=${task.id}`}
                        className={styles.taskAction}
                      >
                        Complete →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Finalize Button */}
          <button
            className={styles.finalizeBtn}
            onClick={handleFinalize}
            disabled={finalizing || !allTasksComplete}
          >
            {finalizing
              ? "Finalizing..."
              : allTasksComplete
              ? "Finalize Entry"
              : `Complete ${incompleteTasks.length} Task${incompleteTasks.length !== 1 ? "s" : ""}`}
          </button>

          {!allTasksComplete && (
            <p className={styles.helpText}>
              Complete all tasks above to activate your entry
            </p>
          )}
        </div>
      </div>
      <ComplianceDisclaimer variant="footer" />
    </Layout>
  );
}

export default function FinalizePage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className={styles.container}>
            <div className={styles.loading}>Loading...</div>
          </div>
          <ComplianceDisclaimer variant="footer" />
        </Layout>
      }
    >
      <FinalizeContent />
    </Suspense>
  );
}
