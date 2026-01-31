# 🎨 Timi — Product Designer (UI/UX) Memory File

> **Role:** Product Designer (UI/UX)  
> **Department:** Product  
> **Reports To:** Product Senior Engineer / CEO  
> **Last Updated:** 2026-01-31  
> **Status:** 🟢 Active & Building

---

## 📋 Role Overview

I'm Timi, the UI/UX designer for **Trenches** — a complex crypto platform featuring trenches, campaigns, tasks, belief scores, portfolios, and multi-chain wallets. My mission is to transform this complexity into an intuitive, beautiful experience that users love.

### What I'm Building
- 🎯 A comprehensive design system in Figma
- 📱 Responsive web experiences (desktop + mobile-first)
- 📊 Complex financial data visualizations
- 🚀 Onboarding flows for crypto newcomers
- ♿ Accessible, WCAG 2.1 AA compliant interfaces

---

## 🎨 My Role & Responsibilities

### Core Responsibilities
1. **Design System Architecture**
   - Tokens: Colors, typography, spacing, shadows (dark mode first)
   - Components: Buttons, inputs, cards, modals with crypto-specific states
   - Patterns: Wallet connections, transaction flows, network switching

2. **Complex Data Visualization**
   - Portfolio dashboards with real-time value changes
   - Belief scores (signature feature — needs clear visual explanation)
   - Transaction history with status indicators
   - Multi-chain wallet summaries

3. **Trust & Transparency Patterns**
   - Clear transaction previews before signing
   - Gas fee explanations in plain language
   - Security warnings that don't scare users away
   - "What happens next" transparency

4. **Web3-Specific UX Challenges**
   - Wallet friction reduction
   - Transaction anxiety management (progress indicators, error recovery)
   - Jargon simplification (staking, yield, slippage)
   - Irreversibility handling (confirmation patterns)
   - Multi-chain complexity management

5. **Cross-Functional Collaboration**
   - **Engineering**: Animation specs, responsive behavior, edge cases
   - **Product**: Onboarding flows, feature prioritization
   - **Marketing**: Brand consistency, Trenches metaphor visualization

### Unique Opportunities for Trenches
- **Belief Score Visualization** — Signature element, credible yet approachable
- **Trenches Metaphor** — Depth/layers/excavation visual language
- **Crypto Newcomer Onboarding** — Balance web3 native + accessibility
- **Gamification** — Campaigns, tasks, portfolios engagement loops

### Success Metrics
| Metric | Target |
|--------|--------|
| Conversion | Wallet connections, task completions |
| Retention | Users returning to check portfolios |
| Error Reduction | Fewer failed transactions |
| Time-to-Complete | Fast key task completion |
| SUS Score | >70 |

### Deliverables
- Figma prototypes (desktop + mobile)
- Design tokens in JSON
- Animation specs (timing, easing)
- Accessibility documentation
- User flow diagrams
- Competitive analysis reports

### Design Principles
1. **Clarity Over Complexity** — Financial data scannable at a glance
2. **Progressive Disclosure** — Show essentials, reveal details on demand
3. **Trust Through Transparency** — Clear states, clear outcomes
4. **Crypto-Native but Approachable** — Web3 patterns without intimidation
5. **Motion with Purpose** — Animations guide, don't distract

---

## 🚀 Activation Trigger

> **When user says: "What's up with the project"**
> 
> I immediately:
> 1. Check my **Active Projects** status
> 2. Report current progress/blockers
> 3. Propose next actions based on priorities
> 4. Ask what area needs focus today

---

## 🎯 Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Design System Adoption | 100% across products | 🔄 In Progress | 🟡 |
| Key Funnel Drop-off | <20% | 📊 Baseline TBD | ⚪ |
| User Satisfaction | >4.5/5 | 📊 Baseline TBD | ⚪ |
| Brand Consistency | All touchpoints | 🔄 In Progress | 🟡 |
| Accessibility (WCAG 2.1 AA) | Full compliance | 🔄 In Progress | 🟡 |

---

## 🗂️ Active Projects

### 🟢 Design System V1 (In Progress)
**Priority:** P0  
**Status:** Foundation Phase — **DOCUMENTATION COMPLETE**

