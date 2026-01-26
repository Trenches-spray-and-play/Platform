# Existing UI Audit

> **Status**: Complete
> 
> **Deployed URL**: https://trenches-web.vercel.app
> 
> **Audit Date**: 2026-01-08
> 
> **Purpose**: Infer implicit logic, assumptions, and gaps from the current UI

---

## 1. Core Features Currently Implied by the UI

### Primary User Flows

1. **Trench Discovery & Selection**
   - Home page displays 3 trench levels: RAPID, MID, DEEP
   - Each trench shows: entry size range, ROI cap, cadence, reserves
   - Users click to enter a specific trench detail page

2. **Authentication & Onboarding**
   - Wallet connection flow (AuthModal)
   - Social profile linking (OnboardingModal)
   - Session persistence via localStorage
   - Handle/wallet address association

3. **Spray Flow (Entry Process)**
   - User selects BLT amount (min-max based on belief score)
   - System calculates ROI based on trench multiplier (1.1x, 1.3x, 1.5x)
   - Displays target wallet address for P2P transfer
   - 15-minute countdown timer for payment window
   - "I HAVE SENT IT" confirmation triggers on-chain verification
   - After verification, mandatory social proof submission

4. **Social Validation System**
   - Users must post on X/Farcaster/Telegram
   - Submit post links for verification
   - Validate peer posts to earn Boost Points
   - Rating system (1-5 stars) for post quality
   - Engagement proof (likes, comments) with proof links

5. **Queue Management**
   - Live queue display with participant rankings
   - Belief Score and Boost Points visible per participant
   - "ON THE CLOCK" status for current payout recipient
   - 15-minute countdown for active payout window
   - Queue position updates based on belief/boost

6. **Dashboard & Position Tracking**
   - User's active positions across trenches
   - Queue position, belief score, boost points per position
   - "DO TASKS" and "VALIDATE PEERS" actions
   - Live community feed of submitted posts

7. **Belief & Boost System**
   - Belief Score: Permanent, affects max entry size and queue priority
   - Boost Points: Temporary, affects queue speed
   - Entry cap multipliers: 1x (base), 2x (500+ belief), 4x (1000+ belief)
   - Boost earned from: task completion, peer validation

### Data Models Implied

- **User**: handle, wallet, beliefScore, boostPoints, socialLinks
- **Trench**: level, minEntry, maxEntry, roiMultiplier, cadence, reserves, active status
- **Participant**: userId, trenchId, entryAmount, status (pending/active/exited), joinedAt
- **Transaction**: userId, amount, type (SPRAY/EXIT), status (PENDING/VERIFIED/FAILED), txHash
- **PostSubmission**: userId, platform, postUrl, timestamp, trenchId
- **ValidationRecord**: validatorId, postId, qualityRating, viewRange, engagementProof

---

## 2. Assumptions the UI Makes About Backend Behavior

### Critical Assumptions

1. **On-Chain Verification**
   - UI assumes backend can verify BLT transfers to target address
   - Verification happens after user clicks "I HAVE SENT IT"
   - 3.5 second mock delay suggests async verification process
   - No actual blockchain integration exists (all mocked)

2. **Queue Ordering Logic**
   - Queue position determined by: belief score + boost points + entry time
   - Higher belief/boost = better position
   - "ON THE CLOCK" status implies server determines whose turn it is
   - No actual queue calculation exists (static mock data)

3. **Payment Window Enforcement**
   - 15-minute countdown suggests backend tracks payment deadlines
   - UI assumes backend will mark transactions as FAILED if timeout
   - No actual timeout enforcement exists

4. **ROI Calculation & Payouts**
   - UI displays ROI amounts (1.1x, 1.3x, 1.5x multipliers)
   - Assumes backend calculates: `entryAmount * roiMultiplier = payoutAmount`
   - Assumes payout happens when user reaches "ON THE CLOCK" status
   - No actual payout mechanism exists

