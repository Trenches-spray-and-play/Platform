# 🎯 BUSINESS MODEL REDESIGN - Product Senior Engineer Review

**Date:** 2026-01-31  
**From:** Kimi (AI Assistant)  
**To:** Product Senior Engineer  
**Priority:** HIGH - Business Model Validation Required  
**Status:** Frontend Complete, Backend Pending Approval

---

## 🚨 EXECUTIVE SUMMARY

**Major architectural change:** Platform redesigned from "many campaigns" to **"3 perpetual trenches"** model.

**Requires your approval before backend implementation.**

| Aspect | Before | After |
|--------|--------|-------|
| **Core Model** | Individual campaigns (start/end) | 3 perpetual trenches (never end) |
| **Projects** | One project = one campaign | Multiple projects per trench |
| **User Experience** | Browse many campaigns | Choose from 3 trenches |
| **Reserve** | Static per campaign | Dynamic, grows with deposits |

---

## 💡 THE BUSINESS MODEL (What We Built)

### Core Concept: 3 Perpetual Trenches

```
┌─────────────────────────────────────────────────────────────┐
│                    TRENCHES PLATFORM                        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   RAPID     │  │    MID      │  │    DEEP     │         │
│  │  (1-3 days) │  │  (7-14 days)│  │ (30-60 days)│         │
│  │             │  │             │  │             │         │
│  │ [HYPE][SOL] │  │ [BLT][ETH]  │  │ [BTC][AVAX] │         │
│  │             │  │             │  │             │         │
│  │ $2.5M       │  │ $8.2M       │  │ $15.1M      │         │
│  │ Reserve     │  │ Reserve     │  │ Reserve     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  Each trench contains MULTIPLE projects' token reserves    │
│  Trenches never end - they continuously grow               │
└─────────────────────────────────────────────────────────────┘
```

### The Flywheel Mechanic

**How value is created:**

```
1. PROJECT JOINS TRENCH
   ↓
   Adds token reserve (e.g., 1M $HYPE)
   
2. USERS SPRAY CAPITAL  
   ↓
   Deposit USD into trench
   
3. PLATFORM BUYS TOKENS
   ↓
   Uses USD to buy featured project tokens
   
4. TOKEN PRICE RISES
   ↓
   Buy pressure increases token value
   
5. RESERVE VALUE GROWS
   ↓
   Same token amount = higher USD value
   
6. USERS GET PAID
   ↓
   Receive dollar-pegged ROI in tokens
   (Benefit from price appreciation)
   
7. CYCLE REPEATS
   ↓
   More projects join, more users spray,
   reserve keeps growing
```

### Dollar-Pegged Payouts (Key Innovation)

**Promise:** Guaranteed USD return (e.g., $1,500 on $1,000 = 1.5x)

**Execution:** 
- ROI calculated in USD
- Paid in project tokens at market price
- If token appreciates → User gets more $ value
- If token depreciates → Platform covers from reserve

**Result:** Users get guaranteed USD return PLUS token upside

---

## 🎨 USER EXPERIENCE REDESIGN

### Homepage Before
```
┌─────────────────────────────────────┐
│  Spray & Play Platform              │
│                                     │
│  [Many Campaign Cards Grid]         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │BLT │ │HYPE│ │SOL │ │FTM │ ...   │
│  │1.5x│ │1.8x│ │2.0x│ │1.6x│       │
│  └────┘ └────┘ └────┘ └────┘       │
│                                     │
│  20+ individual campaigns           │
└─────────────────────────────────────┘
```

### Homepage After (What We Built)
```
┌─────────────────────────────────────┐
│  Three Trenches. Infinite Projects. │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │  ⚡     │ │   ◆    │ │   ▲   ││
│  │ RAPID   │ │  MID   │ │ DEEP  ││
│  │         │ │        │ │       ││
│  │[H][S][B]│ │[B][E]  │ │[B][A] ││
│  │ +2 more │ │        │ │       ││
│  │         │ │        │ │       ││
│  │██████░░░│ │████████│ │███████││
│  │Reserve  │ │Reserve │ │Reserve││
│  │$2.45M   │ │$8.20M  │ │$15.1M││
│  │         │ │        │ │       ││
│  │APY: 12% │ │APY: 15%│ │APY: 8%│
│  │         │ │        │ │       ││
│  │3,420    │ │8,150   │ │12,400 ││
│  │sprayers  │ │sprayers│ │sprayers│
│  │         │ │        │ │       ││
│  │[Spray →]│ │[Spray →]│ │[Spray→]│
│  └─────────┘ └─────────┘ └────────┘│
│                                     │
│  Exactly 3 cards. Never changes.   │
│  Projects rotate within trenches.  │
└─────────────────────────────────────┘
```

### New Homepage Sections

1. **Hero:** "Three Trenches. Infinite Projects."
2. **Stats Bar:** Total Reserve, Active Sprayers, Featured Projects, Avg APY
3. **3 Trench Cards:** Side by side, responsive stacking
4. **How It Works (4 steps):**
   - Projects Add Reserve
   - You Spray Capital  
   - Reserve Grows
   - Cycle Repeats
5. **Featured Projects Grid:** All currently featured tokens

---

## 📊 DATA MODEL CHANGES

### Current Database (Campaign-Centric)
```prisma
model CampaignConfig {
  id          String
  name        String           // "Believe Campaign"
  tokenSymbol String           // "BLT"
  trenchIds   String[]         // ["RAPID"]
  // Each campaign = one project
}
```

