# 🚀 3 Trenches Model - Implementation Status

**Status:** ✅ Week 1 Complete - Core Implementation Done  
**Date:** January 31, 2026  
**Approved By:** TBO (Product Senior Engineer)

---

## ✅ COMPLETED (Week 1)

### 1. Database Schema
**File:** `packages/database/prisma/schema.prisma`

New models added:
- ✅ `TrenchV2` - With insurance buffer (10%), thresholds, status
- ✅ `FeaturedProject` - Projects in trenches with reserve tracking
- ✅ `InsuranceEvent` - Audit log for insurance usage
- ✅ `SprayEntryV2` - Spray records with allocation and fees
- ✅ `TokenPrice` - Price tracking for featured projects

Enums:
- ✅ `TrenchLevelV2` - RAPID, MID, DEEP
- ✅ `TrenchStatusV2` - ACTIVE, PAUSED, EMERGENCY
- ✅ `ProjectStatusV2` - ACTIVE, LOW_RESERVE, EXITING, EXITED
- ✅ `InsuranceReason` - PRICE_DROP, RESERVE_COVERAGE, EMERGENCY_PAYOUT
- ✅ `SprayStatusV2` - PENDING, ACTIVE, READY, PAID_OUT

### 2. Core Services

**Trench Service** (`src/services/trenchServiceV2.ts`)
- ✅ Risk assessment calculation
- ✅ Insurance buffer health checks
- ✅ Trench status management
- ✅ Reserve composition calculation
- ✅ Initialize default trenches

**Spray Service** (`src/services/sprayServiceV2.ts`)
- ✅ 0.5% fee calculation
- ✅ Proportional allocation algorithm
- ✅ Spray validation
- ✅ Payout date calculation
- ✅ Spray preview (no creation)

**Insurance Service** (`src/services/insuranceService.ts`)
- ✅ Payout processing with price drop coverage
- ✅ Insurance buffer management
- ✅ Event logging
- ✅ Reserve health monitoring
- ✅ Token price updates

### 3. API Endpoints

**GET /api/trenches/v2**
- ✅ Returns 3 trenches with full details
- ✅ Insurance buffer and risk indicators
- ✅ Featured projects with proportions
- ✅ Platform-wide statistics

**POST /api/spray/v2**
- ✅ Spray processing with fee
- ✅ Allocation preview mode
- ✅ Risk validation
- ✅ Insurance tracking

### 4. Background Jobs

**Reserve Monitor** (`src/jobs/reserveMonitor.ts`)
- ✅ Runs every 5 minutes
- ✅ Updates trench status based on buffer
- ✅ Logs insurance events

**Price Updater** (`src/jobs/priceUpdater.ts`)
- ✅ Updates token prices
- ✅ Recalculates reserve values
- ✅ Checks low reserve projects

---

## 📋 IMPLEMENTATION DETAILS

### Insurance Buffer Logic

```
Buffer % = (insuranceBuffer / totalReserveUsd) × 100

> 20%  → 🟢 ACTIVE (normal)
10-20% → 🟡 CAUTION (warnings)
< 10%  → 🔴 PAUSED (block sprays)
< 5%   → 🚨 EMERGENCY (early exit)
```

### Fee Structure

```
User sprays: $1,000
Fee (0.5%): $5
Effective: $995
```

### Proportional Allocation

```
Project Share = (Project Reserve / Total Trench Reserve) × Spray Amount

Example:
- HYPE: $1M (40% of $2.5M) → $400
- SOL: $800K (32%) → $320
- BLT: $700K (28%) → $280
```

---

## 🔄 NEXT STEPS

### Week 2: API & Background Jobs
- [ ] Deploy database migration
- [ ] Test API endpoints
- [ ] Schedule background jobs
- [ ] Add error handling

### Week 3: Frontend Integration
- [ ] Create TrenchCardV2 component
- [ ] Build SprayModalV2 with allocation preview
- [ ] Add risk indicators (🟢🟡🔴)
- [ ] Connect to /api/trenches/v2

### Week 4: Deployment
- [ ] Staging deployment
- [ ] Load testing
- [ ] Production deployment
- [ ] Monitor insurance buffers

---

## 🗄️ DATABASE MIGRATION

Run this to apply the new schema:

```bash
cd packages/database
npx prisma migrate dev --name add_3_trenches_model
```

Or push directly:

```bash
npx prisma db push
```

---

## 📁 FILES CREATED

```
packages/database/prisma/schema.prisma (updated)
apps/dapp/src/services/trenchServiceV2.ts
apps/dapp/src/services/sprayServiceV2.ts
apps/dapp/src/services/insuranceService.ts
apps/dapp/src/app/api/trenches/v2/route.ts
apps/dapp/src/app/api/spray/v2/route.ts
apps/dapp/src/jobs/reserveMonitor.ts
apps/dapp/src/jobs/priceUpdater.ts
```

---

## ⚠️ NOTES

1. **Token Prices** - Price updater uses mock data. Implement actual oracle/API.
2. **Background Jobs** - Need to schedule with cron or job scheduler.
3. **Testing** - All core logic implemented, needs integration testing.
4. **Frontend** - API ready, waiting for UI components.

---

**Ready for Week 2!** 🚀
