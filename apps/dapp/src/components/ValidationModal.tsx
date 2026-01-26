"use client";

import { useState } from 'react';
import styles from './ValidationModal.module.css';
import { MOCK_PEER_POSTS } from '@/lib/mockData';

interface ValidationModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

const VIEW_RANGES = ['<100', '100-500', '500-1k', '1k-5k', '5k+'] as const;

export default function ValidationModal({ isOpen, onComplete }: ValidationModalProps) {
    const [step, setStep] = useState<'submit' | 'validate'>('submit');
    const [currentPostIndex, setCurrentPostIndex] = useState(0);

    // Simple link submission
    const [postLink, setPostLink] = useState('');

    // Validation state
    const [rating, setRating] = useState(0);
    const [viewRange, setViewRange] = useState('');

    if (!isOpen) return null;

    const handleSubmitLink = () => {
        if (!postLink.trim()) {
            alert('Please paste your post link');
            return;
        }
        setStep('validate');
    };

    const handleNextPost = () => {
        // Award points (mock)
        const beliefEarned = rating === 5 ? 20 : rating === 4 ? 15 : rating === 3 ? 10 : rating === 2 ? 5 : 0;
        console.log(`Validator +50 Boost, Author +${beliefEarned} Belief`);

        // Reset
        setRating(0);
        setViewRange('');

        if (currentPostIndex < MOCK_PEER_POSTS.length - 1) {
            setCurrentPostIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const currentPost = MOCK_PEER_POSTS[currentPostIndex];
    const isValidationFormValid = rating > 0 && viewRange !== '';

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {step === 'submit' && (
                    <>
                        <h2 className={styles.title}>SOCIAL PROOF</h2>
                        <p className={styles.desc}>Post about Trenches, then drop your link below.</p>

                        <div className={styles.linkSubmission}>
                            <div className={styles.linkField}>
                                <label>POST URL</label>
                                <input
                                    type="url"
                                    className={styles.linkInput}
                                    placeholder="Paste link from any platform..."
                                    value={postLink}
                                    onChange={(e) => setPostLink(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            className={styles.continueBtn}
                            onClick={handleSubmitLink}
                            disabled={!postLink.trim()}
                        >
                            SUBMIT
                        </button>
                    </>
                )}

                {step === 'validate' && (
                    <>
                        <h2 className={styles.title}>VALIDATE ({currentPostIndex + 1}/{MOCK_PEER_POSTS.length})</h2>
                        <p className={styles.desc}>Review to earn <span className={styles.highlight}>+50 BST</span></p>

                        <div className={styles.peerPost}>
                            <div className={styles.postHeader}>
                                <span className={styles.author}>{currentPost.author}</span>
                                <span className={styles.platform}>{currentPost.platform}</span>
                            </div>
                            <p className={styles.content}>{currentPost.content}</p>
                            <a href="#" className={styles.viewPost} target="_blank">VIEW →</a>
                        </div>

                        <div className={styles.form}>
                            <div className={styles.field}>
                                <label className={styles.fieldLabel}>
                                    <span className={styles.labelText}>QUALITY</span>
                                </label>
                                <div className={styles.rating}>
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button
                                            key={n}
                                            className={`${styles.rateBtn} ${rating === n ? styles.active : ''}`}
                                            onClick={() => setRating(n)}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.fieldLabel}>
                                    <span className={styles.labelText}>VIEWS</span>
                                </label>
                                <select
                                    className={styles.select}
                                    value={viewRange}
                                    onChange={(e) => setViewRange(e.target.value)}
                                >
                                    <option value="">Select</option>
                                    {VIEW_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            <button
                                className={styles.submitBtn}
                                disabled={!isValidationFormValid}
                                onClick={handleNextPost}
                            >
                                NEXT →
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
