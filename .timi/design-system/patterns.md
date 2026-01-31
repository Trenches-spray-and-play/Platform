# 🧠 UX Patterns Library

> Design patterns and interaction guidelines for Trenches

---

## 🎯 Core UX Principles

1. **Clarity Over Complexity** — Financial data should be scannable at a glance
2. **Progressive Disclosure** — Show essentials, reveal details on demand
3. **Trust Through Transparency** — Clear states, clear outcomes
4. **Crypto-Native but Approachable** — Web3 patterns without intimidation
5. **Motion with Purpose** — Animations guide, don't distract

---

## 🔄 Transaction Flows

### Wallet Connection Pattern

```
1. CTA State: "Connect Wallet" (primary button)
2. Loading State: Spinner + "Connecting..."
3. Success State: Wallet address truncated (0x123...abc)
4. Error State: Toast notification + retry option
```

**Key details:**
- Show wallet icon + chain indicator when connected
- Dropdown for: View on explorer, Switch wallet, Disconnect
- Auto-trigger on action requiring wallet

### Deposit Flow

```
1. Amount Input: Numeric, show balance, max button
2. Chain Selection: Visual chain icons, gas estimate
3. Review: Clear breakdown (amount, fees, receive)
4. Confirm: Primary CTA, wallet prompt
5. Pending: Transaction hash + explorer link
6. Success: Toast + updated balance animation
```

### Spray Flow

```
1. Select Campaign: Card grid with trench type
2. Amount Input: Token selector, balance check
3. Review: Slippage warning, output estimate
4. Confirm: Two-step (approve → deposit)
5. Progress: Step indicator, tx status
6. Success: Confetti + share option
```

---

## 📊 Data Visualization Patterns

### Portfolio Overview

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Total Balance              [Deposit] [Spray]│
│  $12,345.67 (+5.23%)                        │
├─────────────────────────────────────────────┤
│  [Belief Score] [Boost Points] [Referrals]  │
│  85            1,250 BP      12             │
└─────────────────────────────────────────────┘
```

**Patterns:**
- Numbers use mono font for alignment
- Positive changes in green, negative in red
- Percentage badge next to main value
- Quick actions always visible

### Position Cards

**Structure:**
```
┌────────────────────────────────────┐
│ [RAPID] [LIVE]             Level 3 │
│ Campaign Name                      │
│ $500 → $547                       │
│ ┌─────┬─────┬─────┐               │
│ │ ROI │Wait │Participants         │
│ │ 9.4%│12h  │ 42                  │
│ └─────┴─────┴─────┘               │
│ [Auto-claim toggle]  [Boost]      │
└────────────────────────────────────┘
```

**Interactions:**
- Click card → Campaign detail
- Toggle auto-claim → Instant feedback
- Boost button → Opens boost modal

---

## 🔔 Feedback Patterns

### Toast Notifications

| Type | Duration | Position | Icon |
|------|----------|----------|------|
| Success | 3s | Top-right | ✓ |
| Error | 5s | Top-right | ✕ |
| Warning | 4s | Top-right | ⚠ |
| Info | 3s | Top-right | ℹ |

### Loading States

**Skeleton Pattern:**
- Use for initial page load
- Animated shimmer on card placeholders
- Maintain layout structure

**Spinner Pattern:**
- Use for button actions
- Inline with content
- Replace button text

**Progress Pattern:**
- Use for multi-step flows
- Step indicator at top
- Clear "X of Y" labeling

---

## 🚫 Error Handling

### Error Categories

1. **User Errors** (recoverable)
   - Insufficient balance → Show balance + "Max" helper
   - Invalid input → Inline validation, red border
   - Wrong network → "Switch Network" button

2. **System Errors** (retry possible)
   - Transaction failed → Clear error + retry CTA
   - API timeout → Auto-retry 3x, then manual

3. **Critical Errors** (need help)
   - Wallet not detected → Install prompt
   - Contract error → Contact support link

### Error Message Format

```
[Icon] [Clear headline]
[Explanation in plain language]
[Action to fix or learn more]
```

Example:
```
⚠️ Transaction Failed
The network was busy. Your funds are safe.
[Try Again] [View on Explorer]
```

---

## 🎮 Empty States

### No Positions (Dashboard)

```
┌──────────────────────────────────────┐
│           🎯                         │
│     No Active Positions              │
│  Join a campaign to start earning    │
│    [Browse Campaigns]                │
└──────────────────────────────────────┘
```

### No Campaigns (Filter)

```
┌──────────────────────────────────────┐
│         🔍                           │
│   No campaigns match your filter     │
│    [Clear Filters]                   │
└──────────────────────────────────────┘
```

### Wallet Not Connected

```
┌──────────────────────────────────────┐
│  [LIVE] [PULSE ANIMATION]            │
│  Join Trenches Today                 │
│  Connect your wallet to start        │
│    [Connect Wallet]                  │
└──────────────────────────────────────┘
```

---

## 📱 Responsive Patterns

### Mobile Navigation

```
Desktop: Horizontal nav with icons + labels
Mobile: Bottom tab bar (4 items max)
- Home
- Dashboard
- Earn
- Portfolio
```

### Touch Targets

- Minimum: 44x44px
- Buttons: Full-width on mobile
- Cards: Entire card tappable
- Spacing: 8px minimum between touch targets

### Mobile Optimizations

- Tables → Cards
- Side-by-side → Stacked
- Hover effects → Active states
- Dropdowns → Bottom sheets (future)

---

## 🔐 Trust & Security Patterns

### High-Value Actions

Always show:
1. **Clear preview** — What you're giving, what you'll receive
2. **Risk warning** — If applicable (slippage, lock period)
3. **Confirm step** — No accidental clicks
4. **Transaction link** — Explorer for verification

### Sensitive Data Display

- Wallet addresses: Truncate (0x1234...5678)
- Private keys/seeds: Never show in UI
- Balances: Show full precision on hover

### Security Badges

```
🔒 Contract Audited
✓ Verified Token
⚠️ Unverified (proceed with caution)
```

---

## 🎨 Micro-interactions

### Hover States

| Element | Effect |
|---------|--------|
| Card | Lift + glow border |
| Button | Lift + glow shadow |
| Link | Color shift + underline |
| Icon | Scale 1.1 |

### Success Animations

- Checkmark: Scale + fade in
- Number changes: Count up animation
- Balance update: Flash green briefly

### Loading Feedback

- Button: Spinner replaces text
- Page: Skeleton screens
- Long operations: Progress bar

---

## 🌐 Web3-Specific Patterns

### Chain Indicators

Always show current chain:
- Nav indicator with chain icon
- Switcher if action requires different chain
- Warning if wrong chain for action

### Gas Estimates

Show when relevant:
```
Estimated Gas: 0.001 ETH (~$2.50)
[Gas settings]
```

### Token Approvals

Two-step pattern:
1. Approve token (one-time)
2. Complete action

Clear messaging:
```
Step 1/2: Approve USDC
Allow this app to use your USDC
[Approve USDC] [Cancel]
```
