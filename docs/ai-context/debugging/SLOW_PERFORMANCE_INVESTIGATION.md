# Performance Investigation - Click Response Still Slow
**Date:** January 31, 2026  
**Status:** 🔴 CRITICAL - Performance degraded even after optimizations

---

## 🚨 Issue Summary

User reports performance is "very very slow, maybe even worse" after previous fixes.

**Question:** How many APIs loading on first load? Does this relate to blockchain deposit API?

---

## 🔍 Investigation Results

### APIs Called on Homepage (`/sample-v2`)

| API | When Called | Status |
|-----|-------------|--------|
| `/api/trenches` | On page load (useEffect) | ✅ Single API |
| `/api/sse?userId=...` | When user logged in (EventSource) | ⚠️ **Potential Issue** |
| `/api/user` | Via useUser hook | ✅ Standard |

**Total APIs on first load: 2-3**

### 🔴 SUSPECT #1: SSE (Server-Sent Events) Connection

**File:** `apps/dapp/src/hooks/useRealtimeStatus.ts`

```typescript
const eventSource = new EventSource(`/api/sse?userId=${userId}`);
```

**File:** `apps/dapp/src/app/api/sse/route.ts`

```typescript
const interval = setInterval(async () => {
    const notification = await dequeueNotification(userId);
    // Polls Redis every 2 seconds
}, 2000);
```

**Problem:**
1. Every logged-in user opens an SSE connection
2. Each connection polls Redis every 2 seconds
3. This creates constant background activity
4. **Can block main thread if Redis is slow**

### 🔴 SUSPECT #2: Redis Connection Issues

**File:** `apps/dapp/src/lib/redis.ts`

```typescript
export const redis = Redis.fromEnv();
```

**Potential Issues:**
1. If Redis env vars not set → Operations hang
2. Each SSE connection creates polling load
3. Rate limiting checks hit Redis on every deposit scan

**Check if Redis is configured:**
```bash
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN
```

If these are empty, Redis operations will fail/hang.

### 🔴 SUSPECT #3: Campaign Stats Calculation

**File:** `apps/dapp/src/app/sample-v2/page.tsx` (lines 52-66)

```typescript
// Calculate stats
const totalCampaigns = data.data.reduce(
  (acc: number, group: TrenchGroup) => acc + group.campaigns.length,
  0
);
const activeParticipants = data.data.reduce(
  (acc: number, group: TrenchGroup) =>
    acc + group.campaigns.reduce((sum, c) => sum + (c.participantCount || 0), 0),
  0
);
```

This runs on EVERY render if data changes. With many campaigns, this can be expensive.

### 🔴 SUSPECT #4: Deposit Scanner Services in Bundle

**Services found importing blockchain libraries:**
- `deposit-scanner.service.ts` - Imports ethers/viem/solana
- `deposit-monitor.service.ts` - Imports viem/solana
- `evm-scanner.service.ts` - Imports viem
- `solana-scanner.service.ts` - Imports @solana/web3.js

**If these are imported anywhere in client-side code, they add 500+ KB to bundle.**

---

## 🎯 Immediate Actions to Take

### 1. Disable SSE Temporarily (Test)

**File:** `apps/dapp/src/app/sample-v2/components/LayoutClient.tsx`

**Comment out line 32:**
```typescript
// Comment out to test without SSE:
// useRealtimeStatus(user?.id);
```

**Test:** If performance improves, SSE is the culprit.

### 2. Add Redis Connection Check

**File:** `apps/dapp/src/lib/redis.ts`

Add connection test:
```typescript
// Test connection on startup
redis.ping().then(() => {
    console.log('[Redis] Connected successfully');
}).catch((err) => {
    console.error('[Redis] Connection failed:', err);
});
```

### 3. Memoize Stats Calculation

**File:** `apps/dapp/src/app/sample-v2/page.tsx`

```typescript
import { useMemo } from 'react';

// Replace direct calculation with useMemo:
const stats = useMemo(() => {
  if (!trenchGroups.length) return { totalCampaigns: 0, activeParticipants: 0, totalVolume: "$0" };
  
  const totalCampaigns = trenchGroups.reduce(
    (acc, group) => acc + group.campaigns.length, 0
  );
  const activeParticipants = trenchGroups.reduce(
    (acc, group) => acc + group.campaigns.reduce((sum, c) => sum + (c.participantCount || 0), 0),
    0
  );
  
  return {
    totalCampaigns,
    activeParticipants,
    totalVolume: "$2.4M+",
  };
}, [trenchGroups]);
```

### 4. Check for Service Imports in Client Code

**Run:**
```bash
grep -r "from '@/services/deposit" apps/dapp/src/app/sample-v2/ --include="*.tsx"
grep -r "from '@/services/evm" apps/dapp/src/app/sample-v2/ --include="*.tsx"
grep -r "from '@/services/solana" apps/dapp/src/app/sample-v2/ --include="*.tsx"
```

**If any found, these are pulling heavy libs into client bundle!**

### 5. Add Performance Monitoring

**File:** `apps/dapp/src/app/sample-v2/page.tsx`

Add timing logs:
```typescript
const fetchTrenches = async () => {
  console.time('[Perf] fetchTrenches');
  try {
    const res = await fetch("/api/trenches");
    const data = await res.json();
    console.timeEnd('[Perf] fetchTrenches');
    // ... rest
  } catch (error) {
    console.error("Failed to fetch trenches:", error);
  }
};
```

---

## 📊 Expected Culprits (Ranked)

| Rank | Suspect | Likelihood | Fix Difficulty |
|------|---------|------------|----------------|
| 1 | SSE Redis Polling | HIGH | Easy (disable test) |
| 2 | Redis Not Configured | HIGH | Easy (add env vars) |
| 3 | Blockchain Services in Bundle | MEDIUM | Hard (refactor) |
| 4 | Stats Recalculation | MEDIUM | Easy (useMemo) |
| 5 | Campaign Card Re-renders | LOW | Done (memo) |

---

## 🧪 Quick Test Procedure

### Test 1: Disable SSE
1. Comment out `useRealtimeStatus` in LayoutClient.tsx
2. Restart dev server
3. Test click response
4. **If fixed → SSE/Redis is the issue**

### Test 2: Check Redis
1. Run `echo $UPSTASH_REDIS_REST_URL`
2. If empty → Redis not configured
3. Set dummy values or disable SSE

### Test 3: Check Bundle
1. Run `npm run build`
2. Look for warnings about large chunks
3. Check if ethers/viem appear in client bundle

### Test 4: Profile in DevTools
1. Open Chrome DevTools → Performance
2. Click record
3. Click a campaign card
4. Stop recording
5. Look for:
   - Long tasks (yellow)
   - Network requests (blue)
   - Long JavaScript execution (purple)

---

## 🎯 Most Likely Root Cause

**SSE (Server-Sent Events) with Redis polling**

Every logged-in user has:
1. An open SSE connection
2. Redis polled every 2 seconds
3. If Redis is slow or unconfigured, this blocks

**Quick Fix:** Disable SSE temporarily to verify.

---

## 📝 Next Steps

1. **Dudu: Disable SSE and test** (5 minutes)
2. **Check Redis environment variables**
3. **If SSE is culprit: Implement lazy SSE or increase polling interval**
4. **If not: Profile with DevTools to find actual bottleneck**

---

**Investigation by:** TBO  
**Date:** January 31, 2026  
**Status:** Awaiting Dudu to test SSE disable
