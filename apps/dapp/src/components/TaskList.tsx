"use client";

import { useState, useEffect } from 'react';
import styles from './TaskList.module.css';

interface Task {
    id: string;
    title: string;
    description?: string | null;
    reward: number;
    link?: string | null;
    status: 'pending' | 'completed';
    taskType?: 'ONE_TIME' | 'RECURRING';
}

interface TaskListProps {
    initialTasks: Task[];
    onTaskComplete: (reward: number, taskId?: string) => void;
    compact?: boolean;  // Smaller styling for modal
    required?: boolean; // Show "required" indicator
    onAllComplete?: () => void; // Callback when all tasks done
}

export default function TaskList({
    initialTasks,
    onTaskComplete,
    compact = false,
    required = false,
    onAllComplete
}: TaskListProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

    // Update tasks when initialTasks changes
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    // Check if all tasks are complete
    useEffect(() => {
        if (onAllComplete && tasks.length > 0) {
            const allComplete = tasks.every(t => t.status === 'completed');
            if (allComplete) {
                onAllComplete();
            }
        }
    }, [tasks, onAllComplete]);

    const handleGo = (task: Task) => {
        if (task.link) {
            window.open(task.link, '_blank');
        }

        // Show instructions if they exist and task isn't completed
        if (task.description && task.status === 'pending') {
            setExpandedTaskId(expandedTaskId === task.id ? null : task.id);
        } else if (!task.description && task.status === 'pending') {
            // If no instructions, mark as done immediately (per user flow for non-submission tasks)
            handleComplete(task.id, task.reward);
        }
    };

    const handleComplete = (taskId: string, reward: number) => {
        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, status: 'completed' as const } : t
        ));
        setExpandedTaskId(null);
        onTaskComplete(reward, taskId);
    };

    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const totalCount = tasks.length;

    return (
        <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
            <h3 className={styles.title}>
                {required && <span className={styles.requiredBadge}>REQUIRED</span>}
                CONTRIBUTION TASKS
                <span className={styles.progress}>{completedCount}/{totalCount}</span>
            </h3>
            <div className={styles.list}>
                {tasks.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                        No tasks available
                    </p>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className={`${styles.itemContainer} ${expandedTaskId === task.id ? styles.expanded : ''}`}>
                            <div className={`${styles.item} ${styles[task.status]}`}>
                                <div className={styles.info}>
                                    <span className={styles.taskTitle}>{task.title}</span>
                                    <span className={styles.reward}>+{task.reward} BP</span>
                                </div>
                                {task.status === 'pending' ? (
                                    <button
                                        className={styles.actionBtn}
                                        onClick={() => handleGo(task)}
                                    >
                                        GO
                                    </button>
                                ) : (
                                    <span className={styles.completedIcon}>✓</span>
                                )}
                            </div>

                            {expandedTaskId === task.id && task.description && (
                                <div className={styles.dropdown}>
                                    <p className={styles.instruction}>{task.description}</p>
                                    <button
                                        className={styles.verifyBtn}
                                        onClick={() => handleComplete(task.id, task.reward)}
                                    >
                                        VERIFY COMPLETION
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
