# 🔴 Performance Fixes Summary

**Date:** 2026-01-31  
**Issue:** Slow load times on `/api/trenches` (5-7s) and dashboard (3.2s)

---

## Changes Made

### 1. Database Indexes Added ✅

**File:** `packages/database/prisma/schema.prisma`

Added indexes to the `Participant` model:

```prisma
@@index([trenchId])                           // Index for participant count queries
@@index([userId, status])                     // Index for user position queries
```

**Impact:** The slow `GROUP BY trenchId` query will now use an index instead of scanning the entire table.

### 2. API Response Caching ✅

**File:** `apps/dapp/src/app/api/trenches/route.ts`

Added cache headers to reduce database load:

```typescript
response.headers.set(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=300'
);
```

- **s-maxage=60**: Cache for 60 seconds on CDN/server
- **stale-while-revalidate=300**: Serve stale content for up to 5 minutes while refreshing

### 3. Performance Monitoring ✅

**File:** `apps/dapp/src/services/trenchService.ts`

Added timing logs to identify bottlenecks:

```typescript
console.time('[PERF] getTrenchGroups:total');
console.time('[PERF] getTrenchGroups:fetchCampaigns');
console.time('[PERF] getTrenchGroups:participantCounts');
console.time('[PERF] getTrenchGroups:processCampaigns');
```

**API response now includes timing:**
```json
{
  "meta": {
    "responseTimeMs": 450
  }
}
```

### 4. React Query Settings Verified ✅

**File:** `apps/dapp/src/hooks/useQueries.ts`

Already configured with appropriate stale times:
- `useCampaigns()`: `staleTime: 5 * 60 * 1000` (5 minutes)
- `usePositions()`: `staleTime: 30 * 1000` (30 seconds)
- `useUser()`: `staleTime: 60 * 1000` (1 minute)

---

## Manual Steps Required

### Apply Database Indexes

Since `prisma db push` couldn't run automatically due to existing data constraints, run this SQL directly on the database:

```sql
-- Index for participant count queries (fixes the slow /api/trenches endpoint)
CREATE INDEX IF NOT EXISTS "Participant_trenchId_idx" ON "Participant"("trenchId");

-- Index for user position queries
CREATE INDEX IF NOT EXISTS "Participant_userId_status_idx" ON "Participant"("userId", "status");
```

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL above
3. Verify with: `SELECT * FROM pg_indexes WHERE tablename = 'Participant';`

---

## Expected Performance Improvements

| Metric | Before | Target | After Indexes |
|--------|--------|--------|---------------|
| `/api/trenches` | 5-7s | < 1s | TBD |
| Dashboard load | 3.2s | < 2s | TBD |
| DB query time | ~4s | < 200ms | TBD |

---

## Verification Steps

1. **Check logs after deployment:**
   ```
   [PERF] getTrenchGroups:total: 450ms
   [PERF] /api/trenches completed in 520ms
   ```

2. **Test the API endpoint:**
   ```bash
   curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3004/api/trenches
   ```

3. **Verify cache headers:**
   ```bash
   curl -I http://localhost:3004/api/trenches
   # Should see: Cache-Control: public, s-maxage=60, stale-while-revalidate=300
   ```

---

## Files Modified

1. `packages/database/prisma/schema.prisma` - Added indexes
2. `apps/dapp/src/app/api/trenches/route.ts` - Added caching + timing
3. `apps/dapp/src/services/trenchService.ts` - Added performance monitoring

---

## Next Steps

1. ✅ Dudu: Run the SQL to add indexes in Supabase
2. ⏳ Monitor logs for `[PERF]` timing entries
3. ⏳ Verify `/api/trenches` response time < 1 second
4. ⏳ Check for any `ERR_INSUFFICIENT_RESOURCES` errors

---

**Assigned to:** Dudu  
**Priority:** HIGH 🔴  
**Status:** Code changes complete, awaiting database migration
