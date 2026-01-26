# QA Test Cases for Trenches

> **Status**: SPEC
> 
> **Purpose**: Test cases focusing on abuse prevention, payment flows, and queue integrity

---

## 1. Queue Manipulation Tests

### 1.1 Deterministic Ordering
| Test | Expected | Priority |
|------|----------|----------|
| Two users with same belief score | Higher boost goes first | High |
| Two users with same belief + boost | Earlier join time goes first | High |
| Boost decay reduces position over time | User moves down as boost decays | Medium |
| Belief score update re-sorts queue | Higher belief user overtakes | High |

### 1.2 Position Integrity
| Test | Expected | Priority |
|------|----------|----------|
| 100 concurrent entries | All get unique positions | Critical |
| User exits mid-queue | Others shift up correctly | High |
| User completes payout | Removed from queue | High |

---

## 2. Payment Flow Tests

### 2.1 Transaction Verification
| Test | Expected | Priority |
|------|----------|----------|
| Valid BLT transfer detected | Transaction marked VERIFIED | Critical |
| Wrong amount sent | Transaction NOT matched | Critical |
| Wrong target address | Transaction NOT matched | Critical |
| Transfer after deadline | Transaction marked EXPIRED | High |
| Duplicate tx hash | Ignored (no double credit) | Critical |

### 2.2 Payout Cap Enforcement
| Test | Expected | Priority |
|------|----------|----------|
| User at max payout | No more payouts, status=completed | Critical |
| Payout exceeds remaining cap | Amount capped to remaining | Critical |
| ROI multiplier applied correctly | 1.5x for all trenches (unified) | High |

### 2.3 Timeout Logic
| Test | Expected | Priority |
|------|----------|----------|
| 15-min window expires | Transaction marked EXPIRED | High |
| Payment 1 second before deadline | Accepted | Medium |
| Expired transaction cannot verify | Rejected | High |

---

## 3. Social Contribution Abuse Tests

### 3.1 Self-Review Prevention
| Test | Expected | Priority |
|------|----------|----------|
| User reviews own post | Error: "Cannot validate your own content" | Critical |
| User endorses own post | Error | Critical |

### 3.2 Duplicate Prevention
| Test | Expected | Priority |
|------|----------|----------|
| Same user validates same post twice | Error: unique constraint | High |
| Same URL submitted twice | Error: "Content already submitted" | High |

### 3.3 Score Manipulation
| Test | Expected | Priority |
|------|----------|----------|
| Belief awarded only after 3+ endorsements | No early belief | High |
| Low-belief reviewer endorsement | Reduced weight (future) | Medium |
| Rapid endorsements from same source | Rate limited (future) | Medium |

### 3.4 Boost Decay
| Test | Expected | Priority |
|------|----------|----------|
| Boost decays 5% per hour | Points decrease over time | High |
| 0 boost after full decay | Doesn't go negative | Medium |

---

## 4. Entry Validation Tests

### 4.1 Belief-Based Limits
| Test | Expected | Priority |
|------|----------|----------|
| 0 belief score | 50% of max entry | High |
| 100+ belief score | 75% of max entry | High |
| 500+ belief score | 90% of max entry | High |
| 1000+ belief score | 100% of max entry | High |

### 4.2 Trench Access
| Test | Expected | Priority |
|------|----------|----------|
| Enter inactive trench | Error: "Trench is not active" | High |
| Entry below minimum | Error: "Minimum entry is X BLT" | High |
| Entry above belief cap | Error: "Maximum entry for your belief level" | High |
| Already active in trench | Error: "Already active in this trench" | High |

### 4.3 Trench-Level Caps (NEW)
| Test | Expected | Priority |
|------|----------|----------|
| Rapid entry > $1,000 | Rejected | Critical |
| Medium entry > $10,000 | Rejected | Critical |
| Slow/Deep entry > $100,000 | Rejected | Critical |
| Entry at exact cap | Accepted | High |

---

## 5. Multi-Asset Entry Tests (NEW)

