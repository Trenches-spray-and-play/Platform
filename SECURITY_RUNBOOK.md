# Trenches Security Incident Response Runbook

## 🚨 Severity Classification

| Level | Criteria | Response Time | Notification |
|-------|----------|---------------|--------------|
| **P0 - Critical** | Funds at risk, active exploit | < 15 min | All hands + Telegram |
| **P1 - High** | Potential vulnerability found | < 1 hour | Security team + CTO |
| **P2 - Medium** | Suspicious activity detected | < 4 hours | Security team |
| **P3 - Low** | Minor anomaly | < 24 hours | Daily digest |

---

## Emergency Contacts

```
Primary On-Call:  +1-XXX-XXX-XXXX
Secondary:       +1-XXX-XXX-XXXX
CTO:             +1-XXX-XXX-XXXX
Telegram Group:  @trenches_security_alerts
PagerDuty:       https://trenches.pagerduty.com
```

---

## Response Procedures

### 🔴 P0: Active Exploit in Progress

**Immediate Actions (First 5 minutes):**

1. **PAUSE ALL PAYOUTS**
   ```bash
   # Via admin API
   curl -X POST https://api.trenches.xyz/api/admin/pause \
     -H "Authorization: Bearer $EMERGENCY_TOKEN" \
     -d '{"reason": "Security incident", "durationMinutes": 60}'
   ```

2. **NOTIFY TEAM**
   - Post in #security-war-room Slack
   - Call CTO directly
   - Send Telegram alert: `@channel SECURITY INCIDENT - PAYOUTS PAUSED`

3. **PRESERVE EVIDENCE**
   ```bash
   # Capture current state
   node scripts/emergency-snapshot.js > incident-$(date +%s).json
   
   # Save logs
   vercel logs --since=1h > logs-$(date +%s).txt
   ```

**Next 10 minutes:**

4. **Assess Impact**
   ```sql
   -- Check recent transactions
   SELECT * FROM payouts 
   WHERE status = 'CONFIRMED' 
   AND confirmedAt > NOW() - INTERVAL '1 hour';
   
   -- Check for unusual patterns
   SELECT chain, COUNT(*), SUM(amountUsd) 
   FROM deposits 
   WHERE createdAt > NOW() - INTERVAL '1 hour'
   GROUP BY chain;
   ```

5. **Execute Emergency Procedures**
   - If treasury key compromised: Execute key rotation (see Key Rotation Procedure)
   - If oracle manipulation: Switch to manual price mode
   - If reorg detected: Review reverseDepositCredit logs

### 🟠 P1: Potential Vulnerability

1. **Isolate the component**
2. **Reproduce in testnet**
3. **Engage external auditors if needed**
4. **Prepare hotfix with 24h timeline**

---

## Key Rotation Procedure

### Treasury Key Compromise

```bash
#!/bin/bash
# emergency-key-rotation.sh

# 1. Generate new keys
NEW_EVM_KEY=$(node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))")
NEW_SOLANA_KEY=$(solana-keygen new --no-passphrase --outfile /dev/stdout 2>/dev/null | head -1)

# 2. Update Vercel environment variables
vercel env add TREASURY_KEY_EVM production <<< "$NEW_EVM_KEY"
vercel env add TREASURY_KEY_SOLANA production <<< "$NEW_SOLANA_KEY"

# 3. Redeploy
vercel --prod

# 4. Transfer funds from old vault (if safe)
# ... transaction signing with emergency multi-sig

# 5. Revoke old keys in any external services
```

---

## Post-Incident Review

Required within 48 hours of resolution:

1. **Timeline reconstruction**
2. **Root cause analysis (5 Whys)**
3. **Impact assessment ($ value, user count)**
4. **Remediation actions**
5. **Prevention measures**

Template: `docs/incidents/YYYY-MM-DD-incident-name.md`

---

## Monitoring Dashboards

- **Tenderly**: https://dashboard.tenderly.co/trenches
- **Forta**: https://explorer.forta.network/alerts?bot=trenches
- **Dune**: https://dune.com/trenches/security
- **Grafana**: https://grafana.trenches.xyz/d/security

---

*Last Updated: 2026-01-31*
*Owner: Security Engineering*
