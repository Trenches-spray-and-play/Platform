"use client";

import { useState } from "react";
import { useUIStore } from "@/store/uiStore";
import { useSubmitContent } from "@/hooks/useQueries";
import styles from "../page.module.css";

export default function ContentSubmitModal() {
    const modalData = useUIStore((state) => state.modalData);
    const closeModal = useUIStore((state) => state.closeModal);
    const addToast = useUIStore((state) => state.addToast);
    const submitMutation = useSubmitContent();

    const [submitUrl, setSubmitUrl] = useState("");
    const [submitPlatform, setSubmitPlatform] = useState(modalData?.platforms?.[0] || "");

    if (!modalData) return null;

    const handleSubmitContent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!submitUrl || !submitPlatform) return;

        try {
            await submitMutation.mutateAsync({
                campaignId: modalData.id,
                url: submitUrl,
                platform: submitPlatform,
            });

            addToast('Content submitted successfully!', 'success');
            closeModal();
        } catch (error) {
            console.error("Failed to submit content:", error);
            addToast('Failed to submit content', 'error');
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Submit Content</h3>
                    <button className={styles.modalClose} onClick={closeModal}>×</button>
                </div>
                <form onSubmit={handleSubmitContent} className={styles.modalForm}>
                    <div className={styles.formGroup}>
                        <label>Campaign</label>
                        <div className={styles.formValue}>{modalData.name}</div>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Platform</label>
                        <select
                            value={submitPlatform}
                            onChange={(e) => setSubmitPlatform(e.target.value)}
                            required
                            className={styles.select}
                        >
                            {modalData.platforms.map((platform: string) => (
                                <option key={platform} value={platform}>{platform}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Content URL</label>
                        <input
                            type="url"
                            value={submitUrl}
                            onChange={(e) => setSubmitUrl(e.target.value)}
                            placeholder="https://..."
                            required
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={submitMutation.isPending}>
                            {submitMutation.isPending ? "Submitting..." : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