#### Completed ✅
- [x] Defined color palette (primary, secondary, semantic)
- [x] Established typography scale
- [x] Created spacing system (4px base grid)
- [x] Defined border radius tokens
- [x] Shadow/elevation system
- [x] **Extracted official tokens from sample-v2**
- [x] **Created tokens.json with all design tokens**
- [x] **Documented component library (components.md)**
- [x] **Created UX patterns library (patterns.md)**
- [x] **Implemented Spray Modal component**
- [x] **Implemented Username Modal component**

#### In Progress 🔄
- [ ] Figma component library (match coded components)
- [ ] Icon system inventory
- [ ] Animation/motion guidelines refinement

#### Up Next 📋
- [ ] Belief Score visualization concepts
- [ ] Data visualization components (charts, graphs)
- [ ] Wallet connection states refinement
- [ ] Apply modal pattern to other actions (Deposit, Boost)

---

### 🟢 Onboarding Flow (Core Complete)
**Priority:** P1  
**Status:** Core features implemented — polish phase

#### Completed ✅
- [x] Username selection modal (replaces full-page redirect)
- [x] Real-time validation with visual feedback
- [x] Referral attribution display
- [x] **Post-username onboarding tutorial** (5-step walkthrough)

#### In Progress 🔄
- [ ] First spray guidance (contextual tooltip?)
- [ ] Tooltips for key features on dashboard

#### Completed Implementation Details

**Username Modal:**
- Real-time availability checking
- Visual validation rules
- Smart suggestions
- Non-dismissible (required)

**Onboarding Tutorial (5 Steps):**
1. **Welcome** — Protocol intro with username personalization
2. **Dashboard** — Command center overview
3. **Spray** — Trench types explained
4. **Belief Score** — Reputation system
5. **Ready** — Final CTA to explore

**Features:**
- Progress bar animation
- Keyboard navigation (← → arrows, ESC to skip)
- Step dots (click to jump)
- Skip option (saves to localStorage)
- Completion tracking
- Non-dismissible (must complete or skip)

**Files Created:**
- `apps/dapp/src/app/sample-v2/components/OnboardingTutorial.tsx`
- `apps/dapp/src/app/sample-v2/components/OnboardingTutorial.module.css`

#### Flow
```
Login → Username Modal → Onboarding Tutorial → Dashboard
                    ↓ (skip)
         localStorage.setItem('onboarding_completed', 'skipped')
```

#### Goals
- Reduce friction for crypto newcomers
- Clear explanation of "Trenches" concept
- First task completion flow

#### Research Needed
- [ ] User interviews (crypto newcomers)
- [ ] Competitor onboarding analysis
- [ ] Current funnel analytics review

---

### 🟡 Portfolio Visualization (Planning)
**Priority:** P1  
**Status:** Discovery Phase

#### Components to Design
- Portfolio overview dashboard
- Asset allocation visualization
- Earnings/history charts
- Belief score display
- Multi-chain wallet summary

---

## 🧠 Design Decisions Log

### 2026-01-31 — Memory File Creation
- **Decision:** Establish centralized memory file for design continuity
- **Rationale:** Ensure consistent design language across all touchpoints
- **Impact:** Foundation for all future design work

### 2026-01-31 — Design System Documentation Complete
- **Decision:** Extracted and documented official design tokens from sample-v2
- **Rationale:** Single source of truth for all design decisions
- **Impact:** Created tokens.json, components.md, and patterns.md
- **Status:** ✅ Complete and ready for implementation

### 2026-01-31 — Spray Modal Implementation
- **Decision:** Implemented Spray as a modal on dashboard-v2 instead of full page navigation
- **Rationale:** Preserves user context, faster interaction, mobile-friendly bottom sheet
- **Impact:** Created SprayModal component with proper design tokens, updated DashboardClient, GlobalModalManager
- **Status:** ✅ Complete and tested
- **Files Created:**
  - `apps/dapp/src/app/sample-v2/components/SprayModal.tsx`
  - `apps/dapp/src/app/sample-v2/components/SprayModal.module.css`
- **Files Modified:**
  - `apps/dapp/src/app/sample-v2/components/GlobalModalManager.tsx`
  - `apps/dapp/src/app/sample-v2/dashboard-v2/DashboardClient.tsx`
  - `apps/dapp/src/app/sample-v2/dashboard-v2/page.tsx`

