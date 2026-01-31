# Admin V2 Functional Development Checklist
## For Dudu — Data, API & Logic Focus (No UI/UX)

**Status Legend:**
- ✅ Done — Complete and verified
- 🟡 In Progress — Partially done, needs review
- ❌ Missing — Not implemented yet
- ⚠️ Warning — Has functional issues that need fixing

---

## 📊 OVERALL PROGRESS SUMMARY

| Category | Status | Completion |
|----------|--------|------------|
| Core Data Structure | ✅ | 95% |
| API Integration | ✅ | 90% |
| CRUD Operations | 🟡 | 80% |
| Error Handling | ❌ | Missing |
| Data Validation | ❌ | Missing |
| Security & Auth | ✅ | 90% |
| Performance | ⚠️ | Needs work |
| Edge Cases | ❌ | Not covered |

**Overall Completion: ~75%** — Core works, needs error handling & edge cases

---

## 1. AUTHENTICATION & SECURITY

### 1.1 Login Flow
- [x] Auth verification on layout mount
- [x] Redirect to login if not authenticated
- [x] Login page redirects to main auth flow
- [x] Admin key authentication works

**❌ MISSING:**
- [ ] Session timeout handling (8-hour expiry check)
- [ ] "Remember me" persistence
- [ ] Permission-based feature gating (if roles added later)
- [ ] Audit logging (who accessed what when)

### 1.2 API Security
- [x] All admin API routes check authentication
- [x] No sensitive data exposed in client

**⚠️ MISSING:**
- [ ] Rate limiting feedback (user sees "too many attempts")
- [ ] IP-based suspicious activity detection

---

## 2. DASHBOARD PAGE (/admin-v2)

### 2.1 Data Fetching
- [x] Parallel API calls for stats
- [x] Error handling (catch block exists but basic)

**⚠️ ISSUES:**
- [ ] No retry mechanism if APIs fail
- [ ] No caching (fetches on every mount)
- [ ] Missing loading state management (setLoading in finally)

**❌ MISSING:**
- [ ] Real-time data updates (polling/WebSocket)
- [ ] Data freshness indicator (last updated timestamp)

### 2.2 Data Display
- [x] Stats displayed from API response
- [x] Null/undefined handling (shows "-")

**⚠️ ISSUES:**
- [ ] No validation of API response format
- [ ] Hardcoded fallbacks bypass type safety

---

## 3. USER MANAGEMENT (/admin-v2/users)

### 3.1 User List Data
- [x] Pagination (20 items per page)
- [x] Search by handle/email
- [x] Total count from API meta

**⚠️ ISSUES:**
- [ ] Search triggers on every keystroke (needs debounce)
- [ ] No validation of search input (can submit empty)

**❌ MISSING:**
- [ ] Filter by status (active, suspended, etc.)
- [ ] Sort by column (balance, belief, date)
- [ ] Server-side search (currently client-side? Verify)

### 3.2 User Detail Modal
- [x] Displays user data
- [x] Shows related counts (deposits, tasks, etc.)

**❌ MISSING:**
- [ ] Edit user functionality (balance, belief, status)
- [ ] Suspend/unsuspend user action
- [ ] View user's full history (deposits, campaigns)
- [ ] Reset password action
- [ ] Impersonate user (login as user)

### 3.3 Data Integrity
**❌ MISSING:**
- [ ] Confirm before destructive actions
- [ ] Optimistic updates (UI updates before API confirms)
- [ ] Rollback on API failure

---

## 4. CAMPAIGN MANAGEMENT (/admin-v2/campaigns)

### 4.1 Campaign Data
- [x] List all campaigns from API
- [x] Display status (active, paused, hidden)
- [x] Show reserve balance

**⚠️ ISSUES:**
- [ ] No data refresh after create/update
- [ ] Campaign counts might be stale

### 4.2 Campaign CRUD
- [x] Create campaign form
- [x] Update campaign form
- [x] All fields mapped correctly
- [x] Dynamic import for form (performance)

**❌ MISSING:**
- [ ] Delete campaign (soft delete?)
- [ ] Duplicate campaign (clone existing)
- [ ] Bulk status update (activate multiple)

### 4.3 Form Validation
**❌ MISSING:**
- [ ] Client-side validation before submit
- [ ] Field-level error messages from server
- [ ] Required field validation
- [ ] Number range validation (ROI > 0, etc.)
- [ ] Date validation (start date not in past)

### 4.4 API Error Handling
**❌ MISSING:**
- [ ] Display API errors to user
- [ ] Handle 409 conflict (duplicate name)
- [ ] Handle 400 validation errors
- [ ] Handle 500 server errors

---

## 5. DEPOSITS PAGE (/admin-v2/deposits)

### 5.1 Deposit Data
- [x] List deposits with user info
- [x] Chain filtering
- [x] Status display

