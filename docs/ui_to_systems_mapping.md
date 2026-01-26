# UI to Systems Mapping

> **Status**: Complete
> 
> **Date**: 2026-01-08
> 
> **Purpose**: Map each visible UI section to required backend logic, on-chain data, and off-chain indexing needs

---

## Mapping Table

| UI Section | Required Backend Logic | Required On-Chain Data | Off-Chain Indexing Needs |
|------------|----------------------|----------------------|-------------------------|
| **Home Page - Trench Cards** | | | |
| Trench list display | Fetch active trenches from DB | None | Index trench creation events, status changes |
| Entry size ranges | Calculate min/max from trench config | None | Store trench parameters (minEntry, maxEntry) |
| ROI caps (1.1x, 1.3x, 1.5x) | Fetch multiplier from trench config | None | Store roiMultiplier per trench |
| Cadence display | Fetch cadence string from config | None | Store cadence per trench |
| Reserves display | Calculate or fetch reserve amount | None | Track reserve calculations (if needed) |
| | | | |
| **Trench Detail Page** | | | |
| Queue list display | Calculate queue order: `sort(participants, [beliefScore DESC, boostPoints DESC, joinedAt ASC])` | None | Index participant entries, belief scores, boost points |
| Participant rankings | Real-time queue position calculation | None | Track position changes, re-sort on updates |
| "ON THE CLOCK" status | Determine whose turn: `queue[0]` when round active | None | Track round state, payout windows |
| Countdown timer (15min) | Calculate time remaining for active payout | None | Store payout window start time, sync with server |
| Belief Score display | Fetch user's belief score | None | Index belief score updates from validations |
| Boost Points display | Fetch user's boost points, apply decay | None | Index boost points, schedule decay events |
| Entry amount display | Fetch participant's entry amount | Verify on-chain: BLT transfer amount | Index transaction amounts from blockchain |
| Time ago display | Calculate relative time from `joinedAt` | None | Store `joinedAt` timestamp |
| | | | |
| **Spray Modal - Entry Flow** | | | |
| Amount input validation | Validate: `minEntry <= amount <= getMaxAllowedEntry(beliefScore, maxEntry)` | None | Fetch user belief score, trench max entry |
| ROI calculation display | Calculate: `amount * roiMultiplier` | None | Fetch trench roiMultiplier |
| Max entry cap display | Calculate: `getMaxAllowedEntry(beliefScore, maxEntry)` | None | Fetch user belief score |
| Target wallet address | Generate or fetch payout address for round | None | Store payout addresses per round/trench |
| "I HAVE SENT IT" button | Create pending transaction record | None | Store transaction record with PENDING status |
| Verification status | Poll blockchain for transaction | Verify: `tx.to == targetAddress && tx.amount == entryAmount && tx.token == BLT && tx.timestamp < deadline` | Index BLT transfers to target addresses |
| 15-minute countdown | Track payment deadline | None | Store deadline timestamp, enforce timeout |
| | | | |
| **Validation Modal - Social Proof** | | | |
| Platform selection | Store selected platforms | None | None |
| Post link submission | Validate URL format, store submission | Verify: Post exists at URL, accessible | Index post submissions, link to user/trench |
| Post creation flow | Generate post template | None | None (client-side only) |
| Peer post display | Fetch posts from review pool | None | Index submitted posts, filter by status |
| Quality rating (1-5) | Store rating, calculate belief reward | None | Index validation records, aggregate ratings |
| View range selection | Store estimated views | None | Index view estimates (optional metadata) |
| Engagement proof (likes/comments) | Validate proof links, store engagement | Verify: Engagement exists at proof URL | Index engagement proofs, link to validation |
| Boost point award | Award +50 boost to validator | None | Update boost points, schedule decay |
| Belief point award | Award +5-20 belief to author | None | Update belief score, trigger queue re-sort |
| | | | |
| **Dashboard - Position Tracking** | | | |
| Active positions list | Fetch user's participants across trenches | None | Index user participants, filter by status=active |
| Queue position per trench | Calculate position in each trench's queue | None | Re-calculate on belief/boost updates |
| Belief Score display | Fetch user's total belief score | None | Aggregate from all validations |
| Boost Points display | Fetch user's current boost (with decay) | None | Calculate: `boost - (decayRate * timeElapsed)` |
| "DO TASKS" button | Fetch available tasks | None | Index task definitions, completion status |
| "VALIDATE PEERS" button | Fetch posts in review pool | None | Index posts needing validation |
| Community feed | Fetch recent post submissions | None | Index posts, filter by timestamp, limit results |
| | | | |
| **Profile Page** | | | |
| User handle display | Fetch from user profile | None | Index user profiles |
| Wallet address display | Fetch from user profile | Verify: Address is valid format | Index wallet addresses |
| Social links display | Fetch linked platforms | None | Index social link submissions |
| Belief Score history | Fetch belief score change events | None | Index belief score updates with timestamps |
| Post submissions list | Fetch user's submitted posts | None | Index post submissions by userId |
| | | | |
| **Admin Dashboard** | | | |
| Total users count | Count users in DB | None | Index user creation events |
| Total TVL display | Calculate sum of all entry amounts | Verify: Sum matches on-chain deposits | Index all transactions, aggregate amounts |
| Active sprays count | Count participants with status=active | None | Index participant status changes |
| Trench status toggle | Update trench.active flag | None | Index trench status changes |
| | | | |
| **Activity Ticker** | | | |
| Scrolling activity feed | Fetch recent events (sprays, payouts, validations) | None | Index activity events, filter by recency |
| | | | |
| **Risk Banner** | | | |
| Warning display | Static content, no backend needed | None | None |

