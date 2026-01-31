# 🎯 Trenches Business Model & Mechanics

> **Understanding:** How Trenches actually works - The progressive, perpetual campaign system  
> **Last Updated:** 2026-01-31  
> **Status:** Core Business Logic

---

## 🏗️ Core Concept: 3 Perpetual Trenches

Unlike traditional campaigns that start and end, **Trenches has only 3 trenches that never end:**

| Trench | Duration | Entry Range | Character |
|--------|----------|-------------|-----------|
| **RAPID** | 1-3 days | $5 - $1,000 | Fast turnover, quick payouts |
| **MID** | 7-14 days | $100 - $10,000 | Balanced approach |
| **DEEP** | 30-60 days | $1,000 - $100,000 | Long-term, higher rewards |

**Key Point:** These 3 trenches are **permanent and progressive**. They don't end - they continuously evolve as new projects join.

---

## 💰 How The Reserve System Works

### Step 1: Project Joins a Trench

When a crypto project wants to market using Trenches:

1. **Chooses a trench:** Rapid, Mid, or Deep
2. **Adds reserve:** Deposits a percentage of their tokens as reserve
3. **Gets featured:** Their token name appears on the trench card
4. **Sets ROI:** Promises a return multiplier (e.g., 1.5x)

### Step 2: Users Spray (Deposit)

Users deposit funds (USDC/USDT) into their chosen trench:

```
User Spray → Platform receives USD
                ↓
         [Platform buys project tokens]
                ↓
         Reserve grows (more tokens)
                ↓
         Token price increases (demand)
```

### Step 3: Reserve Mechanics

**The Magic:** User deposits are used to buy more of the featured project's tokens:

| Action | Effect |
|--------|--------|
| Users spray USD | Platform buys project tokens |
| Reserve increases | More tokens in the pool |
| Token demand rises | Token price increases |
| Reserve $ value grows | Even though same token amount |

### Step 4: User Payouts

When users' wait time completes:

```
User invested: $1,000
ROI multiplier: 1.5x
Payout due: $1,500 (in project tokens)

Platform pays: $1,500 worth of featured token(s)
                ↓
User receives: Token(s) at current market price
```

**Key Insight:** Users are paid in **project tokens** (or mix of tokens), not just stablecoins. This creates a flywheel effect:

1. More users spray → More token buying
2. More token buying → Higher token price
3. Higher token price → Reserve value increases
4. Reserve value increases → Can pay more users
5. More users attracted → Cycle continues

---

## 🔄 Progressive Campaign System

### Multiple Projects Per Trench

A single trench can feature **multiple projects simultaneously:**

```
┌─────────────────────────────────────────┐
│           RAPID TRENCH                  │
│           (1-3 days)                    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Project │  │ Project │  │ Project │ │
│  │  BLT    │  │  HYPE   │  │  FTM    │ │
│  │  1.5x   │  │  1.8x   │  │  2.0x   │ │
│  └─────────┘  └─────────┘  └─────────┘ │
│                                         │
│  Combined Reserve: 500M $BLT +         │
│                    200M $HYPE +        │
│                    100M $FTM           │
│                                         │
└─────────────────────────────────────────┘
```

### How Projects Are Featured

**The Trench Card Shows:**
- Trench type (RAPID/MID/DEEP)
- **All featured token names**
- Combined reserve display
- Average/highest ROI available

**Card Can Be Redesigned:**
- Multiple token logos
- Rotating featured project
- "Multi-Token Trench" indicator

---

## 📊 Token Economics Flywheel

```
        NEW PROJECT JOINS
              ↓
    Adds token reserve to trench
              ↓
    ┌─────────────────────┐
    │  USERS SEE HIGH ROI │
    │  AND SPRAY USD      │
    └──────────┬──────────┘
               ↓
    Platform buys project tokens
               ↓
    ┌─────────────────────┐
    │  TOKEN PRICE RISES  │←──── Demand increases
    │  (Buy pressure)     │      from purchases
    └──────────┬──────────┘
               ↓
    Reserve $ value increases
               ↓
    Can pay more users their
    dollar-pegged rewards
               ↓
    MORE USERS ATTRACTED
               ↓
    MORE BUYING PRESSURE
               ↓
         [REPEAT]
```

### The Dollar-Pegged Guarantee

**Promise:** Users always get their $-value return (e.g., $1,500 on $1,000)

**Mechanism:** 
- Payout calculated in USD terms
- Paid in project tokens at current price
- If token appreciates → Fewer tokens needed
- If token depreciates → More tokens from reserve

**Result:** Users win from both:
1. Guaranteed USD return
2. Potential token appreciation

---

## 🎨 Trench Card Design Evolution

### Current Design (Single Project)
```
┌─────────────────────┐
│  RAPID TRENCH       │
│  ◆ BELIEVE ($BLT)   │
│                     │
│  ROI: 1.5x          │
│  Reserve: 100M $BLT │
│  Entry: $5-$1,000   │
└─────────────────────┘
```

### Multi-Project Design (Future)
```
┌──────────────────────────────┐
│     RAPID TRENCH             │
│     (1-3 Days)               │
├──────────────────────────────┤
│  Multi-Token Campaign        │
│                              │
│  [BLT] [HYPE] [FTM] [NEW]   │
│                              │
│  Best ROI: 2.0x             │
│  Combined Reserve: $50M+    │
│  Entry: $5-$1,000           │
│                              │
│  [Enter Trench]             │
└──────────────────────────────┘
```

### Design Elements to Highlight:

