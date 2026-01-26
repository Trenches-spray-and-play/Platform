# Layer 1 Complete Setup Guide

> **Status**: ✅ All Steps Completed
> 
> **Date**: 2026-01-08

---

## ✅ What's Been Done

### 1. Dependencies Installed
- ✅ `@prisma/client@5.19.1` - Database client
- ✅ `prisma@5.19.1` - Database toolkit
- ✅ `viem@^2.0.0` - Blockchain interaction
- ✅ `dotenv@^16.0.0` - Environment variables

### 2. Prisma Client Generated
- ✅ Prisma client generated successfully
- ✅ Type-safe database access ready

### 3. Environment Files Created
- ✅ `.env.local` created with template values
- ✅ `.env.example` available as reference

### 4. Migration Created
- ✅ Migration SQL file created: `prisma/migrations/20260108_init_layer1/migration.sql`
- ✅ Ready to apply when database is configured

### 5. Setup Scripts Created
- ✅ `scripts/create-env-local.js` - Creates .env.local
- ✅ `scripts/setup-env.sh` - Shell setup script
- ✅ `npm run setup:env` - NPM script to create env file

---

## 🔧 Final Configuration Steps

### Step 1: Configure Environment Variables

Edit `.env.local` (already created) with your actual values:

```bash
# Edit the file
nano .env.local
# or
code .env.local
```

**Required values to update:**

1. **DATABASE_URL** - Your PostgreSQL connection string
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/trenches?schema=public"
   ```
   
   For local PostgreSQL:
   ```bash
   # Create database first
   createdb trenches
   
   # Then use:
   DATABASE_URL="postgresql://postgres:password@localhost:5432/trenches?schema=public"
   ```

2. **HYPEREVM_RPC_URL** - Your HyperEVM RPC endpoint
   ```env
   HYPEREVM_RPC_URL="https://your-actual-hyperevm-rpc-url"
   ```
   
   **Note**: You'll need to get this from HyperEVM documentation or your provider.

### Step 2: Apply Database Migration

Once DATABASE_URL is configured:

```bash
npm run prisma:migrate
```

This will:
- Create the database tables
- Apply all migrations
- Set up the schema

**Alternative**: If you want to apply the migration manually:

```bash
# Connect to your database
psql -d trenches

# Then run the SQL from:
cat prisma/migrations/20260108_init_layer1/migration.sql
```

### Step 3: Verify Setup

```bash
# Generate Prisma client (if needed)
npm run prisma:generate

# Start development server
npm run dev
```

### Step 4: Initialize Blockchain Monitoring

Once the server is running, initialize blockchain monitoring:

**Option A: Via API call**
```bash
curl -X POST http://localhost:3000/api/blockchain/init
```

**Option B: Via browser**
Navigate to: `http://localhost:3000/api/blockchain/init` (POST request)

**Option C: Integrate into server startup**

Add to your `src/app/layout.tsx` or create a server startup script:

```typescript
// In a server component or API route
import { initializeBlockchainServices } from '@/lib/blockchain-init';

// Call on server startup
if (process.env.NODE_ENV === 'production') {
  initializeBlockchainServices();
}
```

---

## 🧪 Testing Layer 1

### Test 1: Create Pending Transaction

```bash
curl -X POST http://localhost:3000/api/spray \
  -H "Content-Type: application/json" \
  -d '{
    "trenchId": "rapid-1",
    "amount": 10000,
    "userHandle": "@testuser",
    "targetAddress": "0x7a2...3f9c"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "tx-uuid",
    "status": "PENDING",
    "createdAt": "2026-01-08T...",
    "deadline": "2026-01-08T..."
  }
}
```

### Test 2: Check Transaction Status

```bash
curl http://localhost:3000/api/transactions/{transactionId}
```

### Test 3: Manual Verification Scan

```bash
curl -X POST http://localhost:3000/api/transactions/verify \
  -H "Content-Type: application/json" \
  -d '{"blockCount": 10}'
```

---

## 📊 Database Schema

After migration, you'll have these tables:

- **User** - User accounts with handles and belief scores
- **Trench** - Trench configurations (RAPID, MID, DEEP)
- **Participant** - Users in trenches (unique per user+trench)
- **Transaction** - Payment transactions with blockchain data
- **UserTask** - Task completion tracking

---

## 🔍 Troubleshooting

### "Environment variable not found: DATABASE_URL"

- Make sure `.env.local` exists
- Check that `DATABASE_URL` is set correctly
- Restart your dev server after changing `.env.local`

### "Prisma Client not generated"

```bash
npm run prisma:generate
```

### "Migration failed"

- Check database connection string
- Ensure database exists: `createdb trenches`
- Check PostgreSQL is running: `pg_isready`

### "Blockchain client not initialized"

- Check `HYPEREVM_RPC_URL` is set
- Verify RPC endpoint is accessible
- Check network connectivity

### "Transaction not matching"

- Verify `targetAddress` matches exactly
- Check amount matches (within 0.01% tolerance)
- Ensure transaction is within deadline
- Check transaction hash isn't duplicate

---

## 📝 Quick Reference

### NPM Scripts

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run setup:env        # Create .env.local
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio (DB GUI)
```

### API Endpoints

- `POST /api/spray` - Create pending transaction
- `GET /api/transactions/[id]` - Get transaction status
- `POST /api/transactions/verify` - Manual verification scan
- `POST /api/blockchain/init` - Initialize monitoring

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection (required)
- `HYPEREVM_RPC_URL` - HyperEVM RPC endpoint (required)
- `BLT_CONTRACT_ADDRESS` - BLT token contract (default provided)
- `PAYMENT_WINDOW_MS` - Payment deadline (default: 900000 = 15 min)
- `POLLING_INTERVAL` - Block polling interval (default: 10 seconds)

---

## ✅ Checklist

Before proceeding to Layer 2, verify:

- [ ] `.env.local` configured with real values
- [ ] Database migration applied successfully
- [ ] Prisma client generated
- [ ] Dev server starts without errors
- [ ] Blockchain monitoring initializes
- [ ] Can create pending transactions
- [ ] Can check transaction status
- [ ] Database tables exist and are accessible

---

## 🚀 Next Steps

Once Layer 1 is verified working:

1. **Test with real blockchain** (if available)
2. **Monitor logs** for transaction matching
3. **Verify expiration** works correctly
4. **Proceed to Layer 2**: Enforcement Logic

---

## 📚 Documentation

- `docs/LAYER1_SETUP.md` - Detailed setup instructions
- `docs/LAYER1_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `docs/ui_to_systems_mapping.md` - System requirements
- `docs/existing_ui_audit.md` - UI audit results

---

## 🎉 Status

**Layer 1 Implementation**: ✅ Complete
**Environment Setup**: ✅ Complete
**Database Migration**: ✅ Ready to apply
**Testing**: ⏳ Pending (requires database + RPC configuration)

**Ready for**: Database configuration and testing!