### 5.1 Asset Routing
| Test | Expected | Priority |
|------|----------|----------|
| BLT payment | Routed to payout target | Critical |
| ETH payment | Routed to reserve | Critical |
| USDT payment | Routed to reserve | Critical |
| USDC payment | Routed to reserve | Critical |
| SOL payment | Routed to reserve | Critical |

### 5.2 Entry Credit
| Test | Expected | Priority |
|------|----------|----------|
| Non-BLT payment confirmed | Entry created in queue | Critical |
| Non-BLT payment fails | No entry created | Critical |
| Wrong chain asset | Rejected | High |

### 5.3 Payout Consistency
| Test | Expected | Priority |
|------|----------|----------|
| Non-BLT entry | Still receives BLT payouts | Critical |
| Mixed asset entries in same round | Queue resolves normally | High |
| Reserve receives non-BLT correctly | Conversion sink works | High |

### 5.4 Entry Value Normalization (NEW)
| Test | Expected | Priority |
|------|----------|----------|
| USDT entry | Normalized at $1 face value | Critical |
| USDC entry | Normalized at $1 face value | Critical |
| ETH entry | Normalized at oracle price at confirmation | Critical |
| SOL entry | Normalized at oracle price at confirmation | Critical |
| Oracle returns 0 | Entry rejected | Critical |
| Oracle timeout | Entry pending until resolved | High |

### 5.5 Payment Finality (NEW)
| Test | Expected | Priority |
|------|----------|----------|
| ETH tx < 12 confirmations | Entry remains PENDING | Critical |
| ETH tx >= 12 confirmations | Entry marked CONFIRMED | Critical |
| Solana tx < 32 slots | Entry remains PENDING | Critical |
| HyperEVM tx 1 block | Entry marked CONFIRMED | Critical |
| Reorg after PENDING | Entry cancelled safely | Critical |
| Reorg after CONFIRMED | Should not occur (threshold too low alert) | High |

---

## 6. Blockchain Monitor Tests

### 5.1 Connection
| Test | Expected | Priority |
|------|----------|----------|
| Invalid RPC URL | Warning logged, monitoring disabled | High |
| RPC connection lost | Reconnect on next poll | Medium |

### 5.2 Event Detection
| Test | Expected | Priority |
|------|----------|----------|
| BLT Transfer event emitted | Detected and processed | Critical |
| Non-BLT transfer | Ignored | High |
| Block reorg | Handles gracefully | Medium |

---

## 6. API Security Tests

### 6.1 Input Validation
| Test | Expected | Priority |
|------|----------|----------|
| Missing required fields | 400 error with message | High |
| Invalid rating (0 or 6) | Error: "Rating must be between 1 and 5" | High |
| Non-existent postId | Error: "Post not found" | High |
| Non-existent userId | Error: "User not found" | High |

### 7.2 Rate Limiting (Future)
| Test | Expected | Priority |
|------|----------|----------|
| 100 requests/minute from same IP | Rate limited | Medium |
| Validation spam | Cooldown enforced | Medium |

---

## 8. Reserve Exhaustion Tests (NEW)

### 8.1 Payout Under Stress
| Test | Expected | Priority |
|------|----------|----------|
| Reserve < pending payouts | Payouts continue until depleted | Critical |
| Reserve = 0 | Queue pauses, no panic | Critical |
| Reserve replenished | Queue resumes automatically | High |
| Entry expires unpaid | User notified, status = expired | High |

### 8.2 Reserve Growth
| Test | Expected | Priority |
|------|----------|----------|
| Non-BLT converted to BLT | Reserve increases | Critical |
| BLT entry flows to payout | No double count | High |

---

## Test Execution Priority

1. **Critical** — Run before every deploy
2. **High** — Run daily / on PR
3. **Medium** — Run weekly / on release

---

## Automation Notes

```typescript
// Example test structure
describe('Queue Service', () => {
  it('should order by belief DESC, boost DESC, joinedAt ASC', async () => {
    // Create 3 participants with different scores
    // Assert order is correct
  });
});

describe('Enforcement Service', () => {
  it('should cap entry based on belief score', async () => {
    // User with 0 belief should get 50% max
    const max = getMaxAllowedEntry(0, 1000);
    expect(max).toBe(500);
  });
});
```
