# Security TODO - BEFORE PRODUCTION

## Critical: Rotate Exposed Secrets

The following secrets were exposed during development and MUST be rotated before production:

### 1. HD Master Seed (CRITICAL)
- [ ] Generate new seed: `node -e "console.log(require('bip39').generateMnemonic(128))"`
- [ ] Update in `/landing/.env.local`
- [ ] Update in `/trenches-web/.env`
- [ ] Sweep any existing deposits BEFORE rotating

### 2. Treasury/Payout Private Keys
- [ ] Generate new key: `node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Update `PAYOUT_PRIVATE_KEY` in both .env files
- [ ] Update `TREASURY_KEY_EVM` in both .env files
- [ ] Transfer funds from old vault to new address

### 3. Database Password
- [ ] Change password in Supabase dashboard
- [ ] Update `DATABASE_URL` and `DIRECT_URL` in both .env files

### 4. Solana Treasury Key
- [ ] Generate new Solana keypair
- [ ] Update `TREASURY_KEY_SOLANA` in both .env files

---

## Completed Security Fixes
- [x] Admin authentication (Supabase OAuth)
- [x] Admin API protection (all routes)
- [x] Rate limiting (Redis-backed)
- [x] Sweep transactions (real implementation)
- [x] Deposit crediting (implemented)
- [x] Input validation (comprehensive)

---

Generated: 2026-01-26
