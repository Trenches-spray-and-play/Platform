"use client";

import React from "react";
import styles from "./branding.module.css";
import { Logo } from "@trenches/ui";
import { Download, Copy, ExternalLink, ChevronLeft, ChevronRight, Shield, Zap, TrendingUp, Wallet, Clock, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BrandingPage() {
    const downloadSVG = (type: "full" | "icon" | "highres") => {
        const svgElement = document.querySelector(`#logo-${type} svg`);
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const svgUrl = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = `trenches-logo-${type}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard");
    };

    const brandAssets = {
        tagline: "WHERE TOKENS EARN BELIEF",
        shortBio: "The first high-frequency P2P settlement layer for token incubation and community coordination. Built in the trenches.",
        longBio: "TRENCHES is the first non-custodial coordination layer engineered for hyper-visibility and pre-market growth. Earn 50% more on your tokens through verified social engagement and institutional-grade P2P settlement mechanics. Powered by belief.",
        twitterBio: "Where Tokens Earn Belief. 🔫\nThe first high-frequency P2P settlement layer for token incubation & distribution.\n\nEnlist: playtrenches.xyz",
    };

    const [currentSlide, setCurrentSlide] = React.useState(0);

    const slides = [
        {
            title: "THE_COMMUNITY_MARKETING_FUND",
            subtitle: "WHY_WE_ARE_HERE",
            content: "Every project on Trenches sets aside a reward fund for you. It's like a 'thank you' reward for helping them grow. By participating and sharing the project, you get a piece of this reward fund that is otherwise locked away.",
            stats: [
                { label: "FUND_SOURCE", value: "PROJECT_RESERVE" },
                { label: "PURPOSE", value: "AWARENESS_BOOST" }
            ],
            icon: <TrendingUp size={48} color="var(--accent-zenith)" />,
            info: "This is a **Marketing Incentive** designed to grow the project's community by rewarding those who believe in it early."
        },
        {
            title: "PROTECTING_YOUR_SUPPORT: USD_VALUE_PEG",
            subtitle: "SECURITY_MECHANISM",
            content: "We protect your money. If you start with $100, we make sure you get $150 back. We use dollar values, so even if the coin price goes up or down while you wait, you still get your full profit based on the dollars you started with.",
            stats: [
                { label: "VALUE_PEG", value: "USD_NORMALIZED" },
                { label: "PROTECTION", value: "ANTI_VOLATILITY" }
            ],
            icon: <Shield size={48} color="var(--accent-zenith)" />,
            visualType: "protection",
            info: "This ensures you ultimately **don't lose money** if the token price drops. You are always made whole based on USD value."
        },
        {
            title: "THE_GROWTH_FLYWHEEL: HOW_EVERYONE_WINS",
            subtitle: "THE_POSITIVE_LOOP",
            content: "As more people join, the demand for the project goes up. This makes the project's reward fund more valuable, helping the game run longer. Everyone winning attracts even more people, making the project and your rewards even stronger.",
            stats: [
                { label: "DEMAND", value: "HYPER_GROWTH" },
                { label: "RESERVE_VALUE", value: "INCREASING" }
            ],
            icon: <TrendingUp size={48} color="var(--accent-zenith)" />,
            visualType: "flywheel",
            info: "As the project grows, the **real-world value** that goes to you increases even faster due to community momentum."
        },
        {
            title: "SUSTAINABILITY_DEEP_DIVE: THE_NUMBERS",
            subtitle: "HOW_IT_WORKS",
            content: "Example: If a $50M project has 20,000 players join, the massive growth in users and attention makes the coins much more valuable. Since the project kept 10% ($5M) to pay you, this growth in value easily covers everyone's 50% profit rewards.",
            stats: [
                { label: "PLAYERS", value: "20,000+" },
                { label: "RESERVE", value: "$5,000,000" }
            ],
            icon: <TrendingUp size={48} color="var(--accent-zenith)" />,
            visualType: "sustainability",
            info: "The **Reserve Appreciation** model ensures that the more players enter, the more valuable the fund becomes to support them."
        },
        {
            title: "SIMPLE_FLOW: HELP_&_EARN",
            subtitle: "THE_PROCESS",
            content: "1. HELP: Send support to others currently in line.\n2. SHARE: Tell others about the project to move up faster.\n3. GET PAID: When it's your turn, you receive your original money back plus a 50% cash bonus. It's a simple circle of people helping each other win.",
            stats: [
                { label: "ACTION", value: "SPRAY_&_PLAY" },
                { label: "REWARD", value: "AUTOMATIC" }
            ],
            icon: <Zap size={48} color="var(--accent-zenith)" />,
            info: "The system **connects you directly** to other community members for a seamless, automatic reward exchange."
        },
        {
            title: "STEP_1: CONNECT_&_SETUP",
            subtitle: "GETTING_STARTED",
            content: "Welcome! First, log in with your Google account and choose a username. Next, connect your digital wallets (EVM and SOL). IMPORTANT: Use a personal wallet like MetaMask or Rabby. Do NOT use exchange accounts like Binance or Bybit. This is your private account where your money and rewards are safely stored.",
            stats: [
                { label: "SETUP_TIME", value: "< 1 MIN" },
                { label: "EVM & SOL WALLET (NO CEX)", value: "REQUIRED" }
            ],
            icon: <Wallet size={48} color="var(--accent-zenith)" />,
            visualType: "onboarding_enlist",
            info: "Need help? [Learn how to create a personal wallet](https://support.metamask.io/hc/en-us/articles/360015489531-Getting-started-with-MetaMask)."
        },
        {
            title: "STEP_2: DEPOSIT_&_NETWORK_MATCH",
            subtitle: "SECURE_DEPLOYMENT",
            content: "Go to your profile and use the 'Deposit' section. It's vital to choose the right network: use the SOL address for Solana projects and the EVM address for Ethereum/Base. Once you send funds, it usually takes 1-3 minutes for the system to confirm and reflect the balance in your account.",
            stats: [
                { label: "NETWORKS", value: "EVM + SOL" },
                { label: "REFLECT_TIME", value: "1-3 MINS" }
            ],
            icon: <ExternalLink size={48} color="var(--accent-zenith)" />,
            visualType: "onboarding_deploy",
            info: "Always double-check your network! Funds sent to the wrong network may be unrecoverable."
        },
        {
            title: "STEP_3: DOMINATE_WITH_TASKS_&_RAIDS",
            subtitle: "ACTIVE_WARFARE",
            content: "Don't just wait—win. Complete 'Tasks' for one-time point boosts, post 'Content' to earn ongoing rewards, and join 'Raids' to push the project as a team. These actions earn you Belief Points (to climb the leaderboard) and Boost Points (to slash your payout timer).",
            stats: [
                { label: "TASKS", value: "ONE-TIME" },
                { label: "RAIDS", value: "COMMUNITY" }
            ],
            icon: <Zap size={48} color="var(--accent-zenith)" />,
            visualType: "onboarding_engage",
            info: "**Belief Points** increase your rank. **Boost Points** make your payout countdown go faster."
        },
        {
            title: "STEP_4: REACH_THE_FRONT_&_COLLECT",
            subtitle: "THE_PAYOUT",
            content: "When your timer hits zero and you reach the front of the line, the system automatically sends your money. You'll get everything you started with plus a 50% cash bonus, delivered straight to your personal wallet.",
            stats: [
                { label: "TOTAL_ROI", value: "1.5X" },
                { label: "SETTLEMENT", value: "AUTOMATIC" }
            ],
            icon: <Zap size={48} color="var(--accent-zenith)" />,
            visualType: "onboarding_payout",
            info: "Payouts are **automatic** and happen instantly when you reach the top of the line."
        },
        {
            title: "STEP_5: RE-ENTER_TO_WIN_AGAIN",
            subtitle: "INFINITE_GROWTH",
            content: "The game keeps going! Most successful players use their profits to enter the trench again. By repeating this loop, you keep growing your money and help the project reach new heights while maintaining your top ranking.",
            stats: [
                { label: "STRATEGY", value: "GROW_YOUR_MONEY" },
                { label: "SPEED", value: "MAX_VELOCITY" }
            ],
            icon: <Clock size={48} color="var(--accent-zenith)" />,
            visualType: "onboarding_loop",
            info: "**Re-entering** keeps the system moving and creates long-term value for you and the community."
        },
        {
            title: "THE_SAFETY_NET: GUARANTEED_FLOW",
            subtitle: "TOTAL_SECURITY",
            content: "The project backs the game with a dedicated allocation of supply. This reserve ensures the game stays fast and everyone gets their bonus, regardless of how many new people join. Your payout is guaranteed by the project's own marketing commitment.",
            stats: [
                { label: "BACKING", value: "LOCKED_SUPPLY" },
                { label: "STATUS", value: "ALWAYS_ACTIVE" }
            ],
            icon: <Shield size={48} color="var(--accent-zenith)" />,
            info: "The **Safety Reserve** acts as a baseline, ensuring the reward system keeps functioning at a steady pace."
        }
    ];

    const renderVisual = (type: string | undefined, icon: React.ReactNode) => {
        if (type === "flywheel") {
            return (
                <div className={styles.flywheelContainer}>
                    <motion.div
                        className={styles.flywheelCircle}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    >
                        <div className={styles.flywheelNode} style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }}>DEMAND</div>
                        <div className={styles.flywheelNode} style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>RESERVES</div>
                        <div className={styles.flywheelNode} style={{ left: 0, top: '50%', transform: 'translateY(-50%)' }}>VALUE</div>
                        <div className={styles.flywheelNode} style={{ right: 0, top: '50%', transform: 'translateY(-50%)' }}>REWARDS</div>
                    </motion.div>
                    <div className={styles.flywheelCenter}><Logo variant="icon" width={40} /></div>
                </div>
            );
        }

        if (type === "protection") {
            return (
                <div className={styles.chartContainer}>
                    <div className={styles.chartBar} style={{ height: '40%', background: 'rgba(255,255,255,0.1)' }}>
                        <span className={styles.chartLabel}>$100_ENTRY</span>
                    </div>
                    <div className={styles.chartArrow}><ChevronRight size={24} /></div>
                    <div className={styles.chartBar} style={{ height: '70%', background: 'var(--accent-zenith)' }}>
                        <span className={styles.chartLabel}>$150_PAYOUT</span>
                    </div>
                </div>
            );
        }

        if (type === "sustainability") {
            return (
                <div className={styles.sustainabilityContainer}>
                    <div className={styles.mathRow}>
                        <div className={styles.mathBox}>
                            <span className={styles.mathVal}>$50M</span>
                            <span className={styles.mathLab}>MCAP</span>
                        </div>
                        <div className={styles.mathOp}>+</div>
                        <div className={styles.mathBox}>
                            <span className={styles.mathVal}>20K</span>
                            <span className={styles.mathLab}>PLAYERS</span>
                        </div>
                    </div>
                    <div className={styles.mathResult}>
                        <div className={styles.resultArrow}>↓</div>
                        <div className={styles.reserveCard}>
                            <div className={styles.reserveHeader}>RESERVE_VALUE_GROWTH</div>
                            <div className={styles.reserveProgress}>
                                <motion.div
                                    className={styles.reserveFill}
                                    initial={{ width: "30%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                />
                            </div>
                            <div className={styles.reserveLabels}>
                                <span>INITIAL_$5M</span>
                                <span className={styles.neonText}>TARGET_$\infty$</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (type?.startsWith("onboarding_")) {
            return (
                <div className={styles.onboardingVisual}>
                    <div className={styles.stepIcon}>{icon}</div>
                    <div className={styles.stepBadge}>{type.split('_')[1].toUpperCase()}</div>
                    <div className={styles.stepDots}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`${styles.stepDot} ${type === `onboarding_${['enlist', 'deploy', 'engage', 'payout', 'loop'][i - 1]}` ? styles.activeDot : ''}`} />
                        ))}
                    </div>
                </div>
            );
        }

        return <div className="animate-pulse">{icon}</div>;
    };

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>BRAND_ASSETS</h1>
                <p className={styles.subtitle}>[ TACTICAL_IDENTITY_KIT_V1.0 ]</p>
            </header>

            <section className={styles.intelSection}>
                <div className={styles.intelContainer}>
                    <div className={styles.briefingHeader}>
                        <div>
                            <span className={styles.briefingSubtitle}>OPERATIONAL_OVERVIEW</span>
                            <h2 className={styles.briefingTitle}>INTEL_BRIEFING</h2>
                        </div>
                        <div className={styles.slideIndicator}>
                            FILE_{currentSlide + 1}_OF_{slides.length}
                        </div>
                    </div>

                    <div className={styles.presentationFrame}>
                        {/* Visual Process Map */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
                            {slides.map((_, step) => (
                                <div
                                    key={step}
                                    style={{
                                        height: '3px',
                                        flex: 1,
                                        minWidth: '20px',
                                        maxWidth: '60px',
                                        background: step <= currentSlide ? 'var(--accent-zenith)' : 'rgba(255,255,255,0.1)',
                                        transition: 'all 0.5s ease',
                                        borderRadius: '2px',
                                        boxShadow: step <= currentSlide ? '0 0 10px var(--accent-zenith)' : 'none'
                                    }}
                                />
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlide}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4 }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={(e, { offset, velocity }) => {
                                    const swipe = offset.x;
                                    if (swipe < -50) {
                                        nextSlide();
                                    } else if (swipe > 50) {
                                        prevSlide();
                                    }
                                }}
                                className={styles.slideContent}
                            >
                                <div className={styles.slideText}>
                                    <span className={styles.assetLabel}>{slides[currentSlide].subtitle}</span>
                                    <h3>{slides[currentSlide].title}</h3>
                                    <p>{slides[currentSlide].content}</p>

                                    <div className={styles.statsGrid}>
                                        {slides[currentSlide].stats.map((stat, i) => (
                                            <div key={i} className={styles.statItem}>
                                                <span className={styles.statValue}>{stat.value}</span>
                                                <span className={styles.statLabel}>{stat.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={styles.infoBlock}>
                                        <Info size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: slides[currentSlide].info
                                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--accent-zenith);text-decoration:underline">$1</a>')
                                            }}
                                            style={{ display: 'inline' }}
                                        />
                                    </div>
                                </div>

                                <div className={styles.visualPanel}>
                                    {renderVisual(slides[currentSlide].visualType, slides[currentSlide].icon)}
                                    <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', opacity: 0.1, fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }}>
                                        TR_INTEL_SRV // {currentSlide + 101}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <div className={styles.slideNav}>
                            <button className={styles.downloadBtn} onClick={() => window.open('/docs', '_blank')}>
                                <ExternalLink size={14} style={{ marginRight: '8px' }} /> ACCESS_FULL_DOCUMENTATION
                            </button>
                            <div className={styles.navControls}>
                                <button className={styles.navBtn} onClick={prevSlide}>
                                    <ChevronLeft size={20} />
                                </button>
                                <button className={styles.navBtn} onClick={nextSlide}>
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Visual Identity</h2>
                <div className={styles.assetGrid}>
                    <div className={styles.assetCard}>
                        <span className={styles.assetLabel}>LOGO_HORIZONTAL</span>
                        <div id="logo-full">
                            <Logo />
                        </div>
                        <button className={styles.downloadBtn} onClick={() => downloadSVG("full")}>
                            <Download size={14} style={{ marginRight: '8px' }} /> DOWNLOAD_SVG
                        </button>
                    </div>

                    <div className={styles.assetCard}>
                        <span className={styles.assetLabel}>LOGO_ICON_ONLY</span>
                        <div id="logo-icon">
                            <Logo variant="icon" width={60} color="#fff" />
                        </div>
                        <button className={styles.downloadBtn} onClick={() => downloadSVG("icon")}>
                            <Download size={14} style={{ marginRight: '8px' }} /> DOWNLOAD_SVG
                        </button>
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>High Resolution Identity</h2>
                <div className={styles.assetGrid}>
                    <div className={styles.assetCard} style={{ gridColumn: 'span 2' }}>
                        <span className={styles.assetLabel}>LARGE_FOR_PRINT_SVG (1200 x 1200)</span>
                        <div id="logo-highres" style={{ padding: '4rem', background: '#000', borderRadius: '24px' }}>
                            <Logo variant="icon" width={400} color="#fff" />
                        </div>
                        <button className={styles.downloadBtn} onClick={() => downloadSVG("highres")}>
                            <Download size={14} style={{ marginRight: '8px' }} /> DOWNLOAD_1200X1200_ASSET
                        </button>
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Social Media Previews</h2>
                <div className={styles.assetGrid}>
                    <div className={styles.assetCard}>
                        <span className={styles.assetLabel}>DISPLAY_PICTURE</span>
                        <div className={styles.dpPreview}>
                            <Logo variant="icon" width={80} color="#fff" />
                        </div>
                        <p style={{ fontSize: '0.7rem', color: '#555', marginTop: '1rem' }}>SQUARE_B&W_AVA</p>
                    </div>

                    <div className={styles.assetCard}>
                        <span className={styles.assetLabel}>X_HEADER_PREVIEW</span>
                        <div className={styles.headerPreview}>
                            <Logo variant="horizontal" />
                        </div>
                        <p style={{ fontSize: '0.7rem', color: '#555', marginTop: '1rem' }}>CINEMATIC_BANNER_CONCEPT</p>
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Written Intelligence</h2>
                <div className={styles.bioBox}>
                    <div className={styles.bioItem}>
                        <span className={styles.bioTag}>PRIMARY_TAGLINE</span>
                        <div className={styles.copyText} onClick={() => copyToClipboard(brandAssets.tagline)}>
                            {brandAssets.tagline}
                        </div>
                    </div>

                    <div className={styles.bioItem}>
                        <span className={styles.bioTag}>X_TWITTER_BIO (MAX 160)</span>
                        <div className={styles.copyText} onClick={() => copyToClipboard(brandAssets.twitterBio)}>
                            {brandAssets.twitterBio}
                        </div>
                    </div>

                    <div className={styles.bioItem}>
                        <span className={styles.bioTag}>PROJECT_MISSION_STATEMENT</span>
                        <div className={styles.copyText} onClick={() => copyToClipboard(brandAssets.longBio)}>
                            {brandAssets.longBio}
                        </div>
                    </div>
                </div>
            </section>

            <footer style={{ marginTop: '5rem', opacity: 0.3, fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                END_OF_INTEL_PACKAGE // TRB_SYS_01
            </footer>
        </main>
    );
}
