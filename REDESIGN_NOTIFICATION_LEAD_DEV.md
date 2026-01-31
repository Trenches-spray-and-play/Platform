# 🚀 MAJOR REDESIGN: Campaign Model → Trench Model

**Date:** 2026-01-31  
**From:** Kimi (Lead Dev AI Assistant)  
**To:** Lead Dev  
**Priority:** HIGH  
**Status:** ✅ Complete (Frontend Implementation)

---

## 🎯 Executive Summary

**The platform has been redesigned from a "many campaigns" model to a "3 trenches" model**, aligning with the business model clarification.

| Aspect | Before | After |
|--------|--------|-------|
| **Core Concept** | Many individual campaigns | 3 perpetual trenches |
| **Projects** | One project = one campaign | Multiple projects per trench |
| **Cards** | CampaignCard grid | TrenchCard (3 cards only) |
| **Reserve** | Static per campaign | Dynamic, growing |
| **Pages** | Individual campaign pages | Trench detail pages |

---

## ✅ What Was Built

### 1. New Component: `TrenchCard.tsx`

**Replaces:** `CampaignCard.tsx`

**Features:**
- Shows current featured project(s) with token badges
- Reserve composition bar (visual token mix)
- Total reserve value as primary stat
- Duration, entry range, APY
- Active sprayer count with pulse indicator

**Visual Design:**
```
┌─────────────────────────────────────┐
│  ⚡ RAPID          ● Featured: HYPE │
│  Rapid Trench                       │
│  Quick rotations, fast yields       │
│                                     │
│  [HYPE][SOL][BLT]  +1 more          │
│                                     │
│  ████████░░░░░░░░░░  (reserve bar)  │
│                                     │
│  Reserve      APY      Duration     │
│  $2.45M       +12.5%   1 day        │
│                                     │
│  3,420 sprayers active ●            │
│                                     │
│  Paid in token mix    Spray Now →   │
└─────────────────────────────────────┘
```

**Files:**
- `components/TrenchCard.tsx` ✅
- `components/TrenchCard.module.css` ✅

---

### 2. Redesigned Homepage (`page.tsx`)

#### Hero Section - NEW
- **Headline:** "Three Trenches. Infinite Projects."
- **Description:** Explains the flywheel mechanics
- **Stats (4):**
  1. Total Reserve Value
  2. Active Sprayers
  3. Featured Projects
  4. Avg APY

#### Trench Grid - NEW
- **Exactly 3 cards** side by side
- Responsive: stacks on mobile
- Skeleton loading states

#### How It Works - NEW (4 Steps)
1. **Projects Add Reserve** - Token deposits to trench
2. **You Spray Capital** - USD enters platform
3. **Reserve Grows** - Buying pressure → price ↑
4. **Cycle Repeats** - Flywheel effect

#### Mechanics Card - NEW
- Dollar-pegged rewards explanation
- Token rotation benefits
- Price protection (demand floor)
- Instant liquidity

#### Featured Projects Section - NEW
- Grid of currently featured tokens
- Shows reserve contributions per project

---

## 🔄 Architectural Changes

### Data Model Shift

**Old API Response:**
```typescript
// GET /api/trenches
[
  { level: "RAPID", campaigns: [...] },  // Many campaigns
  { level: "MID", campaigns: [...] },
  { level: "DEEP", campaigns: [...] }
]
```

**New API Response Needed:**
```typescript
// GET /api/trenches/v2
[
  {
    level: "RAPID",
    totalReserveValue: 2450000,        // USD value
    featuredProjects: [                // Multiple projects
      { token: "HYPE", contribution: 1000000, apy: 12.5 },
      { token: "SOL", contribution: 800000, apy: 10.0 },
      { token: "BLT", contribution: 650000, apy: 15.0 }
    ],
    reserveComposition: [              // For bar chart
      { token: "HYPE", percentage: 41 },
      { token: "SOL", percentage: 33 },
      { token: "BLT", percentage: 26 }
    ],
    participantCount: 3420,
    avgApy: 12.5,
    duration: "1-3 days",
    entryRange: { min: 5, max: 1000 }
  },
  // ... MID and DEEP
]
```

---

## ⚠️ Backend Requirements

### New API Endpoint Needed

```typescript
// GET /api/trenches/v2
// Returns exactly 3 trench objects

interface TrenchResponse {
  level: "RAPID" | "MID" | "DEEP";
  name: string;
  description: string;
  duration: string;
  entryRange: { min: number; max: number };
  
  // Reserve
  totalReserveValue: number;           // USD
  reserveComposition: Array<{
    tokenSymbol: string;
    tokenAddress: string;
    amount: number;                    // Token amount
    usdValue: number;
    percentage: number;                // For bar chart
  }>;
  
  // Projects
  featuredProjects: Array<{
    id: string;
    name: string;
    tokenSymbol: string;
    tokenAddress: string;
    reserveContribution: number;       // USD
    apy: number;
    logoUrl?: string;
  }>;
  
  // Stats
  participantCount: number;
  avgApy: number;
  totalSprayed: number;                // All-time
  
  // Visual
  themeColor: string;                  // #00FF66 for RAPID, etc.
}
```

### Database Changes Needed

