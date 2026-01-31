# 🚀 LEAD DEV IMPLEMENTATION BRIEF

**Status:** ✅ APPROVED BY TBO - Ready for Implementation  
**Date:** January 31, 2026  
**Priority:** HIGH  
**Estimated Timeline:** 2-3 weeks

---

## ✅ DECISION: APPROVED WITH MODIFICATIONS

TBO (Product Senior Engineer) has **approved** the 3 Trenches business model with **critical additions**.

**You can now begin backend implementation.**

---

## 🎯 WHAT'S APPROVED

### Business Model (APPROVED)
- ✅ 3 perpetual trenches (Rapid, Mid, Deep)
- ✅ Multiple projects per trench
- ✅ Dollar-pegged payouts
- ✅ Proportional token allocation

### Critical Additions (REQUIRED)

#### 1. Insurance Buffer (10%)
```prisma
model Trench {
  insuranceBuffer   Decimal  // 10% of totalReserveUsd
}
```
- Covers token price drops
- Platform takes loss, not users
- Must be tracked per trench

#### 2. Reserve Thresholds
| Level | Buffer | Status | Action |
|-------|--------|--------|--------|
| >20% | 🟢 | ACTIVE | Normal |
| 10-20% | 🟡 | CAUTION | Warnings |
| <10% | 🔴 | PAUSED | Block sprays |
| <5% | 🚨 | EMERGENCY | Early exit |

#### 3. Fee Structure
- **0.5% deposit fee** (taken from spray amount)
- Example: $1,000 spray → $5 fee → $995 effective

#### 4. Token Allocation
**Proportional to reserve contribution:**
```
Project Share = (Project Reserve / Total Trench Reserve) × Spray Amount
```

---

## 📊 DATABASE SCHEMA (APPROVED)

### Complete Schema

```prisma
// Trench with insurance and thresholds
model Trench {
  id                  String   @id @default(cuid())
  level               TrenchLevel // RAPID, MID, DEEP
  
  // Reserve with insurance (NEW)
  totalReserveUsd     Decimal  @db.Decimal(20, 8)
  insuranceBuffer     Decimal  @db.Decimal(20, 8)  // 10%
  minReserveThreshold Decimal  @db.Decimal(20, 8)  // 20% floor
  
  // Status management (NEW)
  status              TrenchStatus @default(ACTIVE)
  // ACTIVE | PAUSED | EMERGENCY
  
  // Relations
  featuredProjects    FeaturedProject[]
  insuranceEvents     InsuranceEvent[]
  
  // Stats
  participantCount    Int @default(0)
  totalSprayed        Decimal @default(0) @db.Decimal(20, 8)
  totalFeesCollected  Decimal @default(0) @db.Decimal(20, 8)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

// Featured projects in trench
model FeaturedProject {
  id                  String @id @default(cuid())
  trenchId            String
  trench              Trench @relation(fields: [trenchId], references: [id])
  
  name                String
  tokenSymbol         String
  tokenAddress        String
  logoUrl             String?
  
  // Reserve tracking
  reserveAmount       Decimal @db.Decimal(36, 18)
  reserveUsdValue     Decimal @db.Decimal(20, 8)
  reserveProportion   Decimal @db.Decimal(5, 4)  // % of trench
  
  // Status
  status              ProjectStatus @default(ACTIVE)
  minReserveThreshold Decimal @db.Decimal(20, 8)
  
  // Terms
  promisedApy         Decimal @db.Decimal(5, 2)
  
  addedAt             DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

// Insurance events tracking
model InsuranceEvent {
  id          String   @id @default(cuid())
  trenchId    String
  trench      Trench   @relation(fields: [trenchId], references: [id])
  
  amount      Decimal  @db.Decimal(20, 8)
  reason      InsuranceReason
  details     String?
  
  createdAt   DateTime @default(now())
}

// Spray entries
model SprayEntry {
  id            String   @id @default(cuid())
  userId        String
  trenchId      String
  
  // Amounts
  amount        Decimal  @db.Decimal(20, 8)  // User input
  fee           Decimal  @db.Decimal(20, 8)  // 0.5%
  effectiveAmount Decimal @db.Decimal(20, 8) // After fee
  
  // Allocation (JSON)
  allocation    String   // [{tokenSymbol, amount, usdValue}]
  
  // Payout
  expectedPayout Decimal @db.Decimal(20, 8)
  payoutDate    DateTime
  
  status        SprayStatus @default(PENDING)
  
  createdAt     DateTime @default(now())
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

enum SprayStatus {
  PENDING
  ACTIVE
  READY
  PAID_OUT
}
```

---