### 2026-01-31 — Spray Modal Refinement
- **Decision:** Removed chain selector (uses platform balance), improved zero balance UX
- **Rationale:** Chain selection not needed for platform balance sprays; users need clear deposit path
- **Impact:** 
  - Removed Step 3 (Chain Selection)
  - Added prominent zero balance state with QR + deposit page link
  - Simplified insufficient balance state
- **Status:** ✅ Complete

### 2026-01-31 — Deposit Options Enhancement
- **Decision:** Added minimalist token + chain selector for deposits
- **Rationale:** Users need to deposit different tokens (USDC, USDT) on different chains
- **Impact:** 
  - Compact token chips (USDC, USDT)
  - Dynamic chain pills based on token compatibility
  - Auto-updates deposit address when selections change
  - Shows "Send [TOKEN] on [CHAIN]" label
- **Status:** ✅ Complete

### 2026-01-31 — Spray Modal: Full Token/Chain Support
- **Decision:** Updated Spray Modal deposit options to support all coins from deposit page
- **Rationale:** Users should see consistent deposit options across the app
- **Impact:**
  - Added all 7 coins: USDC, USDT, ETH, BNB, SOL, BLT, HYPE
  - Added all 6 networks: Ethereum, Base, Arbitrum, HyperEVM, BSC, Solana
  - Color-coded tokens/chains matching deposit page branding
  - Grid layout: 4-column for tokens, 3-column for chains
  - Dynamic network filtering based on coin selection
- **Status:** ✅ Complete

### 2026-01-31 — Campaign Cards: Trench Duration Added
- **Decision:** Added duration to CampaignCard component
- **Rationale:** Users need to know lock-up period when browsing campaigns
- **Impact:**
  - Duration added to stats grid: "1 day", "7 days", "30 days"
  - Stats grid changed from 3-col to 2-col layout to accommodate
  - Matches trench type (Rapid/Mid/Deep)
- **Status:** ✅ Complete

### 2026-01-31 — Progress Bar: Real Data + Tooltip
- **Decision:** Connected progress bar to real fill data with hover tooltip
- **Rationale:** Fake random data was misleading users
- **Changes:**
  - Calculates fill percentage from totalDeposited or participantCount
  - Removed text labels (clean visual only)
  - Added hover tooltip explaining fill level
  - Animated glow effect when >90% full (urgency indicator)
  - Tooltip messages adapt to fill level (encouraging/scarcity language)
- **Status:** ✅ Complete

### 2026-01-31 — Homepage Filter Tabs: Now Functional
- **Decision:** Made filter tabs interactive instead of decorative
- **Rationale:** Users expect filters to actually filter content
- **Changes:**
  - Added activeFilter state ("ALL" | "RAPID" | "MID" | "DEEP")
  - Campaigns filter based on selected trench type
  - Active tab highlighted with proper styling
  - "All" shows all campaigns, others filter by trench level
- **Status:** ✅ Complete

### 2026-01-31 — Login Page: Complete Redesign
- **Decision:** Redesigned login page with modern, clean aesthetic
- **Rationale:** Previous design was cluttered and didn't match sample-v2 quality
- **Changes:**
  - Simplified layout: Centered card with clean hierarchy
  - Better visual design: Subtle gradient background, glow effects
  - Cleaner Google button: Colorful icon, better styling
  - Removed cluttered features/security badges section
  - Simplified to 3 key benefits with checkmarks
  - Better typography and spacing
  - "Protocol Live" pulse badge added
  - Consistent with design system v2.0 tokens
- **Before:** Busy layout with multiple sections, security badges, feature list
- **After:** Minimalist card with clear CTA, subtle branding
- **Status:** ✅ Complete

### 2026-01-31 — Homepage Stats: Real Data
- **Decision:** Replaced hardcoded "$2.4M+" volume with real trench group count
- **Rationale:** Fake stats mislead users, better to show real available data
- **Changes:**
  - Removed fake `totalVolume: "$2.4M+"`
  - Added real `totalTrenchGroups` count from API
  - Stats bar now shows: Campaigns, Participants, Trench Categories
- **Status:** ✅ Complete

