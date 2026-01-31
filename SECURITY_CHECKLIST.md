# Smart Contract Security Checklist

## Pre-Deployment Security Review

### 🔐 Access Control

- [ ] Admin functions protected by multi-sig (not EOA)
- [ ] Role-based access control (RBAC) implemented
- [ ] Emergency pause mechanism tested
- [ ] Upgrade timelock configured (min 24h for critical changes)
- [ ] Revocation procedures documented for all privileged accounts

### 💰 Fund Safety

- [ ] Treasury uses multi-sig wallet (3-of-5 minimum)
- [ ] Hot wallet balance < 24h of expected payouts
- [ ] Cold wallet holds > 90% of reserves
- [ ] Sweep service has gas buffer verification
- [ ] Payout limits enforced per-transaction and per-day
- [ ] No unlimited token approvals

### 📊 Oracle Security

- [ ] Multiple price sources aggregated (min 3)
- [ ] Circuit breaker for >10% price deviation
- [ ] TWAP (Time-Weighted Average Price) for volatile assets
- [ ] Staleness check (< 300 seconds old)
- [ ] Manual price override capability (multi-sig only)
- [ ] Oracle downtime fallback mechanism

### 🛡️ Reorg Protection

- [ ] Confirmation thresholds set per chain:
  - [ ] Ethereum: 12 blocks
  - [ ] Base/Arbitrum: 50 blocks
  - [ ] HyperEVM: 20 blocks
  - [ ] Solana: 32 slots
- [ ] Block hash verification implemented
- [ ] Deposit reversal logic tested
- [ ] Manual review queue for edge cases
- [ ] Alerting on reorg detection

### ⚡ Economic Security

- [ ] Flash loan attack vectors assessed
- [ ] MEV extraction mitigations (Flashbots/private mempool)
- [ ] Boost point mechanics bounded
- [ ] Queue ordering manipulation resistant
- [ ] Slippage protection on price conversions
- [ ] Dust attack protection on deposits

### 🔍 Monitoring & Alerting

- [ ] Forta bots deployed for:
  - [ ] Large payout detection (> $10k)
  - [ ] Unusual admin function calls
  - [ ] Failed transaction rate > 5%
  - [ ] Balance drops below threshold
- [ ] Tenderly alerts configured
- [ ] Telegram bot for real-time alerts
- [ ] PagerDuty integration for P0 incidents
- [ ] Daily security digest automated

### 🧪 Testing & Verification

- [ ] Unit test coverage > 90%
- [ ] Integration tests for all chains
- [ ] Fuzzing with Echidna (min 100k runs)
- [ ] Formal verification for critical math (Certora)
- [ ] Mainnet fork testing completed
- [ ] Chaos engineering: network partition tests
- [ ] Load testing: 10x expected peak volume

### 📋 Operational Security

- [ ] Secrets rotated (no dev keys in production)
- [ ] Environment variables audited
- [ ] CI/CD pipeline security scan
- [ ] Dependency audit (`npm audit` clean)
- [ ] Docker image vulnerability scan
- [ ] Incident response runbook reviewed
- [ ] Team security training completed
- [ ] Bug bounty program active

### 📝 Documentation

- [ ] Security assumptions documented
- [ ] Threat model updated
- [ ] Upgrade procedures documented
- [ ] Key rotation procedures tested
- [ ] Audit reports published
- [ ] Security contact info public

---

## Deployment Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Security Engineer | | | |
| Lead Dev | | | |
| CTO | | | |
| External Auditor | | | |

---

## Post-Deployment (First 30 Days)

- [ ] Daily manual review of all payouts > $1k
- [ ] Weekly security metrics review
- [ ] Monitor Forta alerts daily
- [ ] Verify oracle prices against multiple sources
- [ ] Test emergency pause monthly
- [ ] Review and rotate secrets (day 30)

---

*This checklist must be completed before any production deployment handling > $1M TVL*
