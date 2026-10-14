---
name: regression-testing
description: Systematic protocol and automated verification test harnesses to verify that existing CRM, telephony, RBAC, mobile sync, and data pipeline functionalities have not broken, degraded, or changed behavior after new code or migrations are introduced.
---

# Regression Testing & Behavioral Invariance Protocol

This skill encodes the mandatory verification workflow for confirming that **no previous functionality has broken, degraded, or behaved differently** after building new features, refactoring code, or migrating database schemas.

Whenever you build, migrate, or refactor something in Heeyaku (e.g., adding Multi-Tenancy or Super Admin), **you MUST execute this protocol before declaring the work complete**.

---

## 1. The Core Invariance Rule

> **The Behavioral Invariance Principle:**  
> A new feature must be strictly **additive or non-destructive**. Existing endpoints, server actions, mobile telemetry syncs, and RBAC boundaries must continue to accept existing payloads and return identical response contracts unless an explicit breaking change was ordered by the user.

```
       [ Proposed Code Change / Migration ]
                         │
                         ▼
        ┌──────────────────────────────────┐
        │  PHASE 1: Blast Radius Analysis  │
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │  PHASE 2: Typecheck & Static Lints│  npx tsc --noEmit
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │  PHASE 3: End-to-End Test Suites │  npx tsx scripts/test-prod-readiness.ts
        └────────────────┬─────────────────┘  npx tsx scripts/test-all-integrations-security.ts
                         │
                         ▼
        ┌──────────────────────────────────┐
        │  PHASE 4: 6-Dimension Invariance │  Verify contracts, mobile app, and DB
        └────────────────┬─────────────────┘
                         │
                         ▼
              [ VERIFIED ZERO REGRESSION ]
```

---

## 2. The 6-Dimension Functional Invariance Checklist

Every change must be audited against these 6 core subsystems of Heeyaku:

### Dimension 1: Authentication & Session Integrity
- [ ] **Web Admin Session:** Does Clerk authentication still resolve properly in [`lib/auth/rbac.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/auth/rbac.ts)? Does `getAuthenticatedUser()` return the correct role (`CEO`, `HR`, `TEAM_LEAD`)?
- [ ] **Mobile JWT Authentication:** Does [`/api/employee/auth/login`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/employee/auth/login/route.ts) still accept Employee Code / Email + Password and return a valid signed JWT?
- [ ] **Identity Resolver:** Does [`resolveEmployeeIdentity()`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/employee/resolve.ts) still correctly map mobile tokens to active database employees across all IDs?
- [ ] **Role Simulation:** Does the CEO role simulation cookie (`heeyaku_simulated_role`) still function for testing HR, TL, and BDA views?

### Dimension 2: RBAC & Tenant / Squad Boundary Protection
- [ ] **CEO Omni-Access:** Can the CEO still access all squads, employees, leads, and executive reports?
- [ ] **HR Lead Isolation:** Is HR **strictly blocked** (`403 Forbidden`) from viewing customer leads, exporting leads, and viewing unmasked customer phone numbers?
- [ ] **Team Lead Squad Isolation:** Can a Team Lead view **only** leads and BDAs belonging to their assigned squad? Are foreign squad leads invisible?
- [ ] **BDA Mobile Isolation:** Can a BDA access **only** their assigned leads and their own call logs via the mobile API?

### Dimension 3: Leads CRM Pipeline & Data Normalization
- [ ] **Lead Creation & Dedup:** Does creating a lead still normalize phone numbers to `phoneDigits` (last 10 digits)?
- [ ] **Unique Lead Code:** Are lead codes generated cleanly in `LD-XXXXX` format without colliding or throwing Prisma `P2002` errors?
- [ ] **Pipeline Stage Integrity:** Does changing a lead's status (e.g. from `NEW` to `ASSIGNED` or `CONTACTED`) preserve existing notes and update timestamps?
- [ ] **Lead Auto-Assignment:** Does bulk auto-assignment (`autoAssignLeadsAction`) still distribute unassigned leads cleanly across squad BDAs without double-assigning?
- [ ] **Lead Export:** Does `/api/admin/leads/export` still generate valid Excel XLSX and CSV binary downloads?

### Dimension 4: Telephony Telemetry & Android Call Sync
- [ ] **Call Log Ingestion:** Does [`/api/employee/calls/sync`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/employee/calls/sync/route.ts) accept call batches from the mobile app without failing?
- [ ] **Connected Call Gate:** Is a BDA strictly prevented from dispositioning a lead as `CONTACTED` or `INTERESTED` unless a verified connected call (`durationSeconds > 0`) exists?
- [ ] **Prospect Promotion:** When a call outcome is marked `INTERESTED`, `CALL_BACK`, or `FOLLOW_UP`, does the lead still automatically:
  1. Flag `isProspect = true`?
  2. Record `promotedToProspectAt`?
  3. Reassign to the squad's Team Lead for closing?
- [ ] **Contract Compatibility:** Did the JSON response shape of `/api/employee/leads` or `/api/employee/calls/sync` change? **Never remove or rename response fields** that the React Native Android app (`CallTrackerAndroid`) expects.

### Dimension 5: Database Transactions, Connection Pooling & Indexes
- [ ] **PgBouncer Pooling:** Are database queries running without connection pool starvation? Is `connection_limit` properly configured?
- [ ] **Transaction Atomicity:** Do multi-write operations (auto-assignment, batch lead imports) execute inside `prisma.$transaction` so that partial failures roll back completely?
- [ ] **Cascade Deletion Safety:** When an employee or team is updated or offboarded, are historical call logs and customer leads preserved (e.g. `onDelete: SetNull` or soft-delete) rather than accidentally deleted?

### Dimension 6: UI Component & Hydration Invariance
- [ ] **Next.js 16 SSR & Layouts:** Do `/admin/dashboard`, `/admin/leads`, and `/admin/employees` load without React 19 hydration errors or infinite redirect loops?
- [ ] **Dialogs & Forms:** Do `CreateEmployeeDialog`, `CreateLeadDialog`, and `SyncSheetDialog` open, validate inputs, show pending states, and close on success?
- [ ] **Cache Invalidation:** Are `revalidatePath('/admin/leads')` and `revalidatePath('/admin/dashboard')` triggered after mutations so the UI updates immediately?

---

## 3. Automated Test Execution Suite

Before declaring any task or migration complete, run the project's automated verification suites using the `run_command` tool:

### 1. TypeScript Strict Static Verification
```powershell
npx tsc --noEmit
```
* **Pass Criteria:** Exit code `0` with **0 errors**. No `any` type escapes that mask broken property accesses.

### 2. Pre-Production Comprehensive Readiness Suite
```powershell
npx tsx scripts/test-prod-readiness.ts
```
* **Covers:** CORS preflights, public lead intake, mobile login & auth, mobile call sync, connected call disposition gates, admin server actions, RBAC boundaries, and Excel export binary generation.
* **Pass Criteria:** All test sections report `✅ [PASS]` with `0 failures`.

### 3. Full Integration & Security Boundary Suite
```powershell
npx tsx scripts/test-all-integrations-security.ts
```
* **Covers:** 41+ automated security and integration assertions including BOLA cross-squad leakage, HR PII masking, employee password resets, and Google Sheets sync authentication.
* **Pass Criteria:** `41 / 41 Test Assertions Passed (0 Failures)`.

### 4. Mobile Sync & Prospect Escalation Suite
```powershell
npx tsx scripts/test-mobile-sync-prospect.ts
npx tsx scripts/test-tl-prospect-workflow.ts
```
* **Covers:** Telephony sync batching, prospect promotion flags, and Team Lead reassignments.
* **Pass Criteria:** All assertions report `✅ [PASS]`.

---

## 4. Multi-Tenant Backward Compatibility Rule

When implementing Multi-Tenancy (the `Company` model and Super Admin):

1. **Default Tenant Fallback (Zero Data Orphanage):**  
   Every existing query must handle records where `companyId` might temporarily be null or default to `"Heeyaku Primary"`. Existing single-tenant records must NEVER be hidden or orphaned.
2. **Environment Variable Fallback:**  
   If `ADMIN_EMAIL` is set in `.env`, the root CEO must continue to have uninterrupted omni-access to their existing workspace even before company switching is configured.
3. **Additive Endpoints:**  
   New Super Admin endpoints (`/super-admin/*`) must live on their own routes and must never alter the URL structures or HTTP status codes of existing `/admin/*` routes.
4. **Mobile Token Backward Compatibility:**  
   If an existing mobile JWT does not yet contain a `companyId` claim, `resolveEmployeeIdentity()` must resolve the employee's `companyId` from the database relation without rejecting the token.

---

## 5. Failure Protocol (What to do if something behaves differently)

If an automated test fails or a previously working page displays an error:
1. **Stop immediately:** Do not push additional changes on top of a broken state.
2. **Consult [`durable-problem-solving`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/.agents/skills/durable-problem-solving/SKILL.md):** Trace the symptom to the root cause. Ask why the contract changed.
3. **Compare Git Diff:** Use `git diff <file>` to inspect the exact lines altered. Identify whether a query filter was accidentally widened, a property was renamed, or a middleware matcher was modified.
4. **Restore Invariant:** Fix the code to preserve the original behavior while accommodating the new feature.
5. **Re-run the Suite:** Re-execute `npx tsx scripts/test-prod-readiness.ts` until all assertions pass cleanly.