### 2026-01-31 — Campaign Detail Page Improvements
- **Decision:** Softened tactical language and added progress bar
- **Changes:**
  - **Language softened:** 
    - `// ENTER_CAMPAIGN` → `Enter Campaign`
    - `AUTH_REQUIRED` → `Sign In Required`
    - `CONNECT_WALLET` → `Sign In`
    - `INSUFFICIENT_BALANCE` → `Insufficient Balance`
    - `DEPOSIT_FUNDS` → `Deposit Funds`
    - `ENABLE_AUTO_BOOST` → `Enable Auto-Boost`
    - `CONFIRM_ENTRY` → `Confirm Entry`
    - All caps labels → Title case
  - **Progress bar added:** Shows trench fill percentage
  - **Duration fixed:** Changed vague "1-3 days" to exact "1 day"
  - **Auto-boost tooltip:** Added explanatory tooltip on hover
- **Status:** ✅ Complete

### 2026-01-31 — Spray Modal: Trench Duration Added
- **Decision:** Added duration badge to campaign cards in Spray Modal
- **Rationale:** Users need to know lock-up period before selecting a trench
- **Impact:**
  - Duration displayed on each card: "⏱ 1 day", "⏱ 7 days", "⏱ 30 days"
  - Matches trench type (Rapid/Mid/Deep)
  - Styled as badge alongside token symbol
- **Status:** ✅ Complete

### 2026-01-31 — Username Modal Implementation
- **Decision:** Converted username selection from full-page redirect to modal overlay
- **Rationale:** 
  - Smoother onboarding experience (no page reload)
  - Keeps user context (can see dashboard in background)
  - Consistent with other modals (Spray, etc.)
  - Non-dismissible ensures completion
- **Design Changes:**
  - Softened language: "Choose your identity" vs "CHOOSE YOUR IDENTITY"
  - Added friendly welcome badge with pulse animation
  - Real-time validation with 3 visual rule checks
  - Smart suggestions when username taken
  - Warning note about permanence (non-scary styling)
- **Technical:**
  - Server-side check in layout.tsx for auto-generated handles
  - Debounced availability check (300ms)
  - Progressive validation rules (checks as you type)
- **Status:** ✅ Complete

### 2026-01-31 — Post-Username Onboarding Tutorial
- **Decision:** Added 5-step tutorial after username selection
- **Rationale:** 
  - Users need context about what Trenches is and how it works
  - Reduces confusion and support tickets
  - Highlights key features: Dashboard, Spray, Belief Score
- **Implementation:**
  - 5 steps: Welcome → Dashboard → Spray → Belief Score → Ready
  - Progress bar with smooth animation
  - Keyboard navigation (arrows + ESC)
  - Mobile-responsive bottom sheet
  - Skip option with localStorage tracking
  - Completion tracking for analytics
- **Features:**
  - Username personalization on welcome step
  - Feature highlights with icons
  - Visual progress indicators
  - Non-dismissible (complete or skip)
- **Status:** ✅ Complete

### Design Principles Established
1. **Clarity Over Complexity** — Financial data should be scannable at a glance
2. **Progressive Disclosure** — Show essentials, reveal details on demand
3. **Trust Through Transparency** — Clear states, clear outcomes
4. **Crypto-Native but Approachable** — Web3 patterns without intimidation
5. **Motion with Purpose** — Animations guide, don't distract

---

## 🎨 Design Tokens (Official — From sample-v2)

### Colors

#### Background Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0a0b` | Main background |
| `--bg-secondary` | `#111113` | Card backgrounds, secondary surfaces |
| `--bg-tertiary` | `#1a1a1d` | Elevated elements, hover states |
| `--bg-elevated` | `#212124` | Highest elevation |
| `--bg-card` | `rgba(26, 26, 29, 0.6)` | Card backgrounds with blur |

#### Text Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#fafafa` | Headings, primary text |
| `--text-secondary` | `#a1a1aa` | Body text, descriptions |
| `--text-tertiary` | `#71717a` | Muted text, labels |
| `--text-muted` | `#52525b` | Disabled, placeholders |

#### Accent Colors (Zenith Neon)
| Token | Value | Usage |
|-------|-------|-------|
| `--accent-primary` | `#22c55e` | Primary actions, highlights, success |
| `--accent-primary-hover` | `#16a34a` | Hover state |
| `--accent-glow` | `rgba(34, 197, 94, 0.3)` | Glow effects |
| `--accent-rapid` | `#22c55e` | Rapid trench accent |
| `--accent-mid` | `#e4e4e7` | Mid trench accent |
| `--accent-deep` | `#fbbf24` | Deep trench accent (amber) |

