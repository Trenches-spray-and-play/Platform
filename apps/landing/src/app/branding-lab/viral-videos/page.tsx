"use client";

import React, { useState, useEffect } from "react";
import styles from "./viral.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Target,
  ArrowRight,
  Users,
  Shield,
  Timer,
  ChevronRight,
  Sparkles,
  Flame,
  AlertTriangle
} from "lucide-react";

// ===================== TYPES =====================
type VideoType = "newbie" | "crypto";
type VideoSection = "hook" | "proof" | "tiers" | "cta";

interface VideoFrame {
  id: string;
  duration: number;
  component: React.ReactNode;
}

// ===================== VIDEO 1: GET PAID (NEWBIE) =====================
const GetPaidVideo = ({ isPlaying, currentFrame }: { isPlaying: boolean; currentFrame: number }) => {
  const [animatedAmount, setAnimatedAmount] = useState(100);
  
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setAnimatedAmount(prev => prev >= 1000 ? 100 : prev + 50);
    }, 200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const frames: VideoFrame[] = [
    {
      id: "hook",
      duration: 8000,
      component: (
        <div className={styles.videoFrame}>
          <div className={styles.moneyBackground}>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className={styles.floatingBill}
                initial={{ y: -100, x: Math.random() * 300 - 150, rotate: 0 }}
                animate={{ 
                  y: 600, 
                  x: Math.random() * 300 - 150,
                  rotate: 360 
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2, 
                  repeat: Infinity,
                  delay: i * 0.2 
                }}
              >
                <DollarSign size={32} />
              </motion.div>
            ))}
          </div>
          <div className={styles.frameContent}>
            <motion.div 
              className={styles.giveawayBadge}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Sparkles size={20} />
              <span>$10,000,000</span>
              <Sparkles size={20} />
            </motion.div>
            <motion.h2 
              className={styles.frameTitle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              MARKETING FUNDS
              <br />
              <span className={styles.highlightGreen}>WAITING FOR YOU</span>
            </motion.h2>
            <motion.p 
              className={styles.frameSubtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Projects spend MILLIONS on marketing every month
            </motion.p>
            <div className={styles.projectGrid}>
              {["$2.5M", "$5M", "$10M", "$1.5M"].map((amount, i) => (
                <motion.div
                  key={i}
                  className={styles.projectCard}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.15 }}
                >
                  <div className={styles.projectIcon}><Target size={24} /></div>
                  <div className={styles.projectAmount}>{amount}</div>
                  <div className={styles.projectLabel}>DISTRIBUTION</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: "proof",
      duration: 7000,
      component: (
        <div className={styles.videoFrame}>
          <div className={styles.frameContent}>
            <motion.div
              className={styles.roiCard}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className={styles.roiHeader}>
                <TrendingUp size={28} />
                <span>FIXED 1.5X PAYOUT</span>
              </div>
              <div className={styles.roiMath}>
                <motion.div 
                  className={styles.roiInput}
                  animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <span className={styles.roiLabel}>YOU PUT IN</span>
                  <span className={styles.roiAmount}>${animatedAmount}</span>
                </motion.div>
                <motion.div 
                  className={styles.roiArrow}
                  animate={{ x: isPlaying ? [0, 10, 0] : 0 }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <ArrowRight size={40} />
                </motion.div>
                <motion.div 
                  className={styles.roiOutput}
                  animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                >
                  <span className={styles.roiLabel}>YOU GET OUT</span>
                  <span className={styles.roiAmountHighlight}>${Math.round(animatedAmount * 1.5)}</span>
                </motion.div>
              </div>
              <motion.div 
                className={styles.roiBadge}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Shield size={18} />
                <span>NOT TRADING. GUARANTEED.</span>
              </motion.div>
            </motion.div>
            <motion.p 
              className={styles.frameCaption}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Help projects get awareness → They pay you directly
            </motion.p>
          </div>
        </div>
      )
    },
    {
      id: "tiers",
      duration: 7000,
      component: (
        <div className={styles.videoFrame}>
          <div className={styles.frameContent}>
            <motion.h3 
              className={styles.tierTitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              CHOOSE YOUR SPEED
            </motion.h3>
            <div className={styles.tierGrid}>
              {[
                { name: "RAPID", time: "24 HOURS", min: "$100", max: "$1,000", color: "#00FF66" },
                { name: "MID", time: "7 DAYS", min: "$100", max: "$10,000", color: "#00CCFF" },
                { name: "DEEP", time: "30 DAYS", min: "$1,000", max: "$100,000", color: "#FF66FF" }
              ].map((tier, i) => (
                <motion.div
                  key={tier.name}
                  className={styles.tierCard}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.2 }}
                  style={{ borderColor: tier.color }}
                >
                  <div className={styles.tierHeader} style={{ color: tier.color }}>
                    <Zap size={20} />
                    <span>{tier.name}</span>
                  </div>
                  <div className={styles.tierTime}>{tier.time}</div>
                  <div className={styles.tierRange}>{tier.min} - {tier.max}</div>
                  <motion.div 
                    className={styles.tierPayout}
                    animate={{ opacity: isPlaying ? [0.5, 1, 0.5] : 1 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ color: tier.color }}
                  >
                    1.5X PAYOUT
                  </motion.div>
                </motion.div>
              ))}
            </div>
            <motion.div 
              className={styles.speedCaption}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Timer size={16} />
              <span>Turn $1k into $1,500 in 24 hours. No guessing.</span>
            </motion.div>
          </div>
        </div>
      )
    },
    {
      id: "cta",
      duration: 8000,
      component: (
        <div className={styles.videoFrame} style={{ background: "linear-gradient(135deg, #00FF66 0%, #00CC52 100%)" }}>
          <div className={styles.frameContent}>
            <motion.div
              className={styles.ctaLogo}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className={styles.logoMarkWhite}>T</div>
            </motion.div>
            <motion.h2 
              className={styles.ctaTitle}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              LOCK YOUR POSITION
            </motion.h2>
            <motion.p 
              className={styles.ctaSubtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              GET PAID FOR YOUR ATTENTION
            </motion.p>
            <motion.button
              className={styles.ctaButton}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              JOIN WAITLIST
              <ChevronRight size={20} />
            </motion.button>
            <motion.div 
              className={styles.ctaUrgency}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Flame size={14} />
              <span>First Trenches opening soon</span>
            </motion.div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={styles.videoPlayer}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentFrame}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className={styles.videoContent}
        >
          {frames[currentFrame]?.component}
        </motion.div>
      </AnimatePresence>
      
      {/* Progress Bar */}
      <div className={styles.progressBar}>
        {frames.map((_, i) => (
          <div 
            key={i} 
            className={`${styles.progressSegment} ${i === currentFrame ? styles.active : ''} ${i < currentFrame ? styles.completed : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

// ===================== VIDEO 2: EXIT LIQUIDITY (CRYPTO NATIVES) =====================
const ExitLiquidityVideo = ({ isPlaying, currentFrame }: { isPlaying: boolean; currentFrame: number }) => {
  const frames: VideoFrame[] = [
    {
      id: "hook",
      duration: 3000,
      component: (
        <div className={styles.videoFrame} style={{ background: "#DC2626" }}>
          <div className={styles.frameContent}>
            <motion.div
              className={styles.redAlert}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <AlertTriangle size={60} />
            </motion.div>
            <motion.h2 
              className={styles.redTitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              THEY&apos;RE WINNING.
            </motion.h2>
            <motion.div
              className={styles.pulseLine}
              animate={{ scaleX: isPlaying ? [0, 1, 0] : 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </div>
      )
    },
    {
      id: "problem",
      duration: 6000,
      component: (
        <div className={styles.videoFrame}>
          <div className={styles.frameContent}>
            <div className={styles.problemGrid}>
              {[
                { icon: <Users size={32} />, text: "EXCHANGES TAKE 40%", sub: "Listing fees, market making" },
                { icon: <AlertTriangle size={32} />, text: "YOU TAKE THE RISK", sub: "Exit liquidity for VCs" },
                { icon: <TrendingUp size={32} />, text: "PUMPS & DUMPS", sub: "Manipulated charts" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className={styles.problemCard}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.3 }}
                >
                  <div className={styles.problemIcon}>{item.icon}</div>
                  <div className={styles.problemText}>{item.text}</div>
                  <div className={styles.problemSub}>{item.sub}</div>
                </motion.div>
              ))}
            </div>
            <motion.div 
              className={styles.victimCounter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <span>You are the product.</span>
            </motion.div>
          </div>
        </div>
      )
    },
    {
      id: "solution",
      duration: 8000,
      component: (
        <div className={styles.videoFrame}>
          <div className={styles.frameContent}>
            <motion.div
              className={styles.solutionBanner}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <span className={styles.solutionTag}>WE&apos;RE CHANGING THE RULES</span>
            </motion.div>
            
            <div className={styles.giveawayMontage}>
              {["$1M", "$5M", "$10M", "$2.5M", "$8M", "$3M"].map((amount, i) => (
                <motion.div
                  key={i}
                  className={styles.montageItem}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                >
                  <DollarSign size={16} />
                  {amount}
                </motion.div>
              ))}
            </div>

            <motion.div 
              className={styles.settlementCard}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <div className={styles.settlementLabel}>THE 1.5X SETTLEMENT</div>
              <div className={styles.settlementMath}>
                <span className={styles.settlementIn}>$1,000</span>
                <motion.span 
                  className={styles.settlementArrow}
                  animate={{ x: isPlaying ? [0, 10, 0] : 0 }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  →
                </motion.span>
                <span className={styles.settlementOut}>$1,500</span>
              </div>
              <motion.div 
                className={styles.cashSound}
                initial={{ opacity: 0 }}
                animate={{ opacity: isPlaying ? [0, 1, 0] : 0 }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                *CHA-CHING* 💰
              </motion.div>
            </motion.div>

            <motion.div 
              className={styles.directPay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <div className={styles.directPayLine}>PROJECTS PAY YOU DIRECTLY</div>
              <div className={styles.directPayLine}>FOR REAL ATTENTION</div>
            </motion.div>
          </div>
        </div>
      )
    },
    {
      id: "cta",
      duration: 2000,
      component: (
        <div className={styles.videoFrame} style={{ background: "#00FF66" }}>
          <div className={styles.frameContent}>
            <motion.h2 
              className={styles.finalCTA}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              JOIN THE TRENCHES
            </motion.h2>
            <motion.div 
              className={styles.url}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              playtrenches.xyz
            </motion.div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={styles.videoPlayer}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentFrame}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={styles.videoContent}
        >
          {frames[currentFrame]?.component}
        </motion.div>
      </AnimatePresence>
      
      <div className={styles.progressBar}>
        {frames.map((_, i) => (
          <div 
            key={i} 
            className={`${styles.progressSegment} ${i === currentFrame ? styles.active : ''} ${i < currentFrame ? styles.completed : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

// ===================== MAIN PAGE COMPONENT =====================
export default function ViralVideosDemo() {
  const [activeTab, setActiveTab] = useState<VideoType>("newbie");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const videoConfigs = {
    newbie: { frames: 4, title: "Get Paid", subtitle: "Beginner-Friendly", duration: 30000 },
    crypto: { frames: 4, title: "Exit Liquidity", subtitle: "Crypto Natives", duration: 25000 }
  };

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        const next = prev + 1;
        if (next >= videoConfigs[activeTab].frames) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
    }, activeTab === "newbie" ? 7500 : 6000);

    return () => clearInterval(interval);
  }, [isPlaying, activeTab]);

  const handlePlay = () => {
    if (currentFrame >= videoConfigs[activeTab].frames - 1) {
      setCurrentFrame(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleTabChange = (tab: VideoType) => {
    setActiveTab(tab);
    setCurrentFrame(0);
    setIsPlaying(false);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>T</div>
          <span>VIRAL VIDEO DEMO</span>
        </div>
        <nav className={styles.nav}>
          <a href="/branding-lab">← Back to Lab</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>High-Energy Viral Video Concepts</h1>
          <p>Code-based animated video previews for social media campaigns. No AI-generated images—pure CSS/React animations.</p>
        </div>

        {/* Video Selector */}
        <div className={styles.selector}>
          <button 
            className={`${styles.tab} ${activeTab === "newbie" ? styles.active : ""}`}
            onClick={() => handleTabChange("newbie")}
          >
            <span className={styles.tabTitle}>Video 1: Get Paid</span>
            <span className={styles.tabSubtitle}>For Newbies • 30s • Educational</span>
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "crypto" ? styles.active : ""}`}
            onClick={() => handleTabChange("crypto")}
          >
            <span className={styles.tabTitle}>Video 2: Exit Liquidity</span>
            <span className={styles.tabSubtitle}>For Crypto Natives • 25s • Aggressive</span>
          </button>
        </div>

        {/* Video Player */}
        <div className={styles.playerContainer}>
          <div className={styles.phoneFrame}>
            <div className={styles.phoneNotch} />
            
            {activeTab === "newbie" ? (
              <GetPaidVideo isPlaying={isPlaying} currentFrame={currentFrame} />
            ) : (
              <ExitLiquidityVideo isPlaying={isPlaying} currentFrame={currentFrame} />
            )}

            {/* Controls */}
            <div className={styles.controls}>
              <button className={styles.controlBtn} onClick={handlePlay}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <div className={styles.controlInfo}>
                <span>{videoConfigs[activeTab].title}</span>
                <span>Frame {currentFrame + 1}/{videoConfigs[activeTab].frames}</span>
              </div>
              <button className={styles.controlBtn} onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
          </div>

          {/* Script Panel */}
          <div className={styles.scriptPanel}>
            <h3>Video Script</h3>
            {activeTab === "newbie" ? (
              <div className={styles.scriptContent}>
                <div className={styles.scriptSection}>
                  <span className={styles.scriptTime}>0:00-0:08</span>
                  <h4>The Money Shot</h4>
                  <p><strong>Visual:</strong> Collage of giveaway screenshots with floating money animation</p>
                  <p><strong>Text:</strong> &quot;$10,000,000 DISTRIBUTION&quot;</p>
                  <p><strong>Audio:</strong> &quot;Did you know web3 projects spend MILLIONS on marketing every month?&quot;</p>
                </div>
                <div className={styles.scriptSection}>
                  <span className={styles.scriptTime}>0:08-0:15</span>
                  <h4>The Social Proof</h4>
                  <p><strong>Visual:</strong> ROI Calculator showing $100 → $150</p>
                  <p><strong>Text:</strong> &quot;50% PROFIT. FIXED.&quot;</p>
                  <p><strong>Audio:</strong> &quot;It&apos;s not trading. It&apos;s a fixed 1.5x payout.&quot;</p>
                </div>
                <div className={styles.scriptSection}>
                  <span className={styles.scriptTime}>0:15-0:22</span>
                  <h4>Choose Your Speed</h4>
                  <p><strong>Visual:</strong> 3 cards: RAPID (24h), MID (7d), DEEP (30d)</p>
                  <p><strong>Audio:</strong> &quot;Choose your speed. No guessing, just growth.&quot;</p>
                </div>
                <div className={styles.scriptSection}>
                  <span className={styles.scriptTime}>0:22-0:30</span>
                  <h4>The CTA</h4>
                  <p><strong>Visual:</strong> Zenith Green background with CTA</p>
                  <p><strong>Text:</strong> &quot;LOCK YOUR POSITION&quot;</p>
                  <p><strong>Audio:</strong> &quot;Join the waitlist now. Let&apos;s go!&quot;</p>
                </div>
              </div>
            ) : (
              <div className={styles.scriptContent}>
                <div className={styles.scriptSection}>
                  <span className={styles.scriptTime}>0:00</span>
                  <h4>The Hook</h4>
                  <p><strong>Visual:</strong> Red screen, flashing text</p>
                  <p><strong>Text:</strong> &quot;THEY&apos;RE WINNING.&quot;</p>
                </div>
                <div className={styles.scriptSection}>
                  <span className={styles.scriptTime}>0:03</span>
                  <h4>The Problem</h4>
                  <p><strong>Visual:</strong> Exchange screenshots, warning icons</p>
                  <p><strong>Text:</strong> &quot;EXCHANGES TAKE 40%&quot; / &quot;YOU TAKE THE RISK&quot;</p>
                </div>
                <div className={styles.scriptSection}>
                  <span className={styles.scriptTime}>0:09</span>
                  <h4>The Pivot</h4>
                  <p><strong>Visual:</strong> Black screen, green text</p>
                  <p><strong>Text:</strong> &quot;WE&apos;RE CHANGING THE RULES.&quot;</p>
                </div>
                <div className={styles.scriptSection}>
                  <span className={styles.scriptTime}>0:12</span>
                  <h4>The Solution</h4>
                  <p><strong>Visual:</strong> Giveaway montage, $1M-$10M numbers</p>
                  <p><strong>Text:</strong> &quot;THE 1.5X SETTLEMENT&quot;</p>
                  <p><strong>SFX:</strong> Cash register &quot;Cha-ching&quot; at 0:15</p>
                </div>
                <div className={styles.scriptSection}>
                  <span className={styles.scriptTime}>0:23</span>
                  <h4>The CTA</h4>
                  <p><strong>Visual:</strong> Zenith Green background</p>
                  <p><strong>Text:</strong> &quot;JOIN THE TRENCHES.&quot; / playtrenches.xyz</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className={styles.features}>
          <h3>Video Features</h3>
          <div className={styles.featureGrid}>
            {[
              { icon: <Zap size={24} />, title: "Fast Transitions", desc: "Quick cuts to maintain attention" },
              { icon: <DollarSign size={24} />, title: "Money Animation", desc: "CSS-based floating currency effects" },
              { icon: <TrendingUp size={24} />, title: "ROI Calculator", desc: "Live-animated math visualization" },
              { icon: <Target size={24} />, title: "Targeted Messaging", desc: "Different scripts per audience" },
              { icon: <Timer size={24} />, title: "Optimal Length", desc: "25-30s for maximum retention" },
              { icon: <Flame size={24} />, title: "High Energy", desc: "Aggressive phonk beats, bold text" }
            ].map((feature, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h4>{feature.title}</h4>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Notes */}
        <div className={styles.techNotes}>
          <h3>Technical Implementation</h3>
          <div className={styles.codeBlock}>
            <pre>{`// React + Framer Motion Animation Structure
const videoFrames = [
  {
    id: "hook",
    duration: 8000,
    component: <MoneyShotFrame /> // Floating bills, giveaway cards
  },
  {
    id: "proof", 
    duration: 7000,
    component: <ROICalculatorFrame /> // Animated math
  },
  // ... more frames
];

// Auto-advance logic
useEffect(() => {
  if (!isPlaying) return;
  const timer = setInterval(() => {
    setCurrentFrame(f => (f + 1) % totalFrames);
  }, frameDuration);
  return () => clearInterval(timer);
}, [isPlaying]);`}</pre>
          </div>
          <div className={styles.techSpecs}>
            <div className={styles.spec}>
              <strong>Format:</strong> Vertical 9:16 (1080x1920)
            </div>
            <div className={styles.spec}>
              <strong>Platform:</strong> TikTok, Reels, X (Twitter)
            </div>
            <div className={styles.spec}>
              <strong>Tech Stack:</strong> React, Framer Motion, CSS Modules
            </div>
            <div className={styles.spec}>
              <strong>Audio:</strong> Aggressive phonk beat + SFX
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
