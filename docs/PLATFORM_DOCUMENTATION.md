# Trenches Platform Documentation

## Executive Summary

The Trenches platform is a **launch-ready**, enterprise-grade dApp for token launch campaigns with non-custodial P2P transfers. All critical P0 and P1 requirements have been implemented.

**Status**: ✅ **LAUNCH APPROVED** (TBO Review)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [State Management](#state-management)
3. [Data Fetching & Caching](#data-fetching--caching)
4. [API Reference](#api-reference)
5. [Real-time Features](#real-time-features)
6. [Validation & Type Safety](#validation--type-safety)
7. [Deployment Guide](#deployment-guide)
8. [Runbooks](#runbooks)

---

## Architecture Overview

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16.1.1 | React framework with App Router |
| Language | TypeScript | Type safety |
| Styling | CSS Modules | Component-scoped styles |
| State | Zustand + React Query | Global state + server cache |
| Database | Supabase PostgreSQL | Primary data store |
| ORM | Prisma 5.22.0 | Database access |
| Real-time | SSE + Upstash Redis | Deposit notifications |
| Validation | Zod | Runtime type checking |

### Project Structure

```
apps/dapp/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── sample-v2/         # Main application
│   │   │   ├── dashboard-v2/  # User dashboard
│   │   │   ├── earn-v2/       # Tasks, raids, content
│   │   │   ├── spray/         # Spray entry flow
│   │   │   └── components/    # Shared components
│   │   └── layout.tsx         # Root layout
│   ├── hooks/                 # React Query hooks
│   ├── lib/                   # Utilities
│   │   ├── schemas.ts         # Zod schemas
│   │   ├── validation.ts      # Validation helpers
│   │   └── redis.ts           # Redis queue
│   └── store/                 # Zustand stores
├── prisma/                    # Database schema
└── package.json
```

---

## State Management

### Zustand Stores

#### `uiStore.ts` — Global UI State
```typescript
interface UIState {
  activeModal: string | null;
  modalData: any;
  toasts: Toast[];
  globalLoading: boolean;
  
  openModal: (name: string, data?: any) => void;
  closeModal: () => void;
  addToast: (message: string, type: 'success' | 'error') => void;
  removeToast: (id: string) => void;
}
```

**Usage:**
```typescript
const { addToast, openModal } = useUIStore();
addToast('Task completed!', 'success');
openModal('CONFIRM', { onConfirm: handleConfirm });
```

### React Query Hooks

All data fetching uses React Query with consistent caching:

| Hook | Query Key | Stale Time | Purpose |
|------|-----------|------------|---------|
| `useUser()` | `["user"]` | 60s | Current user profile |
| `useCampaigns()` | `["campaigns"]` | 5min | Available campaigns |
| `useTasks()` | `["tasks"]` | 5min | Available tasks |
| `useRaids()` | `["raids"]` | 5min | Available raids |
| `useUserTasks()` | `["userTasks"]` | 1min | User's completed tasks |
| `useUserRaids()` | `["userRaids"]` | 1min | User's completed raids |
| `usePositions()` | `["positions"]` | 30s | User's positions |

---

## Data Fetching & Caching

### Configuration

```typescript
// Default React Query config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 1 minute
      gcTime: 5 * 60 * 1000,       // 5 minutes
      refetchOnWindowFocus: false, // Critical for performance
      retry: 1,
      retryDelay: 1000,
    },
  },
});
```

### Mutation Patterns

All mutations follow this pattern:
```typescript
export function useCompleteTask() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      const res = await fetch("/api/user/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (!res.ok) throw new Error("Failed to complete task");
      return res.json();
    },
    onSuccess: (data) => {
      addToast(`Task completed! +${data.reward} BP`, "success");
      queryClient.invalidateQueries({ queryKey: ["userTasks"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error: Error) => {
      addToast(error.message, "error");
    },
  });
}
```

---

## API Reference

### User Endpoints

#### GET /api/user
**Description:** Get current user profile  
**Auth:** Required (session)  
**Response:**
```json
{
  "id": "uuid",
  "handle": "username",
  "balance": "1000.00",
  "beliefScore": 85,
  "boostPoints": 150,
  "walletEvm": "0x...",
  "walletSol": "..."
}
```

#### POST /api/user
**Description:** Update user profile  
**Body:** `{ handle?: string, walletEvm?: string, walletSol?: string }`

### Campaign Endpoints

#### GET /api/trenches
**Description:** List all campaigns grouped by level  
**Response:** Array of trench groups with campaigns

#### GET /api/trenches/[id]
**Description:** Get single campaign details

### Task Endpoints

#### GET /api/tasks
**Description:** List all active tasks  
**Response:** Array of tasks

#### GET /api/user/tasks
**Description:** Get user's completed tasks  
**Auth:** Required  
**Query:** `?sprayEntryId=uuid` (optional)

#### POST /api/user/tasks
**Description:** Mark task as completed  
**Auth:** Required  
**Body:** `{ taskId: string, sprayEntryId?: string }`  
**Response:**
```json
{
  "success": true,
  "data": {
    "completedAt": "2026-01-31T10:00:00Z",
    "rewardAwarded": 10,
    "walletBalance": 160
  }
}
```

### Raid Endpoints

#### GET /api/raids
**Description:** List all active raids

#### GET /api/user/raids
**Description:** Get user's completed raids

#### POST /api/user/raids
**Description:** Claim a raid  
**Auth:** Required (x-user-id header)  
**Body:** `{ raidId: string }`  
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "bpAwarded": 5
  }
}
```

### Spray Endpoints

#### POST /api/spray
**Description:** Create spray entry  
**Body:** `{ trenchId: string, amount: number, level: string }`

#### POST /api/spray/finalize
**Description:** Finalize spray entry after tasks complete  
**Body:** `{ sprayEntryId: string }`

### Content Endpoints

#### GET /api/content-campaigns
**Description:** List content campaigns

#### POST /api/user/content-submissions
**Description:** Submit content for review  
**Body:** `{ campaignId: string, url: string, platform: string }`

---

## Real-time Features

### Server-Sent Events (SSE)

**Endpoint:** `GET /api/sse?userId={uuid}`  
**Protocol:** SSE (text/event-stream)  
**Purpose:** Real-time deposit notifications

#### Event Types

| Event | Description |
|-------|-------------|
| `connected` | Initial connection success |
| `heartbeat` | Keep-alive (every 30s) |
| `notification` | Deposit/position update |

#### Example Event
```
event: notification
data: {"type":"deposit_confirmed","amount":"1.5","token":"ETH","txHash":"0x..."}

```

### Redis Queue

**File:** `lib/redis.ts`

```typescript
// Queue a notification
await queueNotification(userId, {
  type: "deposit_confirmed",
  title: "Deposit Confirmed",
  message: "+1.5 ETH deposited",
  data: { txHash: "0x..." },
  timestamp: Date.now(),
});

// Dequeue (called by SSE endpoint)
const notification = await dequeueNotification(userId);
```

---

## Validation & Type Safety

### Zod Schemas

**File:** `lib/schemas.ts`

```typescript
export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  tokenSymbol: z.string().min(1).max(10),
  tokenAddress: z.string(),
  chainId: z.number(),
  // ...
});

export const SprayRequestSchema = z.object({
  trenchId: z.string(),
  amount: z.number().positive(),
  level: z.enum(["RAPID", "MID", "DEEP"]),
  useAutoBoost: z.boolean().optional(),
});
```

### Validation Helpers

```typescript
// lib/validation.ts

// Validate and show toast on error
const validData = validateOrToast(CampaignSchema, rawData);
if (!validData) return; // Validation failed, toast shown

// Validate API response
const user = await validateApiResponse(UserSchema, response);
```

---

## Deployment Guide

### Prerequisites

- Node.js 18+
- npm or pnpm
- Vercel CLI (optional)
- Supabase account
- Upstash Redis account

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://...:5432/postgres"
DIRECT_URL="postgresql://...:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Redis
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# App
NEXT_PUBLIC_APP_URL="https://trenches-dapp.vercel.app"
```

### Build Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build application
npm run build

# Start production server
npm start
```

### Vercel Deployment

```bash
# Link project
vercel link

# Deploy
vercel --prod
```

---

## Runbooks

### Runbook 1: Deposit Webhook Integration

**Purpose:** Trigger deposit notifications from external bot

**Steps:**
1. Bot detects deposit confirmation on-chain
2. Bot calls internal API or directly writes to Redis:
   ```typescript
   await queueNotification(userId, {
     type: "deposit_confirmed",
     message: `+${amount} ${token} deposited`,
     data: { txHash, amount, token },
     timestamp: Date.now(),
   });
   ```
3. SSE endpoint delivers to connected client
4. Client shows toast notification

### Runbook 2: Handling Task Completion Issues

**Symptom:** User completes task but BP not awarded

**Checklist:**
1. Verify task exists and is active: `SELECT * FROM tasks WHERE id = '...'`
2. Check for duplicate completion: `SELECT * FROM userTasks WHERE userId = '...' AND taskId = '...'`
3. Verify user record: `SELECT boostPoints FROM users WHERE id = '...'`
4. Check auto-boost distribution logs

**Resolution:**
- If duplicate: Explain to user they've already claimed
- If system error: Manually award BP and investigate root cause

### Runbook 3: SSE Connection Issues

**Symptom:** Users not receiving real-time notifications

**Checklist:**
1. Verify Redis connection: Check Upstash dashboard
2. Check SSE endpoint: `curl -N https://api/sse?userId=test`
3. Verify heartbeat: Should receive event every 30s
4. Check browser console for EventSource errors

**Common Issues:**
- **Vercel timeout**: SSE has 60s idle limit, heartbeat prevents this
- **Redis full**: Check memory usage, old notifications auto-expire (24h TTL)

### Runbook 4: Performance Issues

**Symptom:** Slow page loads or ERR_INSUFFICIENT_RESOURCES

**Checklist:**
1. Check React Query DevTools for excessive refetching
2. Verify `refetchOnWindowFocus: false` is set
3. Check Network tab for duplicate API calls
4. Review staleTime settings (should be 30s-5min)

**Resolution:**
- Increase staleTime for less volatile data
- Add request deduplication
- Use `React.memo` for expensive components

---

## Compliance & Security

### Security Measures

- ✅ Rate limiting on all API routes (Upstash Redis)
- ✅ HTTP-only, secure, sameSite cookies
- ✅ Input validation via Zod schemas
- ✅ SQL injection protection via Prisma ORM
- ✅ XSS protection via React's built-in escaping

### Compliance

- ✅ Non-custodial architecture (no fund holding)
- ✅ P2P transfers only
- ✅ Clear risk disclaimers
- ✅ Terms of Service acknowledgment

---

## Support & Contacts

**Technical Lead:** [Dev 1]  
**Documentation:** This file  
**Issue Tracking:** GitHub Issues  

---

*Last Updated: January 31, 2026*  
*Version: 1.0 (Launch Ready)*
