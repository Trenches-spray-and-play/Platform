"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./FinalizeClient.module.css";

interface Task {
    id: string;
    title: string;
    description: string | null;
    reward: number;
    link: string | null;
    taskType: "ONE_TIME" | "RECURRING";
}

interface UserTask {
    taskId: string;
    completedAt: string;
}

interface SprayEntry {
    id: string;
    amount: string;
    trench: {
        level: string;
        durationHours: number;
    };
}

interface FinalizeClientProps {
    sprayEntry: SprayEntry | null;
    initialTasks: Task[];
    initialCompletions: UserTask[];
}

export default function FinalizeClient({
    sprayEntry,
    initialTasks,
    initialCompletions,
}: FinalizeClientProps) {
    const router = useRouter();
    const [completions, setCompletions] = useState<Set<string>>(
        new Set(initialCompletions.map((c) => c.taskId))
    );
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

    if (!sprayEntry) {
        return (
            <div className={styles.errorState}>
                <h3>Spray Entry Not Found</h3>
                <p>This entry may have already been finalized or does not exist.</p>
                <button onClick={() => router.push("/sample-v2")}>Back to Campaigns</button>
            </div>
        );
    }

    const allTasksCompleted = initialTasks.every((t) => completions.has(t.id));

    const handleCompleteTask = async (task: Task) => {
        if (task.link) {
            window.open(task.link, "_blank");
        }

        setLoadingTaskId(task.id);
        try {
            const res = await fetch("/api/user/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    taskId: task.id,
                    sprayEntryId: sprayEntry.id,
                }),
            });

            if (res.ok) {
                setCompletions((prev) => new Set([...prev, task.id]));
            }
        } catch (err) {
            console.error("Failed to mark task as completed:", err);
        } finally {
            setLoadingTaskId(null);
        }
    };

    const handleFinalize = async () => {
        if (!allTasksCompleted) return;

        setIsFinalizing(true);
        setError(null);

        try {
            const res = await fetch("/api/spray/finalize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sprayEntryId: sprayEntry.id,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                router.push("/sample-v2/dashboard-v2?success=true");
            } else {
                throw new Error(data.error || "Failed to finalize entry");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsFinalizing(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Status Banner */}
            <div className={styles.statusBanner}>
                <div className={styles.statusInfo}>
                    <span className={styles.statusBadge}>POSITION_PENDING</span>
                    <h2>Finalize Your Entry</h2>
                    <p>Complete the protocol missions to activate your yield queue.</p>
                </div>
                <div className={styles.entryStats}>
                    <div className={styles.statLine}>
                        <span>Amount:</span>
                        <strong>${parseFloat(sprayEntry.amount).toFixed(2)}</strong>
                    </div>
                    <div className={styles.statLine}>
                        <span>Trench:</span>
                        <strong>{sprayEntry.trench.level}</strong>
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3>Protocol Missions</h3>
                    <span className={styles.progressText}>
                        {completions.size} / {initialTasks.length} Completed
                    </span>
                </div>
                <div className={styles.taskList}>
                    {initialTasks.map((task) => {
                        const isCompleted = completions.has(task.id);
                        return (
                            <div
                                key={task.id}
                                className={`${styles.taskCard} ${isCompleted ? styles.completed : ""}`}
                            >
                                <div className={styles.taskCheck}>
                                    {isCompleted ? "✓" : <span className={styles.dot} />}
                                </div>
                                <div className={styles.taskInfo}>
                                    <h4>{task.title}</h4>
                                    <p>{task.description}</p>
                                    <div className={styles.taskMeta}>
                                        <span className={styles.rewardTag}>+{task.reward} BP</span>
                                        <span className={styles.typeTag}>{task.taskType}</span>
                                    </div>
                                </div>
                                {!isCompleted && (
                                    <button
                                        className={styles.completeBtn}
                                        onClick={() => handleCompleteTask(task)}
                                        disabled={loadingTaskId === task.id}
                                    >
                                        {loadingTaskId === task.id ? "..." : "Complete"}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Verify & Finalize */}
            <div className={styles.finalizeFooter}>
                {error && <div className={styles.errorMsg}>{error}</div>}
                <button
                    className={styles.finalizeBtn}
                    disabled={!allTasksCompleted || isFinalizing}
                    onClick={handleFinalize}
                >
                    {isFinalizing ? "Verifying..." : allTasksCompleted ? "Finalize & Join Queue" : "Complete All Missions First"}
                </button>
                <p className={styles.disclaimer}>
                    By finalizing, you confirm compliance with the protocol terms.
                </p>
            </div>
        </div>
    );
}