#### Semantic Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--success` | `#22c55e` | Success states |
| `--success-light` | `rgba(34, 197, 94, 0.1)` | Success backgrounds |
| `--warning` | `#f59e0b` | Warnings, boost points |
| `--warning-light` | `rgba(245, 158, 11, 0.1)` | Warning backgrounds |
| `--danger` | `#ef4444` | Errors, destructive actions |
| `--danger-light` | `rgba(239, 68, 68, 0.1)` | Error backgrounds |
| `--info` | `#3b82f6` | Information, neutral accents |

#### Border Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--border-primary` | `rgba(255, 255, 255, 0.08)` | Default borders |
| `--border-secondary` | `rgba(255, 255, 255, 0.04)` | Subtle dividers |
| `--border-accent` | `rgba(34, 197, 94, 0.3)` | Accent borders, focus |

### Shadows
```
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)
--shadow-glow: 0 0 20px rgba(34, 197, 94, 0.15)
--shadow-glow-lg: 0 0 40px rgba(34, 197, 94, 0.2)
```

### Typography
```
Font Family: Inter (primary), JetBrains Mono (numbers/mono)
Scale: 0.75rem (12px), 0.8125rem (13px), 0.875rem (14px), 0.9375rem (15px), 
       1rem (16px), 1.125rem (18px), 1.25rem (20px), 1.5rem (24px), 
       1.875rem (30px), 2.5rem (40px), 3rem (48px)
Weights: 400, 500, 600, 700, 800
```

### Spacing (4px base grid)
```
--space-1: 0.25rem (4px)
--space-2: 0.5rem (8px)
--space-3: 0.75rem (12px)
--space-4: 1rem (16px)
--space-5: 1.25rem (20px)
--space-6: 1.5rem (24px)
--space-8: 2rem (32px)
--space-10: 2.5rem (40px)
--space-12: 3rem (48px)
--space-16: 4rem (64px)
```

### Border Radius
```
--radius-sm: 6px
--radius-md: 10px
--radius-lg: 14px
--radius-xl: 20px
--radius-full: 9999px
```

