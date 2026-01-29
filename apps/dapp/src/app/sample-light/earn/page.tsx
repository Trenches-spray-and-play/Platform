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

export default function EarnPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [raids, setRaids] = useState<Raid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, raidsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/raids"),
      ]);
      const tasksData = await tasksRes.json();
      const raidsData = await raidsRes.json();
      if (tasksData.data) setTasks(tasksData.data);
      if (raidsData.data) setRaids(raidsData.data);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const oneTimeTasks = tasks.filter((t) => t.taskType === "ONE_TIME" && t.isActive);
  const recurringTasks = tasks.filter((t) => t.taskType === "RECURRING" && t.isActive);

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <h1>Earn Boost Points ⭐</h1>
            <p>Complete simple tasks and raids to earn Boost Points that reduce your campaign wait time</p>
          </div>

          {/* Info Box */}
          <div className={styles.infoBox}>
            <div className={styles.infoIcon}>💡</div>
            <div className={styles.infoContent}>
              <h3>What are Boost Points?</h3>
              <p>Boost Points are rewards you earn by completing tasks and participating in raids. Each point reduces your wait time by a small amount—collect enough and you can cut your wait time by up to 50%!</p>
            </div>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span>Loading opportunities...</span>
            </div>
          ) : (
            <>
              {/* One-Time Tasks */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>One-Time Tasks</h2>
                    <p>Complete these once to earn permanent Boost Points</p>
                  </div>
                  <span className={styles.badge}>{oneTimeTasks.length} available</span>
                </div>
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
                        Start Task →
                      </button>
                    </div>
                  ))}
                  {oneTimeTasks.length === 0 && (
                    <div className={styles.empty}>No tasks available right now</div>
                  )}
                </div>
              </section>

              {/* Recurring Tasks */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>Recurring Tasks</h2>
                    <p>These tasks refresh periodically—complete them multiple times</p>
                  </div>
                  <span className={styles.badge}>{recurringTasks.length} available</span>
                </div>
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
                        Start Task →
                      </button>
                    </div>
                  ))}
                  {recurringTasks.length === 0 && (
                    <div className={styles.empty}>No recurring tasks available</div>
                  )}
                </div>
              </section>

              {/* Raids */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>Social Raids</h2>
                    <p>Engage with community content to earn quick Boost Points</p>
                  </div>
                  <span className={styles.badge}>{raids.length} active</span>
                </div>
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
                          Raid →
                        </button>
                      </div>
                    </div>
                  ))}
                  {raids.length === 0 && (
                    <div className={styles.empty}>No active raids</div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