## 🔌 API ENDPOINTS (APPROVED)

### 1. GET /api/trenches/v2

Returns exactly 3 trench objects with full details.

**Response:**
```typescript
{
  success: true,
  data: {
    trenches: [
      {
        level: "RAPID",
        name: "Rapid Trench",
        description: "Quick rotations, 1-3 days",
        
        // Reserve with insurance
        totalReserveUsd: 2450000,
        insuranceBuffer: 245000,     // 10%
        minThreshold: 490000,        // 20%
        
        // Status
        status: "ACTIVE",            // ACTIVE | PAUSED | EMERGENCY
        canSpray: true,              // Computed from status
        
        // Risk
        riskLevel: "LOW",            // LOW | MEDIUM | HIGH
        riskIndicators: {
          insuranceBufferPercent: 10,
          reserveHealth: "HEALTHY",  // HEALTHY | WARNING | CRITICAL
        },
        
        // Featured projects
        featuredProjects: [
          {
            id: "proj_123",
            name: "Hyperliquid",
            tokenSymbol: "HYPE",
            tokenAddress: "0x...",
            logoUrl: "https://...",
            reserveUsd: 980000,
            proportion: 0.40,        // 40%
            status: "ACTIVE",
            apy: 15.0,
          }
        ],
        
        // Composition for bar chart
        reserveComposition: [
          { tokenSymbol: "HYPE", percentage: 40, usdValue: 980000 },
          { tokenSymbol: "SOL", percentage: 32, usdValue: 784000 },
          { tokenSymbol: "BLT", percentage: 28, usdValue: 686000 },
        ],
        
        // Stats
        participantCount: 3420,
        totalSprayed: 15200000,
        avgApy: 12.5,
        duration: "1-3 days",
        entryRange: { min: 5, max: 1000 },
        themeColor: "#00FF66",
      }
    ],
    platformStats: {
      totalReserveUsd: 32150000,
      totalSprayers: 28450,
      featuredProjectCount: 12,
      avgPlatformApy: 11.8,
    }
  }
}
```

### 2. POST /api/spray

**Request:**
```typescript
{
  trenchId: "trench_rapid_001",
  amount: 1000,  // USD
}
```

**Processing Logic:**
1. Validate trench status === "ACTIVE"
2. Calculate fee: amount × 0.005
3. effectiveAmount = amount - fee
4. Allocate proportional to featured projects
5. Create spray entry
6. Execute token purchases (async)

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
      amount: 1492.50,
      date: "2026-02-03T00:00:00Z",
    },
    riskLevel: "LOW",
    insuranceBuffer: 245000,
  }
}
```

### 3. Background Jobs (Required)

**Reserve Health Monitor (Every 5 minutes):**
```typescript
// Check all trenches
for each trench:
  - Calculate current reserve USD value
  - Update insurance buffer status
  - If buffer < 20% → status = WARNING
  - If buffer < 10% → status = PAUSED
  - If buffer < 5% → status = EMERGENCY
  - Log InsuranceEvent if status changed
```

**Token Price Updater (Every 5 minutes):**
```typescript
// Update featured project reserve USD values
for each featuredProject:
  - Fetch current token price
  - Calculate reserveUsdValue = reserveAmount × price
  - Update proportion in trench
  - If project reserve < threshold → project.status = LOW_RESERVE
```

---

## 🧮 ALGORITHMS (APPROVED)

### 1. Proportional Allocation

```typescript
function allocateSpray(
  amount: number,
  trench: Trench
): Allocation[] {
  const allocations: Allocation[] = [];
  
  for (const project of trench.featuredProjects) {
    if (project.status !== "ACTIVE") continue;
    
    const proportion = project.reserveUsdValue / trench.totalReserveUsd;
    const allocation = amount * proportion;
    
    allocations.push({
      projectId: project.id,
      tokenSymbol: project.tokenSymbol,
      amount: allocation,
      proportion: proportion,
    });
  }
  
  return allocations;
}

