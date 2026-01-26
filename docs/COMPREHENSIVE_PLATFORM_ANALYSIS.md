# Comprehensive Platform Analysis: Trenches

> **Analysis Date**: 2026-01-14  
> **Last Re-Audit**: Code-level pass (waitlist, dapp, admin)  
> **Scope**: Waitlist, Dashboard, Dapp, Admin Portal — frontend & backend  
> **Status**: Complete Assessment

---

## Executive Summary

Trenches is a **belief coordination platform** that enables token incubation and community distribution through a non-custodial queue system. The platform operates on a "Spray and Pray" model where users enter queues by sending tokens, and their position is determined by social engagement (belief scores) and review activity (boost points).

### Key Characteristics
- **Non-custodial**: Platform never holds user funds
- **Social-first**: Mandatory social proof for participation
- **Queue-based**: Position determined by belief score, boost points, and join time
- **Multi-chain**: Supports BLT (HyperEVM), ETH, USDT, USDC, SOL
- **Campaign-based**: Supports pre-launch waitlists and active campaigns

---

## 1. Platform Architecture Overview

### 1.1 Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- React with TypeScript
- CSS Modules for styling
- Framer Motion for animations
- Supabase Auth for authentication

**Backend:**
- Next.js API Routes
- Prisma ORM with PostgreSQL
- Viem for blockchain interactions
- Supabase for authentication

**Blockchain:**
- HyperEVM (primary - BLT token)
- Ethereum, Base, Arbitrum (EVM chains)
- Solana (partial support)

### 1.2 Database Schema

The platform uses a comprehensive Prisma schema with the following core models:

**User Management:**
- `User`: Core user profile with belief scores, balances, referral codes
- `CampaignConfig`: Campaign configuration (token, chains, ROI, timing)
- `CampaignWaitlist`: Pre-launch waitlist entries

**Queue System:**
- `Trench`: Queue containers (RAPID, MID, DEEP levels)
- `Participant`: User entries in trenches
- `SprayEntry`: Pending entries requiring task completion

**Financial:**
- `Deposit`: Incoming deposits tracked on-chain
- `DepositAddress`: User-specific deposit addresses per chain
- `Payout`: Outgoing payouts to users
- `Transaction`: On-chain transaction records

**Social System:**
- `PostSubmission`: User social media posts
- `Validation`: Peer reviews of posts
- `Task`: One-time and recurring tasks
- `UserTask`: Task completion tracking

**Infrastructure:**
- `PlatformConfig`: Centralized platform settings
- `SweepBatch`: Deposit consolidation batches
- `VaultAddress`: Platform vault addresses per chain

### 1.3 Project Structure

```
Trenches Platform/
├── landing/              # Waitlist landing page
│   ├── src/
│   │   ├── app/         # Next.js pages
│   │   ├── components/  # WaitlistDashboard, OnboardingModal
│   │   └── lib/         # DB, Supabase, config
│   └── prisma/          # Database schema
│
├── trenches-web/        # Main platform (active)
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/    # User dashboard
│   │   │   ├── api/          # API routes
│   │   │   ├── admin/        # Admin panel
│   │   │   └── trench/[id]/  # Trench detail pages
│   │   ├── components/       # UI components
│   │   ├── services/         # Business logic
│   │   └── lib/              # Utilities
│   └── prisma/               # Database schema
│
├── Trenches-V2/         # Alternative implementation
└── docs/                # Documentation
```

---

## 2. Waitlist System Analysis

### 2.1 Purpose & Functionality

The waitlist system serves as a **pre-launch engagement mechanism** for campaigns that haven't started yet. It allows users to:
- Reserve their spot before a campaign goes live
- Optionally deposit funds early (if campaign allows)
- Track their queue position
- Share referral links to improve position

### 2.2 Implementation Details

#### 2.2.1 Database Model

```prisma
model CampaignWaitlist {
  id            String   @id @default(uuid())
  campaignId    String
  userId        String
  hasDeposited  Boolean  @default(false)
  depositAmount Decimal? @db.Decimal(18, 2)
  joinedAt      DateTime @default(now())
  queueNumber   Int?     // Assigned based on joinedAt order
  
  campaign      CampaignConfig @relation(...)
  user          User          @relation(...)
  
  @@unique([campaignId, userId])
  @@index([campaignId, hasDeposited])
}
```

