# Security Engineer Memory Document

**Role:** Smart Contract Security Engineer  
**Project:** Trenches Belief Coordination Platform  
**Last Updated:** 2026-01-31  
**Status:** Active Engagement - Critical Path  

---

## 🎯 Current Mission

Secure Trenches platform for mainnet launch. Handling millions in user deposits across multiple blockchains (HyperEVM, Base, Arbitrum, BSC, Solana).

**Critical Finding:** Current treasury uses EOA private keys in environment variables — **MUST be migrated to Gnosis Safe multi-sig before mainnet.**

---

## 📊 Security Assessment Summary

### Risk Ratings

| Component | Risk Level | Status | Notes |
|-----------|------------|--------|-------|
| **Private Key Management** | 🔴 Critical | In Remediation | Migrating to Gnosis Safe |
| **Price Oracle** | 🟡 High | In Remediation | Building multi-source aggregator |
| **Emergency Pause** | 🔴 Critical | In Development | 2-of-5 guardian module |
| **Payout Logic** | 🟡 Medium | Pending Audit | No formal verification yet |
| **Reorg Protection** | 🟢 Low-Med | Implemented | Block hash verification active |
| **Sweep Service** | 🟡 Medium | Monitoring | HD wallet derivation |

### Key Files Analyzed

```
apps/dapp/src/services/
├── payout.service.ts              # $100M+ TVL at risk
├── sweep.service.ts               # HD derivation, gas estimation
├── deposit-credit.service.ts      # Double-spend prevention
├── reserve.service.ts             # 12h cache, rounding
├── price-oracle.service.ts        # Single CoinGecko source
├── reorg-protection.service.ts    # Block hash verification
├── queue.service.ts               # Boost mechanics
├── alert.service.ts               # Telegram/email alerts
└── config.ts / payout-config.ts   # Environment configuration
```

---

## 🏗️ Infrastructure Created

### Documentation

| File | Purpose | Location |
|------|---------|----------|
| `SECURITY_RUNBOOK.md` | Incident response procedures (P0-P3) | Root |
| `SECURITY_CHECKLIST.md` | Pre-deployment security checklist | Root |
| `SECURITY_ROADMAP.md` | 4-week implementation roadmap | Root |
| `SECURITY-TODO.md` | Critical secrets rotation tracker | Root |
| `MEMORY_SECURITY_ENGINEER.md` | This document | Root |

### Code

| File | Purpose | Location |
|------|---------|----------|
| `oracle-aggregator.ts` | Multi-source price oracle + circuit breaker | `packages/security/src/` |
| `large-payout-bot.ts` | Forta bot for suspicious payouts | `packages/security/forta/` |
| `reorg-detection-bot.ts` | Forta bot for blockchain reorgs | `packages/security/forta/` |
| `deploy-gnosis-safe.ts` | Safe deployment & migration script | `apps/dapp/scripts/security/` |
| `emergency-pause-module.ts` | Pause module for Safe | `apps/dapp/scripts/security/` |

---

## 🚨 Active Critical Path

### Phase 1: Multi-Sig Migration (Days 1-2)

**Status:** 🟡 IN PROGRESS  
**ETA:** Today EOD  
**Owner:** Dev 1 + Security Engineer  

**Safe Configuration:**
```javascript
SIGNERS = [
    "0x...CTO",           // Need address from Lead Dev
    "0x...LeadDev",       // Have
    "0x...SecurityEng",   // Will generate
    "0x...Dev1",          // Have
    "0x...External",      // Need address from Lead Dev
]
THRESHOLD = 3  // 3-of-5
```

**Chains:**
1. HyperEVM (primary) - **TODAY**
2. Ethereum - After HyperEVM validated
3. Base - After HyperEVM validated
4. Arbitrum - After mainnet launch
5. BSC - After mainnet launch

**Solana Exception:** Using Squads multisig (different stack)

### Phase 2: External Audit (Weeks 1-3)

