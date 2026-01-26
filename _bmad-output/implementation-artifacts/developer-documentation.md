# Trenches Developer Documentation

> **Version**: 1.0
> 
> **Purpose**: Technical reference for Trenches backend services

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────┤
│                      API Routes                          │
│  /api/spray  /api/posts  /api/validations  /api/queue   │
├─────────────────────────────────────────────────────────┤
│                      Services                            │
│  transaction  queue  enforcement  belief  blockchain     │
├─────────────────────────────────────────────────────────┤
│                   Prisma ORM                             │
├─────────────────────────────────────────────────────────┤
│                  PostgreSQL (Supabase)                   │
└─────────────────────────────────────────────────────────┘
         │
         │ Events
         ▼
┌─────────────────────┐
│  HyperEVM (BLT)     │
│  Blockchain Monitor │
└─────────────────────┘
```

---

## Services Reference

### transaction.service.ts

```typescript
createPendingTransaction(params) → Transaction
matchTransferToEntry(params) → Transaction | null
verifyTransaction(id, params) → Transaction
getTransactionStatus(id) → Transaction
expirePendingTransactions() → number
```

### queue.service.ts

```typescript
getTrenchQueue(trenchId) → QueueEntry[]
getUserQueuePosition(userId, trenchId) → number | null
getOnTheClockUser(trenchId) → QueueEntry | null
getNextPayoutTarget(trenchId) → QueueEntry | null
addBoostPoints(userId, trenchId, points) → void
applyBoostDecay(decayPercent) → number
recordPayoutReceived(participantId, amount) → void
```

### enforcement.service.ts

```typescript
getMaxAllowedEntry(beliefScore, maxEntry) → number
calculateMaxPayout(amount, multiplier) → number
validateEntry(userId, trenchId, amount) → EnforcementResult
expireParticipants() → number
isRoundActive(startTime, cadence) → boolean
getROIMultiplier(level) → number
```

### belief.service.ts

```typescript
submitPost(params) → PostSubmission
getReviewPool(validatorId, limit) → PostSubmission[]
validatePost(params) → Validation
awardBeliefPoints(userId, rating) → number
getUserBeliefStats(userId) → BeliefStats
getBeliefLeaderboard(limit) → User[]
```

### blockchain.monitor.ts

```typescript
initializeBlockchain() → boolean
startMonitoring() → void
stopMonitoring() → void
scanRecentBlocks(count) → void
```

---

## Database Schema

### Core Models

```prisma
User {
  id, handle, wallet, beliefScore
}

Trench {
  id, name, level, entrySize, cadence, active
}

Participant {
  id, userId, trenchId, status
  entryAmount, maxPayout, receivedAmount, boostPoints
  joinedAt, expiresAt
}

Transaction {
  id, userId, trenchId, amount, type, status
  targetAddress, txHash, deadline, verifiedAt
}
```

### Social Models

```prisma
PostSubmission {
  id, userId, platform, url, contentType
  status, endorsements
}

Validation {
  id, postId, validatorId
  rating, proofUrl, endorsed
  boostAwarded, beliefAwarded
}
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/spray` | Create pending entry |
| GET | `/api/trenches/[id]/queue` | Get queue + stats |
| POST | `/api/posts` | Submit content |
| GET | `/api/posts?validatorId=x` | Get review pool |
| POST | `/api/validations` | Submit review |
| GET | `/api/blockchain/init` | Start monitoring |
| GET | `/api/deposit-address` | Get user deposit addresses |
| POST | `/api/deposit-address` | Create addresses for all chains |
| GET | `/api/deposits` | Get user deposit history |

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Blockchain
HYPEREVM_RPC_URL=https://rpc.hyperliquid.xyz/evm
HYPEREVM_CHAIN_ID=999
BLT_CONTRACT_ADDRESS=0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF

# Config
PAYMENT_WINDOW_MS=900000
POLLING_INTERVAL=10

# Deposit Address System (HD Wallet)
HD_MASTER_SEED=<mnemonic-or-hex-seed>
SWEEP_INTERVAL_HOURS=6
MIN_SWEEP_THRESHOLD_USD=50

# RPC URLs
ETHEREUM_RPC_URL=https://eth.llamarpc.com
BASE_RPC_URL=https://mainnet.base.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Vault Addresses
VAULT_ADDRESS_ETHEREUM=0x...
VAULT_ADDRESS_BASE=0x...
VAULT_ADDRESS_ARBITRUM=0x...
VAULT_ADDRESS_HYPEREVM=0x...
VAULT_ADDRESS_SOLANA=...
```

---

## Key Algorithms

### Queue Ordering

```typescript
participants.sort((a, b) => {
  // 1. Belief Score DESC
  if (b.beliefScore !== a.beliefScore) 
    return b.beliefScore - a.beliefScore;
  // 2. Boost Points DESC
  if (b.boostPoints !== a.boostPoints) 
    return b.boostPoints - a.boostPoints;
  // 3. Join Time ASC
  return a.joinedAt - b.joinedAt;
});
```

### Belief-Based Entry Cap

```typescript
if (beliefScore >= 1000) return maxEntry * 1.0;
if (beliefScore >= 500)  return maxEntry * 0.9;
if (beliefScore >= 100)  return maxEntry * 0.75;
return maxEntry * 0.5;
```

### Payout Eligibility

```typescript
isEligible = (
  status === 'active' &&
  receivedAmount < maxPayout &&
  !expired
);
```

---

## Non-Negotiable Constraints

From [beliefs.md](file:///Users/mac/Trenches%20-%20Spray%20and%20Pray/_bmad-output/implementation-artifacts/beliefs.md):

1. App never touches funds
2. All payments are wallet-to-wallet
3. No guaranteed payouts
4. ROI is capped and time-bound
5. UI exposes risk clearly
