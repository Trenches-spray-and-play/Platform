# ✅ TBO APPROVED SPECIFICATION

**Date:** January 31, 2026  
**Decision:** ✅ APPROVE WITH MODIFICATIONS  
**Approver:** TBO (Product Senior Engineer)  
**Next Step:** Lead Dev Implementation

---

## 🎯 EXECUTIVE SUMMARY

**Status:** Approved with required modifications  
**Risk Level:** HIGH (mitigated with insurance/thresholds)  
**Timeline:** Backend implementation can begin

---

## ✅ APPROVED BUSINESS MODEL

### Core Concept (APPROVED)
- ✅ 3 perpetual trenches (Rapid, Mid, Deep)
- ✅ Multiple projects per trench
- ✅ Dollar-pegged payouts (with insurance requirement)
- ✅ Proportional token allocation

### Critical Additions Required

#### 1. Insurance Buffer Mechanism (REQUIRED)

```
Each trench maintains 10% insurance buffer:

Total Reserve: $2,500,000
Insurance Buffer (10%): $250,000
Available for Payouts: $2,250,000

If token price drops before payout:
→ Use insurance buffer to cover gap
→ Platform takes loss (not user)
```

**Implementation:**
```prisma
model Trench {
  id                String   @id @default(cuid())
  level             TrenchLevel
  totalReserveUsd   Decimal  @db.Decimal(20, 8)
  insuranceBuffer   Decimal  @db.Decimal(20, 8)  // 10% of reserve
  // ...
}
```

#### 2. Reserve Thresholds (REQUIRED)

| Threshold | Status | Action |
|-----------|--------|--------|
| >20% buffer | 🟢 ACTIVE | Normal operations |
| 10-20% buffer | 🟡 CAUTION | Warning displayed |
| <10% buffer | 🔴 PAUSED | New sprays blocked |
| <5% buffer | 🚨 EMERGENCY | Early exit offered |

**Implementation:**
```prisma
model Trench {
  minReserveThreshold Decimal @db.Decimal(20, 8) // 20% floor
  status              TrenchStatus // ACTIVE, PAUSED, EMERGENCY
  // ...
}
```

#### 3. Fee Structure (APPROVED)

**Deposit Fee:** 0.5% (taken from spray amount)

**Example:**
- User sprays: $1,000
- Platform fee: $5 (0.5%)
- Effective spray: $995
- Payout at 1.5x: $1,492.50
- User receives: $1,492.50 (no additional fees)

**Implementation:**
```typescript
const depositFee = sprayAmount * 0.005; // 0.5%
const effectiveSpray = sprayAmount - depositFee;
```

#### 4. Token Allocation Logic (APPROVED)

**Method:** Proportional to reserve contribution

**Formula:**
```
Project Share = (Project Reserve / Total Trench Reserve) × Spray Amount

Example:
- RAPID trench total reserve: $2,500,000
- HYPE reserve: $1,000,000 (40%)
- SOL reserve: $800,000 (32%)
- BLT reserve: $700,000 (28%)

User sprays: $1,000
- $400 goes to buy HYPE (40%)
- $320 goes to buy SOL (32%)
- $280 goes to buy BLT (28%)
```

**Phase 2:** Add user override capability (user can adjust proportions)

---

## 📊 APPROVED DATA MODEL

### Updated Schema

```prisma
model Trench {
  id                  String   @id @default(cuid())
  level               TrenchLevel // RAPID, MID, DEEP
  
  // Reserve (APPROVED)
  totalReserveUsd     Decimal  @db.Decimal(20, 8)
  insuranceBuffer     Decimal  @db.Decimal(20, 8)  // 10% buffer
  minReserveThreshold Decimal  @db.Decimal(20, 8)  // 20% floor
  
  // Status (NEW)
  status              TrenchStatus @default(ACTIVE)
  // ACTIVE: Normal operations
  // PAUSED: Below threshold, sprays blocked
  // EMERGENCY: Critical reserve level
  
  // Relations
  featuredProjects    FeaturedProject[]
  insuranceEvents     InsuranceEvent[]
  
  // Stats (APPROVED)
  participantCount    Int @default(0)
  totalSprayed        Decimal @default(0) @db.Decimal(20, 8)
  totalFeesCollected  Decimal @default(0) @db.Decimal(20, 8)
  
  // Visual (APPROVED)
  themeColor          String
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model FeaturedProject {
  id                  String @id @default(cuid())
  trenchId            String
  trench              Trench @relation(fields: [trenchId], references: [id])
  
  // Project info (APPROVED)
  name                String
  tokenSymbol         String
  tokenAddress        String
  logoUrl             String?
  
  // Reserve (APPROVED)
  reserveAmount       Decimal @db.Decimal(36, 18)  // Token amount
  reserveUsdValue     Decimal @db.Decimal(20, 8)   // USD value
  reserveProportion   Decimal @db.Decimal(5, 4)    // % of trench (0-1)
  
  // Thresholds (NEW)
  minReserveThreshold Decimal @db.Decimal(20, 8)
  
  // Status (NEW)
  status              ProjectStatus @default(ACTIVE)
  // ACTIVE: Normal
  // LOW_RESERVE: Below warning threshold
  // EXITING: Winding down
  
  // Terms (APPROVED)
  promisedApy         Decimal @db.Decimal(5, 2)
  
  addedAt             DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

// NEW: Insurance Events
model InsuranceEvent {
  id          String   @id @default(cuid())
  trenchId    String
  trench      Trench   @relation(fields: [trenchId], references: [id])
  
  amount      Decimal  @db.Decimal(20, 8)
  reason      InsuranceReason
  // PRICE_DROP: Token price decreased
  // RESERVE_COVERAGE: Covering payout gap
  // EMERGENCY_PAYOUT: Early exit payout
  
  details     String?  // JSON with additional context
  
  createdAt   DateTime @default(now())
}

enum TrenchStatus {
  ACTIVE
  PAUSED
  EMERGENCY
}

enum ProjectStatus {
  ACTIVE
  LOW_RESERVE
  EXITING
  EXITED
}

enum InsuranceReason {
  PRICE_DROP
  RESERVE_COVERAGE
  EMERGENCY_PAYOUT
}
```

