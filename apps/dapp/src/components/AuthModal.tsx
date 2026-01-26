"use client";

import styles from './AuthModal.module.css';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    if (!isOpen) return null;

    const handleLogin = (provider: string) => {
        // Mock login delay
        setTimeout(() => {
            onSuccess();
        }, 800);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2 className={styles.title}>ACCESS REQUIRED</h2>
                <p className={styles.subtitle}>Sign in to join the Trench.</p>

                <div className={styles.options}>
                    <button className={styles.optionBtn} onClick={() => handleLogin('passkey')}>
                        <span className={styles.icon}>🔑</span>
                        PASSKEY
                    </button>
                    <button className={styles.optionBtn} onClick={() => handleLogin('google')}>
                        <span className={styles.icon}>G</span>
                        GOOGLE
                    </button>
                    <button className={styles.optionBtn} onClick={() => handleLogin('apple')}>
                        <span className={styles.icon}></span>
                        APPLE
                    </button>
                    <button className={styles.optionBtn} onClick={() => handleLogin('x')}>
                        <span className={styles.icon}>𝕏</span>
                        TWITTER / X
                    </button>
                </div>

                <button className={styles.cancelBtn} onClick={onClose}>CANCEL</button>
            </div>
        </div>
    );
}
