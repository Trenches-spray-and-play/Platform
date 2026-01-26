"use client";

import { useState, useEffect } from 'react';
import styles from './ReviewPool.module.css';

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

interface ReviewPoolProps {
    userId: string;
    onReview: (post: ReviewPost) => void;
    onSubmit: () => void;
}

const PLATFORM_ICONS: Record<string, string> = {
    'x': 'X',
    'twitter': 'X',
    'telegram': 'TG',
    'youtube': 'YT',
    'medium': 'MD',
};

export default function ReviewPool({ userId, onReview, onSubmit }: ReviewPoolProps) {
    const [posts, setPosts] = useState<ReviewPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchReviewPool();
    }, [userId]);

    const fetchReviewPool = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/posts?validatorId=${userId}&limit=10`);
            const data = await res.json();

            if (data.success) {
                setPosts(data.data || []);
            } else {
                setError(data.error || 'Failed to load');
            }
        } catch (err) {
            setError('Failed to fetch review pool');
        } finally {
            setLoading(false);
        }
    };

    const getPlatformIcon = (platform: string) => {
        return PLATFORM_ICONS[platform.toLowerCase()] || '🔗';
    };

    const truncateUrl = (url: string, maxLength: number = 40) => {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength) + '...';
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.title}>Review Pool</span>
                </div>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.title}>Review Pool</span>
                <span className={styles.count}>{posts.length} items</span>
            </div>

            {posts.length === 0 ? (
                <div className={styles.empty}>
                    <p>No content to review</p>
                    <button className={styles.submitBtn} onClick={onSubmit}>
                        Submit Content
                    </button>
                </div>
            ) : (
                <>
                    <div className={styles.list}>
                        {posts.map(post => (
                            <div key={post.id} className={styles.item}>
                                <span className={styles.platform}>
                                    {getPlatformIcon(post.platform)}
                                </span>
                                <span className={styles.author}>
                                    @{post.user.handle}
                                </span>
                                <span className={styles.url}>
                                    {truncateUrl(post.url)}
                                </span>
                                <span className={styles.endorsements}>
                                    ↑{post.endorsements}
                                </span>
                                <button
                                    className={styles.reviewBtn}
                                    onClick={() => onReview(post)}
                                >
                                    Review
                                </button>
                            </div>
                        ))}
                    </div>
                    <button className={styles.submitBtn} onClick={onSubmit}>
                        + Submit Content
                    </button>
                </>
            )}
        </div>
    );
}
