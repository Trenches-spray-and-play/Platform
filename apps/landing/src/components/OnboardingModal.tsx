"use client";

import { useState, useEffect, useRef } from 'react';
import styles from './OnboardingModal.module.css';
import { Check, Loader2 } from 'lucide-react';

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
        } catch (e) {
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
    const telegramUrl = config?.telegramUrl || 'https://t.me/trenchesprotocol';
    const twitterUrl = config?.twitterUrl || 'https://x.com/traboraofficial';
    const referralDomain = config?.referralDomain || 'playtrenches.xyz';
    const defaultTweetText = `Just enlisted in the @traboraofficial deployment queue. Spray and Pray!\n\nhttps://${referralDomain}`;
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
                <button className={styles.closeBtn} onClick={onClose}>×</button>

                {/* Step Indicator */}
                <div className={styles.stepIndicator}>
                    <span className={step > 1 ? styles.stepDone : styles.stepActive}>
                        {step > 1 ? <Check size={14} /> : '1'}
                    </span>
                    <div className={styles.stepLine} />
                    <span className={step === 2 ? styles.stepActive : styles.stepInactive}>2</span>
                </div>

                {/* Error Toast */}
                {error && (
                    <div className={styles.errorToast}>
                        <span>{error}</span>
                    </div>
                )}

                {step === 1 && (
                    <div className={styles.content}>
                        <h2 className={styles.title}>CONNECT YOUR SOCIALS</h2>
                        <p className={styles.desc}>
                            Join our community channels to stay updated and connect with other members.
                        </p>

                        {configLoading ? (
                            <div className={styles.loadingState}>
                                <Loader2 size={24} className={styles.spinner} />
                                <span>Loading...</span>
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
                                                <Check size={20} color="#00ff00" />
                                            ) : (
                                                '📱'
                                            )}
                                        </span>
                                        <div className={styles.missionContent}>
                                            <span className={styles.missionText}>JOIN TELEGRAM</span>
                                            {telegramConfirmed && (
                                                <span className={styles.missionSuccess}>Connected!</span>
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
                                                <Check size={20} color="#00ff00" />
                                            ) : (
                                                '𝕏'
                                            )}
                                        </span>
                                        <div className={styles.missionContent}>
                                            <span className={styles.missionText}>FOLLOW ON X</span>
                                            {twitterConfirmed && (
                                                <span className={styles.missionSuccess}>Connected!</span>
                                            )}
                                        </div>
                                    </a>
                                </div>

                                <button
                                    className={styles.nextBtn}
                                    onClick={handleContinue}
                                    disabled={!canContinue}
                                >
                                    {canContinue ? 'CONTINUE' : 'Complete tasks above to continue'}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className={styles.content}>
                        <h2 className={styles.title}>SHARE</h2>
                        <p className={styles.descText}>
                            Help spread the word! Share your enlistment with your followers.
                        </p>

                        <div className={styles.shareBox}>
                            {!shareConfirmed && !isSyncing ? (
                                <a
                                    href={`https://x.com/intent/tweet?text=${tweetText}`}
                                    className={styles.shareBtn}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleShareClick}
                                >
                                    𝕏 SHARE ON X
                                </a>
                            ) : (
                                <div className={styles.shareComplete}>
                                    <Check size={20} color="#00ff00" />
                                    <span>Shared!</span>
                                </div>
                            )}
                        </div>

                        {isSyncing && (
                            <div className={styles.finalizingState}>
                                <Loader2 size={24} className={styles.spinner} />
                                <span>Finalizing your spot...</span>
                            </div>
                        )}

                        {!shareConfirmed && !isSyncing && (
                            <p className={styles.skipHint}>
                                Click the share button above to complete your registration
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
