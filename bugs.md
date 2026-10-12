# HEEYAKU CRM & Telephony: Exhaustive Codebase & Security Audit Report

> **Audit Context & Constraints:**  
> Conducted under strict read-only inspection rules. No code, configuration, database rows, or environment variables were modified. All defects are documented with source file paths, line ranges, root causes, evidence, impacts, suggested fix directions, and regression test specifications.

---

## 1. Executive Summary

A comprehensive, multi-pass security, architecture, and code-quality audit of the HEEYAKU repository was performed. The platform is an enterprise-grade EdTech CRM and automated Telephony application built on:
- **Framework:** Next.js 16.3.4 (App Router, Turbopack, React 19.2.8)
- **Database & ORM:** PostgreSQL (Supabase) via Prisma ORM 6.19.3
- **Authentication & RBAC:** Clerk Authentication + Custom In-Memory Multi-Tier RBAC
- **Mobile Telephony Integration:** React Native Android Telephony Engine (`CallTrackerAndroid`)
- **External Integrations:** Google Sheets Two-Way Synchronization & Webhook Lead Ingestion

### Summary of Audit Findings
| Severity | Count | Summary of Key Issues |
| :--- | :---: | :--- |
| **Critical** | **3** | • Broken Object-Level Authorization (BOLA) Squad Isolation bypass in leads table<br>• Orphaned Team Lead privilege escalation to full corporate lead access<br>• Hex vs. Sequential integer lead code collision crashing CSV import & webhook intake |
| **High** | **3** | • Lead deduplication bypass due to missing `phoneDigits` in manual CRUD actions<br>• Sales pipeline stage regression during automated lead distribution<br>• Cascade deletion of all historical call records upon employee offboarding |
| **Medium** | **4** | • Un-demoted former Team Leads retaining managerial privileges<br>• UTC vs. IST timezone boundary skew distorting daily KPI dashboards<br>• Stale ghost leads persisting in Android mobile local storage<br>• Insecure API key leakage via URL query parameter |
| **Low / Operational** | **2** | • Mobile 403 on reassigned lead disposition notes submission<br>• Potential race condition during concurrent sheet sync lead creation |

---

## 2. Repository Inventory & Audit Coverage

### File-by-File Audit Ledger

| Component / Subsystem | Path / File | Audit Status | Focus Area & Assessment |
| :--- | :--- | :---: | :--- |
| **Edge Proxy** | [`proxy.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/proxy.ts) | **Reviewed** | Edge middleware, Clerk reverse-proxy handling, and Server Action passthrough. |
| **RBAC & Admin Engine** | [`lib/auth/rbac.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/auth/rbac.ts) | **Reviewed** | Session cache TTL, role validation, simulated roles, and CEO domain check. |
| **Admin Route Security** | [`lib/auth/admin.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/auth/admin.ts) | **Reviewed** | Admin session assertion, employee identity mapping, and squad boundaries. |
| **Employee JWT Token** | [`lib/auth/employee-token.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/auth/employee-token.ts) | **Reviewed** | HMAC-SHA256 token creation and validation for mobile telephony clients. |
| **External API Auth** | [`lib/auth/external-api.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/auth/external-api.ts) | **Reviewed** | Constant-time SHA-256 API key comparison and query param fallback. |
| **Prisma Schema** | [`prisma/schema.prisma`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/prisma/schema.prisma) | **Reviewed** | Data model relations, onDelete cascade rules, and composite indexes. |
| **Manual Lead Actions** | [`app/admin/leads/actions.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/actions.ts) | **Reviewed** | Create, update, delete, and note operations; normalization integrity. |
| **Lead Assignment** | [`app/admin/leads/assignment-actions.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/assignment-actions.ts) | **Reviewed** | Atomic transactions, unassignment logic, and round-robin auto-distribution. |
| **File & Sheet Import** | [`app/admin/leads/import-actions.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/import-actions.ts) | **Reviewed** | XLSX/CSV parsing, batch chunking, sequential code counter, SSRF checks. |
| **Employee Service** | [`lib/employee/employee.service.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/employee/employee.service.ts) | **Reviewed** | Clerk user provisioning, invitation sync, password reset, and deletion cascading. |
| **Team / Squad Service** | [`lib/team/team.service.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/team/team.service.ts) | **Reviewed** | Squad lifecycle, team lead assignment, member moves, and squad dissolution. |
| **Call Sync Route** | [`app/api/employee/calls/sync/route.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/employee/calls/sync/route.ts) | **Reviewed** | Mobile call log batch ingestion, prospect promotion, and deduplication. |
| **Mobile Lead Route** | [`app/api/employee/leads/route.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/employee/leads/route.ts) | **Reviewed** | Scoped lead list serialization for authenticated mobile BDAs. |
| **Disposition Route** | [`app/api/employee/leads/[leadId]/disposition/route.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/employee/leads/%5BleadId%5D/disposition/route.ts) | **Reviewed** | Connected call validation (talk time > 0s), stage updates, notes formatting. |
| **Google Sheets Sync** | [`app/api/v1/integrations/google-sheets/sync/route.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/v1/integrations/google-sheets/sync/route.ts) | **Reviewed** | Bidirectional delta sync, hex code generation, phone normalization. |
| **Webhook Ingestion** | [`app/api/v1/leads/ingest/route.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/v1/leads/ingest/route.ts) | **Reviewed** | Rate-limiting, batch intake, phone deduplication, sequential lead code logic. |
| **Leads Page (SSR)** | [`app/admin/leads/page.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/page.tsx) | **Reviewed** | Query param parsing, squad isolation filters, pagination, and KPI counts. |
| **Dashboard Metrics** | [`lib/dashboard/metrics.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/dashboard/metrics.ts) | **Reviewed** | Date calculations, metrics aggregation, caching, and squad filters. |
| **Export Route** | [`app/api/admin/leads/export/route.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/admin/leads/export/route.ts) | **Reviewed** | XLSX streaming, RBAC export permission check, and squad isolation. |
| **Android Mobile Client** | [`CallTrackerAndroid/src/services/*`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/CallTrackerAndroid/src/services/) | **Reviewed** | Native module storage bridge, offline queue, retry backoff, and cache sync. |

