# Layer 1: Blockchain Indexer Design

> **Status**: Design Phase
> 
> **Priority**: CRITICAL - Must be deployed before any real transactions
> 
> **Risk Level**: SAFE - Read-only, no fund movement

---

## Objective

Implement read-only HyperEVM transaction detection for BLT transfers relevant to Trenches.

**Constraints:**
- No writes to blockchain
- No custody of funds
- Indexing only
- Must verify transactions match user entries

---

## Architecture

### Components

1. **Blockchain Monitor Service**
   - Monitors HyperEVM for BLT transfer events
   - Filters transfers to target payout addresses
   - Extracts transaction data

2. **Transaction Verification Service**
   - Matches on-chain transfers to pending user entries
   - Validates: amount, address, timestamp, token
   - Updates transaction status

3. **Indexing Database**
   - Stores verified transactions
   - Links transactions to participants
   - Tracks verification status

---

## Data Flow

```
User clicks "I HAVE SENT IT"
  ↓
Backend creates Transaction record (status: PENDING)
  ↓
Blockchain Monitor detects BLT transfer to target address
  ↓
Transaction Verification Service matches transfer to pending entry
  ↓
If match: Update Transaction (status: VERIFIED)
  ↓
Create/Update Participant record (status: active)
  ↓
Trigger queue re-calculation
```

---

## Transaction Matching Logic

### Matching Criteria

A blockchain transfer matches a pending entry if:

1. **Address Match**: `tx.to === entry.targetAddress`
2. **Amount Match**: `tx.amount === entry.amount` (within tolerance? ±0.01%)
3. **Token Match**: `tx.token === BLT_CONTRACT_ADDRESS`
4. **Time Window**: `tx.timestamp >= entry.createdAt && tx.timestamp <= entry.deadline`
5. **User Match**: `tx.from === entry.userWallet` (optional, for extra security)

### Edge Cases

- **Multiple transfers to same address**: Match by amount + timestamp proximity
- **Partial matches**: Reject if amount doesn't match exactly
- **Late transfers**: Mark as FAILED if after deadline
- **Duplicate transactions**: Prevent double-counting

---

## API Design

### Endpoints

#### `POST /api/transactions/pending`
Create pending transaction record when user clicks "I HAVE SENT IT"

**Request:**
```json
{
  "trenchId": "rapid-1",
  "userId": "user-123",
  "amount": 10000,
  "targetAddress": "0x7a2...3f9c",
  "deadline": "2026-01-08T15:30:00Z"
}
```

**Response:**
```json
{
  "id": "tx-123",
  "status": "PENDING",
  "createdAt": "2026-01-08T15:15:00Z",
  "deadline": "2026-01-08T15:30:00Z"
}
```

#### `GET /api/transactions/:id/status`
Check verification status of transaction

**Response:**
```json
{
  "id": "tx-123",
  "status": "VERIFIED",
  "txHash": "0xabc...def",
  "verifiedAt": "2026-01-08T15:16:30Z",
  "blockNumber": 19284
}
```

#### `POST /api/transactions/verify` (Internal)
Manually trigger verification check (for testing/debugging)

---

## Database Schema Updates

### Transaction Model (Update)

```prisma
model Transaction {
  id          String    @id @default(uuid())
  userId      String
  trenchId    String
  amount      Int       // BLT amount
  targetAddress String  // Payout address
  status      String    // PENDING, VERIFIED, FAILED, EXPIRED
  txHash      String?   // On-chain transaction hash
  blockNumber Int?      // Block number
  fromAddress String?   // Sender address (from blockchain)
  toAddress   String?   // Receiver address (from blockchain)
  deadline    DateTime  // Payment deadline
  verifiedAt  DateTime? // When verification completed
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id])
  trench      Trench    @relation(fields: [trenchId], references: [id])
}
```

---

## Blockchain Integration

### HyperEVM Setup

1. **RPC Endpoint**
   - Need HyperEVM RPC URL
   - May need API key for rate limits

2. **BLT Contract**
   - Address: `0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF` (verify this)
   - ABI: Standard ERC20 Transfer event

3. **Event Listening**
   ```typescript
   // Listen for Transfer events
   contract.on("Transfer", (from, to, amount, event) => {
     if (isTargetAddress(to)) {
       processTransfer({
         from,
         to,
         amount: amount.toString(),
         txHash: event.transactionHash,
         blockNumber: event.blockNumber,
         timestamp: getBlockTimestamp(event.blockNumber)
       });
     }
   });
   ```

### Polling Strategy (Alternative)

If event listening not available:

1. Poll latest block every N seconds (e.g., 5-10s)
2. Scan for Transfer events to target addresses
3. Process new transfers
4. Store last processed block number

---

## Implementation Steps

### Step 1: Setup Blockchain Connection
- [ ] Configure HyperEVM RPC connection
- [ ] Verify BLT contract address
- [ ] Test connection and event listening

### Step 2: Create Transaction Service
- [ ] Implement `createPendingTransaction()`
- [ ] Implement `verifyTransaction()`
- [ ] Implement `matchTransferToEntry()`

### Step 3: Implement Blockchain Monitor
- [ ] Set up event listener or poller
- [ ] Filter transfers to target addresses
- [ ] Extract transaction data

### Step 4: Database Integration
- [ ] Update Prisma schema
- [ ] Run migrations
- [ ] Create transaction records

### Step 5: API Endpoints
- [ ] `POST /api/transactions/pending`
- [ ] `GET /api/transactions/:id/status`
- [ ] Error handling and validation

### Step 6: Testing
- [ ] Test with mock transfers
- [ ] Test matching logic
- [ ] Test edge cases (duplicates, timeouts, etc.)

---

## Security Considerations

1. **No Fund Access**: Service never holds or moves funds
2. **Read-Only**: Only reads blockchain, never writes
3. **Verification**: All transfers must be verified on-chain
4. **Timeout Enforcement**: Reject transfers after deadline
5. **Duplicate Prevention**: Prevent same txHash being processed twice

---

## Monitoring & Alerts

1. **Blockchain Connection**: Alert if RPC connection fails
2. **Verification Lag**: Alert if verification takes > 5 minutes
3. **Unmatched Transfers**: Alert if transfer detected but no matching entry
4. **Failed Verifications**: Track and log failed matches

---

## Next Steps After Layer 1

Once Layer 1 is deployed and tested:

1. **Layer 2**: Add payment timeout enforcement
2. **Layer 2**: Add ROI cap validation
3. **Layer 2**: Add entry validation (belief score, max entry)
4. **Layer 3**: Social system (belief/boost)
5. **Layer 4**: Payout coordination

---

## Questions to Resolve

1. **HyperEVM RPC URL**: What's the production RPC endpoint?
2. **BLT Contract Address**: Verify `0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF` is correct
3. **Target Address Generation**: How are payout addresses generated? Per round? Per trench?
4. **Amount Tolerance**: Should we allow small rounding differences?
5. **Event Listening vs Polling**: Which is available for HyperEVM?
