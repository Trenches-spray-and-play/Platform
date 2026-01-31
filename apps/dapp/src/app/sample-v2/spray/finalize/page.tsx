import { Metadata } from "next";
import Layout from "../../components/Layout";
import FinalizeClient from "./FinalizeClient";
import ErrorBoundary from "../../components/ErrorBoundary";
import styles from "../page.module.css";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Finalize Entry | Trenches v2",
  description: "Complete your protocol missions to activate your position.",
};

async function getSprayEntry(id: string, userId: string) {
  try {
    const entry = await prisma.sprayEntry.findUnique({
      where: { id },
      include: {
        trench: {
          select: {
            level: true,
            durationHours: true,
          }
        }
      }
    });

    if (!entry || entry.userId !== userId) return null;

    return {
      id: entry.id,
      amount: entry.amount.toString(),
      trench: entry.trench
    };
  } catch (error) {
    console.error("Failed to fetch spray entry:", error);
    return null;
  }
}

async function getTasks() {
  try {
    const tasks = await prisma.task.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    return tasks;
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return [];
  }
}

async function getUserTaskCompletions(userId: string, sprayEntryId: string) {
  try {
    const completions = await prisma.userTask.findMany({
      where: {
        userId,
        sprayEntryId,
      },
      select: {
        taskId: true,
        completedAt: true,
      }
    });
    return completions.map(c => ({
      taskId: c.taskId,
      completedAt: c.completedAt.toISOString()
    }));
  } catch (error) {
    console.error("Failed to fetch user tasks:", error);
    return [];
  }
}

export default async function FinalizePage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const session = await getSession();

  if (!session || !searchParams.id) {
    return (
      <Layout>
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.card} style={{ textAlign: "center", padding: "3rem" }}>
              <h3>Invalid Session or Entry ID</h3>
              <p>Please try again from the Spray portal.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const [sprayEntry, allTasks, completions] = await Promise.all([
    getSprayEntry(searchParams.id, session.id),
    getTasks(),
    getUserTaskCompletions(session.id, searchParams.id)
  ]);

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <span className={styles.category}>Security Clearance</span>
              <h1 className={styles.title}>Mission Hub</h1>
              <p className={styles.subtitle}>
                Your funds are secured. Complete the missions below to finalize your deployment.
              </p>
            </div>
          </div>

          <ErrorBoundary>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.statusDot} />
                <h3>MISSION_CHECKLIST_#{(searchParams.id || "").slice(0, 8)}</h3>
              </div>
              <div className={styles.cardContent}>
                <FinalizeClient
                  sprayEntry={sprayEntry}
                  initialTasks={allTasks as any}
                  initialCompletions={completions}
                />
              </div>
            </div>
          </ErrorBoundary>
        </div>
      </div>
    </Layout>
  );
}
