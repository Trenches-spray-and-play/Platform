# Trenches Security Implementation Roadmap

## 🎯 Executive Summary

As Smart Contract Security Engineer, this roadmap addresses the critical security gaps identified in the Trenches platform. **Priority 1 items must be completed before mainnet launch** with >$1M TVL.

---

## Phase 1: Critical Hardening (Weeks 1-2)

### 🔐 1.1 Multi-Sig Treasury Deployment

**Status:** Required before mainnet  
**Effort:** 3 days  
**Owner:** Security + DevOps

```bash
# Deploy Gnosis Safe
npm install @safe-global/protocol-kit

# Configuration:
# - 3-of-5 multi-sig
# - Signers: CTO, Lead Dev, Security Engineer, + 2 external
# - Daily limit: 24h of expected payouts
# - Large transfers (>100k): 24h timelock
```

**Deliverables:**
- [ ] Gnosis Safe deployed on all supported chains
- [ ] Treasury migrated to multi-sig
- [ ] Hot wallet funded with 24h capacity only
- [ ] Emergency contact list distributed

### 🔐 1.2 Emergency Pause System

**Status:** Required before mainnet  
**Effort:** 2 days  
**Owner:** Security

Implementation in `packages/security/src/pause-guardian.ts`:
- Multi-sig governed pause (2-of-3)
- Three pause levels: PAYOUTS, DEPOSITS, FULL
- 24h timelock for unpause
- Auto-expire after 7 days
- PagerDuty + Telegram integration

**Integration Points:**
```typescript
// In payout.service.ts
if (!isOperationAllowed('payout')) {
    throw new Error('Payouts currently paused');
}

// In deposit-credit.service.ts  
if (!isOperationAllowed('deposit')) {
    throw new Error('Deposits currently paused');
}
```

### 🔐 1.3 Oracle Security Hardening

**Status:** Required before mainnet  
**Effort:** 3 days  
**Owner:** Security

Implementation in `packages/security/src/oracle-aggregator.ts`:
- Multi-source aggregation (CoinGecko + Binance minimum)
- Outlier detection (>10% from median rejected)
- Circuit breaker for >15% price movement
- Confidence scoring per price

**Replace in `price-oracle.service.ts`:**
```typescript
// OLD:
const price = await fetchCoingeckoPrice(symbol);

// NEW:
const aggregated = await getAggregatedPrice(symbol);
if (!aggregated || aggregated.confidence < 0.8) {
    throw new Error('Price unreliable');
}
const price = aggregated.price;
```

---

## Phase 2: Monitoring & Alerting (Weeks 2-3)

### 📊 2.1 Forta Bot Deployment

**Status:** Required before mainnet  
**Effort:** 2 days  
**Owner:** Security

Bots implemented in `packages/security/forta/`:

| Bot | Alert Condition | Severity |
|-----|-----------------|----------|
| `large-payout-bot` | Payout > $10k | Medium |
| `reorg-detection-bot` | Block hash mismatch | High |
| `failed-tx-bot` | >5% failure rate | High |
| `balance-monitor` | Hot wallet < threshold | Critical |

**Deployment:**
```bash
cd packages/security/forta
npm install -g forta-agent
forta-agent publish
```

### 📊 2.2 Tenderly Alerting

**Status:** Recommended  
**Effort:** 1 day  
**Owner:** DevOps

Configure alerts for:
- Failed transaction rate > 5%
- Gas price spikes affecting sweep operations
- Contract reverts in payout flow

### 📊 2.3 Security Dashboard

**Status:** Recommended  
**Effort:** 3 days  
**Owner:** Frontend + Security

Create `/admin/security` page with:
- Real-time pause status
- Circuit breaker states
- Oracle confidence scores
- Recent alerts (Forta + Tenderly)
- Emergency pause button (multi-sig)

---

## Phase 3: Testing & Verification (Weeks 3-4)

### 🧪 3.1 Property-Based Testing

**Status:** Required before mainnet  
**Effort:** 3 days  
**Owner:** Security

```typescript
// tests/fuzz/payout-calculator.test.ts
import fc from 'fast-check';

describe('Payout Calculator Properties', () => {
    it('never exceeds maxPayout', () => {
        fc.assert(fc.property(
            fc.record({
                maxPayout: fc.float({ min: 0, max: 1000000 }),
                receivedAmount: fc.float({ min: 0 }),
                payoutIncrement: fc.float({ min: 0 }),
            }),
            (input) => {
                const result = calculatePaymentAmount(input);
                return result <= input.maxPayout - input.receivedAmount;
            }
        ));
    });
    
    it('always returns non-negative', () => {
        // ...
    });
});
```

### 🧪 3.2 Chaos Engineering

**Status:** Recommended  
**Effort:** 2 days  
**Owner:** DevOps

Test scenarios:
- RPC endpoint failure (failover)
- Database connection loss
- Redis unavailable (lock fallback)
- Oracle API downtime

### 🧪 3.3 Load Testing

**Status:** Required before mainnet  
**Effort:** 2 days  
**Owner:** QA + DevOps

Targets:
- 10x expected peak volume
- 100 concurrent payout requests
- 1000 deposit scans per minute

---

## Phase 4: Operational Security (Week 4+)

### 📝 4.1 Bug Bounty Program

**Status:** Recommended (launch 2 weeks after mainnet)  
**Effort:** 2 days setup  
**Owner:** Security + Legal

**Immunefi Program Structure:**
| Severity | Bounty |
|----------|--------|
| Critical | $100k - $500k |
| High | $25k - $100k |
| Medium | $5k - $25k |
| Low | $1k - $5k |

**Scope:**
- Payout contracts
- Oracle price feeds
- Deposit credit logic
- Admin functions

### 📝 4.2 Security Documentation

**Status:** Required before mainnet  
**Effort:** Ongoing  
**Owner:** Security

Documents created:
- ✅ `SECURITY_RUNBOOK.md` - Incident response procedures
- ✅ `SECURITY_CHECKLIST.md` - Pre-deployment checklist
- ✅ `SECURITY_ROADMAP.md` - This document

Documents needed:
- Threat model (threat-model.md)
- Security assumptions (security-assumptions.md)
- Upgrade procedures (upgrade-procedures.md)

### 📝 4.3 Team Training

**Status:** Required before mainnet  
**Effort:** 1 day  
**Owner:** Security

Topics:
- Incident response simulation
- Key management best practices
- Social engineering awareness
- Secure coding review

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Test Coverage | >90% | ? |
| Critical Vulnerabilities | 0 | TBD |
| Response Time (P0) | <15 min | N/A |
| Oracle Uptime | 99.9% | N/A |
| Multi-sig Adoption | 100% treasury | 0% |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Private key compromise | Low | Critical | Multi-sig, HSM, monitoring |
| Oracle manipulation | Medium | High | Multi-source, circuit breaker |
| Smart contract bug | Medium | Critical | Audits, formal verification |
| Reorg exploit | Low | High | Block hash verification |
| Admin key compromise | Low | Critical | Multi-sig, timelocks |

---

## Security Contacts

- **Security Engineer:** security@trenches.xyz
- **Emergency Hotline:** +1-XXX-XXX-XXXX
- **Telegram:** @trenches_security_alerts
- **Immunefi:** https://immunefi.com/bounty/trenches

---

*Last Updated: 2026-01-31*  
*Next Review: 2026-02-15*
