# Layer 1 Setup Instructions

> **Status**: Implementation Complete
> 
> **Date**: 2026-01-08

---

## What Was Implemented

### ✅ Core Services

1. **Transaction Service** (`src/services/transaction.service.ts`)
   - Create pending transactions
   - Match blockchain transfers to entries
   - Verify transactions
   - Expire pending transactions

2. **Blockchain Monitor** (`src/services/blockchain.monitor.ts`)
   - Monitor HyperEVM for BLT transfers
   - Poll for new blocks
   - Process Transfer events
   - Match transfers to pending entries

3. **Database Client** (`src/lib/db.ts`)
   - Prisma client singleton
   - Development/production handling

4. **Configuration** (`src/lib/config.ts`)
   - Environment variable management
   - Blockchain settings

### ✅ API Endpoints

1. `POST /api/spray` - Create pending transaction
2. `GET /api/transactions/[id]` - Get transaction status
3. `POST /api/transactions/verify` - Manually trigger verification scan
4. `POST /api/blockchain/init` - Initialize blockchain monitoring

### ✅ Database Schema Updates

- Enhanced Transaction model with:
  - `trenchId`, `targetAddress`, `deadline`
  - `blockNumber`, `fromAddress`, `toAddress`
  - `verifiedAt`, `updatedAt`
  - `EXPIRED` status

- Added unique constraint to Participant model

---

## Setup Steps

### 1. Install Dependencies

```bash
cd trenches-web
npm install
```

This will install:
- `@prisma/client` - Database client
- `viem` - Blockchain interaction
- `dotenv` - Environment variables

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/trenches"
HYPEREVM_RPC_URL="https://your-hyperevm-rpc-url"
BLT_CONTRACT_ADDRESS="0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF"
```

### 3. Setup Database

Generate Prisma client:

```bash
npm run prisma:generate
```

Create and run migration:

```bash
npm run prisma:migrate
```

This will:
- Create the database if it doesn't exist
- Apply schema changes
- Generate Prisma client

### 4. Initialize Blockchain Monitoring

On server startup, call:

```bash
POST /api/blockchain/init
```

Or integrate into your server startup code.

---

## Testing

### Test Transaction Creation

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

### Check Transaction Status

```bash
curl http://localhost:3000/api/transactions/{transactionId}
```

### Manually Trigger Verification

```bash
curl -X POST http://localhost:3000/api/transactions/verify \
  -H "Content-Type: application/json" \
  -d '{"blockCount": 10}'
```

---

## How It Works

### Flow

1. User clicks "I HAVE SENT IT" in UI
2. Frontend calls `POST /api/spray` with entry details
3. Backend creates Transaction record with status `PENDING`
4. Blockchain monitor polls for new blocks
5. When Transfer event detected:
   - Check if matches pending transaction (address + amount)
   - If match: Update transaction to `VERIFIED`
   - Create/update Participant record
6. Frontend polls `GET /api/transactions/[id]` for status

### Matching Logic

A blockchain transfer matches if:
- `tx.to === entry.targetAddress`
- `tx.amount === entry.amount` (within 0.01% tolerance)
- `tx.timestamp < entry.deadline`
- Transaction not already processed

### Expiration

Pending transactions expire after 15 minutes (configurable via `PAYMENT_WINDOW_MS`).

Expired transactions are marked as `EXPIRED` and won't be matched.

---

## Configuration

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `HYPEREVM_RPC_URL` - HyperEVM RPC endpoint (required for monitoring)
- `BLT_CONTRACT_ADDRESS` - BLT token contract (defaults to mock address)
- `PAYMENT_WINDOW_MS` - Payment deadline in milliseconds (default: 900000 = 15 min)
- `POLLING_INTERVAL` - Block polling interval in seconds (default: 10)

### Adjusting Polling

For faster verification, reduce `POLLING_INTERVAL`:

```env
POLLING_INTERVAL=5  # Poll every 5 seconds
```

For lower RPC usage, increase it:

```env
POLLING_INTERVAL=30  # Poll every 30 seconds
```

---

## Next Steps

After Layer 1 is deployed and tested:

1. **Layer 2**: Add payment timeout enforcement
2. **Layer 2**: Add ROI cap validation
3. **Layer 2**: Add entry validation (belief score, max entry)
4. **Layer 3**: Social system (belief/boost)
5. **Layer 4**: Payout coordination

---

## Troubleshooting

### "Blockchain client not initialized"

- Check `HYPEREVM_RPC_URL` is set in `.env.local`
- Verify RPC endpoint is accessible
- Check network connectivity

### "Transaction not matching"

- Verify `targetAddress` matches exactly (case-sensitive)
- Check amount matches (within tolerance)
- Ensure transaction is within deadline
- Check transaction hash isn't duplicate

### "Database connection error"

- Verify `DATABASE_URL` is correct
- Check database is running
- Run `npm run prisma:generate` to regenerate client

---

## Security Notes

✅ **Read-Only**: Service only reads blockchain, never writes
✅ **No Custody**: Never holds or moves funds
✅ **Verification**: All transfers verified on-chain
✅ **Timeout**: Expired transactions rejected
✅ **Duplicate Prevention**: Same txHash processed only once

---

## Production Considerations

1. **RPC Rate Limits**: Monitor RPC usage, adjust polling interval
2. **Database Indexing**: Add indexes on `targetAddress`, `txHash`, `deadline`
3. **Monitoring**: Set up alerts for:
   - Blockchain connection failures
   - High verification lag
   - Unmatched transfers
4. **Scaling**: Consider separate service for blockchain monitoring
5. **Backup**: Regular database backups

---

## Status

✅ **Implementation**: Complete
⏳ **Testing**: Pending
⏳ **Deployment**: Pending