**Key Features:**
- One entry per user per campaign (enforced by unique constraint)
- Queue number assigned sequentially based on join time
- Optional deposit tracking for early commitment
- Indexed for efficient queries

#### 2.2.2 API Endpoints

**GET `/api/campaign/waitlist?campaignId=xxx`**
- Returns user's waitlist status
- Calculates queue position dynamically
- Includes campaign metadata (start date, deposit acceptance)

**POST `/api/campaign/waitlist`**
- Joins user to waitlist
- Validates campaign hasn't started
- Handles optional deposit (deducts from user balance)
- Prevents duplicate entries
- Atomic transaction for balance deduction

**DELETE `/api/campaign/waitlist?campaignId=xxx`**
- Removes user from waitlist
- Only allowed before campaign starts
- Refunds deposit if applicable (not implemented)

#### 2.2.3 Frontend Components

**WaitlistDashboard** (`landing/src/components/WaitlistDashboard.tsx`)
- Displays user's queue position
- Shows referral code and count
- Countdown timer to deployment
- Copy referral link functionality
- Logout option

**Key UI Elements:**
- Queue position display (#X)
- Referral statistics
- Deployment countdown
- Status message from platform config

#### 2.2.4 Integration Points

**Campaign Configuration:**
- `CampaignConfig.startsAt`: When campaign goes live
- `CampaignConfig.acceptDepositsBeforeStart`: Whether deposits are accepted
- `PlatformConfig.deploymentDate`: Global deployment timer

**User Balance System:**
- Deposits deduct from `User.balance` (USD-normalized)
- Balance must be sufficient for deposit
- Transaction ensures atomicity

### 2.3 Current State Assessment

**✅ Strengths:**
- Clean database schema with proper constraints
- Atomic transactions for data integrity
- Flexible deposit system (optional)
- Queue position calculation is accurate
- Prevents duplicate entries

**⚠️ Gaps & Issues:**

1. **No Deposit Refund Logic**
   - DELETE endpoint doesn't refund deposits
   - Users who leave waitlist lose deposited funds

2. **Queue Position Calculation**
   - Currently based on `joinedAt` only
   - No consideration for deposit status (should deposits get priority?)
   - No belief score integration (should high-belief users get priority?)

3. **Campaign Transition**
   - No automatic migration from waitlist to active participants
   - Manual process required when campaign starts

4. **Referral Integration**
   - Referral count displayed but not used for queue priority
   - No referral rewards system

5. **Missing Features:**
   - No waitlist leaderboard
   - No notifications when position changes
   - No bulk operations for campaign start

### 2.4 Recommendations

1. **Implement Deposit Refunds**
   ```typescript
   // In DELETE handler
   if (waitlistEntry.hasDeposited && waitlistEntry.depositAmount) {
     await tx.user.update({
       where: { id: dbUser.id },
       data: { balance: { increment: waitlistEntry.depositAmount } }
     });
   }
   ```

2. **Enhanced Queue Priority**
   - Consider deposit status (depositors first)
   - Consider belief score (high-belief users first)
   - Consider referral count (active referrers first)

3. **Campaign Start Migration**
   - Automatic conversion of waitlist entries to participants
   - Preserve queue order during migration
   - Handle deposit conversion to entry amounts

4. **Waitlist Analytics**
   - Total waitlist size
   - Average deposit amount
   - Conversion rate (waitlist → active)

---

## 3. Dashboard System Analysis

### 3.1 Purpose & Functionality

The dashboard is the **central command center** for authenticated users, providing:
- Active position tracking across all trenches
- Queue position visibility
- Social engagement tools (submit content, review peers)
- Task management
- Belief and boost point tracking

### 3.2 Implementation Details

#### 3.2.1 Core Components

**Dashboard Page** (`trenches-web/src/app/dashboard/page.tsx`)

**Data Fetching:**
- User positions: `/api/user/positions`
- User profile: `/api/user`
- Available tasks: `/api/tasks`
- Completed tasks: `/api/user/tasks`

**State Management:**
- Positions array (active trench entries)
- User profile (belief score, boost points)
- Tasks list with completion status
- Modal states (submit content, review)

**UI Sections:**
1. **Active Deployments** (Positions Grid)
   - Cards for each active trench position
   - Queue position, ROI, entry amount, max payout
   - "BOOST_QUEUE" action button

2. **Mission Control Panel**
   - Points widget (belief + boost)
   - Task list (one-time and recurring)
   - Review pool (posts needing validation)

#### 3.2.2 Position Tracking

**Position Data Structure:**
```typescript
interface Position {
  id: string;
  trenchId: string;
  trenchName: string;
  trenchLevel: string; // RAPID | MID | DEEP
  status: string;
  joinedAt: string;
  boostPoints: number;
  entryAmount: number;
  maxPayout: number;
  receivedAmount: number;
  queuePosition: number; // Calculated dynamically
  expiresAt: string | null;
}
```

**Queue Position Calculation** (`/api/user/positions`):
- Counts participants ahead in queue
- Considers: `joinedAt`, `boostPoints`, `status='active'`
- **Issue**: Doesn't consider belief score in calculation

#### 3.2.3 Social Engagement System

**Submit Content Modal:**
- Users submit social media posts (X, Farcaster, Telegram)
- Required for spray entry completion
- Links to `PostSubmission` model

**Review Pool:**
- Displays posts needing validation
- Users can review and endorse
- Awards boost points (+50) to validator
- Awards belief points (+5-20) to post author

**Task System:**
- One-time tasks (complete once)
- Recurring tasks (complete per spray)
- Boost point rewards
- Completion tracking via `UserTask`

#### 3.2.4 API Endpoints

**User Data:**
- `GET /api/user` - User profile
- `GET /api/user/positions` - Active positions
- `GET /api/user/stats` - User statistics
- `GET /api/user/tasks` - Completed tasks
- `POST /api/user/tasks` - Complete a task

**Social System:**
- `GET /api/posts` - Get posts (review pool)
- `POST /api/posts` - Submit post
- `POST /api/validations` - Submit validation

**Tasks:**
- `GET /api/tasks` - Available tasks
- `GET /api/admin/tasks` - Admin task management

### 3.3 Current State Assessment

**✅ Strengths:**
- Clean separation of concerns
- Real-time data fetching
- Comprehensive position tracking
- Social engagement well-integrated
- Task system functional

**⚠️ Gaps & Issues:**

1. **Queue Position Calculation Inconsistency**
   - Dashboard uses simplified calculation (joinedAt + boostPoints)
   - Doesn't match full queue algorithm (should include belief score)
   - May show incorrect positions

2. **Missing Real-time Updates**
   - No WebSocket/polling for position changes
   - Users must refresh to see updates
   - No notifications for position changes

3. **Incomplete Position Data**
   - `expiresAt` field exists but not displayed
   - No countdown for position expiration
   - No warning when position is about to expire

4. **Social System Gaps**
   - No post submission history
   - No validation history
   - No leaderboard for top validators

5. **Task System Limitations**
   - No task categories
   - No task difficulty levels
   - No task expiration
   - Recurring tasks not clearly distinguished

6. **Performance Concerns**
   - Multiple sequential API calls on load
   - No caching of position data
   - Queue calculation runs on every request

### 3.4 Recommendations

1. **Fix Queue Position Calculation**
   ```typescript
   // Should match trench queue algorithm:
   // 1. Belief Score (DESC)
   // 2. Boost Points (DESC)
   // 3. Join Time (ASC)
   ```

2. **Add Real-time Updates**
   - WebSocket connection for live updates
   - Or polling with React Query
   - Notifications for position changes

3. **Enhanced Position Display**
   - Show expiration countdown
   - Warning when < 24 hours remaining
   - Historical position chart

4. **Social System Enhancements**
   - Post submission history
   - Validation analytics
   - Top validators leaderboard
   - Post engagement metrics

5. **Performance Optimization**
   - Batch API calls
   - Cache position data
   - Optimize queue calculation (consider caching)

---

## 4. Platform Integration Analysis

### 4.1 Waitlist → Dashboard Transition

**Current Flow:**
1. User joins waitlist (landing page)
2. Campaign starts (admin action)
3. User must manually navigate to dashboard
4. User must manually enter trench (spray)

**Issues:**
- No automatic notification when campaign starts
- No automatic position creation from waitlist
- Users may miss campaign start

**Recommended Flow:**
1. User joins waitlist
2. Campaign starts (admin action)
3. System automatically:
   - Converts waitlist entries to participants
   - Preserves queue order
   - Converts deposits to entry amounts
   - Sends notification to users
4. Users see positions in dashboard

### 4.2 Campaign System

**CampaignConfig Model:**
- Supports multiple trenches per campaign
- Configurable token (address, symbol, decimals, chain)
- Configurable ROI multiplier (default 1.5x)
- Timing controls (startsAt, acceptDepositsBeforeStart)
- Payout controls (interval, pause)

**Current State:**
- Campaign system is well-designed
- Flexible configuration
- Supports waitlist and active phases

**Gaps:**
- No campaign analytics dashboard
- No campaign performance metrics
- No A/B testing capabilities

### 4.3 Authentication & User Management

**Supabase Integration:**
- Google OAuth
- Session management
- User sync between Supabase and Prisma

**User Model:**
- Handles: wallet addresses (EVM + Solana)
- Belief score tracking
- Balance tracking (USD-normalized)
- Referral system

**Issues:**
- No email/password auth (Google only)
- No wallet-based auth (Web3 wallets)
- User creation happens in multiple places (inconsistent)

### 4.4 Blockchain Integration

**Services Implemented:**
- `blockchain.monitor.ts`: Monitors HyperEVM for transfers
- `deposit-monitor.service.ts`: Monitors multiple chains for deposits
- `transaction.service.ts`: Transaction verification and matching
- `payout.service.ts`: Payout execution
- `sweep.service.ts`: Deposit consolidation

**Current State:**
- Layer 1 (read-only) complete
- Multi-chain deposit monitoring
- Transaction verification working
- Payout system implemented

**Gaps:**
- Solana support incomplete
- No transaction retry logic
- Limited error handling for failed transactions
- No gas optimization for payouts

---

## 5. Data Flow Analysis

### 5.1 Waitlist Flow

```
User → Landing Page → Google Auth → Onboarding → Waitlist Dashboard
                                                      ↓
                                              Join Waitlist API
                                                      ↓
                                              CampaignWaitlist Entry
                                                      ↓
                                              (Optional) Deposit
                                                      ↓
                                              Queue Position Assigned
```

### 5.2 Dashboard Flow

```
User → Dashboard → Fetch Positions → Display Active Deployments
                                          ↓
                                    Fetch Profile → Display Belief/Boost
                                          ↓
                                    Fetch Tasks → Display Task List
                                          ↓
                                    Fetch Review Pool → Display Posts
```

### 5.3 Spray Entry Flow

```
User → Trench Page → Spray Modal → Select Amount → Generate Deposit Address
                                                          ↓
                                              User Sends Tokens (P2P)
                                                          ↓
                                              Blockchain Monitor Detects
                                                          ↓
                                              Transaction Verified
                                                          ↓
                                              Participant Created
                                                          ↓
                                              Queue Position Calculated
                                                          ↓
                                              Dashboard Updates
```

### 5.4 Social Engagement Flow

```
User → Submit Content → PostSubmission Created
                              ↓
                    Post Appears in Review Pool
                              ↓
                    Validator Reviews → Validation Created
                              ↓
                    Boost Points Awarded (Validator)
                              ↓
                    Belief Points Awarded (Author)
                              ↓
                    Queue Positions Recalculated
```

---

## 6. Critical Issues & Risks

### 6.1 Data Integrity

**Issue**: Queue position calculation inconsistency
- **Risk**: Users see incorrect positions
- **Impact**: High - affects user trust
- **Priority**: Critical

**Issue**: No atomic waitlist → participant migration
- **Risk**: Data loss during campaign start
- **Impact**: High - users may lose positions
- **Priority**: High

### 6.2 User Experience

**Issue**: No real-time updates
- **Risk**: Stale data shown to users
- **Impact**: Medium - confusion about positions
- **Priority**: Medium

**Issue**: No campaign start notifications
- **Risk**: Users miss campaign launch
- **Impact**: Medium - lost engagement
- **Priority**: Medium

### 6.3 Financial

**Issue**: No deposit refund mechanism
- **Risk**: Users lose funds if they leave waitlist
- **Impact**: High - financial loss
- **Priority**: High

**Issue**: No gas optimization for payouts
- **Risk**: High gas costs
- **Impact**: Medium - operational cost
- **Priority**: Low

### 6.4 Security

**Issue**: No rate limiting on API endpoints
- **Risk**: API abuse
- **Impact**: Medium - service degradation
- **Priority**: Medium

**Issue**: No input validation on some endpoints
- **Risk**: Data injection
- **Impact**: High - data corruption
- **Priority**: High

---

## 7. Recommendations Summary

### 7.1 Immediate (Critical)

1. **Fix Queue Position Calculation**
   - Implement consistent algorithm across all endpoints
   - Include belief score in calculation
   - Add caching for performance

2. **Implement Deposit Refunds**
   - Add refund logic to DELETE waitlist endpoint
   - Test thoroughly with edge cases

3. **Add Input Validation**
   - Validate all API inputs
   - Add rate limiting
   - Sanitize user inputs

### 7.2 Short-term (High Priority)

1. **Campaign Start Migration**
   - Automatic waitlist → participant conversion
   - Preserve queue order
   - Send notifications

2. **Real-time Updates**
   - Implement WebSocket or polling
   - Update positions live
   - Notify on changes

3. **Enhanced Queue Priority**
   - Consider deposits in waitlist
   - Consider belief score
   - Consider referral count

### 7.3 Medium-term (Enhancement)

1. **Analytics Dashboard**
   - Campaign performance metrics
   - User engagement analytics
   - Queue movement tracking

2. **Social System Enhancements**
   - Post history
   - Validation leaderboard
   - Engagement metrics

3. **Performance Optimization**
   - Batch API calls
   - Cache frequently accessed data
   - Optimize database queries

### 7.4 Long-term (Future)

1. **Multi-wallet Support**
   - Connect multiple wallets
   - Wallet switching
   - Wallet-based auth

2. **Advanced Features**
   - Position trading (if allowed)
   - Prediction markets
   - Governance integration

---

## 8. Technical Debt

### 8.1 Code Organization

- Multiple project directories (landing, trenches-web, Trenches-V2)
- Unclear which is the "source of truth"
- Duplicate code across directories

### 8.2 Documentation

- Good documentation exists but scattered
- No API documentation (OpenAPI/Swagger)
- No architecture diagrams

### 8.3 Testing

- No test files found
- No integration tests
- No E2E tests

### 8.4 Monitoring

- No error tracking (Sentry, etc.)
- No performance monitoring
- No analytics integration

---

## 9. Conclusion

The Trenches platform demonstrates a **well-architected foundation** with:
- ✅ Solid database schema
- ✅ Comprehensive feature set
- ✅ Multi-chain support
- ✅ Social engagement system

However, there are **critical gaps** that need attention:
- ⚠️ Queue calculation inconsistencies (see §10.3, §10.6)
- ⚠️ Missing deposit refunds (waitlist DELETE)
- ⚠️ No real-time updates
- ⚠️ Incomplete campaign transition
- ⚠️ Spray-level bug, admin participant-count bug, recurring-task handling (§10.6)

**Overall Assessment**: The platform is **~75% complete** with strong fundamentals. A **code-level re-audit** (§10) of the waitlist, dapp, and admin surfaces shows **two distinct “waitlist” concepts** (landing vs campaign), **inconsistent queue ordering** across APIs, and **several correctness bugs** that affect queue order, campaign stats, and waitlist economics. These should be addressed before production reliance on queue order or campaign metrics.

**Recommended Next Steps:**
1. Fix critical data integrity issues (§10.6 table)
2. Implement missing financial operations (refunds, recurring-task checks)
3. Align queue ordering (belief → boost → joinedAt) everywhere; use `queue.service` or shared logic
4. Fix spray-level resolution and admin campaign participant count
5. Add real-time updates and campaign transition automation
6. Harden admin auth and add testing/monitoring

---

## Appendix: Key Metrics to Track

### Waitlist Metrics
- Total waitlist size
- Average deposit amount
- Conversion rate (waitlist → active)
- Referral rate
- Time to campaign start

### Dashboard Metrics
- Active positions per user
- Average queue position
- Task completion rate
- Social engagement rate
- Position retention rate

### Platform Metrics
- Total TVL (Total Value Locked)
- Active campaigns
- Daily active users
- Payout success rate
- Transaction verification rate

---

## 10. Re-Audit: Code-Level Findings (Waitlist, Dapp, Admin)

This section documents a **code-level** pass across the landing (waitlist), trenches-web (dapp), and admin portal, and how they affect each other.

### 10.1 Codebases in Play

| Codebase | Purpose | Auth | DB | APIs |
|----------|---------|------|----|------|
| **landing/** | Waitlist landing + onboarding | Supabase (Google OAuth) | Own Prisma (shared DB if same `DATABASE_URL`) | `/api/config`, `/api/user/sync` |
| **trenches-web/** | Main dapp (home, dashboard, spray, profile) | Supabase + `getSession()` (Prisma user) | Prisma | Full API surface |
| **Trenches-V2/** | Alternate impl + standalone waitlist sub-app | Same pattern | Own schema | Similar |
| **Admin** | Campaigns, users, tasks, config, payouts | Cookie `admin_auth=true` + hardcoded key | Uses trenches-web DB | `/api/admin/*` |

**Critical:** Landing **never** calls `/api/campaign/waitlist`. Its “waitlist” is **global user signup order** (`user/sync` → `User` + `position` = `count(createdAt <= user.createdAt)`). Campaign-specific waitlist lives only in **trenches-web** (SprayModal WAITLIST/ACCEPTING → `POST /api/campaign/waitlist`).

### 10.2 Landing (Waitlist) — Code-Level

**Flow:** `page.tsx` → Google auth → `GET /api/user/sync?supabaseId=…` → if exists, `WaitlistDashboard`; else `OnboardingModal` → `POST /api/user/sync` → dashboard. `userSession` from sync (or onboarding) stored in `localStorage` as `user_session`.

**Bugs / gaps:**

- **`/api/user/sync` GET:** `position` = `count(createdAt <= user.createdAt)` (correct rank). **POST** returns `position = prisma.user.count()` (total users), **not** user rank. Inconsistent.
- **OnboardingModal** sends `verificationLink` in body; **backend ignores it**. Only `handle`, `email`, `walletEvm`, `walletSol` are used.
- **Referral:** WaitlistDashboard shows `referralDomain/ref/{referralCode}` and copy. There is **no** `/ref/[code]` route; `referredById` is never set from URL. Referral codes exist but aren’t used for attribution.
- **Config:** Landing has `/api/config` (PlatformConfig). No `docsUrl` in default fallback in some code paths; schema has it.

### 10.3 Trenches-Web (Dapp) — Code-Level

**Home:** Fetches `/api/trenches`, groups campaigns by level (RAPID/MID/DEEP). Renders `CampaignCard` per campaign per level. Phase from `getCampaignPhase` (WAITLIST / ACCEPTING / LIVE / PAUSED).

**Spray flow:** `CampaignCard` → `SprayModal` with `trench` (id = **campaign** id), `phase`.  
- **WAITLIST:** `POST /api/campaign/waitlist` with `campaignId`, `depositAmount: 0`. No amount input.  
- **ACCEPTING:** Same, `depositAmount: parsedUsd`.  
- **LIVE:** `POST /api/spray` with `trenchId` (= campaign id), `amount` → spray entry → tasks → `POST /api/spray/finalize`.

**Spray API** (`/api/spray`): If `trenchId` is campaign id, resolves **first** trench via `campaign.trenchIds[0]` (e.g. `"rapid"`) and `findFirst` by level. **Bug:** Home shows one card per level per campaign (same campaign id). User can click “MID” card but spray **always** uses `trenchIds[0]` → effectively always first level (e.g. RAPID). Level is **not** passed to the spray API.

**Dashboard:** `GET /api/user/positions`, `/api/user`, `/api/tasks`, `/api/user/tasks`. Positions = `Participant` per trench. Queue position from **positions** API uses `joinedAt` + `boostPoints` only; **belief score not used**.  
`queue.service` **does** use belief → boost → joinedAt. **Trench detail** `GET /api/trenches/[id]` uses its **own** `orderBy`: `boostPoints` DESC, `joinedAt` ASC — **not** queue.service, so **belief missing** there.  
**Result:** Queue order inconsistent across trench detail, positions, and queue.service.

**Finalize** (`/api/spray/finalize`): Requires “all active tasks” completed. It does **not** filter `UserTask` by `sprayEntryId`. So **RECURRING** tasks are effectively treated as global; per-spray completion for recurring tasks is not enforced.

**Auth:** Dapp uses `useAuth()` (Supabase) in UI. APIs use `getSession()` (Supabase → Prisma find-or-create). Session from cookies; same-origin requests work.

### 10.4 Admin Portal — Code-Level

**Auth:** `admin/login` checks password `spray_and_pray_admin` client-side, sets `admin_auth=true` cookie. No server-side verification. **Security risk.**

**Config:** Admin reads/writes PlatformConfig via `/api/admin/config`. UI says “Settings apply to both Waitlist and Main Dapp.” Landing and dapp each have their own `/api/config` (or similar) reading PlatformConfig; **if** they share the same DB, config is shared.

**Campaign detail** `GET /api/admin/campaigns/[id]`:  
Participant count uses `trenchId: { in: campaign.trenchIds }`. But `trenchIds` are **level names** (`"rapid"`, `"mid"`, `"deep"`); `Participant.trenchId` is **Trench UUID**. Comparison is meaningless; count will be **0** (or wrong). **Bug.**

**Campaign CRUD:** Create/update use `trenchIds` as level names. Trenches API and spray resolution use the same. Participant/trench resolution is where mismatch occurs.

### 10.5 Cross-Cutting Data Flow

- **PlatformConfig:** Admin → PUT `/api/admin/config`. Landing config → `GET /api/config`. Dapp sidebar/config → `GET /api/config`. Shared only if same DB.
- **Campaign waitlist:** Only used in **dapp** (SprayModal WAITLIST/ACCEPTING). Landing has no campaign waitlist; it’s global “enlist” + user sync.
- **User:** Landing creates/updates via `POST /api/user/sync`. Dapp resolves via `getSession()`. Same Supabase user can map to same Prisma user if both use same DB.
- **Deposits / balance:** User balance deducted for spray and for ACCEPTING waitlist deposits. Deposits in admin “Deposits” tab; balance in admin “Users.”

### 10.6 Critical Bugs Summary

| Issue | Location | Impact |
|-------|----------|--------|
| Spray level ignored when spraying from home | Spray API always uses `trenchIds[0]`; UI has per-level cards | Users can “spray” MID but actually enter RAPID |
| Queue order: belief missing in trench detail | `trenches/[id]` route `orderBy` | Trench page queue order wrong vs spec |
| Queue order: belief missing in positions | `/api/user/positions` | Dashboard positions can disagree with queue.service |
| Waitlist DELETE does not refund | `DELETE /api/campaign/waitlist` | Users lose deposited funds when leaving |
| Admin participant count wrong | `campaigns/[id]` uses `trenchId in trenchIds` (levels vs UUIDs) | Campaign detail stats incorrect |
| Recurring tasks not enforced per spray | Finalize checks all `UserTask`, no `sprayEntryId` filter | Recurring logic broken |
| Sync POST `position` = total users | `landing` `/api/user/sync` POST | Wrong “position” right after onboarding |
| Referral link not implemented | No `/ref/[code]`, `referredById` never set | Referrals don’t attribute |
| Admin auth is client-side only | Cookie + hardcoded key | Full admin access if key leaks |

### 10.7 Updated Opinion

The platform has a **solid base**: clear separation of campaigns vs trenches, working spray + waitlist flows, queue.service that matches spec, and a rich admin surface. **However**, the code-level pass shows:

1. **Two “waitlists”** — landing’s global enlist vs dapp’s campaign waitlist — that are **not** the same thing and are easy to conflate.
2. **Inconsistent queue semantics** across trench detail, positions API, and queue.service (belief often omitted).
3. **Spray-from-home level bug** and **admin participant count bug** are straightforward logic errors with clear user-facing impact.
4. **Waitlist refund** and **recurring-task** gaps are behavioral bugs that affect fairness and correctness.
5. **Admin auth** is not production-ready.

**Assessment:** Good structure and feature set, but **several correctness and data-integrity issues** must be fixed before reliance on queue order, campaign stats, or waitlist economics. Addressing the items in §10.6 would materially improve consistency and trust.

---

**End of Analysis**