---

## 🔌 APPROVED API SPECIFICATION

### GET /api/trenches/v2

**Response:**
```typescript
{
  success: true,
  data: {
    trenches: [
      {
        // Core (APPROVED)
        level: "RAPID" | "MID" | "DEEP",
        name: "Rapid Trench",
        description: "Quick rotations, 1-3 days",
        
        // Reserve (APPROVED with additions)
        totalReserveUsd: 2450000,
        insuranceBuffer: 245000,     // 10%
        minThreshold: 490000,        // 20%
        
        // Status (NEW)
        status: "ACTIVE",            // ACTIVE | PAUSED | EMERGENCY
        canSpray: true,              // false if PAUSED
        
        // Risk (NEW)
        riskLevel: "LOW",            // LOW | MEDIUM | HIGH
        riskIndicators: {
          insuranceBufferPercent: 10,
          reserveHealth: "HEALTHY",  // HEALTHY | WARNING | CRITICAL
        },
        
        // Projects (APPROVED)
        featuredProjects: [
          {
            id: "proj_123",
            name: "Hyperliquid",
            tokenSymbol: "HYPE",
            tokenAddress: "0x...",
            logoUrl: "https://...",
            
            // Reserve contribution (APPROVED)
            reserveUsd: 980000,
            proportion: 0.40,        // 40%
            
            // Status (NEW)
            status: "ACTIVE",        // ACTIVE | LOW_RESERVE | EXITING
            
            // Terms (APPROVED)
            apy: 15.0,
          }
        ],
        
        // Reserve composition (APPROVED)
        reserveComposition: [
          { tokenSymbol: "HYPE", percentage: 40, usdValue: 980000 },
          { tokenSymbol: "SOL", percentage: 32, usdValue: 784000 },
          { tokenSymbol: "BLT", percentage: 28, usdValue: 686000 },
        ],
        
        // Stats (APPROVED)
        participantCount: 3420,
        totalSprayed: 15200000,
        avgApy: 12.5,
        
        // Terms (APPROVED)
        duration: "1-3 days",
        durationHours: 72,
        entryRange: { min: 5, max: 1000 },
        
        // Visual (APPROVED)
        themeColor: "#00FF66",
      }
    ],
    
    // Platform stats (APPROVED)
    platformStats: {
      totalReserveUsd: 32150000,
      totalSprayers: 28450,
      featuredProjectCount: 12,
      avgPlatformApy: 11.8,
    }
  }
}
```

### POST /api/spray (APPROVED)

**Request:**
```typescript
{
  trenchId: "trench_rapid_001",
  amount: 1000,           // USD
  
  // Optional: User override (Phase 2)
  allocationPreference?: {
    [tokenSymbol: string]: number  // Percentage override
  }
}
```

**Processing:**
1. Validate trench status (must be ACTIVE)
2. Calculate fee: $1000 × 0.5% = $5
3. Effective amount: $995
4. Allocate proportionally across featured projects
5. Execute token purchases
6. Create spray entry

**Response:**
```typescript
{
  success: true,
  data: {
    sprayId: "spray_abc123",
    amount: 1000,
    fee: 5,
    effectiveAmount: 995,
    
    allocation: [
      { tokenSymbol: "HYPE", amount: 398, usdValue: 398 },
      { tokenSymbol: "SOL", amount: 318.4, usdValue: 318.4 },
      { tokenSymbol: "BLT", amount: 278.6, usdValue: 278.6 },
    ],
    
    expectedPayout: {
      amount: 1492.50,  // 1.5x
      date: "2026-02-03T00:00:00Z",
    },
    
    // Risk disclosure (NEW)
    riskLevel: "LOW",
    insuranceBuffer: 245000,
  }
}
```

