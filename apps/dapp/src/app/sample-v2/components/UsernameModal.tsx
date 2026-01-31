"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import styles from "./UsernameModal.module.css";

interface UsernameModalProps {
    referralInfo?: { referrerHandle: string } | null;
}

export default function UsernameModal({ referralInfo }: UsernameModalProps) {
    const router = useRouter();
    const closeModal = useUIStore((state) => state.closeModal);
    const addToast = useUIStore((state) => state.addToast);

    const [username, setUsername] = useState("");
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Generate suggestions based on input
    useEffect(() => {
        if (username.length >= 3 && !isAvailable && isAvailable !== null) {
            const base = username.replace(/[0-9_]+$/, "");
            const newSuggestions = [
                `${base}_dev`,
                `${base}_xyz`,
                `${base}_2025`,
            ].filter(s => s !== username && s.length <= 20);
            setSuggestions(newSuggestions.slice(0, 3));
        } else {
            setSuggestions([]);
        }
    }, [username, isAvailable]);

    // Debounced username check
    const checkUsername = useCallback(async (value: string) => {
        if (value.length < 3) {
            setIsAvailable(null);
            setErrorMessage(value.length > 0 ? "Username must be at least 3 characters" : "");
            return;
        }

        // Client-side validation
        if (!/^[a-z0-9_]+$/.test(value)) {
            setIsAvailable(false);
            setErrorMessage("Only lowercase letters, numbers, and underscores");
            return;
        }

        setIsChecking(true);
        try {
            const res = await fetch(`/api/user/username?check=${encodeURIComponent(value)}`);
            const data = await res.json();
            setIsAvailable(data.available);
            setErrorMessage(data.reason || "");
        } catch {
            setErrorMessage("Failed to check availability");
        } finally {
            setIsChecking(false);
        }
    }, []);

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (username) {
                checkUsername(username);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [username, checkUsername]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAvailable || isSubmitting) return;

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/user/username", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
            const data = await res.json();

            if (data.success) {
                addToast("Welcome to Trenches!", "success");
                closeModal();
                router.refresh(); // Refresh to update user state
            } else {
                setErrorMessage(data.error || "Failed to claim username");
                setIsAvailable(false);
            }
        } catch {
            setErrorMessage("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setUsername(suggestion);
        setSuggestions([]);
        inputRef.current?.focus();
    };

    const getStatusIndicator = () => {
        if (isChecking) {
            return (
                <div className={styles.statusChecking}>
                    <div className={styles.spinner} />
                    <span>Checking...</span>
                </div>
            );
        }
        if (isAvailable === true) {
            return (
                <div className={styles.statusAvailable}>
                    <span className={styles.checkIcon}>✓</span>
                    <span>Available</span>
                </div>
            );
        }
        if (isAvailable === false) {
            return (
                <div className={styles.statusTaken}>
                    <span className={styles.crossIcon}>✕</span>
                    <span>Taken</span>
                </div>
            );
        }
        return null;
    };

    // Prevent closing modal - username is required
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            // Shake animation or subtle feedback that this is required
            addToast("Please choose a username to continue", "warning");
        }
    };

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.welcomeBadge}>
                        <span className={styles.pulseDot} />
                        Welcome to Trenches
                    </div>
                    <h2 className={styles.title}>Choose your identity</h2>
                    <p className={styles.subtitle}>
                        Pick a unique username. This is how others will recognize you.
                    </p>

                    {referralInfo && (
                        <div className={styles.referralBanner}>
                            <span className={styles.referralIcon}>🎁</span>
                            <span>Referred by @{referralInfo.referrerHandle}</span>
                        </div>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Input Section */}
                    <div className={styles.inputSection}>
                        <label className={styles.inputLabel}>
                            Username
                            {getStatusIndicator()}
                        </label>

                        <div
                            className={`${styles.inputWrapper} ${
                                isAvailable === true
                                    ? styles.valid
                                    : isAvailable === false
                                    ? styles.invalid
                                    : ""
                            }`}
                        >
                            <span className={styles.atSymbol}>@</span>
                            <input
                                ref={inputRef}
                                type="text"
                                className={styles.input}
                                value={username}
                                onChange={(e) =>
                                    setUsername(
                                        e.target.value
                                            .toLowerCase()
                                            .replace(/[^a-z0-9_]/g, "")
                                            .slice(0, 20)
                                    )
                                }
                                placeholder="your_username"
                                maxLength={20}
                                autoComplete="off"
                                autoCapitalize="off"
                                spellCheck={false}
                            />
                            <span className={styles.charCount}>
                                {username.length}/20
                            </span>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <p className={styles.errorMessage}>{errorMessage}</p>
                        )}

                        {/* Suggestions */}
                        {suggestions.length > 0 && (
                            <div className={styles.suggestions}>
                                <span className={styles.suggestionsLabel}>Try:</span>
                                {suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        className={styles.suggestionChip}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        @{suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Rules */}
                    <div className={styles.rules}>
                        <div className={`${styles.rule} ${username.length >= 3 ? styles.met : ""}`}>
                            <span className={styles.ruleIcon}>
                                {username.length >= 3 ? "✓" : "•"}
                            </span>
                            <span>3-20 characters</span>
                        </div>
                        <div
                            className={`${styles.rule} ${
                                /^[a-z0-9_]*$/.test(username) && username.length > 0 ? styles.met : ""
                            }`}
                        >
                            <span className={styles.ruleIcon}>
                                {/^[a-z0-9_]*$/.test(username) && username.length > 0 ? "✓" : "•"}
                            </span>
                            <span>Letters, numbers, underscores only</span>
                        </div>
                        <div className={`${styles.rule} ${isAvailable === true ? styles.met : ""}`}>
                            <span className={styles.ruleIcon}>
                                {isAvailable === true ? "✓" : "•"}
                            </span>
                            <span>Available</span>
                        </div>
                    </div>

                    {/* Important Note */}
                    <div className={styles.importantNote}>
                        <span className={styles.noteIcon}>ℹ</span>
                        <p>
                            Your username <strong>cannot be changed later</strong>. Choose wisely!
                        </p>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={!isAvailable || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className={styles.btnSpinner} />
                                Claiming...
                            </>
                        ) : (
                            "Claim Username"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