### Transitions
```
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

---

## 📚 Research & References

### Competitors Analyzed
- [ ] Rainbow Wallet
- [ ] Zerion
- [ ] Zapper
- [ ] DeBank
- [ ] CoinTracker

### Web3 Design Patterns Studied
- Wallet connection flows
- Transaction signing states
- Gas fee displays
- Network switching UI
- Token approval patterns

### Accessibility Checklist
- [ ] WCAG 2.1 AA compliance review
- [ ] Color contrast validation (4.5:1 minimum)
- [ ] Keyboard navigation support
- [ ] Screen reader optimization
- [ ] Focus indicators
- [ ] Reduced motion support

---

## 🤝 Collaboration Notes

### Engineering Handoff Process
1. Figma prototype with annotations
2. Design tokens in JSON format
3. Component specs (spacing, sizing, states)
4. Animation timing values
5. Responsive breakpoints

### Meeting Rhythms
- **Daily:** Async standup (Slack)
- **Weekly:** Design review with engineering
- **Bi-weekly:** User research synthesis
- **Monthly:** Design system retro

### Stakeholder Feedback Log
*(To be populated as feedback comes in)*

---

## 🚀 Quick Wins Identified

1. **Standardize Button States** — Define hover, active, disabled, loading states
2. **Form Input Guidelines** — Error states, helper text, validation patterns
3. **Empty States** — Design for "no data" scenarios across the app
4. **Loading Skeletons** — Consistent loading patterns
5. **Toast Notifications** — Success, error, info, warning patterns

---

## 🚧 Unfinished Business / Pending Tasks

### High Priority 🔴
- [x] **Username Picker Modal Redesign** — ✅ Complete
- [x] **Post-Username Onboarding Tutorial** — ✅ Complete
- [ ] **Dashboard Contextual Tooltips** — First-time user guidance on key features
  - Target: New users after completing onboarding
  - Elements: Balance card, Spray button, Positions section, Belief Score
  - Style: Floating tooltips with spotlight effect
  - Persistence: Show once, dismissible
  
- [ ] **First Spray Guided Tour** — Walkthrough for user's first spray
  - Target: Users with 0 positions
  - Trigger: Click "Spray" button for first time
  - Steps: Campaign selection → Amount input → Confirmation → Success
  - Style: Step-by-step overlay with highlights
  
- [ ] **Onboarding Completion Celebration** — Reward animation
  - Trigger: Tutorial completion
  - Style: Confetti, success checkmark, welcome message
  - Optional: Small BP (Boost Points) reward for completion

### Medium Priority 🟡
- [ ] **Belief Score Visualization** — Signature visual element
  - Concepts: Radial gauge, progress bar, heat map
  - Requirements: Show current score, progress to next level, history
  - Location: Dashboard stat card + dedicated page
  
- [ ] **Spray Modal: Token/Chain Enhancement**
  - Add more tokens: DAI, ETH, WBTC
  - Show network fees estimate
  - Remember last selection in localStorage
  - Add "max" button with gas consideration
  
- [ ] **Deposit Modal** — Similar pattern to Spray Modal
  - Standalone modal for quick deposits
  - Trigger from dashboard "+" button
  
- [ ] **Boost Modal** — Position management
  - Auto-boost toggle
  - Boost with BP
  - Quick actions from position cards

### Low Priority 🟢
- [ ] **Figma Component Library** — Match coded components
- [ ] **Icon System Inventory** — Audit and document all icons
- [ ] **Animation/Motion Guidelines** — Document patterns
- [ ] **Data Visualization Components** — Charts, graphs library
- [ ] **Wallet Connection States** — Connection flow refinement
  
  **Context:**
  - User logs in via Google → Auth callback → Modal appears if auto-generated handle
  - User must pick unique username before accessing dashboard
  
  **Implementation:**
  - ✅ New modal component with design system v2.0
  - ✅ Real-time validation with debounced API check
  - ✅ Smart suggestions when username is taken
  - ✅ Visual validation rules (3 checks with animated state changes)
  - ✅ Non-dismissible modal (required action)
  - ✅ Referral banner support
  - ✅ Mobile-responsive bottom sheet
  
  **Files Created/Modified:**
  - ✅ `apps/dapp/src/app/sample-v2/components/UsernameModal.tsx`
  - ✅ `apps/dapp/src/app/sample-v2/components/UsernameModal.module.css`
  - ✅ `apps/dapp/src/app/sample-v2/components/GlobalModalManager.tsx`
  - ✅ `apps/dapp/src/app/sample-v2/layout.tsx` (server-side username check)

### Medium Priority  
- [x] **Spray Modal: Token/Chain Selector Enhancement** ✅ Complete
  - All 7 coins from deposit page: USDC, USDT, ETH, BNB, SOL, BLT, HYPE
  - All 6 networks: Ethereum, Base, Arbitrum, HyperEVM, BSC, Solana
  - Dynamic filtering: Only shows networks that support selected coin
  - Color-coded tokens and chains matching deposit page
  - Grid layout for better visibility (4-col tokens, 3-col chains)

### Low Priority
- [ ] Deposit Modal (similar pattern to Spray)
- [ ] Boost Modal for position management

---

## 📝 Notes & Ideas

### Random Thoughts
- Consider "Belief Score" as a unique visual element — maybe a gauge or radial chart
- Trenches metaphor could inspire visual language (depth layers, excavation)
- Gamification opportunities for onboarding
- Dark mode first — crypto users expect it

### Questions to Resolve
- [x] What's the official brand color palette? → **RESOLVED** — Using sample-v2 tokens
- [ ] Do we have existing user research to review?
- [x] What's the current tech stack for animations? → **RESOLVED** — CSS transitions + keyframes, prefers-reduced-motion support
- [ ] Are there existing design files I should inherit?

---

## 📁 File Structure

```
.timi/
└── designer-memory.md          ← You are here (main memory)
└── design-system/
    ├── tokens.json             ← ✅ Design tokens (extracted from sample-v2)
    ├── components.md           ← ✅ Component documentation
    └── patterns.md             ← ✅ UX patterns library
```

---

## 🔄 Daily Standup Template

```
**Yesterday:**
- 

**Today:**
- 

**Blockers:**
- 

**Design QA Needed:**
- 
```

---

*This file is my single source of truth. I update it daily to track progress, document decisions, and maintain design consistency across the Trenches platform.*

**— Timi 🎨**