1. **Perpetual Nature:** "Always Open" indicator
2. **Multi-Token:** Show all featured projects
3. **Combined Reserve:** Aggregate $ value
4. **Progressive:** "Growing Reserve" indicator
5. **Flexible Entry:** Show entry range prominently

---

## 🆚 Traditional vs Trenches Model

| Aspect | Traditional Campaign | Trenches Model |
|--------|---------------------|----------------|
| **Duration** | Fixed (ends) | Perpetual (never ends) |
| **Projects** | One per campaign | Multiple per trench |
| **Reserve** | Fixed amount | Grows with user deposits |
| **Token Price** | Static | Appreciates with demand |
| **Payout** | In one token | In any featured token |
| **New Projects** | New campaign needed | Join existing trench |

---

## 💡 Key Business Insights

### For Projects (Token Issuers):
- **Marketing:** Exposure to Trenches user base
- **Liquidity:** Continuous buying pressure
- **Price Support:** Platform constantly buys tokens
- **Flexibility:** Choose trench based on goals

### For Users (Sprayers):
- **Guaranteed Returns:** Dollar-pegged payouts
- **Token Upside:** Get paid in appreciating tokens
- **Choice:** Pick trench based on timeline
- **Diversification:** Exposure to multiple projects

### For Platform (Trenches):
- **Sustainability:** Reserve grows with usage
- **Network Effects:** More users → More projects → More users
- **Fee Revenue:** Take spread on token purchases
- **Scalability:** Only 3 trenches to maintain

---

## 🎮 User Flow Example

### Scenario: New User Discovers Trenches

1. **Landing:** Sees 3 trenches (Rapid, Mid, Deep)
2. **Rapid Trench Card Shows:**
   - Featured: BLT, HYPE, FTM
   - Best ROI: 2.0x
   - Combined Reserve: $50M+
   - Entry: $5-$1,000
3. **User Sprays:** $500 into Rapid Trench
4. **Platform:** Buys $500 worth of BLT/HYPE/FTM
5. **Token Prices:** Rise slightly due to buy pressure
6. **Reserve Value:** Increases
7. **User Waits:** 1-3 days
8. **Payout:** Receives $750 worth of tokens (1.5x ROI)
9. **Token Appreciated:** $750 worth is now $800
10. **User Wins:** $800 value on $500 investment

---

## 🔄 Adding New Projects to Trenches

### Process:

1. **Project Applies:** Wants to market via Trenches
2. **Selects Trench:** Rapid (fast buzz), Mid (steady), Deep (long-term)
3. **Adds Reserve:** Deposits tokens to trench reserve
4. **Sets Terms:** ROI multiplier, marketing materials
5. **Gets Featured:** Token appears on trench card
6. **Users Spray:** Platform buys their token
7. **Price Appreciates:** Demand increases
8. **Reserve Grows:** Value increases

### Trench Selection Guide for Projects:

| Project Goal | Recommended Trench | Why |
|--------------|-------------------|-----|
| Quick hype, fast liquidity | RAPID | 1-3 days, high turnover |
| Steady growth, sustained interest | MID | 7-14 days, balanced |
| Long-term holders, deep liquidity | DEEP | 30-60 days, committed users |

---

## 📈 Success Metrics

### For Each Trench:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Total Reserve Value | Growing | USD value of all tokens |
| Unique Featured Projects | 5+ per trench | Count of tokens |
| User Participation | Increasing | Active sprayers |
| Token Price Appreciation | >0% | Average price change |
| Payout Reliability | 100% | Successful payouts |

### Platform-Wide:

| Metric | Target |
|--------|--------|
| Total Value Locked (TVL) | $100M+ |
| Monthly Active Sprayers | 10,000+ |
| Featured Projects | 20+ |
| Average User ROI | 1.5x+ |

---

## 🛠️ Technical Implications

### Database Schema Needs:

```prisma
model Trench {
  id          String      @id @default(uuid())
  level       TrenchLevel // RAPID, MID, DEEP
  // ... existing fields
  
  // NEW: Multiple projects per trench
  featuredProjects FeaturedProject[]
  combinedReserve  Decimal  @default(0) // USD value
}

model FeaturedProject {
  id          String   @id @default(uuid())
  trenchId    String
  trench      Trench   @relation(fields: [trenchId], references: [id])
  
  tokenAddress String
  tokenSymbol  String
  tokenAmount  Decimal  // Amount in reserve
  roiMultiplier Decimal // Project's promised ROI
  
  addedAt     DateTime @default(now())
  isActive    Boolean  @default(true)
}
```

### UI Implications:

- Campaign cards show **multiple tokens**
- Reserve display is **combined USD value**
- Users can see **which projects** are featured
- Payout can be in **any featured token** or **mix**

---

## ❓ FAQ

**Q: Do trenches ever end?**  
A: No. The 3 trenches (Rapid, Mid, Deep) are perpetual. Projects come and go, but trenches continue.

**Q: Can a project be in multiple trenches?**  
A: Yes. A project could have presence in Rapid (for hype) AND Deep (for committed holders).

**Q: What happens when a project runs out of reserve?**  
A: They must add more tokens or users stop getting paid. Platform monitors reserve health.

**Q: How are payouts determined?**  
A: Dollar-pegged. User gets their ROI % paid in current market value of featured tokens.

**Q: Can users choose which token to receive?**  
A: Potentially yes - either auto-allocated or user-selected at spray time.

**Q: What if token price crashes?**  
A: Project must add more tokens to maintain reserve value, or platform stops accepting new sprays.

---

**Document Owner:** Product Team  
**Review Schedule:** Monthly  
**Last Updated:** 2026-01-31