---

## On-Chain Data Requirements

### HyperEVM / BLT Contract Monitoring

1. **BLT Transfer Events**
   - Event: `Transfer(address from, address to, uint256 amount)`
   - Filter: `to == targetPayoutAddress`
   - Required fields: `from`, `to`, `amount`, `blockNumber`, `timestamp`, `txHash`
   - Purpose: Verify user sent correct amount to correct address

2. **Contract Address**
   - BLT Token: `0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF` (from mockData)
   - Must verify this is correct for HyperEVM

3. **Transaction Verification Logic**
   ```typescript
   verifyTransaction(txHash: string, expectedAmount: number, targetAddress: string): boolean {
     // 1. Fetch transaction from blockchain
     // 2. Verify: tx.to === targetAddress
     // 3. Verify: tx.amount === expectedAmount
     // 4. Verify: tx.token === BLT_CONTRACT_ADDRESS
     // 5. Verify: tx.timestamp < paymentDeadline
     // 6. Return true if all pass
   }
   ```

### No On-Chain Data Needed For

- Trench configuration (off-chain only)
- User profiles (off-chain only)
- Belief scores (off-chain only)
- Boost points (off-chain only)
- Queue positions (calculated off-chain)
- Social posts (off-chain only)
- Validation records (off-chain only)

---

## Off-Chain Indexing Requirements

### Database Tables (Prisma Schema Exists)

1. **User**
   - Index: `handle`, `wallet`, `beliefScore`
   - Updates: On validation completion, belief score changes

2. **Trench**
   - Index: `level`, `active`, `minEntry`, `maxEntry`, `roiMultiplier`
   - Updates: On admin status changes

3. **Participant**
   - Index: `userId`, `trenchId`, `status`, `joinedAt`
   - Updates: On entry, status changes, queue re-sorts

4. **Transaction**
   - Index: `userId`, `txHash`, `status`, `createdAt`
   - Updates: On blockchain verification, timeout

5. **PostSubmission** (needs schema addition)
   - Index: `userId`, `trenchId`, `platform`, `timestamp`
   - Updates: On submission, validation

6. **ValidationRecord** (needs schema addition)
   - Index: `validatorId`, `postId`, `timestamp`
   - Updates: On validation submission

### Indexing Services Needed

1. **Blockchain Indexer**
   - Service: Monitor HyperEVM for BLT transfers
   - Trigger: On new block, scan for relevant transfers
   - Action: Create/update Transaction records
   - Frequency: Real-time (every block)

