# Trenches User Documentation

> **Version**: 1.0
> 
> **Purpose**: Clear risk language and system behavior documentation

---

## What Trenches Is

Trenches is a **belief coordination platform** where:

- Users enter queues by sending supported tokens (BLT, ETH, USDT, USDC, SOL)
- Queue position is determined by **belief score** (earned socially) and **boost points** (earned by reviewing others)
- Payouts flow to eligible users who reached the front of the queue **in BLT only**
- Everything is **observable** — you can see the queue, positions, and caps
- Queue position is determined by **belief score** (earned socially) and **boost points** (earned by reviewing others)
- Payouts flow to eligible users who reached the front of the queue
- Everything is **observable** — you can see the queue, positions, and caps

---

## What Trenches Is NOT

> [!CAUTION]
> Read this carefully before participating.

- ❌ **Not a guaranteed payout system** — Payouts depend on continued inflow
- ❌ **Not custodial** — Trenches never holds your funds
- ❌ **Not a yield product** — There is no interest, staking, or APY
- ❌ **Not insurance** — Your entry can expire worthless
- ❌ **Not reversible** — Once sent, tokens are someone else's

---

## How the Queue Works

### Ordering Algorithm
Your position is determined by:

```
1. Belief Score (higher = better)
2. Boost Points (higher = better)
3. Join Time (earlier = better)
```

### Moving Up
You can improve your position by:
- **Reviewing peer content** → Earn boost points (+50 per review)
- **Getting endorsed** → Earn belief points (5-20 per endorsement)

### Moving Down
You can lose position if:
- Others gain more belief/boost
- Your boost decays (5% per hour)

---

## Entry Rules

| Your Belief Score | Maximum Entry |
|-------------------|---------------|
| 0-99 | 50% of trench max |
| 100-499 | 75% of trench max |
| 500-999 | 90% of trench max |
| 1000+ | 100% of trench max |

---

## Payout Caps

**All trenches use 1.5× max return.**

| Level | Entry Cap | Payout Example |
|-------|-----------|----------------|
| ⚡ Rapid | $1,000 | $1,000 → max $1,500 |
| ⚔️ Medium | $10,000 | $10,000 → max $15,000 |
| 🛡️ Slow | $100,000 | $100,000 → max $150,000 |

**You cannot receive more than 1.5× your entry.**

---

## Payment Assets

### Accepted for Entry
| Asset | Chains |
|-------|--------|
| BLT | HyperEVM |
| ETH | Ethereum, Base, Arbitrum |
| USDT | Ethereum, Base, Arbitrum, HyperEVM, Solana |
| USDC | Ethereum, Base, Arbitrum, HyperEVM, Solana |
| SOL | Solana |

### Payout Asset
> [!IMPORTANT]
> All payouts are in **BLT only**, regardless of entry asset.

### Where Non-BLT Payments Go
If you pay with anything other than BLT:
- Your payment goes to **Trenches reserve** (not another user)
- You are still added to the queue
- Your payout will still be in BLT

---

## Deposit Process

### Getting Your Deposit Address

1. Navigate to "Deposit" in the app
2. Select your preferred chain (Ethereum, Base, Arbitrum, HyperEVM, Solana)
3. Copy your unique deposit address
4. This address is **yours forever** — you can reuse it for future deposits

> [!IMPORTANT]
> Each chain has a separate address. Make sure you're sending to the correct chain's address.

### Sending Funds

1. Send supported tokens to your deposit address
2. System detects your deposit automatically
3. After confirmation (varies by chain), you're credited and added to the queue
4. **No memo or reference needed** — it's your personal address

### Confirmation Times

| Chain | Wait Time | Blocks |
|-------|-----------|--------|
| Ethereum | ~3 minutes | 12 blocks |
| Base / Arbitrum | ~2 minutes | 50 blocks |
| HyperEVM | ~2 seconds | 1 block |
| Solana | ~15 seconds | 32 slots |

### What Happens After Deposit

1. Your deposit is detected and marked as "Pending"
2. System waits for confirmation threshold
3. Once confirmed, your entry value (in USD) is calculated
4. You're added to the appropriate trench queue
5. Deposits are periodically swept to the Trenches vault

---

## Risk Disclosure

> [!WARNING]
> **You can lose everything you enter.**

Trenches makes no guarantees:
- Queue inflow may stop
- Your entry may expire before payout
- System rules may change
- Smart contract bugs may occur

**Only enter what you can afford to lose.**

---

## Social Contribution System

### Submitting Content
1. Create content about Trenches (threads, videos, articles)
2. Submit the URL via the app
3. Wait for peer reviews

### Reviewing Peers
1. Open content from the review pool
2. Interact (like, comment, repost)
3. Submit proof link
4. Rate quality (1-5)
5. Choose: Endorse or Skip

### Rewards
- **Reviewers**: +50 boost points per review
- **Authors**: +5-20 belief points after 3+ endorsements

### Abuse Prevention
- You cannot review your own content
- One review per person per post
- Low-belief accounts have less influence

---

## Glossary

| Term | Meaning |
|------|---------|
| **Trench** | A queue with specific entry size and ROI cap |
| **Spray** | Entering a trench by sending BLT |
| **Belief Score** | Permanent reputation from social contributions |
| **Boost Points** | Temporary queue advantage (decays over time) |
| **On the Clock** | The user at position 1, eligible for payout |
| **BLT** | The token used for entries and payouts |