### Proposed Database (Trench-Centric)
```prisma
model Trench {
  id               String   @id
  level            TrenchLevel  // RAPID, MID, DEEP
  
  // Aggregate metrics
  totalReserveUsd  Decimal      // Combined USD value
  participantCount Int
  totalSprayed     Decimal
  
  // Relations
  featuredProjects FeaturedProject[]
}

model FeaturedProject {
  id          String
  trenchId    String
  
  // Project details
  name        String
  tokenSymbol String
  tokenAddress String
  
  // Reserve contribution
  reserveAmount    Decimal  // Token amount
  reserveUsdValue  Decimal  // USD value
  
  // Terms
  apy         Decimal
  addedAt     DateTime
  isActive    Boolean
}
```

---

## ⚠️ WHAT NEEDS YOUR APPROVAL

### 1. Business Model Validation

**Questions for you:**
- [ ] Does the "3 perpetual trenches" model align with product vision?
- [ ] Is the dollar-pegged payout mechanism sound?
- [ ] Should users choose which token to receive, or auto-allocated?
- [ ] How do we handle a project running out of reserve?

### 2. API Contract Design

**New endpoint needed:** `GET /api/trenches/v2`

**Returns exactly 3 objects:**
```typescript
{
  level: "RAPID" | "MID" | "DEEP",
  totalReserveUsd: number,
  featuredProjects: [...],
  reserveComposition: [...],  // For bar chart
  participantCount: number,
  avgApy: number
}
```

**Your input needed:**
- [ ] API response structure approved?
- [ ] Data refresh frequency (real-time vs cached)?
- [ ] Error handling strategy?

### 3. User Experience Decisions

**Open questions:**
- [ ] Should trench cards rotate featured projects (carousel)?
- [ ] How to show "project is ending reserve" warning?
- [ ] What happens when user clicks "Spray" - choose token or auto?
- [ ] Trench detail page - show all projects or aggregated?

### 4. Monetization / Fees

**Not yet defined:**
- [ ] Platform fee structure?
- [ ] How do we make money from this model?
- [ ] Fee taken from deposits or payouts?

---

## 🎯 SCENARIOS TO VALIDATE

### Scenario 1: New Project Joins
```
HYPE wants to market using Trenches
→ Chooses RAPID trench
→ Adds 1M $HYPE tokens to reserve
→ Sets 1.5x ROI promise
→ HYPE badge appears on RAPID card
→ Users see combined reserve grew
```

**Your validation:** Does this flow make sense?

### Scenario 2: User Spray
```
User sprays $1,000 into RAPID trench
→ Platform buys $1,000 worth of featured tokens
  (maybe $400 HYPE + $300 SOL + $300 BLT)
→ Token prices rise slightly
→ Reserve value increases
→ User waits 1-3 days
→ Receives $1,500 worth of tokens
```

**Your validation:** Is the execution clear?

### Scenario 3: Multiple Projects
```
RAPID trench has 5 featured projects
User sprays $1,000
→ How is the $1,000 allocated?
  A) Proportional to reserve contribution?
  B) User chooses?
  C) Equal split?
→ User gets paid in which tokens?
```

**Your validation:** What should the allocation logic be?

---

## 📁 DOCUMENTATION

**Business Model Deep Dive:**
- `docs/ai-context/TRENCHES_BUSINESS_MODEL.md` (local, gitignored)

**Technical Specification:**
- `REDESIGN_NOTIFICATION_LEAD_DEV.md` (for after your approval)

**Current Implementation:**
- `components/TrenchCard.tsx` (uses mock data)
- `app/sample-v2/page.tsx` (redesigned homepage)

---

## ✅ APPROVAL CHECKLIST

**Product Senior Engineer Sign-Off:**

Business Model:
- [ ] 3 perpetual trenches model approved
- [ ] Dollar-pegged payout mechanism validated
- [ ] Reserve flywheel mechanic sound

API Design:
- [ ] `/api/trenches/v2` response structure approved
- [ ] Data model changes approved

User Experience:
- [ ] 3-card homepage design approved
- [ ] Trench detail page approach approved
- [ ] Token allocation logic defined

Open Questions:
- [ ] Platform fee structure decided
- [ ] Reserve depletion handling defined
- [ ] Token rotation strategy approved

---

## 🚀 NEXT STEPS (After Your Approval)

**Once you approve:**
1. Kimi notifies Lead Dev with technical specs
2. Lead Dev plans backend implementation
3. Dev team builds API + database
4. Frontend connects to real data
5. Marketing updates messaging

**Timeline estimate:**
- Your review: 1-2 days
- Backend implementation: 1-2 weeks
- Integration + testing: 3-5 days

---

## ❓ QUESTIONS FOR YOU

**Strategic:**
1. Does this model scale to 100+ projects?
2. How does this differentiate from competitors?
3. What's the moat once projects learn the mechanic?

**Operational:**
1. Who approves projects joining trenches?
2. How do we prevent reserve manipulation?
3. What legal/regulatory considerations?

**Technical:**
1. Real-time reserve updates or cached?
2. On-chain or off-chain reserve tracking?
3. Token purchase automation level?

---

**Ready for your review and approval!**

Please review `docs/ai-context/TRENCHES_BUSINESS_MODEL.md` for complete details.

---

**Contact:** Reply with approval or questions  
**Urgency:** Medium - Blocking backend implementation  
**Decision needed by:** [Suggest date]
