"use client";

import { useState } from 'react';
import styles from './ReviewModal.module.css';

interface ReviewPost {
    id: string;
    platform: string;
    url: string;
    contentType: string;
    endorsements: number;
    user: {
        id: string;
        handle: string;
        beliefScore: number;
    };
}

interface ReviewModalProps {
    isOpen: boolean;
    post: ReviewPost | null;
    validatorId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const PLATFORM_ICONS: Record<string, string> = {
    'x': '𝕏',
    'twitter': '𝕏',
    'telegram': '✈️',
    'youtube': '▶️',
    'medium': 'M',
};

export default function ReviewModal({ isOpen, post, validatorId, onClose, onSuccess }: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [proofUrl, setProofUrl] = useState('');
    const [endorsed, setEndorsed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        if (!post) return;

        try {
            setLoading(true);
            setError(null);

            const res = await fetch('/api/validations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId: post.id,
                    validatorId,
                    rating,
                    proofUrl: proofUrl.trim() || undefined,
                    endorsed,
                }),
            });

            const data = await res.json();

            if (data.success) {
                // Reset form
                setRating(0);
                setProofUrl('');
                setEndorsed(false);
                onSuccess();
                onClose();
            } else {
                setError(data.error || 'Failed to submit');
            }
        } catch (err) {
            setError('Failed to submit validation');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !post) return null;

    const platformIcon = PLATFORM_ICONS[post.platform.toLowerCase()] || '🔗';

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>

                <h2 className={styles.title}>Validate Content</h2>

                <div className={styles.contentPreview}>
                    <span className={styles.platform}>{platformIcon}</span>
                    <span className={styles.author}>@{post.user.handle}</span>
                    <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.viewLink}
                    >
                        View →
                    </a>
                </div>

                <div className={styles.ratingSection}>
                    <div className={styles.stars}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                className={`${styles.star} ${rating >= star ? styles.active : ''}`}
                                onClick={() => setRating(star)}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>

                <input
                    type="url"
                    className={styles.proofInput}
                    placeholder="Proof URL (optional)"
                    value={proofUrl}
                    onChange={e => setProofUrl(e.target.value)}
                />

                <div className={styles.endorseRow}>
                    <span className={styles.endorseLabel}>Endorse?</span>
                    <button
                        className={`${styles.toggle} ${endorsed ? styles.active : ''}`}
                        onClick={() => setEndorsed(!endorsed)}
                    >
                        <span className={styles.toggleKnob} />
                    </button>
                </div>

                <div className={styles.rewards}>
                    <span className={styles.rewardItem}>+50 BOOST POINTS</span>
                    {endorsed && (
                        <span className={styles.rewardItem}>AUTHOR BELIEF INCREASED</span>
                    )}
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <button
                    className={styles.submitBtn}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Submit'}
                </button>
            </div>
        </div>
    );
}
