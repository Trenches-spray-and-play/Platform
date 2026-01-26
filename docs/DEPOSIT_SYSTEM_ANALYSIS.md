# Deposit System Analysis

> **Last Updated:** 2026-01-22  
> **Scope:** User deposit flow, address generation, fund management, and sweeping

---

## 1. Simple Overview (User Perspective)

### How Deposits Work — The User Experience

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  User clicks    │───▶│  Unique address  │───▶│  User sends     │
│  "Deposit"      │    │  is generated    │    │  tokens/crypto  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Balance shows  │◀───│  Finality met    │◀───│  Platform       │
│  in dashboard   │    │  (12+ blocks)    │    │  detects tx     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Step-by-Step User Flow

1. **User requests deposit address**
   - User clicks "Deposit" and selects a chain (Ethereum, Base, Arbitrum, HyperEVM, or Solana)
   - Platform generates a **unique address just for this user**
   - Same address is reused for future deposits on the same chain

2. **User sends funds**
   - User sends tokens (USDT, USDC, BLT, ETH, SOL) to their unique address
   - Transaction appears on the blockchain

3. **Platform detects deposit**
   - Background monitor scans for incoming transfers to user addresses
   - Deposit recorded as "PENDING"

4. **Confirmation period**
   - Platform waits for block confirmations (varies by chain)
   - After threshold reached, deposit marked "CONFIRMED"
   - User's USD-equivalent balance is credited

5. **Funds are swept to vault**
   - Periodically, all confirmed deposits are consolidated
   - Funds move from user addresses → platform vault
   - Deposit marked "SWEPT"

---

## 2. Technical Architecture

### 2.1 Key Services

| Service | Purpose |
|---------|---------|
| `deposit-address.service.ts` | Generates unique deposit addresses per user |
| `deposit-monitor.service.ts` | Watches blockchain for incoming deposits |
| `price-oracle.service.ts` | Converts token amounts to USD |
| `sweep.service.ts` | Consolidates deposits to vault |

### 2.2 Database Models

```
┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  DepositAddress  │────▶│     Deposit     │────▶│   SweepBatch     │
├──────────────────┤     ├─────────────────┤     ├──────────────────┤
│ id               │     │ id              │     │ id               │
│ userId           │     │ depositAddressId│     │ chain            │
│ chain            │     │ userId          │     │ txHash           │
│ address          │     │ txHash          │     │ status           │
│ derivationIndex  │     │ chain           │     │ depositCount     │
│ cachedBalance    │     │ asset           │     │ totalAmount      │
└──────────────────┘     │ amount          │     │ gasCost          │
                         │ amountUsd       │     └──────────────────┘
                         │ status          │
                         │ blockNumber     │              ┌──────────────────┐
                         │ confirmations   │              │   VaultAddress   │
                         │ sweepBatchId    │              ├──────────────────┤
                         │ sweepTxHash     │              │ chain            │
                         └─────────────────┘              │ address          │
                                                          │ purpose          │
                               Statuses:                  └──────────────────┘
                               PENDING → CONFIRMED → SWEPT
```

---

## 3. Address Generation (HD Wallet)

### 3.1 How It Works

The platform uses **Hierarchical Deterministic (HD) Wallets** following BIP-44 standard:

```
Master Seed (from HD_MASTER_SEED env var)
    │
    ├── EVM Path: m/44'/60'/0'/0/{index}
    │   └── Same address for ETH, Base, Arbitrum, HyperEVM
    │
    └── Solana Path: m/44'/501'/{index}'/0'
        └── Separate address for Solana
```

### 3.2 Key Points

| Feature | Behavior |
|---------|----------|
| **One address per user per chain type** | EVM chains share address, Solana separate |
| **Deterministic** | Same seed + index = same address always |
| **Derivation index** | Auto-incremented for each new user |
| **CEX-style** | Users get permanent deposit addresses (like exchanges) |

### 3.3 Code Reference

```typescript
// File: deposit-address.service.ts

// EVM address derivation
function deriveEvmAddress(index: number): string {
    const path = `44'/60'/0'/0/${index}`;
    const derived = evmMasterNode.derivePath(path);
    return derived.address;
}

// Solana address derivation  
function deriveSolanaAddress(index: number): string {
    const path = `m/44'/501'/${index}'/0'`;
    const derived = derivePath(path, solanaSeed.toString('hex'));
    return SolanaKeypair.fromSeed(derived.key).publicKey.toBase58();
}
```

### 3.4 Supported Chains & Tokens

| Chain | Tokens | Coin Type |
|-------|--------|-----------|
| Ethereum | USDT, USDC, ETH | 60 |
| Base | USDC, ETH | 60 |
| Arbitrum | USDT, USDC, ETH | 60 |
| HyperEVM | BLT, USDT, USDC | 60 |
| Solana | SOL | 501 |

---

## 4. Deposit Detection & Confirmation

### 4.1 Monitoring Process

```
Every 10 seconds (configurable):
   │
   ├── For each EVM chain:
   │   ├── Get latest block
   │   ├── Query ERC20 Transfer events
   │   ├── Filter: transfers TO watched addresses
   │   └── Process matching deposits
   │
   └── For Solana: (TODO - not implemented)
```

### 4.2 Deposit Status Flow

```
[Transaction Detected]
        │
        ▼
   ┌─────────┐
   │ PENDING │ ◀── Deposit recorded, waiting for confirmations
   └────┬────┘
        │ blocks accumulate...
        ▼
   ┌───────────┐
   │ CONFIRMED │ ◀── Finality threshold met, user credited
   └─────┬─────┘
         │ sweep job runs...
         ▼
   ┌────────┐
   │ SWEPT  │ ◀── Funds moved to vault
   └────────┘