---

## 🎨 APPROVED UX SPECIFICATION

### 1. Trench Card Display (APPROVED)

**Show:**
- Trench level icon (⚡ ◆ ▲)
- Top 3 featured projects with badges [HYPE][SOL][BLT]
- "+N more" indicator if >3 projects
- Total reserve value (primary metric)
- Reserve composition bar (visual)
- APY (secondary metric)
- Active sprayer count
- Risk indicator color (🟢🟡🔴)

**Risk Indicator Logic:**
```typescript
const getRiskLevel = (insuranceBufferPercent: number) => {
  if (insuranceBufferPercent >= 20) return { level: "LOW", color: "🟢" };
  if (insuranceBufferPercent >= 10) return { level: "MEDIUM", color: "🟡" };
  return { level: "HIGH", color: "🔴" };
};
```

### 2. Spray Flow (APPROVED)

**Step 1:** Click "Spray" on trench card  
**Step 2:** Enter amount  
**Step 3:** Show projected allocation breakdown  
**Step 4:** Display risk disclosure  
**Step 5:** Confirm  
**Step 6:** Execute

**Allocation Preview:**
```
Your $1,000 spray will be allocated:

[HYPE] ████████████ 40% ($400)
[SOL]  █████████    32% ($320)
[BLT]  ████████     28% ($280)

Platform fee: $5 (0.5%)
Expected return: $1,492.50 (in 1-3 days)

Risk Level: 🟢 LOW
Insurance Buffer: $245,000 (10%)
```

### 3. Warning States (REQUIRED)

**Trench Card:**
- 🟢 Green border: Insurance >20%
- 🟡 Yellow border: Insurance 10-20% (warning)
- 🔴 Red border: Insurance <10% (sprays paused)
- 🚨 Emergency badge: Insurance <5%

**Spray Button:**
- Enabled: Trench status = ACTIVE
- Disabled: Trench status = PAUSED | EMERGENCY
- Tooltip: "Temporarily paused - reserve buffer low"

---

## ⚠️ RISK MANAGEMENT PROTOCOLS

### Scenario 1: Token Price Drop

**Detection:**
- Monitor token prices every 5 minutes
- Calculate reserve USD value in real-time

**Action (Price Drop <10%):**
1. Log InsuranceEvent
2. Draw from insurance buffer to maintain payout obligations
3. Alert platform admin

**Action (Price Drop >20%):**
1. Trigger trench status = PAUSED
2. Block new sprays
3. Emergency notification to projects
4. Evaluate early exit options

### Scenario 2: Reserve Depletion

**Levels:**
- **Healthy:** Insurance buffer >20% → Continue normal ops
- **Warning:** Insurance buffer 10-20% → Show warnings, reduce marketing
- **Critical:** Insurance buffer <10% → Pause sprays, emergency mode
- **Terminal:** Insurance buffer <5% → Early exit for users, project exit

**Recovery:**
- Projects can add more reserve
- Platform can inject emergency liquidity
- Gradual reopening when buffer restored

---

## 🚀 IMPLEMENTATION CHECKLIST

### Phase 1: Backend Foundation (Week 1)
- [ ] Update database schema with insurance/thresholds
- [ ] Create insurance event logging
- [ ] Implement reserve health monitoring
- [ ] Build risk calculation engine

### Phase 2: API Development (Week 1-2)
- [ ] Build GET /api/trenches/v2
- [ ] Implement spray endpoint with fee logic
- [ ] Add proportional allocation algorithm
- [ ] Create risk indicator calculations

### Phase 3: Frontend Integration (Week 2)
- [ ] Connect TrenchCard to real API
- [ ] Add allocation preview to spray flow
- [ ] Implement risk indicators (🟢🟡🔴)
- [ ] Build warning state UIs

### Phase 4: Testing & Launch (Week 3)
- [ ] Test insurance buffer scenarios
- [ ] Simulate price drop recoveries
- [ ] Load test with high volume
- [ ] Deploy with monitoring

### Phase 5: Risk Dashboard (Phase 2)
- [ ] Real-time reserve health monitor
- [ ] Insurance buffer alerts
- [ ] Project exit management
- [ ] Automated hedging (optional)

---

## 📋 SIGN-OFF

**Product Senior Engineer Approval:**

- [x] Business model approved (with insurance/thresholds)
- [x] Data model approved
- [x] API specification approved
- [x] UX flow approved
- [x] Risk management protocols approved
- [x] Fee structure approved (0.5% deposit)

**Ready for Lead Dev Implementation:** ✅ YES

**Implementation Priority:** HIGH

**Next Review:** After backend schema finalized

---

**Document Version:** 1.0  
**Approved By:** TBO (Product Senior Engineer)  
**Date:** January 31, 2026  
**Status:** APPROVED - Ready for development