**Status:** 🔴 BOOKING TODAY  
**Firm:** Trail of Bits (recommended)  
**Cost:** $100-125k  
**Timeline:** 3 weeks  
**Contact:** info@trailofbits.com  

**Scope:**
- Priority 1: payout.service.ts, sweep.service.ts, deposit-credit.service.ts ($100k)
- Priority 2: oracle-aggregator, pause-module, queue.service.ts ($25k)

**Backup:** OpenZeppelin (4 weeks, $100-150k)

### Phase 3: Monitoring & Testing (Weeks 2-4)

**Forta Bots:**
- Large payout detection (> $10k threshold)
- Reorg detection
- Failed transaction rate monitoring

**Tenderly:**
- Alerting configuration
- Transaction simulation

---

## 📋 Action Items Status

### Today (2026-01-31)

| # | Task | Owner | Status | Blockers |
|---|------|-------|--------|----------|
| 1 | Deploy Gnosis Safe on HyperEVM | Dev 1 + Security | 🟡 In Progress | Waiting for signer addresses |
| 2 | Book Trail of Bits Audit | Lead Dev | 🔴 Started | Need confirmation email |
| 3 | Verify Safe Signers | Security Eng | 🟡 Ready | Will generate address |

### Tomorrow (2026-02-01)

| # | Task | Owner | Status |
|---|------|-------|--------|
| 4 | Deploy Pause Module (testnet) | Dev 1 + Security | 🟡 Planned |
| 5 | Integration Testing | Dev 1 | 🟡 Planned |
| 6 | Security Standup | All | 🟡 Scheduled 10am |
| 7 | Oracle Aggregator Integration | Security | 🟡 Planned |

### This Week

| # | Task | Owner | Status |
|---|------|-------|--------|
| 8 | Complete Safe migration all chains | Dev 1 + Security | 🟡 Planned |
| 9 | Property-based testing setup | Security | 🟡 Planned |
| 10 | Chaos engineering tests | DevOps | 🟡 Planned |
| 11 | Update SECURITY-TODO.md | Security | 🟡 Planned |

---

## 🔐 Secrets & Keys Status

### Environment Variables Requiring Rotation

From `SECURITY-TODO.md`:

| Secret | Status | Action | Owner |
|--------|--------|--------|-------|
| HD_MASTER_SEED | 🔴 Exposed | Rotate before mainnet | DevOps |
| PAYOUT_PRIVATE_KEY | 🔴 Exposed | Migrate to Safe | Security + Dev 1 |
| TREASURY_KEY_EVM | 🔴 Exposed | Migrate to Safe | Security + Dev 1 |
| TREASURY_KEY_SOLANA | 🔴 Exposed | Rotate + Squads | Security |
| DATABASE_URL | 🟡 Check | Verify not exposed | DevOps |

### New Environment Variables Needed

```bash
# Gnosis Safe
SAFE_ADDRESS_HYPEREVM=0x...
SAFE_ADDRESS_ETHEREUM=0x...
SAFE_ADDRESS_BASE=0x...
SAFE_SIGNER_1=0x...  # CTO
SAFE_SIGNER_2=0x...  # Lead Dev
SAFE_SIGNER_3=0x...  # Security Eng
SAFE_SIGNER_4=0x...  # Dev 1
SAFE_SIGNER_5=0x...  # External

# Pause Module
PAUSE_MODULE_ADDRESS=0x...
PAUSE_GUARDIAN_1=0x...
PAUSE_GUARDIAN_2=0x...

# Oracle
COINGECKO_API_KEY=...  # Pro tier for reliability
BINANCE_API_KEY=...    # Backup source

# Monitoring
FORTA_API_KEY=...
TENDERLY_PROJECT_SLUG=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ADMIN_CHAT_ID=...
```

---

## 🗣️ Communication Channels

### Active
- **GitHub:** Code reviews, PRs
- **This Workspace:** Technical coordination
- **Telegram "Trenches Security War Room":** Real-time coordination (being created)

### To Establish
- **PagerDuty:** Incident escalation
- **Immunefi:** Bug bounty program (post-launch)