```

### 4.3 Confirmation Thresholds

| Chain | Default Threshold |
|-------|-------------------|
| Ethereum | 12 blocks (~2.5 min) |
| Base | 12 blocks |
| Arbitrum | 12 blocks |
| HyperEVM | 12 blocks |
| Solana | Configurable |

### 4.4 What Happens After Confirmation

```typescript
// File: deposit-monitor.service.ts

async function creditUserEntry(deposit) {
    // 1. Get USD value of deposit
    const amountUsd = deposit.amountUsd;
    
    // 2. Credit user's balance
    // (Currently placeholder - marked as TODO)
    
    // 3. User can now use balance to:
    //    - Spray into trenches
    //    - Join waitlists with deposits
}
```

---

## 5. Where the Money Goes (Fund Flow)

### 5.1 Complete Fund Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER WALLET                               │
└─────────────────────────────┬────────────────────────────────────┘
                              │ User sends tokens
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│          USER'S UNIQUE DEPOSIT ADDRESS                           │
│   (Derived from HD wallet, path: m/44'/60'/0'/0/{userIndex})    │
│   Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f8b9D1            │
└─────────────────────────────┬────────────────────────────────────┘
                              │ Sweep job consolidates
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    PLATFORM VAULT ADDRESS                         │
│           (Configured in VaultAddress table)                      │
│   Example: 0xPLATFORM_VAULT_ADDRESS                              │
└─────────────────────────────┬────────────────────────────────────┘
                              │ Payouts to winning users
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      WINNER WALLETS                               │
│       (Users who complete queue and receive ROI)                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Vault Addresses

Vault addresses are stored in the `VaultAddress` table:

```typescript
model VaultAddress {
    id      String @id
    chain   String @unique  // "ethereum", "base", etc.
    address String          // Platform's consolidation wallet
    purpose String          // "primary"
}
```

### 5.3 Sweep Process (Consolidation)

**Purpose:** Move funds from many user deposit addresses → single vault

```typescript
// File: sweep.service.ts

// Runs periodically (configurable, e.g., every 6 hours)
async function sweepChain(chain) {
    // 1. Get all CONFIRMED deposits not yet swept
    const deposits = await getPendingSweepDeposits(chain);
    
    // 2. Check minimum threshold (avoid dust sweeps)
    if (totalAmount < MIN_SWEEP_AMOUNTS[chain]) return;
    
    // 3. Create sweep batch
    const batchId = await createSweepBatch(chain, depositIds, totalAmount);
    
    // 4. Execute transfers from each user address → vault
    //    (Would derive private keys from HD wallet)
    
    // 5. Mark deposits as SWEPT
}
```

**Minimum Sweep Thresholds:**

| Chain | Minimum |
|-------|---------|
| Ethereum | 0.01 ETH |
| Base | 0.001 ETH |
| Arbitrum | 0.001 ETH |
| HyperEVM | 1 BLT |
| Solana | 0.1 SOL |

---

## 6. Security Considerations

### 6.1 Current Implementation

| Aspect | Status |
|--------|--------|
| HD Seed Storage | Environment variable (`HD_MASTER_SEED`) |
| Private Key Derivation | On-demand from seed |
| Vault Access | Sweep service only |
| User Access | Users only receive addresses, never private keys |

### 6.2 How Platform Controls Funds

1. **Platform holds master seed** → can derive all private keys
2. **Users deposit to derived addresses** → platform controls these
3. **Sweep moves funds to vault** → consolidation
4. **Payouts from vault** → to winning users' personal wallets

### 6.3 Non-Custodial Claim

The platform is described as "non-custodial" but:
- Platform generates and controls deposit addresses
- User funds are held in platform-controlled addresses
- Sweep consolidates to platform vault

> ⚠️ This is more accurately "platform-custodied" rather than "non-custodial" from a traditional DeFi perspective.

---

## 7. API Endpoints

### 7.1 Get Deposit Address

```typescript
GET /api/deposit/address?chain=ethereum

Response:
{
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f8b9D1",
    chain: "ethereum",
    isNew: false // true if just created
}
```

### 7.2 Get Deposit History

```typescript
GET /api/deposits

Response:
{
    deposits: [
        {
            id: "...",
            txHash: "0x...",
            chain: "ethereum",
            asset: "USDC",
            amount: "100.00",
            amountUsd: 100.00,
            status: "CONFIRMED",
            confirmations: 15,
            createdAt: "2026-01-22T12:00:00Z"
        }
    ]
}
```

---

## 8. Summary

### What Happens to User Money

1. **Deposited** → User sends to their unique address
2. **Recorded** → Platform detects and tracks as PENDING
3. **Confirmed** → After block finality, user balance credited
4. **Swept** → Funds consolidated to platform vault
5. **Used** → User sprays into trenches OR...
6. **Paid out** → Queue winners receive tokens from vault

### Key Takeaways

| Question | Answer |
|----------|--------|
| **How are addresses generated?** | HD wallet derivation (BIP-44) from master seed |
| **Are addresses unique per user?** | Yes, and reused for same chain |
| **Where do funds go initially?** | User's derived deposit address |
| **Where do funds go after sweep?** | Platform vault address |
| **When is user credited?** | After confirmation threshold (12+ blocks) |
| **Can user withdraw?** | Not directly — use balance in platform |
| **Is it truly non-custodial?** | No, platform controls addresses |
