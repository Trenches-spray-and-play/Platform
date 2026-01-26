# System Laws — Belief → Rule Mapping

> **Status**: LAW
> 
> **Purpose**: Translate beliefs into enforceable system rules

---

## Belief → Law Table

| Belief | System Law | Enforcement |
|--------|------------|-------------|
| No custody | App never touches funds | Wallet-to-wallet only |
| No guarantees | Payouts depend on inflow | Display risk explicitly |
| Humans > bots | Social verification required | Review friction, proof links |
| Contribution > capital | Boosts affect queue | Belief score → priority |
| Observable | Queue is public | Real-time position display |
| Capped upside | ROI hard limits | Server-side enforcement |
| Time-bound | Entries expire | Timeout logic enforced |
| Belief continues | Queue dies without activity | Decay mechanics |

---

## Address Generation Laws

> [!IMPORTANT]
> **Rule 1** — No Address Generation  
> Trenches never generates wallets or controls keys.

> [!IMPORTANT]
> **Rule 2** — User First  
> Eligible users always take priority over reserves.

> [!IMPORTANT]
> **Rule 3** — Hard Caps  
> No entry may receive more than its predefined max payout.

---

## Payout Target Priority

```
1. Eligible users (active, not expired, under cap)
2. Reserve addresses (project treasury, round-robin)
```

Nothing else.

---

## Eligibility Formula

A user is eligible to receive if **ALL** are true:
- Entry is `active`
- Round is `active`
- `received_amount < max_payout`
- Entry has not expired
- User is not flagged/slashed

If any condition fails → skip user.

---

## Overpayment Prevention

```typescript
remaining_cap = max_payout - received_amount
amount_to_pay = min(expected_payout_increment, remaining_cap)

if (remaining_cap <= 0) {
  markEntryCompleted()
  removeFromQueue()
  selectNextTarget()
}
```