**Current:**
```prisma
model CampaignConfig {
  // ... single project per config
}
```

**New:**
```prisma
model Trench {
  id          String   @id @default(uuid())
  level       TrenchLevel  // RAPID, MID, DEEP
  
  // Reserve (aggregate of all projects)
  totalReserveUsd  Decimal @default(0)
  
  // Relations
  featuredProjects FeaturedProject[]
  
  // Stats
  participantCount Int @default(0)
  totalSprayed     Decimal @default(0)
}

model FeaturedProject {
  id          String @id @default(uuid())
  trenchId    String
  trench      Trench @relation(fields: [trenchId], references: [id])
  
  // Project info
  name        String
  tokenSymbol String
  tokenAddress String
  
  // Reserve
  reserveAmount    Decimal  // Token amount
  reserveUsdValue  Decimal  // USD value at current price
  
  // Terms
  apy         Decimal
  addedAt     DateTime @default(now())
  isActive    Boolean  @default(true)
}
```

---

## 🎨 UI/UX Changes Summary

| Element | Before | After |
|---------|--------|-------|
| **Homepage Grid** | Many campaign cards | 3 trench cards |
| **Card Design** | Single project focus | Multi-project with reserve bar |
| **Primary Metric** | Campaign name | Total reserve value |
| **Secondary Info** | Individual ROI | Avg APY + featured tokens |
| **Visual** | Static | Animated reserve composition |
| **Navigation** | Campaign detail | Trench detail with projects tab |

---

## 📁 Files Changed

| File | Status | Description |
|------|--------|-------------|
| `components/TrenchCard.tsx` | ✅ New | Main trench display component |
| `components/TrenchCard.module.css` | ✅ New | Styles for trench card |
| `app/sample-v2/page.tsx` | ✅ Redesigned | Complete homepage overhaul |
| `app/sample-v2/page.module.css` | ✅ Updated | New layout styles |
| `docs/ai-context/TRENCHES_BUSINESS_MODEL.md` | ✅ Moved | Business logic documentation |

---

## ⚠️ Current State: Using Mock Data

**Important:** The frontend is using **mock data** because the backend API doesn't expose the new trench-centric model yet.

### To Connect Real Data:

1. **Create new API endpoint:** `GET /api/trenches/v2`
2. **Update database schema:** Add `Trench` and `FeaturedProject` models
3. **Migrate existing data:** Convert campaigns to featured projects
4. **Update frontend:** Change API call from `/api/trenches` to `/api/trenches/v2`

### Mock Data Location:
```typescript
// In TrenchCard.tsx or page.tsx
const mockTrenches = [
  {
    level: "RAPID",
    totalReserveValue: 2450000,
    featuredProjects: [...],
    // ...
  }
];
```

---

## 🎯 Next Steps for Lead Dev

### Immediate (Frontend Complete):
- [ ] Review new component designs
- [ ] Approve visual direction
- [ ] Test responsive layouts

### Short Term (Backend):
- [ ] Design `GET /api/trenches/v2` endpoint
- [ ] Update database schema
- [ ] Create migration plan for existing campaigns
- [ ] Implement reserve tracking

### Medium Term (Integration):
- [ ] Connect frontend to new API
- [ ] Remove mock data
- [ ] Add real-time reserve updates (WebSocket)
- [ ] Build trench detail page

### Long Term (Enhancement):
- [ ] Token purchase automation
- [ ] Price oracle integration
- [ ] Reserve health monitoring
- [ ] Project onboarding flow

---

## 🔄 Migration Strategy

### Option A: Parallel Deploy (Recommended)
1. Build new API alongside old one
2. Frontend uses feature flag to switch
3. Gradual migration of campaigns to trenches
4. Sunset old API after validation

### Option B: Big Bang
1. Build new API
2. Migrate all data at once
3. Deploy frontend + backend together
4. Higher risk, faster completion

---

## 🧪 Testing Checklist

### Frontend (Ready to Test):
- [ ] Responsive design (mobile/desktop)
- [ ] Loading states
- [ ] Reserve composition bar animation
- [ ] "Spray Now" button navigation

### Backend (To Build):
- [ ] API returns correct trench structure
- [ ] Reserve calculations accurate
- [ ] Featured projects sorted correctly
- [ ] Performance < 500ms

### Integration (After Backend):
- [ ] Real data displays correctly
- [ ] Numbers match database
- [ ] Error states handled
- [ ] Loading → data transition smooth

---

## 📞 Questions?

**Design Decisions:**
- Why 3 cards? → Matches business model (3 trenches)
- Why reserve bar? → Visualizes multi-project nature
- Why mock data? → Backend API needs updates

**Technical Details:**
- See `components/TrenchCard.tsx` for implementation
- See `docs/ai-context/TRENCHES_BUSINESS_MODEL.md` for business logic

---

## ✅ Certification Status

**Risk Level:** HIGH (Major architectural change)  
**Testing:** Mock data only (backend pending)  
**Recommendation:** Review with Product Sr Eng before proceeding

**Lead Dev Sign-off Required:**
- [ ] Design approved
- [ ] Backend plan approved
- [ ] Migration strategy approved

---

**Prepared by:** Kimi  
**Date:** 2026-01-31  
**Status:** Frontend complete, backend pending