2. **Queue Calculator**
   - Service: Re-calculate queue positions
   - Trigger: On belief score update, boost point change, new participant
   - Action: Update participant rankings
   - Frequency: On-demand (when triggered)

3. **Boost Decay Scheduler**
   - Service: Decay boost points over time
   - Trigger: Scheduled job (e.g., every hour)
   - Action: Reduce boost points by decay rate
   - Frequency: Periodic (configurable)

4. **Round Manager**
   - Service: Manage payout rounds and cadence
   - Trigger: On round start/end, cadence timer
   - Action: Update round state, trigger payouts
   - Frequency: Based on cadence (NO WAIT, 3 DAYS, 7 DAYS)

5. **Activity Event Indexer**
   - Service: Track all user actions
   - Trigger: On spray, validation, payout, etc.
   - Action: Create activity event records
   - Frequency: Real-time

---

## Backend API Endpoints Required

### Transaction & Entry

- `POST /api/spray` - Create pending transaction record
- `GET /api/transactions/:txHash/verify` - Verify on-chain transaction
- `POST /api/transactions/:id/confirm` - Confirm verified transaction
- `GET /api/transactions/pending` - Get pending transactions for user

### Queue & Positions

- `GET /api/trenches/:id/queue` - Get current queue with positions
- `GET /api/users/:id/positions` - Get user's active positions
- `POST /api/queue/recalculate` - Trigger queue re-calculation

### Social & Validation

- `POST /api/posts/submit` - Submit post link
- `GET /api/posts/review-pool` - Get posts needing validation
- `POST /api/validations/submit` - Submit validation
- `GET /api/validations/:postId` - Get validations for post

### Belief & Boost

- `GET /api/users/:id/belief` - Get belief score
- `GET /api/users/:id/boost` - Get boost points
- `POST /api/boost/decay` - Trigger boost decay (admin/scheduled)

### Trench Management

- `GET /api/trenches` - Get all active trenches
- `GET /api/trenches/:id` - Get trench details
- `PUT /api/trenches/:id/status` - Update trench status (admin)

### Payouts

- `GET /api/payouts/next` - Get next user in queue for payout
- `POST /api/payouts/execute` - Execute payout (admin/system)
- `GET /api/payouts/history` - Get payout history

---

## Implementation Priority

### Phase 1: Read-Only Truth (SAFE - No Writes)

1. ✅ Blockchain indexer for BLT transfers
2. ✅ Transaction verification API
3. ✅ Queue population from verified transactions
4. ✅ Read-only trench/participant APIs

**Risk**: None - only reading blockchain, no fund movement

### Phase 2: Enforcement Logic (SAFE - No Custody)

1. ✅ Payment timeout tracking
2. ✅ ROI cap validation
3. ✅ Entry validation (belief score, max entry)
4. ✅ Round cadence enforcement

**Risk**: Low - only enforcing rules, no fund movement

### Phase 3: Social System (LOW RISK)

1. ✅ Content submission API
2. ✅ Review/endorsement system
3. ✅ Belief score calculation
4. ✅ Boost point decay

**Risk**: Low - only reputation, no money

### Phase 4: Payout Coordination (REQUIRES CAREFUL DESIGN)

1. ✅ Queue position calculation
2. ✅ Payout trigger mechanism
3. ✅ Wallet-to-wallet transfer execution
4. ✅ Payout status tracking

**Risk**: Medium - coordinates payouts but doesn't hold funds

---

## Critical Constraints (from non_negotiables.md)

All systems must enforce:

- ✅ No fund holding (all transfers are P2P)
- ✅ No pooled assets
- ✅ No guaranteed payouts
- ✅ ROI caps enforced server-side
- ✅ Time-bound rounds
- ✅ Belief must continue (decay if inactive)

---

## Next Steps

1. **Design blockchain indexer** - How to monitor HyperEVM for BLT transfers
2. **Design transaction verification** - How to match on-chain transfers to user entries
3. **Design queue calculation** - Exact algorithm for position determination
4. **Design payout coordination** - How to trigger wallet-to-wallet transfers without custody