// Example:
// User sprays: $1,000
// HYPE reserve: $1M (40% of $2.5M) → $400
// SOL reserve: $800K (32%) → $320
// BLT reserve: $700K (28%) → $280
```

### 2. Risk Level Calculation

```typescript
function calculateRiskLevel(trench: Trench): RiskLevel {
  const bufferPercent = (trench.insuranceBuffer / trench.totalReserveUsd) * 100;
  
  if (bufferPercent >= 20) {
    return { level: "LOW", color: "green", status: "ACTIVE" };
  }
  if (bufferPercent >= 10) {
    return { level: "MEDIUM", color: "yellow", status: "CAUTION" };
  }
  if (bufferPercent >= 5) {
    return { level: "HIGH", color: "red", status: "PAUSED" };
  }
  return { level: "CRITICAL", color: "red", status: "EMERGENCY" };
}
```

### 3. Insurance Payout

```typescript
async function processPayoutWithInsurance(
  spray: SprayEntry,
  currentTokenPrices: Prices
): Promise<PayoutResult> {
  const expectedUsd = spray.expectedPayout;
  
  // Calculate actual token value at current prices
  const actualTokenValue = calculateTokenValue(
    spray.allocation,
    currentTokenPrices
  );
  
  if (actualTokenValue >= expectedUsd) {
    // Token appreciated or stable
    return { amount: expectedUsd, useInsurance: false };
  }
  
  // Token depreciated - use insurance
  const shortfall = expectedUsd - actualTokenValue;
  
  if (shortfall <= trench.insuranceBuffer) {
    // Cover from insurance
    await deductFromInsuranceBuffer(trench.id, shortfall);
    await logInsuranceEvent(trench.id, shortfall, "PRICE_DROP");
    
    return { amount: expectedUsd, useInsurance: true };
  }
  
  // Insurance depleted - partial payout
  const available = actualTokenValue + trench.insuranceBuffer;
  await deductFromInsuranceBuffer(trench.id, trench.insuranceBuffer);
  
  return { 
    amount: available, 
    useInsurance: true,
    partial: true,
    shortfall: expectedUsd - available
  };
}
```

---

## 📁 FILES TO IMPLEMENT

### Backend

| File | Purpose | Priority |
|------|---------|----------|
| `prisma/schema.prisma` | Database schema | P0 |
| `src/services/trenchService.ts` | Trench business logic | P0 |
| `src/services/sprayService.ts` | Spray processing | P0 |
| `src/services/insuranceService.ts` | Insurance buffer management | P0 |
| `src/app/api/trenches/v2/route.ts` | GET /api/trenches/v2 | P0 |
| `src/app/api/spray/route.ts` | POST /api/spray | P0 |
| `src/jobs/reserveMonitor.ts` | Background health checks | P1 |
| `src/jobs/priceUpdater.ts` | Token price updates | P1 |

### Frontend Integration

| File | Purpose | Priority |
|------|---------|----------|
| `components/TrenchCard.tsx` | Update to use real API | P0 |
| `app/sample-v2/page.tsx` | Connect to /api/trenches/v2 | P0 |
| `components/SprayModal.tsx` | Spray flow with allocation preview | P0 |

---

## ✅ IMPLEMENTATION CHECKLIST

### Week 1: Database & Core Logic
- [ ] Update Prisma schema with insurance/thresholds
- [ ] Run migration
- [ ] Implement trenchService with insurance logic
- [ ] Implement sprayService with fee calculation
- [ ] Build proportional allocation algorithm

### Week 2: API & Background Jobs
- [ ] Build GET /api/trenches/v2
- [ ] Build POST /api/spray
- [ ] Implement reserve health monitor
- [ ] Implement token price updater
- [ ] Add risk level calculations

### Week 3: Frontend Integration & Testing
- [ ] Connect TrenchCard to real API
- [ ] Build allocation preview UI
- [ ] Add risk indicators (🟢🟡🔴)
- [ ] Test insurance scenarios
- [ ] Simulate price drops
- [ ] Load testing

### Week 4: Deployment
- [ ] Deploy to staging
- [ ] Final testing with real data
- [ ] Production deployment
- [ ] Monitor insurance buffers

---

## ⚠️ CRITICAL IMPLEMENTATION NOTES

### 1. Insurance Buffer Must Be Real
- Actually deduct from buffer when covering losses
- Track all insurance events
- Alert when buffer drops below thresholds

### 2. Status Changes Matter
- When trench status changes to PAUSED → Block new sprays immediately
- When status changes to EMERGENCY → Trigger notifications
- Log all status changes with reasons

### 3. Fee Calculation
- Always take 0.5% from spray amount
- Track fees collected per trench
- Display fee clearly to user

### 4. Price Updates
- Update token prices every 5 minutes
- Recalculate reserve USD values
- Update risk levels immediately
- Handle API failures gracefully

---

## 📄 FULL SPECIFICATION

**Complete approved specification:** `TBO_APPROVED_SPECIFICATION.md`

**Business model details:** `docs/ai-context/TRENCHES_BUSINESS_MODEL.md`

**Original notification:** `PRODUCT_SR_ENG_NOTIFICATION.md`

---

## 🚀 READY TO START

**TBO has approved. You can begin implementation immediately.**

**Questions?** See full spec or ask TBO.

**Good luck!** 🎯