**⚠️ ISSUES:**
- [ ] No pagination (loads all deposits?)

**❌ MISSING:**
- [ ] Search by tx hash
- [ ] Search by user
- [ ] Date range filter
- [ ] Export to CSV

### 5.2 Deposit Actions
- [x] Manual backfill API
- [x] Trigger deposit scan API

**❌ MISSING:**
- [ ] Approve/reject pending deposits
- [ ] Edit deposit (correction for errors)
- [ ] View on blockchain explorer link
- [ ] Bulk actions (approve multiple)

---

## 6. PAYOUTS PAGE (/admin-v2/payouts)

### 6.1 Payout Data
- [x] Stats from API
- [x] List payouts

**⚠️ ISSUES:**
- [ ] Missing pagination
- [ ] No filtering by status

**❌ MISSING:**
- [ ] Approve pending payouts
- [ ] Retry failed payouts
- [ ] Bulk payout processing
- [ ] Export payout history

### 6.2 Payout Actions
**❌ MISSING:**
- [ ] Manual trigger payout
- [ ] Cancel pending payout
- [ ] View payout transaction details

---

## 7. OTHER PAGES — FUNCTIONAL STATUS

### 7.1 Tasks (/admin-v2/tasks)
- [x] CRUD operations
- [x] Active/inactive toggle

**❌ MISSING:**
- [ ] Task completion statistics
- [ ] Reorder tasks (API endpoint?)
- [ ] Task type validation

### 7.2 Raids (/admin-v2/raids)
- [x] CRUD operations

**❌ MISSING:**
- [ ] Raid completion verification
- [ ] Auto-validation logic
- [ ] Raid performance metrics

### 7.3 Content Campaigns (/admin-v2/content)
- [x] CRUD operations

**❌ MISSING:**
- [ ] Submission review workflow
- [ ] Budget tracking calculations
- [ ] Performance metrics API integration

### 7.4 Submissions (/admin-v2/submissions)
- [x] List submissions

**❌ MISSING:**
- [ ] Approve/reject actions
- [ ] Bulk approve/reject
- [ ] View count validation

### 7.5 Trenches (/admin-v2/trenches)
- [x] List trenches

**❌ MISSING:**
- [ ] Edit trench parameters
- [ ] Adjust reserves API
- [ ] Trench performance data

### 7.6 Settings (/admin-v2/settings)
- [x] Load config from API
- [x] Save config to API

**❌ MISSING:**
- [ ] Config change audit log
- [ ] Validation for dates/URLs
- [ ] Preview changes before save

---

## 8. ERROR HANDLING — CRITICAL GAPS

### 8.1 API Error Handling
**❌ MISSING EVERYWHERE:**
- [ ] User-friendly error messages
- [ ] Error categorization (network vs server vs validation)
- [ ] Retry mechanism with exponential backoff
- [ ] Offline detection and queuing

### 8.2 Data Validation
**❌ MISSING:**
- [ ] Response format validation (zod/schemas)
- [ ] Type guards for API responses
- [ ] Null/undefined checks before accessing nested data

### 8.3 Edge Cases
**❌ NOT HANDLED:**
- [ ] Empty API responses
- [ ] Malformed API responses
- [ ] Network timeouts
- [ ] Session expiration during operation
- [ ] Concurrent edit conflicts

---

## 9. PERFORMANCE — DATA & API

### 9.1 Data Fetching
**✅ GOOD:**
- [x] Parallel API calls where possible
- [x] Pagination on users
- [x] Dynamic imports for heavy components

**⚠️ ISSUES:**
- [ ] No request caching
- [ ] No debouncing on search inputs
- [ ] No data prefetching

**❌ MISSING:**
- [ ] React Query / SWR for caching
- [ ] Virtualization for long lists
- [ ] Optimistic updates

### 9.2 API Optimization
**❌ MISSING:**
- [ ] Request deduplication
- [ ] Background refetching
- [ ] Stale-while-revalidate pattern

---

## 10. DATA INTEGRITY & CONSISTENCY

### 10.1 Form Handling
**❌ MISSING:**
- [ ] Dirty state tracking (warn if navigating away)
- [ ] Auto-save drafts
- [ ] Form reset functionality
- [ ] Unsaved changes confirmation

### 10.2 State Management
**⚠️ ISSUES:**
- [ ] Local state can drift from server state
- [ ] No centralized state management
- [ ] Props drilling in some components

### 10.3 Data Synchronization
**❌ MISSING:**
- [ ] WebSocket for real-time updates
- [ ] Polling strategy for long-running operations
- [ ] Conflict resolution for concurrent edits

---

## 11. SECURITY — FUNCTIONAL