5. **Belief Score Updates**
   - UI assumes backend updates belief scores after validation
   - Validation rewards: +50 Boost Points to validator, +5-20 Belief to author
   - No actual scoring system exists (all client-side mocks)

6. **Entry Size Caps**
   - UI enforces max entry based on belief score tiers
   - Assumes backend validates: `entryAmount <= getMaxAllowedEntry(beliefScore, trenchMax)`
   - No actual server-side validation exists

7. **Social Proof Verification**
   - UI assumes backend can verify post links are valid
   - Assumes backend can detect engagement (likes, comments) via proof links
   - No actual link verification exists

8. **Trench State Management**
   - UI assumes backend tracks: active trenches, reserves, participant counts
   - Admin dashboard shows TVL, user counts (all mocked)
   - No actual state management exists

### Payment Flow Assumptions

1. User sends BLT to displayed wallet address (P2P)
2. Backend monitors blockchain for transaction
3. Backend verifies: amount matches, address matches, within time window
4. Backend adds user to queue with status "pending"
5. Backend promotes to "active" after verification
6. Backend calculates queue position based on belief/boost
7. Backend triggers payout when user reaches front of queue
8. Payout is wallet-to-wallet (not from pool)

**CRITICAL GAP**: None of this exists. All payment logic is mocked.

---

## 3. What Parts Are Purely Visual vs Logical

### Purely Visual (No Backend Logic Required)

- ✅ **Activity Ticker**: Scrolling feed of mock activity
- ✅ **Trench Cards**: Static display of trench parameters
- ✅ **Color Coding**: RAPID (red), MID (amber), DEEP (cyan)
- ✅ **Risk Banner**: Static warning message
- ✅ **Loading States**: "LOADING TRENCH DATA..." spinners
- ✅ **Empty States**: "NO ACTIVE POSITIONS" message
- ✅ **Community Feed**: Mock post display in dashboard
- ✅ **Admin KPIs**: Static numbers (1,203 users, $842K TVL)

### Visual + Client-Side Logic (No Backend)

- ✅ **Form Validation**: Amount input min/max checks
- ✅ **ROI Calculation**: `entryAmount * roiMultiplier` (client-side math)
- ✅ **Entry Cap Display**: `getMaxAllowedEntry()` calculation (client-side)
- ✅ **Countdown Timers**: Client-side countdown (not synced with backend)
- ✅ **Modal State Management**: Open/close, step progression
- ✅ **LocalStorage Persistence**: User session, positions (client-only)

### Requires Backend Logic (Currently Missing)

- ❌ **On-Chain Transaction Verification**: Must scan blockchain for BLT transfers
- ❌ **Queue Position Calculation**: Must compute based on belief/boost/time
- ❌ **Payment Timeout Enforcement**: Must track deadlines and mark failed
- ❌ **Belief Score Updates**: Must persist and recalculate after validations
- ❌ **Boost Point Decay**: Must decay temporary boosts over time
- ❌ **Trench State**: Must track reserves, active participants, payout rounds
- ❌ **Social Link Verification**: Must validate post URLs are real
- ❌ **Engagement Proof Verification**: Must verify likes/comments via APIs
- ❌ **Payout Execution**: Must trigger wallet-to-wallet transfers
- ❌ **ROI Cap Enforcement**: Must prevent payouts exceeding caps
- ❌ **Round Cadence**: Must enforce timing (NO WAIT, 3 DAYS, 7 DAYS)

---

## 4. What Is Missing for This to Be a Real Non-Custodial System

### Critical Missing Components

#### A. Blockchain Integration Layer

1. **Transaction Indexing**
   - No HyperEVM/BLT contract monitoring
   - No transaction detection for target addresses
   - No amount verification against user's claimed entry
   - No timestamp verification (15-minute window)

2. **Wallet Verification**
   - No wallet signature verification
   - No proof-of-ownership checks
   - No address validation

3. **On-Chain State Reading**
   - No BLT balance checks
   - No contract state queries
   - No event listening

#### B. Queue & Payout System