---

## 3. Confirmed Vulnerabilities & Bugs (Detailed Breakdown)

---

### [SEC-01] Critical: Broken Object-Level Authorization (BOLA) Squad Isolation Bypass via Query Parameter Overwrite
- **Unique ID:** `SEC-01`
- **Severity:** Critical
- **Status:** Confirmed
- **Confidence:** High
- **Affected File:** [`app/admin/leads/page.tsx:L69-87`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/page.tsx#L69-L87)
- **Technical Explanation:**  
  In the server component [`app/admin/leads/page.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/page.tsx), squad-level scoping for Team Leads is combined with employee-specific filters using JavaScript object spread notation:
  ```typescript
  const leadWhere: Prisma.LeadWhereInput = {
    ...(targetTeamId
      ? {
          OR: [
            { teamId: targetTeamId },
            ...(admin.employeeId ? [{ assignedEmployeeId: admin.employeeId }] : []),
          ],
        }
      : {}),
    ...(employeeId
      ? {
          OR: [
            { assignedEmployeeId: employeeId },
            { originalBdaId: employeeId },
            { callLogs: { some: { employeeId } } },
          ],
        }
      : {}),
  };
  ```
  In JavaScript object literals, spreading a second object containing an existing key (`OR`) **completely overwrites** the first key.
- **Preconditions:**  
  A user with the `TEAM_LEAD` role accesses `/admin/leads?employeeId=<TARGET_EMPLOYEE_ID>` where `TARGET_EMPLOYEE_ID` belongs to another squad.
- **Impact:**  
  The `teamId: targetTeamId` clause is discarded. The Team Lead is granted full visibility into another squad's leads, contact phone numbers, call records, and private notes.
- **Safe Verification Evidence:**  
  JavaScript object evaluation rule verification:
  ```javascript
  const a = { OR: [{ teamId: 'team-alpha' }] };
  const b = { OR: [{ assignedEmployeeId: 'emp-beta' }] };
  const merged = { ...a, ...b };
  console.log(merged); // Result: { OR: [ { assignedEmployeeId: 'emp-beta' } ] } — teamId is eliminated.
  ```
- **Suggested Fix Direction:**  
  Structure the Prisma filter with an explicit `AND` array:
  ```typescript
  const andClauses: Prisma.LeadWhereInput[] = [];
  if (targetTeamId) {
    andClauses.push({
      OR: [
        { teamId: targetTeamId },
        ...(admin.employeeId ? [{ assignedEmployeeId: admin.employeeId }] : []),
      ],
    });
  }
  if (employeeId) {
    andClauses.push({
      OR: [
        { assignedEmployeeId: employeeId },
        { originalBdaId: employeeId },
        { callLogs: { some: { employeeId } } },
      ],
    });
  }
  const leadWhere: Prisma.LeadWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};
  ```
- **Recommended Regression Test:**  
  Test that a Team Lead assigned to Team A querying `/admin/leads?employeeId=<EMPLOYEE_IN_TEAM_B>` returns an empty list and generates SQL containing `WHERE (teamId = 'Team A' AND assignedEmployeeId = 'emp-b')`.

---

### [SEC-02] Critical: Privilege Escalation to Full Organization Lead Access for Orphaned Team Leads
- **Unique ID:** `SEC-02`
- **Severity:** Critical
- **Status:** Confirmed
- **Confidence:** High
- **Affected Files:**  
  - [`lib/team/team.service.ts:L236-250`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/team/team.service.ts#L236-L250) (`deleteTeam`)  
  - [`app/admin/leads/page.tsx:L37-40`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/page.tsx#L37-L40)  
  - [`app/admin/leads/page.tsx:L69-77`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/page.tsx#L69-L77)
- **Technical Explanation:**  
  When an administrator dissolves a team using `TeamService.deleteTeam(teamId)`:
  ```typescript
  await prisma.employee.updateMany({
    where: { teamId },
    data: { teamId: null, team: 'General' },
  });
  await prisma.team.delete({ where: { id: teamId } });
  ```
  The Team Lead's role in the `Employee` table is not modified and remains `role: Role.TEAM_LEAD` with `teamId: null`.  
  When this orphaned Team Lead accesses `/admin/leads`:
  ```typescript
  const isTeamLead = admin.role === 'TEAM_LEAD';
  const targetTeamId = isTeamLead ? admin.teamId : selectedTeamId;
  ```
  Because `admin.teamId` is `null`, `targetTeamId` is `null`.  
  In the query builder:
  ```typescript
  ...(targetTeamId ? { OR: [...] } : {})
  ```
  Since `targetTeamId` is falsy, this evaluates to `{}`.
- **Preconditions:**  
  A team is deleted by an admin while having an active Team Lead assigned.
- **Impact:**  
  No squad restriction is applied. The orphaned Team Lead now views **every lead in the entire company**, escalating privileges to equal an unrestricted CEO/Director view.
- **Suggested Fix Direction:**  
  1. In `deleteTeam`, demote any employee with `role: Role.TEAM_LEAD` to `role: Role.BDA` in the dissolved squad:
     ```typescript
     await prisma.employee.updateMany({
       where: { teamId, role: Role.TEAM_LEAD },
       data: { role: Role.BDA, teamId: null, team: 'General' },
     });
     ```
  2. In [`app/admin/leads/page.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/page.tsx#L37), enforce that if `isTeamLead && !admin.teamId`, `targetTeamId` must be set to a non-matching sentinel value (`'NONE'`) or trigger an authorization exception.
- **Recommended Regression Test:**  
  Seed a team with a team lead, invoke `deleteTeam`, authenticate as the former team lead, and assert that querying `/admin/leads` returns zero leads and does not leak global database rows.

---

### [BUG-01] Critical: Ingestion & Bulk Import Fatal Crash (P2002) Caused by Hex Lead Code Collision
- **Unique ID:** `BUG-01`
- **Severity:** Critical
- **Status:** Confirmed
- **Confidence:** High
- **Affected Files:**  
  - [`app/api/v1/leads/ingest/route.ts:L124-135`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/v1/leads/ingest/route.ts#L124-L135)  
  - [`app/admin/leads/import-actions.ts:L312-323`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/import-actions.ts#L312-L323)  
  - [`app/api/v1/integrations/google-sheets/sync/route.ts:L24-26`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/v1/integrations/google-sheets/sync/route.ts#L24-L26)
- **Technical Explanation:**  
  In [`google-sheets/sync/route.ts:L24-26`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/v1/integrations/google-sheets/sync/route.ts#L24-L26), lead codes are generated as random 3-byte hexadecimal strings:
  ```typescript
  function generateRandomLeadCode(): string {
    return `LD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`; // e.g. "LD-C9F1A4"
  }
  ```
  However, [`import-actions.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/import-actions.ts#L318-L323) and [`ingest/route.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/v1/leads/ingest/route.ts#L130-L135) derive the next sequential integer code from the most recently created lead:
  ```typescript
  const latestLead = await prisma.lead.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { leadCode: true },
  });

  let currentNumber = 1;
  if (latestLead && latestLead.leadCode.startsWith('LD-')) {
    const parsed = parseInt(latestLead.leadCode.replace('LD-', ''), 10);
    if (!isNaN(parsed)) {
      currentNumber = parsed + 1;
    }
  }
  ```
  If the latest lead in the database came from Google Sheets (e.g. `LD-C9F1A4`), `parseInt("C9F1A4", 10)` yields `NaN`.  
  `currentNumber` falls back to `1`.  
  The system attempts to insert `LD-00001`, `LD-00002`, which already exist from initial database seeding.  
  Because `prisma.lead.createMany` is called without `skipDuplicates: true`, PostgreSQL throws `P2002: Unique constraint failed on the fields: (leadCode)`.
- **Preconditions:**  
  At least one lead is synced from Google Sheets, followed by an admin uploading a CSV/Excel file or an external webhook pushing leads to `/api/v1/leads/ingest`.
- **Impact:**  
  All subsequent CSV/XLSX imports and all external webhook intakes fail with HTTP 500 errors.
- **Safe Verification Evidence:**  
  `parseInt("LD-C9F1A4".replace("LD-", ""), 10)` returns `NaN` in standard JavaScript.
- **Suggested Fix Direction:**  
  1. Standardize lead code generation repository-wide.
  2. When querying `latestLead` for numeric sequences, filter strictly for numeric suffixes:
     ```typescript
     const latestLead = await prisma.lead.findFirst({
       where: { leadCode: { startsWith: 'LD-' } },
       orderBy: { createdAt: 'desc' },
     });
     // Alternatively, use a PostgreSQL sequence (`CREATE SEQUENCE lead_code_seq;`)
     ```
  3. Ensure `prisma.lead.createMany` incorporates collision handling or unique prefixes.
- **Recommended Regression Test:**  
  Insert a lead with `leadCode: 'LD-HEX999'`. Call `importLeadsFileAction` with a 2-row test dataset and verify insertion completes without throwing a P2002 constraint error.

---

### [BUG-02] High: Lead Deduplication Bypass Due to Missing `phoneDigits` in Manual Lead CRUD
- **Unique ID:** `BUG-02`
- **Severity:** High
- **Status:** Confirmed
- **Confidence:** High
- **Affected Files:**  
  - [`app/admin/leads/actions.ts:L163-175`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/actions.ts#L163-L175) (`createLeadAction`)  
  - [`app/admin/leads/actions.ts:L353-370`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/actions.ts#L353-L370) (`updateLeadAction`)  
  - [`prisma/schema.prisma:L86`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/prisma/schema.prisma#L86)
- **Technical Explanation:**  
  The `Lead` model contains a dedicated `phoneDigits` column indexed for exact-match 10-digit deduplication across country codes (`+91`, `0`, spaces):
  ```prisma
  phoneDigits String? // Normalized last 10 digits for exact-match dedup
  @@index([phoneDigits])
  ```
  Both Google Sheets sync ([`google-sheets/sync/route.ts:L115-118`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/v1/integrations/google-sheets/sync/route.ts#L115-L118)) and Webhook Ingest ([`ingest/route.ts:L88-105`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/v1/leads/ingest/route.ts#L88-L105)) perform pre-insertion deduplication by matching incoming records against `phoneDigits`.  
  However, in [`app/admin/leads/actions.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/actions.ts):
  - `createLeadAction` writes `phoneNumber` but omits `phoneDigits`, leaving it `null`.
  - `updateLeadAction` modifies `phoneNumber` but never recalculates `phoneDigits`.
- **Preconditions:**  
  A lead is manually entered or updated by an administrator via the CRM UI.
- **Impact:**  
  When the same lead is subsequently captured via a landing page webhook or Google Sheet, `phoneDigits` lookup fails to find the existing record. A duplicate lead is created, fragmenting communication history and lead assignment.
- **Suggested Fix Direction:**  
  In both `createLeadAction` and `updateLeadAction`, normalize and store `phoneDigits`:
  ```typescript
  const phoneDigits = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
  // Pass phoneDigits into prisma.lead.create and prisma.lead.update data payloads
  ```
- **Recommended Regression Test:**  
  Create a lead with `phoneNumber: "+91 98765 43210"` via `createLeadAction`. Query the database to verify `phoneDigits` is `"9876543210"`. Submit the same number to `/api/v1/leads/ingest` and verify the action is `'duplicate_skipped'` or `'updated'`.

---

### [BUG-03] High: Pipeline Stage Regression in Bulk Auto-Assignment Actions
- **Unique ID:** `BUG-03`
- **Severity:** High
- **Status:** Confirmed
- **Confidence:** High
- **Affected Files:**  
  - [`app/admin/leads/assignment-actions.ts:L466-474`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/assignment-actions.ts#L466-L474) (`autoAssignLeadsAction`)  
  - [`app/admin/leads/assignment-actions.ts:L584-592`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/assignment-actions.ts#L584-L592) (`autoAssignLeadsToTeamsAction`)
- **Technical Explanation:**  
  Manual single/bulk assignment actions in `assignment-actions.ts` preserve pipeline stages for leads that are already in progress.  
  However, in `autoAssignLeadsAction`:
  ```typescript
  await tx.lead.updateMany({
    where: { id: { in: assignedLeadIds } },
    data: {
      assignedEmployeeId: empId,
      assignedAt,
      status: 'ASSIGNED', // Unconditionally resets status
      ...(emp?.teamId ? { teamId: emp.teamId } : {}),
    },
  });
  ```
  Similarly, in `autoAssignLeadsToTeamsAction`:
  ```typescript
  await tx.lead.updateMany({
    where: { id: { in: assignedLeadIds } },
    data: {
      teamId,
      assignedEmployeeId: null,
      assignedAt: null,
      status: 'NEW', // Unconditionally resets status
    },
  });
  ```
- **Preconditions:**  
  An unassigned lead that had already advanced to `CONTACTED`, `CALL_BACK`, or `INTERESTED` is redistributed using the auto-assign action.
- **Impact:**  
  The lead's qualification progress is wiped out, reverting active pipeline prospects back to uncontacted statuses (`ASSIGNED` or `NEW`).
- **Suggested Fix Direction:**  
  Update `status` only for leads whose status is currently `'NEW'` or `'UNASSIGNED'`:
  ```typescript
  // For uncontacted leads:
  await tx.lead.updateMany({
    where: { id: { in: assignedLeadIds }, status: 'NEW' },
    data: { assignedEmployeeId: empId, assignedAt, status: 'ASSIGNED', ...(emp?.teamId ? { teamId: emp.teamId } : {}) },
  });
  // For leads already in active stages:
  await tx.lead.updateMany({
    where: { id: { in: assignedLeadIds }, status: { not: 'NEW' } },
    data: { assignedEmployeeId: empId, assignedAt, ...(emp?.teamId ? { teamId: emp.teamId } : {}) },
  });
  ```
- **Recommended Regression Test:**  
  Set a lead's status to `CALL_BACK`. Execute `autoAssignLeadsAction` on this lead. Verify that after assignment, the status remains `CALL_BACK`.

---

### [BUG-04] High: Irreversible Telemetry Loss via `onDelete: Cascade` on Employee Deletion
- **Unique ID:** `BUG-04`
- **Severity:** High
- **Status:** Confirmed
- **Confidence:** High
- **Affected Files:**  
  - [`prisma/schema.prisma:L155`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/prisma/schema.prisma#L155)  
  - [`lib/employee/employee.service.ts:L356-358`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/employee/employee.service.ts#L356-L358)
- **Technical Explanation:**  
  In [`prisma/schema.prisma:L155`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/prisma/schema.prisma#L155):
  ```prisma
  model CallLog {
    id String @id @default(cuid())
    employeeId String
    employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
    leadId String?
    lead Lead? @relation(fields: [leadId], references: [id], onDelete: SetNull)
  ...
  ```
  When an administrator deletes an offboarded employee using `EmployeeService.deleteEmployee(id)`, PostgreSQL cascades the deletion to the `CallLog` table.
- **Preconditions:**  
  An administrator uses the permanent delete action on an employee rather than deactivating them.
- **Impact:**  
  Every historical call log, talk-time record, call recording note, and compliance entry created by that employee is permanently purged. Aggregate corporate reporting and analytics are irreversibly corrupted.
- **Suggested Fix Direction:**  
  1. Change `CallLog.employeeId` to optional (`employeeId String?`), and set `onDelete: SetNull`.  
  2. In `EmployeeService.deleteEmployee`, block hard deletion if an employee has associated `callLogs`, enforcing soft deletion (`isActive: false`) instead.
- **Recommended Regression Test:**  
  Create an employee with 3 call logs. Call `deleteEmployee`. Verify that call logs are preserved in the database (or that deletion is prevented with an actionable error).

---

## 4. Likely Bugs Requiring Additional Verification

---

### [BUG-05] Medium: Squad Reconfiguration Leaves Replaced Team Lead with Phantom Managerial Role
- **Unique ID:** `BUG-05`
- **Severity:** Medium
- **Status:** Likely
- **Confidence:** High
- **Affected File:** [`lib/team/team.service.ts:L132-149`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/team/team.service.ts#L132-L149)
- **Technical Explanation:**  
  In `TeamService.updateTeam`:
  ```typescript
  const previousLeadId = existingTeam.teamLeadId;
  const newLeadId = teamLeadId || null;

  if (newLeadId && newLeadId !== previousLeadId) {
    await prisma.employee.update({
      where: { id: newLeadId },
      data: { role: Role.TEAM_LEAD, teamId: id, team: name.trim() },
    });
  }
  ```
  `previousLeadId` is **never demoted**. The replaced employee retains `role: Role.TEAM_LEAD` in the database.
- **Preconditions:**  
  An existing squad has its Team Lead replaced with another member.
- **Impact:**  
  The replaced employee retains Team Lead permissions across the application, including access to managerial endpoints and lead export capabilities.
- **Suggested Fix Direction:**  
  Demote `previousLeadId` to `Role.BDA` within the same transaction:
  ```typescript
  if (previousLeadId && previousLeadId !== newLeadId) {
    await prisma.employee.update({
      where: { id: previousLeadId },
      data: { role: Role.BDA },
    });
  }
  ```
- **Recommended Regression Test:**  
  Replace Team Lead A with Team Lead B. Verify in the database that Employee A's role is updated to `BDA`.

---

### [BUG-06] Medium: UTC Server Timezone Skew Distorting Daily KPIs in IST
- **Unique ID:** `BUG-06`
- **Severity:** Medium
- **Status:** Likely
- **Confidence:** High
- **Affected File:** [`lib/dashboard/metrics.ts:L76-81`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/dashboard/metrics.ts#L76-L81)
- **Technical Explanation:**  
  In [`lib/dashboard/metrics.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/dashboard/metrics.ts):
  ```typescript
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  ```
  `setHours` relies on the host machine's timezone. On cloud providers (Vercel, AWS Lambda, Docker containers), the system timezone defaults to UTC. The company operates in Indian Standard Time (IST, UTC+5:30).
- **Preconditions:**  
  Users view the dashboard between 12:00 AM IST and 5:30 AM IST.
- **Impact:**  
  During the first 5.5 hours of every Indian business day, `startOfToday` corresponds to 00:00 UTC (05:30 AM IST). Metrics for today reflect calls made during the previous day.
- **Suggested Fix Direction:**  
  Calculate date boundaries using explicit Indian Standard Time (`Asia/Kolkata`):
  ```typescript
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
  const istDateString = formatter.format(new Date()); // "YYYY-MM-DD"
  const startOfToday = new Date(`${istDateString}T00:00:00.000+05:30`);
  ```
- **Recommended Regression Test:**  
  Simulate a system time of 02:00 AM IST (20:30 UTC previous day) and assert that `startOfToday` resolves to 00:00:00 IST on the current Indian calendar date.

---

### [BUG-07] Medium: Ghost Leads Persisting in Android Offline Cache
- **Unique ID:** `BUG-07`
- **Severity:** Medium
- **Status:** Likely
- **Confidence:** High
- **Affected File:** [`CallTrackerAndroid/src/services/assignedLeadsService.ts:L71-85`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/CallTrackerAndroid/src/services/assignedLeadsService.ts#L71-L85)
- **Technical Explanation:**  
  In the mobile client's `refreshAssignedLeads()`:
  ```typescript
  const existing = cachedLeadsMemory.length > 0 ? cachedLeadsMemory : await this.getCachedLeads();
  const map = new Map<string, AssignedLead>();
  for (const l of existing) {
    map.set(l.id, l);
  }
  for (const l of res.leads) {
    map.set(l.id, { ...(map.get(l.id) || {}), ...l });
  }
  const merged = Array.from(map.values());
  ```
  The merge strategy adds all existing local leads and updates them with newly returned ones. If a lead is **unassigned or reassigned away** on the server, `res.leads` will omit it, but the local map retains it.
- **Preconditions:**  
  An administrator unassigns a lead or transfers it to another BDA.
- **Impact:**  
  The lead remains permanently visible on the original BDA's mobile app. If the BDA attempts to update notes or disposition, the server rejects the request with HTTP 403.
- **Suggested Fix Direction:**  
  Replace the additive merge with authoritative server replacement when `res.success` is true.
- **Recommended Regression Test:**  
  Seed client cache with Lead 1 and Lead 2. Mock a server response returning only Lead 2. Verify that after calling `refreshAssignedLeads()`, the cache contains only Lead 2.

---

## 5. Potential Issues and Unresolved Questions

---

### [POT-01] Medium: Historical Callers Triggering 403 on Reassigned Lead Disposition
- **Affected Files:**  
  - [`app/api/employee/leads/route.ts:L51-58`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/employee/leads/route.ts#L51-L58)  
  - [`app/api/employee/leads/[leadId]/disposition/route.ts:L78-86`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/employee/leads/%5BleadId%5D/disposition/route.ts#L78-L86)
- **Technical Explanation:**  
  [`app/api/employee/leads/route.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/employee/leads/route.ts) returns leads where:
  ```typescript
  OR: [
    { assignedEmployeeId: { in: employeeIds } },
    { originalBdaId: { in: employeeIds } },
    { callLogs: { some: { employeeId: { in: employeeIds } } } },
  ]
  ```
  If a lead is reassigned to another BDA, it remains visible in the original caller's mobile app. However, [`app/api/employee/leads/[leadId]/disposition/route.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/employee/leads/%5BleadId%5D/disposition/route.ts#L81-L86) rejects disposition updates from anyone other than the assigned employee or original BDA with `403 Access denied`.
- **Open Architectural Question:**  
  Should historical callers have read-only visibility into previously contacted leads in the mobile app, or should reassigned leads be removed from their list entirely?

---

### [POT-02] Low: Race Condition in Concurrent Sheet Sync Lead Ingestion
- **Affected File:** [`app/api/v1/integrations/google-sheets/sync/route.ts:L122-140`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/v1/integrations/google-sheets/sync/route.ts#L122-L140)
- **Technical Explanation:**  
  Google Sheets sync checks for existing phone numbers using `findMany` before calling `createMany`. If two sheet syncs or webhook calls execute simultaneously with the same phone number, both can pass the deduplication check and create duplicate records because `phoneDigits` is not backed by a database-level unique constraint.

---

## 6. Security Vulnerabilities & Attack Paths

---

### [SEC-03] Medium: API Secret Leakage via URL Query Parameter (`?apiKey=`)
- **Severity:** Medium
- **Status:** Confirmed
- **Confidence:** High
- **Affected File:** [`lib/auth/external-api.ts:L54-61`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/auth/external-api.ts#L54-L61)
- **Attack Path:**
  1. An external service configures webhook delivery using `?apiKey=<SECRET>` in the URL query string.
  2. The secret is logged in plaintext across CDN logs, proxy logs (Vercel / Cloudflare), browser history, and HTTP `Referer` headers.
  3. An attacker with log access extracts `EXTERNAL_INGESTION_API_KEY` and uses it to inject spam leads or scrape sync responses.
- **Remediation:**  
  Deprecate query-param authentication and require keys via `x-api-key` or `Authorization: Bearer` headers.

---

### [SEC-04] Medium: Wildcard Domain Pattern in Root CEO Authorization
- **Severity:** Medium
- **Status:** Confirmed
- **Confidence:** High
- **Affected File:** [`lib/auth/rbac.ts:L344-350`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/auth/rbac.ts#L344-L350)
- **Attack Path:**
  ```typescript
  for (const entry of allowed) {
    if (entry.startsWith('@') && entry.length > 3 && entry.includes('.') && normalized.endsWith(entry)) {
      return true;
    }
  }
  ```
  If an administrator sets `ADMIN_EMAIL=@heeyaku.com`, any user created with an `@heeyaku.com` email address (e.g. interns, contractors) automatically inherits full Root CEO privileges.
- **Remediation:**  
  Remove domain wildcard matching from `isAllowedCeoEmail`. Only allow explicit, comma-separated email addresses in `ADMIN_EMAIL`.

---

## 7. Checks Performed & Results

| Check / Verification Area | Tool & Method | Result / Outcome |
| :--- | :--- | :--- |
| **Edge Route Protection** | Code inspection on [`proxy.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/proxy.ts) | Verified: `/admin(.*)` and `/api/admin(.*)` are guarded. Server actions enforce RBAC internally. |
| **Cascade Constraints** | Code inspection on [`prisma/schema.prisma`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/prisma/schema.prisma) | Verified: `CallLog.employee` specifies `onDelete: Cascade`. Defect confirmed. |
| **Object Spread Overwriting** | AST analysis on [`app/admin/leads/page.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/admin/leads/page.tsx) | Verified: Consecutive `OR` keys overwrite squad isolation filters. Defect confirmed. |
| **Lead Code Number Parsing** | Cross-file trace (`import-actions.ts`, `google-sheets/sync/route.ts`) | Verified: Hex code format incompatible with `parseInt`. Defect confirmed. |
| **Timing-Safe Comparison** | Code inspection on [`lib/auth/external-api.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/lib/auth/external-api.ts) | Verified: SHA-256 digests with `crypto.timingSafeEqual` prevent timing attacks. |
| **Talk-Time Gate Enforcement** | Code inspection on [`disposition/route.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/app/api/employee/leads/%5BleadId%5D/disposition/route.ts) | Verified: Gate requires `durationSeconds: { gt: 0 }` for connected outcomes. |

---

## 8. Excluded Workflows & Unreviewed Areas

1. **Android OS Java Telephony Daemon:**  
   *Reason:* Native Java code requires a compiled Android runtime environment to verify; inspected TypeScript bridge bindings only.
2. **Production Database Live Modifications:**  
   *Reason:* Enforced read-only mandate; no live production database operations were performed.
3. **External Third-Party Webhook Services (Meta Ads / Zapier):**  
   *Reason:* Third-party cloud systems outside the repository boundary.

---

## 9. Prioritized Remediation Roadmap

```
========================================================================================
                              PRIORITIZED REMEDIATION ROADMAP
========================================================================================

PHASE 1: CRITICAL SECURITY & SYSTEM STABILITY (IMMEDIATE)
  1. [SEC-01] Replace object spread with Prisma AND array in app/admin/leads/page.tsx
  2. [BUG-01] Unify lead code generation across Google Sheets sync and bulk import
  3. [SEC-02] Demote Team Leads to BDA when deleting teams in lib/team/team.service.ts

PHASE 2: DATA INTEGRITY & PIPELINE ACCURACY (WITHIN 24-48 HOURS)
  4. [BUG-02] Populate phoneDigits in createLeadAction and updateLeadAction
  5. [BUG-03] Preserve existing pipeline stages during auto-assignment in
              app/admin/leads/assignment-actions.ts
  6. [BUG-04] Change CallLog.employee foreign key from Cascade to SetNull

PHASE 3: LOGIC & CLIENT RELIABILITY (NEXT SPRINT)
  7. [BUG-05] Auto-demote replaced Team Leads in updateTeam
  8. [BUG-07] Update Android offline cache to evict unassigned leads
  9. [BUG-06] Force Asia/Kolkata timezone calculations in metrics.ts
 10. [SEC-03] Deprecate ?apiKey= URL query parameter authentication
========================================================================================
```