### 11.1 Input Security
**❌ MISSING:**
- [ ] Input sanitization (XSS prevention)
- [ ] SQL injection prevention (parameterized queries on API)
- [ ] CSRF tokens on forms

### 11.2 Data Protection
**✅ GOOD:**
- [x] No sensitive data in localStorage
- [x] Auth tokens in httpOnly cookies

**❌ MISSING:**
- [ ] Content Security Policy
- [ ] Activity logging (audit trail)

---

## 12. API ENDPOINTS — VERIFICATION NEEDED

Verify these endpoints exist and work:

### 12.1 User Management
- [x] `GET /api/admin/users`
- [x] `GET /api/admin/users?search=&page=&limit=`
- [ ] `PATCH /api/admin/users/[id]` (update user)
- [ ] `POST /api/admin/users/[id]/suspend` (suspend)

### 12.2 Campaigns
- [x] `GET /api/admin/campaigns`
- [x] `POST /api/admin/campaigns` (create)
- [x] `PATCH /api/admin/campaigns/[id]` (update)
- [ ] `DELETE /api/admin/campaigns/[id]` (delete)

### 12.3 Deposits
- [x] `GET /api/admin/deposits`
- [x] `POST /api/admin/deposits/scan`
- [x] `POST /api/admin/deposits/backfill`
- [ ] `POST /api/admin/deposits/[id]/approve`

### 12.4 Payouts
- [x] `GET /api/payouts`
- [x] `GET /api/payouts?stats=true`
- [ ] `POST /api/payouts/[id]/approve`
- [ ] `POST /api/payouts/[id]/retry`

### 12.5 Tasks
- [x] `GET /api/admin/tasks`
- [x] `POST /api/admin/tasks`
- [x] `PATCH /api/admin/tasks/[id]`
- [x] `DELETE /api/admin/tasks/[id]`

### 12.6 Other
- [x] `GET /api/admin/balance`
- [x] `GET /api/admin/verify`
- [x] `GET /api/admin/config`
- [x] `POST /api/admin/config`

---

## 🎯 PRIORITY ORDER (Functional Only)

### Week 1 — Critical Data Handling
1. [ ] Add error handling to ALL API calls (try/catch + user feedback)
2. [ ] Add form validation (client + server errors)
3. [ ] Add debouncing to search inputs
4. [ ] Fix pagination on deposits and payouts

### Week 2 — CRUD Completeness
5. [ ] Complete User Detail Modal (edit, suspend)
6. [ ] Add Delete operations (campaigns, tasks)
7. [ ] Add Bulk actions (approve, reject)
8. [ ] Add Export to CSV (users, deposits, payouts)

### Week 3 — Edge Cases & Performance
9. [ ] Add data validation schemas (zod)
10. [ ] Add optimistic updates
11. [ ] Add request caching (React Query)
12. [ ] Handle all edge cases (empty, malformed, timeout)

---

## 🧪 FUNCTIONAL TESTING CHECKLIST

### Data Operations
- [ ] Create campaign → Verify in DB
- [ ] Update campaign → Changes persist after refresh
- [ ] Search users → Results match query
- [ ] Pagination → Next/previous pages work
- [ ] Sort → Data reorders correctly

### Error Scenarios
- [ ] API returns 500 → User sees error message
- [ ] Network offline → Appropriate error shown
- [ ] Validation error → Field-level messages shown
- [ ] Session expired → Redirects to login

### Edge Cases
- [ ] Empty database → "No data" message (not crash)
- [ ] 10,000 users → Pagination still works
- [ ] Special characters in search → No XSS
- [ ] Concurrent edits → Last write wins (or conflict shown)

### Security
- [ ] Non-admin access → 403 forbidden
- [ ] SQL injection attempt → Sanitized/escaped
- [ ] XSS attempt → Scripts not executed

---

## 📞 QUESTIONS FOR PRODUCT/BACKEND

1. **Soft delete or hard delete** for campaigns?
2. **User suspend** — temporary or permanent? Can they unsuspend?
3. **Payout approval** — single approver or multi-sig?
4. **Audit logging** — do we need to track who changed what?
5. **Real-time updates** — polling interval or WebSocket?
6. **Export limits** — max rows per CSV export?

---

## 📝 NOTES FOR DUDU

**What's Working Well:**
- Clean API integration patterns
- Proper TypeScript interfaces
- Good separation of concerns

**Biggest Gaps:**
1. Error handling (biggest issue)
2. Form validation (user can submit invalid data)
3. Edge cases (empty states, timeouts)

**Recommended Approach:**
1. Start with error handling utility/wrapper
2. Add validation to one form (campaigns), then copy pattern
3. Test edge cases with empty database

**Files to Focus On:**
- All `page.tsx` files need error handling
- All form components need validation
- `DataTable.tsx` needs debouncing

Good luck! Focus on making it robust, not pretty. 🚀
