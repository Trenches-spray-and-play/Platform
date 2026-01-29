"use client";

import { useState, useEffect, useRef } from 'react';
import styles from './OnboardingModal.module.css';
import { Check, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TacticalButton, XIcon } from '@trenches/ui';

interface PlatformConfig {
    telegramUrl: string;
    twitterUrl: string;
    onboardingTweetText: string;
    referralDomain: string;
}

interface UserData {
    id: string;
    handle: string;
    referralCode: string;
    position: number;
    beliefScore: number;
    boostPoints: number;
    joinedAt: string;
    referralCount: number;
}

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (userData: UserData) => void;
}

const CONFIRM_DELAY = 10000; // 10 seconds in ms

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
    const [step, setStep] = useState(1);
    const [isSyncing, setIsSyncing] = useState(false);
    const [config, setConfig] = useState<PlatformConfig | null>(null);
    const [configLoading, setConfigLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Social confirmation states
    const [telegramConfirmed, setTelegramConfirmed] = useState(false);
    const [twitterConfirmed, setTwitterConfirmed] = useState(false);

    // Timer refs for silent confirmation
    const telegramTimerRef = useRef<NodeJS.Timeout | null>(null);
    const twitterTimerRef = useRef<NodeJS.Timeout | null>(null);
    const shareTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Step 2: Share state
    const [shareConfirmed, setShareConfirmed] = useState(false);

    const STORAGE_KEY = 'trenches_onboarding_state';

    useEffect(() => {
        if (typeof window === 'undefined') return;

        setConfigLoading(true);
        fetch('/api/config')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch config');
                return res.json();
            })
            .then(data => setConfig(data))
            .catch(err => console.error('Failed to fetch config:', err))
            .finally(() => setConfigLoading(false));

        // Restore state from localStorage
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.step) setStep(data.step);
                if (data.telegramConfirmed) setTelegramConfirmed(true);
                if (data.twitterConfirmed) setTwitterConfirmed(true);
            }
        } catch {
            console.error("Failed to restore onboarding state");
        }
    }, []);

    // Save state to localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (isOpen) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                step,
                telegramConfirmed,
                twitterConfirmed
            }));
        }
    }, [step, telegramConfirmed, twitterConfirmed, isOpen]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (telegramTimerRef.current) clearTimeout(telegramTimerRef.current);
            if (twitterTimerRef.current) clearTimeout(twitterTimerRef.current);
            if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
        };
    }, []);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    if (!isOpen) return null;

    // Config values with fallbacks
    const telegramUrl = config?.telegramUrl || 'https://t.me/playTrenches';
    const twitterUrl = config?.twitterUrl || 'https://x.com/trenches121000';
    const referralDomain = config?.referralDomain || 'playtrenches.xyz';
    const defaultTweetText = `Just joined the playtrenches.xyz deployment queue. Spray and Play!\n\nhttps://${referralDomain}`;
    const tweetText = encodeURIComponent(config?.onboardingTweetText || defaultTweetText);

    const handleTelegramClick = () => {
        if (telegramConfirmed || telegramTimerRef.current) return;

        // Start silent 10-second timer
        telegramTimerRef.current = setTimeout(() => {
            setTelegramConfirmed(true);
            telegramTimerRef.current = null;
        }, CONFIRM_DELAY);
    };

    const handleTwitterClick = () => {
        if (twitterConfirmed || twitterTimerRef.current) return;

        // Start silent 10-second timer
        twitterTimerRef.current = setTimeout(() => {
            setTwitterConfirmed(true);
            twitterTimerRef.current = null;
        }, CONFIRM_DELAY);
    };

    const handleShareClick = () => {
        if (shareConfirmed || shareTimerRef.current) return;

        // Start silent 10-second timer, then auto-finalize
        shareTimerRef.current = setTimeout(() => {
            setShareConfirmed(true);
            shareTimerRef.current = null;
            handleFinalize();
        }, CONFIRM_DELAY);
    };

    const handleContinue = () => {
        setStep(2);
    };

    const handleFinalize = async () => {
        setIsSyncing(true);

        try {
            const res = await fetch('/api/user/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referredByCode: localStorage.getItem('referralCode') || undefined,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success && data.user) {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem('referralCode');
                onComplete(data.user);
            } else {
                if (data.details && Array.isArray(data.details)) {
                    setError(data.details.join(' '));
                } else {
                    setError(data.error || 'Failed to finalize. Please try again.');
                }
            }
        } catch (err) {
            console.error('Sync error:', err);
            setError('Network error. Please check your connection.');
        } finally {
            setIsSyncing(false);
        }
    };

    const canContinue = telegramConfirmed && twitterConfirmed;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                    <X size={24} strokeWidth={1.5} />
                </button>

                {/* Step Indicator */}
                <div className={styles.stepIndicator}>
                    <span className={step > 1 ? styles.stepDone : styles.stepActive}>
                        {step > 1 ? <Check size={14} /> : '1'}
                    </span>
                    <div className={styles.stepLine} />
                    <span className={step === 2 ? styles.stepActive : styles.stepInactive}>2</span>
                </div>

                {/* Error Toast */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            className={styles.errorToast}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            className={styles.content}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <span className={styles.v6Tag}>[ Step 01 Get Started ]</span>
                            <h2 className={styles.title}>Link your accounts</h2>
                            <p className={styles.desc}>
                                Get the latest updates and connect with other members.
                            </p>

                            {configLoading ? (
                                <div className={styles.loadingState}>
                                    <Loader2 size={24} strokeWidth={1.5} className={styles.spinner} />
                                    <span>...</span>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.missionGrid}>
                                        {/* Telegram */}
                                        <a
                                            href={telegramUrl}
                                            className={`${styles.missionButton} ${telegramConfirmed ? styles.completed : ''}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={handleTelegramClick}
                                        >
                                            <span className={styles.missionIcon}>
                                                {telegramConfirmed ? (
                                                    <Check size={20} color="var(--accent-zenith)" />
                                                ) : (
                                                    '📱'
                                                )}
                                            </span>
                                            <div className={styles.missionContent}>
                                                <span className={styles.missionText}>Join the telegram group</span>
                                                {telegramConfirmed && (
                                                    <span className={styles.missionSuccess}>Joined!</span>
                                                )}
                                            </div>
                                        </a>

                                        {/* Twitter/X */}
                                        <a
                                            href={twitterUrl}
                                            className={`${styles.missionButton} ${twitterConfirmed ? styles.completed : ''}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={handleTwitterClick}
                                        >
                                            <span className={styles.missionIcon}>
                                                {twitterConfirmed ? (
                                                    <Check size={20} color="var(--accent-zenith)" />
                                                ) : (
                                                    '𝕏'
                                                )}
                                            </span>
                                            <div className={styles.missionContent}>
                                                <span className={styles.missionText}>Follow on X</span>
                                                {twitterConfirmed && (
                                                    <span className={styles.missionSuccess}>Following!</span>
                                                )}
                                            </div>
                                        </a>
                                    </div>

                                    <TacticalButton
                                        variant="primary"
                                        className={styles.nextBtn}
                                        onClick={handleContinue}
                                        disabled={!canContinue}
                                    >
                                        {canContinue ? 'CONTINUE' : 'Complete Next Steps to continue'}
                                    </TacticalButton>
                                </>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            className={styles.content}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <span className={styles.v6Tag}>[ Step 02 Finish ]</span>
                            <h2 className={styles.title}>Confirm your spot</h2>
                            <p className={styles.descText}>
                                Invite your friends to the queue.
                            </p>

                            <div className={styles.shareBox}>
                                {!shareConfirmed && !isSyncing ? (
                                    <TacticalButton
                                        variant="primary"
                                        className={styles.shareBtn}
                                        onClick={() => {
                                            window.open(`https://x.com/intent/tweet?text=${tweetText}`, '_blank');
                                            handleShareClick();
                                        }}
                                    >
                                        <XIcon size={14} /> Confirm your spot
                                    </TacticalButton>
                                ) : (
                                    <div className={styles.shareComplete}>
                                        <Check size={20} color="var(--accent-zenith)" />
                                        <span>Confirmed!</span>
                                    </div>
                                )}
                            </div>

                            {isSyncing && (
                                <div className={styles.finalizingState}>
                                    <Loader2 size={24} strokeWidth={1.5} className={styles.spinner} />
                                    <span>almost there...</span>
                                </div>
                            )}

                            {!shareConfirmed && !isSyncing && (
                                <p className={styles.skipHint}>
                                    Click the button above to complete your registration
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