---

## 🧠 Technical Context

### Architecture Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Gnosis Safe for EVM | Battle-tested, industry standard | No native HyperEVM Tx Service |
| 3-of-5 Threshold | Balance security vs availability | Slower than 2-of-3 |
| Same Safe for Pause | Single source of truth | Requires custom module |
| Multi-source Oracle | Prevents single-point manipulation | Higher latency |
| 24h Unpause Timelock | Prevents hasty unpauses | Delayed recovery |

### Known Limitations

1. **HyperEVM No Tx Service:** Must use manual coordination or self-hosted
2. **No Formal Verification:** Code audited but not mathematically proven
3. **Single Price Cache:** 60s TTL may miss flash crashes
4. **Manual Sweep:** No automated gas price optimization

---

## 📚 Reference Materials

### External Resources

| Resource | URL | Purpose |
|----------|-----|---------|
| Gnosis Safe | https://safe.global | Multi-sig wallet |
| Trail of Bits | https://trailofbits.com | Security audit |
| Forta | https://forta.network | Monitoring bots |
| Tenderly | https://tenderly.co | Transaction simulation |
| HyperEVM Explorer | https://explorer.hyperliquid.xyz | Block explorer |

### Internal Docs

| Doc | Location | Last Updated |
|-----|----------|--------------|
| Architecture | `docs/` | Check git |
| Database Schema | `prisma/schema.prisma` | Check git |
| API Routes | `src/app/api/` | Check git |

---

## 🎯 Success Criteria

### Mainnet Launch Blockers

- [ ] Gnosis Safe deployed on all chains
- [ ] Audit completed with no critical findings
- [ ] All critical/high findings remediated
- [ ] Pause module tested on testnet
- [ ] Emergency runbook tested (fire drill)
- [ ] Secrets rotated
- [ ] Bug bounty program active (Immunefi)

### Monitoring Requirements

- [ ] Forta bots deployed and alerting
- [ ] Tenderly alerts configured
- [ ] Telegram bot active
- [ ] PagerDuty integration working
- [ ] Daily security digest automated

### Documentation Requirements

- [ ] All `SECURITY_*.md` files current
- [ ] Incident response tested
- [ ] Team training completed
- [ ] External audit report published

---

## 📝 Session Notes

### 2026-01-31: Initial Engagement

**Context:** Lead Dev introduced me as Security Engineer. Reviewed job description and platform architecture.

**Actions:**
1. Analyzed all critical service files
2. Identified 3 critical/high findings
3. Created security infrastructure (docs + code)
4. Proposed remediation roadmap
5. Coordinated with Dev 1 for Safe deployment

**Blockers:**
- Need 5 signer addresses for Safe
- Trail of Bits booking pending
- Dev 1 availability for deployment

**Next Actions:**
1. Generate Security Engineer Safe signer address
2. Join Telegram War Room
3. Support Dev 1 with deployment blockers
4. Verify Trail of Bits booking

---

## 🔗 Quick Links

```bash
# Deployment scripts
apps/dapp/scripts/security/deploy-gnosis-safe.ts
apps/dapp/scripts/security/emergency-pause-module.ts

# Security code
packages/security/src/oracle-aggregator.ts
packages/security/forta/large-payout-bot.ts
packages/security/forta/reorg-detection-bot.ts

# Documentation
SECURITY_RUNBOOK.md
SECURITY_CHECKLIST.md
SECURITY_ROADMAP.md
SECURITY-TODO.md
MEMORY_SECURITY_ENGINEER.md  # This file
```

---

## 🔄 Update Protocol

**When to update this document:**
1. After each significant action completed
2. When new blockers discovered
3. When timeline changes
4. At end of each day

**Version History:**
- v1.0 (2026-01-31): Initial creation, Phase 1 in progress

---

**Current Focus:** Support Dev 1 with Gnosis Safe deployment on HyperEVM.  
**Next Check-in:** Tomorrow 10am Security Standup.  
**Emergency Contact:** Telegram War Room (joining once created)
