# 📋 Business Model Documentation Update

**Date:** 2026-01-31  
**Author:** Kimi  
**Purpose:** Clarify Trenches perpetual trench business model

---

## ✅ Documentation Created

### New Document: `docs/TRENCHES_BUSINESS_MODEL.md`

**Purpose:** Explain how Trenches actually works - the perpetual, multi-project trench system

**Key Concepts Documented:**

1. **3 Perpetual Trenches**
   - Rapid (1-3 days): Quick turnover
   - Mid (7-14 days): Balanced
   - Deep (30-60 days): Long-term
   - **They never end** - continuous and progressive

2. **Multi-Project System**
   - Multiple projects can share one trench
   - Each project adds token reserve
   - Users see combined reserve value
   - Payouts in featured tokens

3. **Reserve Flywheel Mechanics**
   ```
   Users spray USD
        ↓
   Platform buys project tokens
        ↓
   Token price rises (demand)
        ↓
   Reserve $ value increases
        ↓
   Can pay more users
        ↓
   [Repeat cycle]
   ```

4. **Dollar-Pegged Payouts**
   - ROI calculated in USD (e.g., 1.5x)
   - Paid in project tokens at market price
   - Users benefit from token appreciation

5. **UI Implications**
   - Campaign cards show multiple tokens
   - "Multi-Token Trench" indicator
   - Combined reserve display
   - Featured projects list

---

## 📝 Files Updated

| File | Change |
|------|--------|
| `docs/TRENCHES_BUSINESS_MODEL.md` | Created comprehensive business model doc |
| `docs/README.md` | Added TRENCHES_BUSINESS_MODEL.md to tracked docs list |
| `docs/ai-context/memory/AGENT_MEMORY.md` | Added business model clarification section |

---

## 🎯 Key Clarifications for Team

### Previous Misconception:
- Individual campaigns that start and end
- One project per campaign
- Static reserve
- Payouts in stablecoins

### Correct Understanding:
- **3 perpetual trenches** (never end)
- **Multiple projects per trench**
- **Growing reserve** (increases with user deposits)
- **Payouts in project tokens** (dollar-pegged value)

---

## 🚀 Action Items for Team

### For Product/Design:
- [ ] Redesign campaign cards to show multiple tokens
- [ ] Add "Multi-Token Trench" indicators
- [ ] Design "Featured Projects" section
- [ ] Update reserve display (combined USD value)

### For Engineering:
- [ ] Update database schema (multiple projects per trench)
- [ ] Modify payout logic (token-based, not just USDC)
- [ ] Update API to return featured projects list
- [ ] Add token purchase mechanism

### For Marketing:
- [ ] Update pitch decks with perpetual trench concept
- [ ] Explain flywheel mechanics to projects
- [ ] Highlight multi-project exposure for users
- [ ] Emphasize token appreciation benefits

---

## 📖 How to Use This Document

**For New Team Members:**
1. Read `TRENCHES_BUSINESS_MODEL.md` first
2. Understand the perpetual vs. campaign distinction
3. Review the reserve mechanics

**For Developers:**
1. Reference when building trench features
2. Understand payout logic requirements
3. Note multi-project database implications

**For Product/Design:**
1. Use for UI/UX decisions
2. Reference card design examples
3. Understand user flow implications

**For Business Development:**
1. Use to explain model to projects
2. Reference trench selection guide
3. Understand value proposition

---

## 🔗 Related Documents

- **Technical Specs:** `docs/PLATFORM_DOCUMENTATION.md`
- **Token Economics:** `docs/TRENCHES_BUSINESS_MODEL.md` (Section: Token Economics Flywheel)
- **UI Design:** `docs/existing_ui_audit.md`
- **Pitch Materials:** `docs/INVESTOR_AND_USER_PITCHES.md`

---

## ❓ Common Questions Answered

**Q: Do trenches ever end?**  
A: No. Rapid, Mid, and Deep are permanent.

**Q: Can multiple projects share a trench?**  
A: Yes. That's the core design.

**Q: How do users get paid?**  
A: In project tokens at dollar-pegged value (e.g., $1,500 worth of BLT/HYPE/etc).

**Q: What makes token price rise?**  
A: Platform buys tokens with user deposits = constant buy pressure.

**Q: What happens when reserve runs low?**  
A: Project must add more tokens, or new sprays pause.

---

**Document Owner:** Product Team  
**Review Schedule:** Monthly  
**Questions:** See full doc at `docs/TRENCHES_BUSINESS_MODEL.md`

---

*Documentation complete: 2026-01-31*
