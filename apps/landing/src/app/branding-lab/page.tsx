"use client";

import React from "react";
import Link from "next/link";
import styles from "./lab.module.css";
import { ArrowRight, Sparkles, BookOpen, ShieldCheck, Heart, Zap, Video, Layers } from "lucide-react";

export default function BrandingLabHub() {
    const variations = [
        {
            id: "v1",
            title: "Modern Startup",
            desc: "Clean & professional SaaS-style dashboard",
            icon: <Sparkles size={24} />,
            color: "#00FF66"
        },
        {
            id: "v2",
            title: "Educational Canvas",
            desc: "Instruction-first walkthrough with soft visuals",
            icon: <BookOpen size={24} />,
            color: "#3B82F6"
        },
        {
            id: "v3",
            title: "Trust-Built FinTech",
            desc: "Bank-like clarity and security focus",
            icon: <ShieldCheck size={24} />,
            color: "#10B981"
        },
        {
            id: "v4",
            title: "Community Pulse",
            desc: "Vibrant and friendly social-first approach",
            icon: <Heart size={24} />,
            color: "#F59E0B"
        },
        {
            id: "v5",
            title: "Essentialist Minimalist",
            desc: "Zero distractions, pure focus on logic",
            icon: <Zap size={24} />,
            color: "#FFFFFF"
        }
    ];

    const demos = [
        {
            id: "viral-videos",
            title: "Viral Video Concepts",
            desc: "High-energy video previews for TikTok/Reels/X (Newbie + Crypto Native versions)",
            icon: <Video size={24} />,
            color: "#FF3366"
        },
        {
            id: "demo-suite",
            title: "Component Demo Suite",
            desc: "Interactive showcase of UI components and animations",
            icon: <Layers size={24} />,
            color: "#8B5CF6"
        }
    ];

    return (
        <main className={styles.hubContainer}>
            <header className={styles.hubHeader}>
                <h1>Branding Presentation Lab</h1>
                <p>Exploring 5 newbie-friendly ways to tell the Trenches story.</p>
            </header>

            <div className={styles.hubGrid}>
                {variations.map((v) => (
                    <Link key={v.id} href={`/branding-lab/${v.id}`} className={styles.hubCard}>
                        <div className={styles.cardIcon} style={{ color: v.color }}>
                            {v.icon}
                        </div>
                        <div className={styles.cardContent}>
                            <h2>{v.title}</h2>
                            <p>{v.desc}</p>
                        </div>
                        <ArrowRight className={styles.cardArrow} size={20} />
                    </Link>
                ))}
            </div>

            <header className={styles.hubHeader} style={{ marginTop: '4rem' }}>
                <h1>Marketing Campaign Demos</h1>
                <p>Interactive demos for walkthrough campaigns and viral content.</p>
            </header>

            <div className={styles.hubGrid}>
                {demos.map((d) => (
                    <Link key={d.id} href={`/branding-lab/${d.id}`} className={styles.hubCard}>
                        <div className={styles.cardIcon} style={{ color: d.color }}>
                            {d.icon}
                        </div>
                        <div className={styles.cardContent}>
                            <h2>{d.title}</h2>
                            <p>{d.desc}</p>
                        </div>
                        <ArrowRight className={styles.cardArrow} size={20} />
                    </Link>
                ))}
            </div>

            <footer className={styles.hubFooter}>
                <Link href="/branding">View Current Branding Page</Link>
            </footer>
        </main>
    );
}
