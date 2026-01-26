"use client";

import { useState } from 'react';
import styles from './SubmitContentModal.module.css';

interface SubmitContentModalProps {
    isOpen: boolean;
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

type Platform = 'x' | 'telegram' | 'youtube' | 'medium';
type ContentType = 'thread' | 'video' | 'article';

const PLATFORMS: { id: Platform; icon: string; label: string }[] = [
    { id: 'x', icon: 'X', label: 'X' },
    { id: 'telegram', icon: 'TG', label: 'Telegram' },
    { id: 'youtube', icon: 'YT', label: 'YouTube' },
    { id: 'medium', icon: 'MD', label: 'Medium' },
];

const CONTENT_TYPES: { id: ContentType; label: string }[] = [
    { id: 'thread', label: 'Thread' },
    { id: 'video', label: 'Video' },
    { id: 'article', label: 'Article' },
];

export default function SubmitContentModal({ isOpen, userId, onClose, onSuccess }: SubmitContentModalProps) {
    const [platform, setPlatform] = useState<Platform>('x');
    const [contentType, setContentType] = useState<ContentType>('thread');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!url.trim()) {
            setError('Please enter a URL');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    platform,
                    url: url.trim(),
                    contentType,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setUrl('');
                setPlatform('x');
                setContentType('thread');
                onSuccess();
                onClose();
            } else {
                setError(data.error || 'Failed to submit');
            }
        } catch (err) {
            setError('Failed to submit content');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>

                <h2 className={styles.title}>Submit Content</h2>

                <div className={styles.platformRow}>
                    {PLATFORMS.map(p => (
                        <button
                            key={p.id}
                            className={`${styles.platformBtn} ${platform === p.id ? styles.active : ''}`}
                            onClick={() => setPlatform(p.id)}
                        >
                            <span className={styles.platformIcon}>{p.icon}</span>
                        </button>
                    ))}
                </div>

                <input
                    type="url"
                    className={styles.urlInput}
                    placeholder="Enter URL"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                />

                <div className={styles.typeRow}>
                    {CONTENT_TYPES.map(t => (
                        <button
                            key={t.id}
                            className={`${styles.typeBtn} ${contentType === t.id ? styles.active : ''}`}
                            onClick={() => setContentType(t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
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