1. **Queue Calculation Engine**
   - No server-side queue ordering
   - No belief/boost aggregation
   - No time-based sorting
   - No "turn" determination logic

2. **Payout Coordination**
   - No payout trigger mechanism
   - No wallet-to-wallet transfer execution
   - No payout amount calculation
   - No payout status tracking

3. **Round Management**
   - No cadence enforcement (NO WAIT, 3 DAYS, 7 DAYS)
   - No round start/end tracking
   - No reserve tracking
   - No round expiry logic

#### C. Enforcement & Safety

1. **Payment Timeout**
   - No deadline tracking
   - No automatic FAILED status assignment
   - No queue removal for expired payments

2. **ROI Cap Enforcement**
   - No server-side cap validation
   - No prevention of over-payouts
   - No cumulative payout tracking

3. **Entry Validation**
   - No server-side belief score checks
   - No max entry enforcement
   - No duplicate entry prevention

#### D. Social System Backend

1. **Content Submission**
   - No post URL storage
   - No platform validation
   - No content archive

2. **Review System**
   - No review record storage
   - No endorsement aggregation
   - No abuse detection (self-review, bot rings)

3. **Belief Score Calculation**
   - No server-side belief updates
   - No time-distributed endorsement logic
   - No decay mechanics
   - No reversible scoring for abuse

4. **Boost Point Management**
   - No boost point persistence
   - No decay scheduling
   - No cap enforcement

#### E. Data Persistence

1. **Database Integration**
   - Prisma schema exists but no actual DB connection
   - No user persistence
   - No transaction history
   - No trench state persistence

2. **Real-Time Updates**
   - No WebSocket/polling for queue updates
   - No live position changes
   - No real-time belief score updates

#### F. Non-Custodial Guarantees

1. **No Fund Holding**
   - ✅ UI correctly shows P2P transfer (good)
   - ❌ No verification that funds never touch app wallet
   - ❌ No proof that app cannot access user funds

2. **Transparency**
   - ❌ No on-chain transaction history display
   - ❌ No verifiable payout records
   - ❌ No public queue state

3. **Risk Disclosure**
   - ✅ Risk banner exists (good)
   - ❌ No clear explanation of what "non-custodial" means in practice
   - ❌ No disclosure of coordination risks

### What Exists (Good Foundation)

✅ **UI Structure**: Complete, professional, matches non-custodial philosophy
✅ **Data Models**: Prisma schema well-designed
✅ **User Flows**: Logical, clear progression
✅ **Visual Design**: Risk-aware, clear messaging
✅ **Client-Side Logic**: Form validation, calculations work

### What Must Be Built (Priority Order)

**Layer 1 - Read-Only Truth (SAFE)**
1. HyperEVM transaction indexing
2. BLT transfer detection
3. Transaction verification API
4. Queue population from real transactions

**Layer 2 - Enforcement Logic (SAFE)**
5. Payment timeout tracking
6. ROI cap validation
7. Round cadence enforcement
8. Entry validation (belief score, max entry)

**Layer 3 - Social System (LAST)**
9. Content submission API
10. Review/endorsement system
11. Belief score calculation engine
12. Boost point decay scheduler

**Layer 4 - Payout Coordination (FINAL)**
13. Queue position calculation
14. Payout trigger mechanism
15. Wallet-to-wallet transfer execution
16. Payout status tracking

---

## Summary: Current State

**What Works**: UI is complete, functional, and philosophically aligned with non-custodial design.

**What's Missing**: All backend logic. The UI assumes a complete backend system that doesn't exist.

**Risk Level**: HIGH - Users could send funds to displayed addresses with no verification, queue management, or payout coordination.

**Next Steps**: Build Layer 1 (read-only indexing) before allowing any real transactions.

---

## Audit Notes

- UI correctly emphasizes "NON-CUSTODIAL" and "P2P TRANSFER"
- Risk banner appropriately warns users
- No promises of guaranteed payouts in UI (good)
- Belief/Boost system well-designed conceptually
- Social validation flow is clear and enforceable

**The UI is ready. The backend is not.**
