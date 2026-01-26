"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import styles from "./SprayModal.module.css";
import TaskList from './TaskList';

interface TrenchData {
    id: string;
    name: string;
    level: string;
    minEntry: number;  // USD
    maxEntry: number;  // USD
    roiMultiplier: number;
    roiCap: string;
}

interface Task {
    id: string;
    title: string;
    description?: string | null;
    reward: number;
    link?: string | null;
    status: 'pending' | 'completed';
}

interface SprayModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    trench: TrenchData;
    phase?: 'WAITLIST' | 'ACCEPTING' | 'LIVE' | 'PAUSED';
}

type FlowStep = 'idle' | 'insufficient' | 'confirming' | 'processing' | 'tasks' | 'finalizing' | 'success';

export default function SprayModal({ isOpen, onClose, onConfirm, trench, phase = 'LIVE' }: SprayModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<FlowStep>('idle');

    // User balance (USD)
    const [userBalance, setUserBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Input State - USD amount
    const [usdInput, setUsdInput] = useState<string>('');

    // Spray entry state
    const [sprayEntryId, setSprayEntryId] = useState<string | null>(null);
    const [newBalance, setNewBalance] = useState<number>(0);

    // Tasks state
    const [tasks, setTasks] = useState<Task[]>([]);
    const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
    const [allTasksComplete, setAllTasksComplete] = useState(false);

    // Success state
    const [queuePosition, setQueuePosition] = useState<number>(0);

    // Wallet address for payouts
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [savedWalletAddress, setSavedWalletAddress] = useState<string>('');

    // Derived values
    const parsedUsd = parseFloat(usdInput) || 0;
    const isValidAmount = parsedUsd >= trench.minEntry &&
        parsedUsd <= trench.maxEntry &&
        parsedUsd <= userBalance;
    const maxReturn = Math.floor(parsedUsd * trench.roiMultiplier);

    // Errors
    const insufficientBalance = parsedUsd > userBalance && parsedUsd > 0;
    const exceedsTrenchCap = parsedUsd > trench.maxEntry && parsedUsd > 0;
    const belowMinimum = parsedUsd < trench.minEntry && parsedUsd > 0;

    useEffect(() => {
        if (isOpen) {
            setStep('idle');
            setUsdInput('');
            setSprayEntryId(null);
            setAllTasksComplete(false);
            setWalletAddress('');
            fetchBalance();
            fetchTasks();
            fetchWalletAddress();
        }
    }, [isOpen]);

    const fetchBalance = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user');
            const data = await res.json();
            if (data.data?.balance) {
                setUserBalance(data.data.balance);
            }
        } catch (error) {
            console.error('Failed to fetch balance:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWalletAddress = async () => {
        try {
            const res = await fetch('/api/user');
            const data = await res.json();
            if (data.data?.wallet) {
                setWalletAddress(data.data.wallet);
                setSavedWalletAddress(data.data.wallet);
            }
        } catch (error) {
            console.error('Failed to fetch wallet:', error);
        }
    };

    const saveWalletAddress = async () => {
        if (!walletAddress || walletAddress === savedWalletAddress) return true;
        try {
            const res = await fetch('/api/user/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: walletAddress }),
            });
            const data = await res.json();
            if (data.success) {
                setSavedWalletAddress(walletAddress);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to save wallet:', error);
            return false;
        }
    };

    const fetchTasks = async (currentSprayEntryId: string | null = null) => {
        const targetId = currentSprayEntryId || sprayEntryId;
        try {
            const [tasksRes, completedRes] = await Promise.all([
                fetch('/api/tasks'),
                fetch(`/api/user/tasks${targetId ? `?sprayEntryId=${targetId}` : ''}`),
            ]);
            const tasksData = await tasksRes.json();
            const completedData = await completedRes.json();

            const completedIds = new Set<string>(
                (completedData.data || []).map((t: { taskId: string }) => t.taskId)
            );
            setCompletedTaskIds(completedIds);

            const allTasks = tasksData.data || [];
            const relevantTasks = allTasks.filter((task: Task & { taskType?: string }) => {
                if (task.taskType === 'RECURRING') return true;
                return !completedIds.has(task.id);
            });

            const mergedActiveTasks = relevantTasks.map((task: Task) => ({
                ...task,
                status: completedIds.has(task.id) ? 'completed' : 'pending',
            }));

            setTasks(mergedActiveTasks);

            const allComplete = mergedActiveTasks.length === 0 ||
                mergedActiveTasks.every((t: Task) => t.status === 'completed');
            setAllTasksComplete(allComplete);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        }
    };

    const handleSpray = async () => {
        if (phase === 'WAITLIST') {
            setStep('confirming');
            return;
        }

        if (insufficientBalance) {
            setStep('insufficient');
            return;
        }
        if (!isValidAmount) return;
        setStep('confirming');
    };

    const handleConfirmSpray = async () => {
        const isPaymentPhase = phase === 'LIVE' || phase === 'ACCEPTING';
        setStep('processing');
        try {
            // If we are in WAITLIST or ACCEPTING phase, use the waitlist API
            if (phase === 'WAITLIST' || phase === 'ACCEPTING') {
                const res = await fetch('/api/campaign/waitlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        campaignId: trench.id,
                        depositAmount: phase === 'ACCEPTING' ? parsedUsd : 0,
                    }),
                });
                const data = await res.json();

                if (data.success) {
                    setQueuePosition(data.data.queueNumber);

                    // For ACCEPTING phase, we should show tasks if they exist
                    if (phase === 'ACCEPTING' && tasks.length > 0 && !allTasksComplete) {
                        setStep('tasks');
                    } else {
                        setStep('success');
                        setTimeout(() => {
                            onConfirm();
                            onClose();
                            router.push('/dashboard');
                        }, phase === 'WAITLIST' ? 1000 : 2000); // Snappier for enlistment
                    }
                } else {
                    if (data.error === 'Already in waitlist') {
                        alert('Identity already verified for this campaign. Opening dashboard briefing...');
                        onClose();
                        router.push('/dashboard');
                    } else {
                        console.error('Waitlist join failed:', data.error);
                        setStep('idle');
                    }
                }
                return;
            }

            // Standard LIVE spray logic
            const res = await fetch('/api/spray', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trenchId: trench.id,
                    amount: parsedUsd,
                    level: trench.level,
                }),
            });
            const data = await res.json();

            if (data.success) {
                setSprayEntryId(data.data.sprayEntryId);
                setNewBalance(data.data.newBalance);

                // IMPORTANT: Re-fetch tasks using the new sprayEntryId to check for recurring requirements
                await fetchTasks(data.data.sprayEntryId);

                if (allTasksComplete) {
                    await finalizeSpray(data.data.sprayEntryId);
                } else {
                    setStep('tasks');
                }
            } else {
                console.error('Spray failed:', data.error);
                if (data.error === 'Insufficient balance') {
                    setStep('insufficient');
                } else {
                    setStep('idle');
                }
            }
        } catch (error) {
            console.error('Spray error:', error);
            setStep('idle');
        }
    };

    const handleTaskComplete = async (reward: number, taskId?: string) => {
        if (!taskId) return;
        try {
            const res = await fetch('/api/user/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId,
                    sprayEntryId: sprayEntryId || null,
                }),
            });
            const data = await res.json();

            if (data.success) {
                setCompletedTaskIds(prev => new Set([...prev, taskId]));
                setTasks(prev => prev.map(t =>
                    t.id === taskId ? { ...t, status: 'completed' as const } : t
                ));
            }
        } catch (error) {
            console.error('Failed to complete task:', error);
        }
    };

    const handleAllTasksComplete = useCallback(() => {
        setAllTasksComplete(true);
    }, []);

    const finalizeSpray = async (entryId?: string) => {
        const id = entryId || sprayEntryId;
        if (!id) return;

        setStep('finalizing');
        try {
            const res = await fetch('/api/spray/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sprayEntryId: id }),
            });
            const data = await res.json();

            if (data.success) {
                setQueuePosition(data.data.queuePosition);
                setStep('success');
                setTimeout(() => {
                    onConfirm();
                    onClose();
                    router.push('/dashboard');
                }, 2000);
            } else {
                console.error('Finalize failed:', data.error);
                if (data.error === 'All tasks must be completed') {
                    setStep('tasks');
                }
            }
        } catch (error) {
            console.error('Finalize error:', error);
            setStep('tasks');
        }
    };

    const handleGoToDeposit = () => {
        onClose();
        router.push('/profile');
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {step === 'idle' && (
                    <>
                        <h3 className={styles.title}>
                            {phase === 'WAITLIST' ? 'ENLIST' : phase === 'ACCEPTING' ? 'SECURE SPOT' : 'SPRAY'}
                        </h3>

                        <div className={styles.balanceDisplay}>
                            <span className={styles.balanceLabel}>YOUR BALANCE</span>
                            <span className={styles.balanceValue}>
                                {loading ? '...' : `$${userBalance.toFixed(2)}`}
                            </span>
                        </div>

                        <p className={styles.description}>
                            {phase === 'WAITLIST'
                                ? 'Join the waitlist for priority alerts'
                                : `${trench.minEntry} - ${trench.maxEntry} USD`}
                        </p>

                        {phase !== 'WAITLIST' && (
                            <div className={styles.inputContainer}>
                                <span className={styles.currencyPrefix}>$</span>
                                <input
                                    type="number"
                                    value={usdInput}
                                    onChange={(e) => setUsdInput(e.target.value)}
                                    className={styles.amountInput}
                                    placeholder={trench.minEntry.toString()}
                                />
                                <span className={styles.currencySuffix}>USD</span>
                            </div>
                        )}

                        {insufficientBalance && (
                            <div className={styles.error}>Insufficient balance</div>
                        )}
                        {exceedsTrenchCap && (
                            <div className={styles.error}>Exceeds trench cap (${trench.maxEntry})</div>
                        )}
                        {belowMinimum && (
                            <div className={styles.error}>Minimum entry is ${trench.minEntry}</div>
                        )}

                        {phase !== 'WAITLIST' && (
                            <div className={styles.calcBox}>
                                <div className={styles.calcRow}>
                                    <span>ENTRY</span>
                                    <span className={styles.totalBlt}>${parsedUsd > 0 ? parsedUsd.toFixed(2) : '---'}</span>
                                </div>
                                <div className={styles.calcRow}>
                                    <span>MAX RETURN ({trench.roiCap})</span>
                                    <span className={styles.highlight}>${parsedUsd > 0 ? maxReturn.toFixed(2) : '---'}</span>
                                </div>
                            </div>
                        )}

                        <div className={styles.actions}>
                            <button className={styles.cancelBtn} onClick={onClose}>CANCEL</button>
                            <button
                                className={styles.confirmBtn}
                                onClick={handleSpray}
                                disabled={phase !== 'WAITLIST' && parsedUsd <= 0}
                                style={{ opacity: (phase === 'WAITLIST' || parsedUsd > 0) ? 1 : 0.5 }}
                            >
                                {insufficientBalance && (phase !== 'WAITLIST' && phase !== 'ACCEPTING') ? 'DEPOSIT FUNDS' : phase === 'WAITLIST' ? 'ENLIST' : phase === 'ACCEPTING' ? 'SECURE SPOT' : 'SPRAY'}
                            </button>
                        </div>
                    </>
                )}

                {step === 'insufficient' && (
                    <>
                        <h3 className={styles.title}>INSUFFICIENT BALANCE</h3>
                        <div className={styles.insufficientBox}>
                            <p>You need <strong>${parsedUsd.toFixed(2)}</strong> to spray</p>
                            <p>Your balance: <strong>${userBalance.toFixed(2)}</strong></p>
                        </div>
                        <div className={styles.actions}>
                            <button className={styles.cancelBtn} onClick={() => setStep('idle')}>BACK</button>
                            <button className={styles.confirmBtn} onClick={handleGoToDeposit}>
                                DEPOSIT FUNDS
                            </button>
                        </div>
                    </>
                )}

                {step === 'confirming' && (
                    <>
                        <h3 className={styles.title}>
                            {phase === 'WAITLIST' ? 'JOIN WAITLIST' : phase === 'ACCEPTING' ? 'CONFIRM PRIORITY' : 'CONFIRM SPRAY'}
                        </h3>

                        <div className={styles.confirmSummary}>
                            {phase !== 'WAITLIST' && (
                                <div className={styles.summaryRow}>
                                    <span>Amount</span>
                                    <span>${parsedUsd.toFixed(2)}</span>
                                </div>
                            )}
                            <div className={styles.summaryRow}>
                                <span>Trench</span>
                                <span>{trench.level}</span>
                            </div>
                            {phase !== 'WAITLIST' && (
                                <div className={styles.summaryRow}>
                                    <span>Max Return</span>
                                    <span className={styles.highlight}>${maxReturn.toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        <p className={styles.notice}>
                            {phase === 'WAITLIST'
                                ? "Priority is granted upon enlistment, but your spot is secured only when payment is made once the Secure Spot button is live."
                                : "Complete tasks to join the Queue"}
                        </p>

                        <div className={styles.actions}>
                            <button className={styles.cancelBtn} onClick={() => setStep('idle')}>BACK</button>
                            <button className={styles.confirmBtn} onClick={handleConfirmSpray}>
                                CONFIRM
                            </button>
                        </div>
                    </>
                )}

                {step === 'processing' && (
                    <div className={styles.statusView}>
                        <div className={styles.spinner}></div>
                        <p>{phase === 'WAITLIST' ? 'ENLISTING IDENTITY...' : 'PROCESSING PAYMENT...'}</p>
                    </div>
                )}

                {step === 'tasks' && (
                    <>
                        <h3 className={styles.title}>COMPLETE TASKS</h3>

                        <div className={styles.walletInputSection}>
                            <label className={styles.walletLabel}>
                                RECEIVING WALLET ADDRESS
                                <span className={styles.requiredStar}>*</span>
                            </label>
                            <input
                                type="text"
                                value={walletAddress}
                                onChange={(e) => setWalletAddress(e.target.value)}
                                placeholder="0x... or Solana address"
                                className={styles.walletInput}
                            />
                            {savedWalletAddress && walletAddress !== savedWalletAddress && (
                                <p className={styles.walletHint}>Updating from: {savedWalletAddress.slice(0, 8)}...</p>
                            )}
                            {!walletAddress && (
                                <p className={styles.error}>Wallet address required for payouts</p>
                            )}
                        </div>

                        <div className={styles.tasksContainer}>
                            {tasks.length > 0 ? (
                                <TaskList
                                    initialTasks={tasks}
                                    onTaskComplete={handleTaskComplete}
                                    compact={true}
                                    required={true}
                                    onAllComplete={handleAllTasksComplete}
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                    <p>NO OUTSTANDING REQUIREMENTS</p>
                                    <p style={{ fontSize: '0.7rem', marginTop: '1rem' }}>YOU HAVE COMPLETED ALL DEPLOYMENT MANEUVERS</p>
                                </div>
                            )}
                        </div>

                        <div className={styles.actions}>
                            <button
                                className={styles.confirmBtn}
                                onClick={async () => {
                                    const saved = await saveWalletAddress();
                                    if (saved) {
                                        if (phase === 'ACCEPTING') {
                                            setStep('success');
                                            setTimeout(() => {
                                                onConfirm();
                                                onClose();
                                                router.push('/dashboard');
                                            }, 2000);
                                        } else {
                                            finalizeSpray();
                                        }
                                    }
                                }}
                                disabled={!allTasksComplete || !walletAddress}
                                style={{ opacity: (allTasksComplete && walletAddress) ? 1 : 0.5, width: '100%' }}
                            >
                                {!walletAddress ? 'ENTER WALLET' : !allTasksComplete ? 'COMPLETE ALL TASKS' : 'JOIN QUEUE'}
                            </button>
                        </div>
                    </>
                )}

                {step === 'finalizing' && (
                    <div className={styles.statusView}>
                        <div className={styles.spinner}></div>
                        <p>JOINING QUEUE...</p>
                    </div>
                )}

                {step === 'success' && (
                    <div className={styles.statusView}>
                        <div className={styles.successIcon}>✓</div>
                        <p>{phase === 'LIVE' ? 'QUEUED' : 'REGISTERED'}</p>
                        <p className={styles.queuePosition}>
                            {phase === 'LIVE' ? 'POSITION' : 'WAITLIST NO.'} #{queuePosition}
                        </p>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
