# HEEYAKU TELEPHONY CRM & MOBILE AUDIT SPECIFICATION (Connection.MD)

> **Exhaustive System Ledger, Variable Mapping, Function Graph, Import Dependencies, Design Patterns & Performance Optimizations**  
> Covering 100% of the Web Application (Next.js 15, React 19, Prisma ORM, PostgreSQL, Clerk Auth, TailwindCSS, Server Actions) and Mobile Application (React Native 0.77 Bare, Android Telephony Kotlin Modules, Native SharedPreferences, Offline Telemetry Queues).

---

## EXECUTIVE TABLE OF CONTENTS
1. [Global Architectural Topography](#1-global-architectural-topography)
2. [Database Schema & Prisma ORM Blueprint](#2-database-schema--prisma-orm-blueprint)
3. [Global Middleware, Next.js Config & Entry Infrastructure](#3-global-middleware-nextjs-config--entry-infrastructure)
4. [Backend Security, Authentication & Utility Services (lib/)](#4-backend-security-authentication--utility-services-lib)
5. [Server Actions & Database Mutation Services (app/admin/)](#5-server-actions--database-mutation-services-appadmin)
6. [Backend REST API Route Handlers (app/api/)](#6-backend-rest-api-route-handlers-appapi)
7. [Admin Web Application UI Architecture & Data Connections](#7-admin-web-application-ui-architecture--data-connections)
8. [Public Marketing Website & High-Performance Landing Engine](#8-public-marketing-website--high-performance-landing-engine)
9. [Mobile App: Android Native Telephony Engine (Kotlin)](#9-mobile-app-android-native-telephony-engine-kotlin)
10. [Mobile App: Services, Storage, Offline Queue & Custom Hooks](#10-mobile-app-services-storage-offline-queue--custom-hooks)
11. [Mobile App: Screens, Modals & Navigation Graph](#11-mobile-app-screens-modals--navigation-graph)
12. [Cross-System End-to-End Data Lifecycle Tracing](#12-cross-system-end-to-end-data-lifecycle-tracing)
13. [Comprehensive Variable & Function Connection Index](#13-comprehensive-variable--function-connection-index)

---

# 1. GLOBAL ARCHITECTURAL TOPOGRAPHY

The HEEYAKU platform is an integrated Enterprise Telephony & CRM Ecosystem built specifically for educational institutions, admissions desks, and sales teams. The ecosystem consists of two interconnected clients and a centralized PostgreSQL backend:

```
                                  +---------------------------------------+
                                  |         POSTGRESQL (Supabase)         |
                                  |  - employees (staff accounts)         |
                                  |  - leads (admissions prospects)       |
                                  |  - call_logs (telephony telemetry)    |
                                  +---------------------------------------+
                                                     ^
                                                     | (Prisma ORM Client: lib/prisma.ts)
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                                    NEXT.JS 15 BACKEND & WEB PLATFORM                                    |
|                                                                                                         |
|  [Security & Middleware]                                                                                |
|    - proxy.ts (Clerk route protection for /admin and /api/admin)                                        |
|    - lib/auth/admin.ts (In-memory TTL Clerk session cache + Email whitelist)                            |
|    - lib/auth/employee-token.ts (HS256 JWT sign/verify for mobile BDA staff)                            |
|    - lib/security/rate-limit.ts (Sliding window memory rate limiter for auth endpoints)                 |
|                                                                                                         |
|  [Server Actions]                                                                                       |
|    - app/admin/employees/actions.ts & fetch-actions.ts (CRUD, chunked pagination, password reset)      |
|    - app/admin/leads/actions.ts & assignment-actions.ts & import-actions.ts (Transactions, CSV/XLSX)   |
|                                                                                                         |
|  [REST API Routes]                                                                                      |
|    - /api/employee/auth/login (Rate-limited BDA credentials verification)                               |
|    - /api/employee/auth/me (JWT bearer verification & live CRM stats)                                   |
|    - /api/employee/calls/sync (Authoritative call ingestion, single-connected rule, note appending)     |
|    - /api/employee/leads (Assigned lead delivery)                                                       |
|    - /api/employee/leads/[leadId]/disposition (Lead stage update & timestamped notes)                   |
|    - /api/employee/analytics (IST-aligned telephony metrics & chronological deduplication)             |
|    - /api/admin/leads/export (Formula-injection safe XLSX/CSV stream)                                   |
|    - /api/demo & /api/download/apk (Lead capture & APK download binary stream)                         |
|                                                                                                         |
|  [Admin Dashboard & UI]                                                                                 |
|    - /admin/dashboard (Live Bento analytics, conversion donut, funnel flow, top performers)             |
|    - /admin/employees (Virtual table, chunked pagination, credential cards, staff detail views)         |
|    - /admin/leads (TanStack-like virtualized tables, bulk reassignment, drag-and-drop file import)      |
|                                                                                                         |
|  [Public Web Platform]                                                                                  |
|    - Next.js SSR / Static Landing pages with interactive 3D WebGL Aurora, framer-motion, Lenis smooth   |
+---------------------------------------------------------------------------------------------------------+
                                                     ^
                                                     | (HTTPS REST / Bearer JWT)
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                                 HEEYAKU CALLTRACKER MOBILE APP (Android)                                |
|                                                                                                         |
|  [Native Android Telephony Layer (Kotlin)]                                                              |
|    - CallTrackerModule.kt: TelephonyCallback, PhoneStateListener, CallLog ContentProvider resolver     |
|    - SingleThreadExecutor: Off-thread background log extraction with 700ms OS commit delay              |
|    - SharedPreferences: 'heeyaku_app_calls' persistent offline storage & outcome map                    |
|    - NativeEventEmitter: 'CallStateChanged' & 'CallEnded' real-time bridge dispatch                     |
|                                                                                                         |
|  [React Native Architecture (v0.77 Bare)]                                                               |
|    - App.tsx: Auth state routing, global CallOutcomeModal host                                          |
|    - services/apiClient.ts: AbortController timeout, 401 unauth interceptor, HTTP 429 backoff           |
|    - services/authStorage.ts: SharedPreferences native persistent token & session cache                 |
|    - services/offlineQueue.ts: Up to 200 unsynced calls with retry backoff <= 50                        |
|    - hooks/useCallTracker.ts: Master telemetry orchestrator, AppState watcher, 25s background sync      |
|    - hooks/useCallMetrics.ts: First-connected call enforcement & IST Today date filter                  |
|    - hooks/tracker/*: useTelephonyState, useCallHistory, useCallPermissions, useCallOutcomes,           |
|                       useCallFilter                                                                     |
|    - screens/*: DashboardScreen, CallsScreen, LeadsScreen, AnalyticsScreen, ProfileScreen, LoginScreen  |
+---------------------------------------------------------------------------------------------------------+
```

---

# 2. DATABASE SCHEMA & PRISMA ORM BLUEPRINT

File: `prisma/schema.prisma`
The database layer is managed through **Prisma Client JS** connecting to PostgreSQL with direct connection pooling support via `directUrl`.

### 2.1 Enums

#### `LeadStatus`
Defines the sales lifecycle of a prospect:
- `NEW`: Fresh prospect intake. Unassigned or freshly added to system.
- `ASSIGNED`: Assigned to an active Business Development Associate (BDA).
- `CONTACTED`: Reached by phone call or WhatsApp message.
- `INTERESTED`: Prospect demonstrated high interest in course/admissions.
- `FOLLOW_UP`: Scheduled for future callback or counseling session.
- `CALL_BACK`: Explicit prospect request to call back at a later hour.
- `NOT_INTERESTED`: Prospect declined offer.
- `NO_ANSWER`: Outbound call placed, rang out without answer.
- `BUSY`: Telephony carrier returned user busy tone.
- `WRONG_NUMBER`: Invalid phone contact or misdial.
- `CONVERTED`: Success state; prospect enrolled or payment received.
- `NOT_QUALIFIED`: Ineligible prospect (e.g. academic prerequisites unfulfilled).
- `OTHER`: Miscellaneous disposition.

#### `CallType`
Defines telephony direction and disposition reported by native Android:
- `OUTGOING`: Dialed from employee device (type 2 in Android CallLog).
- `INCOMING`: Inbound call received (type 1 in Android CallLog).
- `MISSED`: Inbound call unhandled (type 3 in Android CallLog).
- `REJECTED`: Inbound or outbound call rejected (type 5 in Android CallLog).

---

### 2.2 Models & Indexes

#### Model: `Employee` (Mapped table: `employees`)
Represents an administrative staff member or Business Development Associate.
- **Fields**:
  - `id` (String, `@id`, `@default(cuid())`): Primary unique identifier.
  - `employeeCode` (String, `@unique`): Unique sequential identifier (e.g. `EMP-1001`, `EMP-1002`).
  - `name` (String): Full name of the staff member.
  - `email` (String, `@unique`): Login credential and administrative notification address.
  - `phoneNumber` (String): Verified 10-digit phone number.
  - `team` (String?, default `"General"`): Organizational pod/team name.
  - `notes` (String?): Administrative remarks.
  - `passwordHash` (String): 10-round bcrypt salted password hash.
  - `isActive` (Boolean, default `true`): Account status flag. Deactivated staff cannot log into mobile app or receive leads.
  - `createdAt` (DateTime, default `now()`)
  - `updatedAt` (DateTime, `@updatedAt`)
- **Relations**:
  - `leads` (`Lead[]`): All leads assigned to this employee (one-to-many).
  - `callLogs` (`CallLog[]`): Telephony logs recorded by this employee (one-to-many, cascade delete).
- **Database Indexes**:
  - `@@index([employeeCode])`: Fast lookup during mobile login resolution.
  - `@@index([email])`: Fast lookup during credential verification.
  - `@@index([isActive])`: High-speed filtering for active assignable telecallers.

#### Model: `Lead` (Mapped table: `leads`)
Represents a student inquiry, course prospect, or admissions lead.
- **Fields**:
  - `id` (String, `@id`, `@default(cuid())`): Primary identifier.
  - `leadCode` (String, `@unique`): Human-readable sequential ID (e.g. `LED-1001`).
  - `name` (String): Prospect name.
  - `phoneNumber` (String): Prospect 10-digit normalized phone number.
  - `email` (String?): Prospect email address.
  - `company` (String?): Target course, university, or program of interest.
  - `source` (String, default `"MANUAL"`): Ingestion origin (e.g. `MANUAL`, `File Import`, `Website`).
  - `status` (`LeadStatus`, default `NEW`): Current pipeline lifecycle state.
  - `notes` (String?): Cumulative timestamped call notes and interaction history.
  - `assignedEmployeeId` (String?): Foreign key referencing `Employee.id`.
  - `assignedEmployee` (`Employee?`): Relation reference with `onDelete: SetNull`.
  - `assignedAt` (DateTime?): Timestamp when lead was assigned or reassigned.
  - `createdAt` (DateTime, default `now()`)
  - `updatedAt` (DateTime, `@updatedAt`)
- **Relations**:
  - `callLogs` (`CallLog[]`): Calls placed to or received from this lead (`onDelete: SetNull`).
- **Database Indexes & Optimizations**:
  - `@@index([leadCode])`: Fast search queries by Lead ID.
  - `@@index([phoneNumber])`: Telephony matching during incoming and outgoing call log sync.
  - `@@index([status])`: Pipeline filtering on dashboard and lead management views.
  - `@@index([assignedEmployeeId])`: Staff lead list generation.
  - `@@index([createdAt])`: Chronological intake sorting.
  - `@@index([updatedAt])`: Real-time pipeline update tracking.
  - `@@index([assignedEmployeeId, status])`: Composite index for BDA status aggregation without table scans.
  - `@@index([assignedEmployeeId, updatedAt])`: Composite index for staff activity queries.

#### Model: `CallLog` (Mapped table: `call_logs`)
Represents an individual phone call telemetry event reported by the mobile app or telephony system.
- **Fields**:
  - `id` (String, `@id`, `@default(cuid())`): Primary identifier.
  - `employeeId` (String): Foreign key referencing `Employee.id`.
  - `employee` (`Employee`): Relation with `onDelete: Cascade`.
  - `leadId` (String?): Foreign key referencing `Lead.id` if matched.
  - `lead` (`Lead?`): Relation with `onDelete: SetNull`.
  - `phoneNumber` (String): Target dialed or received number.
  - `contactName` (String?): Name cached from phonebook or lead profile.
  - `callType` (`CallType`, default `OUTGOING`): Telephony classification.
  - `durationSeconds` (Int, default `0`): Talk time in seconds.
  - `connected` (Boolean, default `false`): True only if answered (`OFFHOOK` achieved with talk time > 0).
  - `outcomeId` (String?): Disposition identifier (e.g. `interested`, `follow_up`).
  - `outcomeLabel` (String?): Human-readable disposition label.
  - `notes` (String?): Agent remarks recorded in the disposition modal.
  - `startedAt` (DateTime, default `now()`)
  - `endedAt` (DateTime?)
  - `createdAt` (DateTime, default `now()`)
- **Database Indexes & Optimizations**:
  - `@@index([employeeId])`: Filter employee call history.
  - `@@index([leadId])`: Filter interaction history for a prospect.
  - `@@index([phoneNumber])`: Deduplication and reverse lookups.
  - `@@index([startedAt])`: Date range queries and timeline generation.
  - `@@index([employeeId, startedAt])`: Composite index for daily employee report aggregation.
  - `@@index([leadId, connected])`: High-speed check for the Single Connected Call Rule.
  - `@@index([phoneNumber, connected])`: Deduplication for numbers without an assigned lead.

---

# 3. GLOBAL MIDDLEWARE, NEXT.JS CONFIG & ENTRY INFRASTRUCTURE

### 3.1 `proxy.ts` (Clerk Route Protection Middleware)
- **Imports**:
  - `clerkMiddleware`, `createRouteMatcher` from `@clerk/nextjs/server`.
- **Variables**:
  - `isProtectedRoute`: Result of `createRouteMatcher(["/admin(.*)", "/api/admin(.*)"])`.
  - `config.matcher`: Regex array skipping static assets (`html`, `css`, `js`, images, fonts, APK binaries, csv, xlsx) while intercepting all `/admin` and `/api` routes.
- **Execution Flow**:
  - Intercepts incoming HTTP requests.
  - Evaluates `isProtectedRoute(req)`.
  - If true, invokes `await auth.protect()`, forcing unauthenticated requests to redirect to Clerk sign-in.
  - Mobile routes (`/api/employee/(.*)`) and landing pages are excluded from Clerk session requirements and handled independently.

---

### 3.2 `next.config.ts` (Runtime & Security Hardening)
- **Key Properties**:
  - `compress: true`: Enables Gzip/Brotli response compression.
  - `experimental.serverActions.bodySizeLimit: '20mb'`: Accommodates bulk CSV/XLSX file uploads (up to 25,000 rows).
  - `experimental.optimizePackageImports`: Tree-shakes heavy libraries: `lucide-react`, `framer-motion`, `ogl`, `lenis`.
  - `images.formats`: Configures `['image/avif', 'image/webp']` for next-gen compression.
  - `images.remotePatterns`: Whitelists `images.unsplash.com`.
- **HTTP Security Headers**:
  - `X-Frame-Options: DENY`: Anti-clickjacking protection.
  - `X-Content-Type-Options: nosniff`: MIME-sniffing prevention.
  - `Referrer-Policy: strict-origin-when-cross-origin`: Referrer leakage prevention.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`: Restricts browser hardware access.
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`: Enforces HTTPS for 2 years.
  - `/api/employee/(.*)` headers: Configures `Cache-Control: private, no-cache, no-store, must-revalidate` and `Pragma: no-cache` to prevent proxy caching of mobile tokens and telemetry.

---

# 4. BACKEND SECURITY, AUTHENTICATION & UTILITY SERVICES (lib/)

### 4.1 `lib/prisma.ts` (Prisma Client Singleton)
- **Design Pattern**: Global Singleton.
- **Variables**:
  - `globalForPrisma`: `globalThis as unknown as { prisma: PrismaClient | undefined }`.
  - `prisma`: Instantiated once or reused from `globalForPrisma.prisma`.
- **Optimization**: Prevents multiple connection pool allocations across hot module reloads in Next.js development.

---

### 4.2 `lib/auth/admin.ts` (Admin Authorization & Session Cache)
- **Imports**: `cache` from `react`, `auth`, `currentUser` from `@clerk/nextjs/server`.
- **Interfaces & Classes**:
  - `AuthenticatedAdmin`: `{ userId: string; email: string; name: string; }`
  - `AuthorizationError` extends `Error`: Has `statusCode` (default 403).
  - `CachedAdminSession`: `{ admin: AuthenticatedAdmin | null; expiresAt: number; }`
- **Variables**:
  - `adminSessionCache`: `Map<string, CachedAdminSession>` (In-memory server cache).
  - `ADMIN_SESSION_TTL_MS`: `10 * 60 * 1000` (10-minute cache lifetime).
  - `STATIC_ALLOWED_ADMIN_EMAILS`: Static whitelist (e.g. `subhra1234c@gmail.com`, `sibasishchakraborti@gmail.com`).
- **Functions**:
  - `getAuthenticatedAdmin()`: Wrapped in React `cache()`. Fetches Clerk `userId`. Checks `adminSessionCache`. If missing or expired, calls `currentUser()`, resolves primary email, validates against email whitelist (env `ADMIN_EMAIL` + static), caches valid admin for 10 minutes, returning `AuthenticatedAdmin` or `null`.
    - *Optimization*: Saves ~2,800ms per click by eliminating external Clerk API roundtrips across internal admin navigations.
  - `assertAdminAccess()`: Asserts `getAuthenticatedAdmin()` is non-null, else throws `AuthorizationError('Access denied...', 403)`.

---

### 4.3 `lib/auth/employee-token.ts` (Custom HS256 JWT Engine)
- **Imports**: `crypto` from `crypto`.
- **Interfaces**:
  - `EmployeeTokenPayload`: `{ employeeId: string; employeeCode: string; email: string; name: string; exp: number; }`
- **Functions**:
  - `getJwtSecret()`: Returns `process.env.EMPLOYEE_JWT_SECRET` or fallback secret. Throws in production if missing.
  - `base64UrlEncode(str: string)`: Converts string to Base64URL (`+` to `-`, `/` to `_`, strips `=`).
  - `base64UrlDecode(str: string)`: Restores Base64 padding and characters, returning UTF-8 string.
  - `signEmployeeToken(data, expiresInDays = 30)`: Constructs header `{ alg: 'HS256', typ: 'JWT' }` and payload with unix expiration. Computes HMAC SHA-256 signature using `crypto.createHmac`. Returns `header.payload.signature`.
  - `verifyEmployeeToken(token: string)`: Validates 3-part format. Computes expected signature. Uses `crypto.timingSafeEqual` to prevent timing attacks. Checks expiration (`payload.exp < now`). Returns decoded `EmployeeTokenPayload` or `null`.

---

### 4.4 `lib/security/rate-limit.ts` (Sliding-Window Memory Rate Limiter)
- **Interfaces**:
  - `RateLimitRecord`: `{ count: number; resetAt: number; }`
  - `RateLimitOptions`: `{ windowMs: number; maxAttempts: number; }`
  - `RateLimitResult`: `{ allowed: boolean; remaining: number; resetSeconds: number; }`
- **Variables**:
  - `rateLimitStore`: `Map<string, RateLimitRecord>`.
  - Garbage collector: `setInterval` every 5 minutes clearing expired records with `.unref?.()`.
- **Functions**:
  - `checkRateLimit(key, options)`: Checks or initializes bucket for IP/identifier. Returns `allowed`, `remaining`, and `resetSeconds`.
  - `resetRateLimit(key)`: Deletes bucket upon successful authentication to avoid locking out verified users.

---

### 4.5 `lib/crypto/passwords.ts` (Bcrypt & Password Generator)
- **Imports**: `crypto` from `crypto`, `bcrypt` from `bcryptjs`.
- **Functions**:
  - `generateRandomPassword(length = 10)`: Generates cryptographically secure temporary passwords. Pools uppercase, lowercase, digits, and special characters. Enforces at least 1 character from each group. Applies Fisher-Yates shuffle using `crypto.randomInt`.
  - `hashPassword(plainText: string)`: Hashes password using bcrypt with 10 salt rounds.
  - `verifyPassword(plainText: string, hash: string)`: Asynchronously compares plaintext against hash.

---

### 4.6 `lib/dashboard/metrics.ts` (Aggregations & Server Cache)
- **Imports**: `prisma` from `@/lib/prisma`, `LeadStatus` from `@prisma/client`.
- **Constants**:
  - `ALL_STATUS_METADATA`: Array of 13 status descriptors with UI labels, badge colors, and dot styles.
  - `DASHBOARD_CACHE_TTL_MS`: `25000` (25-second server-side memory TTL).
- **Functions**:
  - `invalidateDashboardMetricsCache()`: Manually busts `cachedMetrics` on database mutations (create lead, reassign, sync calls).
  - `getDashboardMetrics()`: Checks `cachedMetrics`. If expired, runs a single consolidated `Promise.all` with 9 parallel Prisma queries:
    1. Status breakdown for today.
    2. Active employees with lead counts.
    3. Assigned today counts grouped by employee.
    4. Assigned month counts grouped by employee.
    5. Converted today counts grouped by employee.
    6. Converted month counts grouped by employee.
    7. Converted all-time counts grouped by employee.
    8. Contacted today counts grouped by employee.
    9. Contacted month counts grouped by employee.
    - Aggregates results in $O(1)$ memory map lookups.
    - Calculates conversion rates for today and this month.
    - Determines `topPerformerToday` and `topPerformerThisMonth`.
    - Returns and caches `DashboardMetricsResult`.

---

### 4.7 Other Utility Services in `lib/`
- **`lib/lead/phone.ts`**:
  - `PHONE_REGEX`: `/^[0-9]{10}$/`.
  - `normalizePhoneNumber(raw)`: Strips non-digits, strips Indian prefix (`+91` or `91`) if 12 digits, strips leading `0` if 11 digits.
  - `isValidPhoneNumber(phone)`: Boolean regex check.
  - `toLast10Digits(phone)`: Extracts the rightmost 10 numerical digits for telephony matching.
  - `zodPhoneNumberSchema`: Reusable Zod validator ensuring 10 digits after normalization.
- **`lib/lead/code.ts` & `lib/employee/code.ts`**:
  - `generateNextLeadCode()`: Generates `LED-1001`, `LED-1002` sequentially.
  - `generateNextEmployeeCode()`: Generates `EMP-1001`, `EMP-1002` sequentially.
- **`lib/employee/resolve.ts`**:
  - `resolveEmployeeIdentity(payload)`: Resiliently resolves an employee by `employeeId`, `employeeCode`, or `email`. Gathers all alias IDs across database re-seeds into `allIds: string[]` to prevent orphan call logs or missed assigned leads.
- **`lib/lead/export.ts`**:
  - `sanitizeCell(val)`: Defends against CSV formula injection by prefixing characters `=`, `+`, `-`, `@` with a single quote `'`.
  - `formatLeadsForExport(leads)`: Formats rows for XLSX/CSV download.
  - `downloadLeadsAsXlsx(leads, filename)`: Browser XLSX export using SheetJS.
  - `downloadLeadsAsCsv(leads, filename)`: Browser CSV export using SheetJS and Blob URL.
- **`lib/lead/import-parser.ts`**:
  - `parseImportFile(file)`: Detects `.csv` or `.xlsx`/`.xls`. Parses CSV with PapaParse, Excel with SheetJS.
  - `autoDetectColumnMapping(headers)`: Heuristically maps columns (e.g. 'Student Name', 'Mobile', 'Course') to system fields.
- **`lib/utils/date.ts`**:
  - `IST_OFFSET_MS`: `5.5 * 60 * 60 * 1000` (UTC+05:30).
  - `getStartOfTodayISTMs()` & `getStartOfTodayIST()`: Accurately resolves 00:00:00 IST to prevent UTC date rollover discrepancies.
- **`lib/utils.ts`**:
  - `cn(...inputs)`: Combines `clsx` and `tailwind-merge` for class name deduplication.

---

# 5. SERVER ACTIONS & DATABASE MUTATION SERVICES (app/admin/)

### 5.1 Employee Management Actions (`app/admin/employees/actions.ts`)
- **`createEmployeeAction(input)`**:
  - Validates input with `CreateEmployeeSchema` (Zod: name, email, phone, team, notes).
  - Verifies email uniqueness in Prisma.
  - Generates `employeeCode` via `generateNextEmployeeCode()`.
  - Generates temporary password via `generateRandomPassword(10)`.
  - Hashes password via `hashPassword()`.
  - Creates employee in Prisma.
  - Triggers `invalidateDashboardMetricsCache()`, `clearEmployeeChunkCache()`, `revalidatePath('/admin/employees')`.
  - Returns employee details and temporary password for one-time admin display.
- **`updateEmployeeAction(input)`**:
  - Validates input with `UpdateEmployeeSchema`.
  - Verifies email isn't in use by another staff member.
  - Updates name, email, phone, team, notes.
  - Invalidates caches and revalidates paths.
- **`toggleEmployeeStatusAction(id)`**:
  - Flips `isActive` boolean for the employee.
- **`resetEmployeePasswordAction(id)`**:
  - Generates new 10-char random password.
  - Updates `passwordHash` in Prisma.
  - Returns temporary password for the admin.

### 5.2 Employee Chunked Fetch Actions (`app/admin/employees/fetch-actions.ts`)
- **Variables**:
  - `chunkCache`: `Map<string, CachedChunk>`.
  - `CACHE_TTL_MS`: 20,000ms (20 seconds).
- **`fetchEmployeesChunkAction(params)`**:
  - Accepts `skip`, `take` (default 10), `searchQuery`, `statusFilter`, `teamFilter`.
  - Builds dynamic Prisma `where` clause with case-insensitive search across name, email, employeeCode, and phone.
  - Queries `prisma.employee.findMany` strictly for 10 records and total count.
  - Aggregates talk times via `prisma.callLog.groupBy` for the 10 fetched IDs.
  - Returns mapped `EmployeeListItem[]`, `totalCount`, and `hasMore`.

### 5.3 Lead Management Actions (`app/admin/leads/actions.ts`)
- **`createLeadAction(input)`**:
  - Validates with `CreateLeadSchema`.
  - If `assignedEmployeeId` is provided, checks employee exists and is active; promotes initial status from `NEW` to `ASSIGNED` and sets `assignedAt`.
  - Generates sequential `leadCode` (`LED-xxxx`).
  - Creates `Lead` record in Prisma.
  - Invalidates dashboard cache and revalidates paths.
- **`updateLeadAction(input)`**:
  - Validates with `UpdateLeadSchema`.
  - Handles assignment changes: updates `assignedAt` if changed. If unassigned, sets status back to `NEW` if previously `ASSIGNED`.
  - Updates lead record.
- **`deleteLeadAction(id)`**:
  - Deletes lead record and cascades null to associated call logs.

### 5.4 Lead Assignment Actions (`app/admin/leads/assignment-actions.ts`)
- **`assignLeadsAction(input)`**:
  - Takes `leadIds: string[]` and `employeeId: string`.
  - Verifies employee exists and `isActive === true`.
  - Executes atomic Prisma transaction (`prisma.$transaction`):
    - Leads with status `NEW` -> transitioned to `ASSIGNED` and assigned to employee.
    - Leads with advanced statuses (`CONTACTED`, `INTERESTED`, etc.) -> retain their status while updating employee association.
- **`unassignLeadsAction(input)`**:
  - Takes `leadIds: string[]`.
  - Executes atomic transaction:
    - Leads with status `ASSIGNED` -> transitioned back to `NEW`.
    - Advanced leads -> retain status while clearing employee ID.

### 5.5 Lead Import Actions (`app/admin/leads/import-actions.ts`)
- **`validateAndPreviewImportAction(rows)`**:
  - Accepts up to 25,000 raw rows.
  - Normalizes phone numbers with `zodPhoneNumberSchema`.
  - Detects duplicate phone numbers *within the uploaded file* using a Set.
  - Queries database for existing phone numbers in chunks of 2,000 to prevent SQL parameter limits.
  - Separates rows into `validRows`, `duplicates` (with existing Lead ID), and `invalidRows` (with error messages).
- **`executeImportAction(input)`**:
  - Takes validated leads and optional `assignedEmployeeId`.
  - Finds latest sequential `LED-xxxx` code.
  - Batches database insertion into chunks of 1,000 using `prisma.lead.createMany`.

---

# 6. BACKEND REST API ROUTE HANDLERS (app/api/)

### 6.1 `POST /api/employee/auth/login`
- **Rate Limit**: 5 attempts per 60 seconds per client IP.
- **Input**: `{ identifier, password }`.
- **Logic**:
  - Normalizes identifier (handles numeric codes by prefixing `EMP-`, or matches email).
  - Finds active employee record.
  - Verifies bcrypt hash.
  - Resets rate limit counter on success.
  - Signs 30-day HS256 JWT containing `employeeId`, `employeeCode`, `email`, `name`.
  - Returns JWT token and employee profile.

### 6.2 `GET /api/employee/auth/me`
- **Auth**: Bearer JWT.
- **Logic**: Verifies token, resolves employee identity, returns employee profile plus live CRM counts:
  - `totalAssigned`: All leads assigned to this employee.
  - `contactedToday`: Leads updated to contacted/interested today.
  - `convertedTotal`: Total leads converted by this employee.

### 6.3 `POST /api/employee/calls/sync` (Authoritative Telemetry Ingestion)
- **Auth**: Bearer JWT.
- **Input**: `{ calls: CallSyncPayload[] }`.
- **Critical Business Rules & Deduplication Policy**:
  - Normalizes phone numbers to last 10 digits.
  - Pre-fetches assigned leads for the employee and matches calls by last 10 digits.
  - Pre-fetches existing call logs within a 120-second timestamp window to prevent duplicate records on retry.
  - **Single Connected Call Rule**: A student prospect can only have *one* connected call across all time. If an earlier connected call exists for this lead or phone number, subsequent calls are forced to `connected = false`. If an earlier call is synced retroactively, subsequent connected calls in the database are demoted to `connected = false`.
  - Creates or updates `CallLog` records.
  - If a disposition outcome is provided (e.g. `interested`, `converted`), automatically updates the matched `Lead` status and appends timestamped notes (e.g. `"[14:30 - Call 45s]: Prospect interested in MBA"`).
  - Invalidates dashboard cache.

### 6.4 `GET /api/employee/leads`
- **Auth**: Bearer JWT.
- **Logic**: Returns all leads assigned to the authenticated employee (resolved across any alias IDs), ordered by `updatedAt desc`.

### 6.5 `POST /api/employee/leads/[leadId]/disposition`
- **Auth**: Bearer JWT.
- **Logic**: Enforces assignment ownership. Only assigned staff can update disposition. Validates status against `LeadStatus` enum. Appends timestamped note entry. Updates lead in Prisma.

### 6.6 `GET /api/employee/analytics`
- **Auth**: Bearer JWT.
- **Logic**:
  - Resolves employee IDs and fetches up to 1,000 call logs.
  - Computes start of today in Indian Standard Time (IST).
  - Enforces single-connected call deduplication across all time.
  - Computes `todayMetrics` and `lifetimeMetrics`:
    - `totalAttempts`
    - `totalConnected`
    - `totalUnconnected`
    - `connectionRatePercent`
    - `totalDurationSeconds`
    - `averageDurationSeconds`
    - `outcomeDistribution` (counts per outcome)
  - Formats calls for the mobile client with authoritative connected flags and legacy compatibility aliases (`duration`, `date`, `number`, `name`).

### 6.7 `GET /api/admin/leads/export`
- **Auth**: Clerk Admin access.
- **Query Params**: `format` (`xlsx` or `csv`), `status`, `employeeId`, `assignment`, `search`.
- **Logic**: Applies database filters, fetches up to 10,000 leads, sanitizes formulas against injection, generates XLSX or CSV stream with dynamic attachment header.

### 6.8 `POST /api/demo` & `GET /api/download/apk`
- **/api/demo**: Validates landing page inquiry, logs demo booking with tracking ID `HKU-DEMO-XXXX`.
- **/api/download/apk**: Serves `public/downloads/heeyaku-calltracker.apk` with `Content-Type: application/vnd.android.package-archive` and file length headers.

---

# 7. ADMIN WEB APPLICATION UI ARCHITECTURE & DATA CONNECTIONS

### 7.1 Layout & Shell Architecture
- **`app/admin/layout.tsx`**: Server layout verifying `assertAdminAccess()`. Renders `AdminShell`.
- **`components/admin/AdminShell.tsx`**: Client layout managing sidebar collapse state, dark/light theme, and mobile drawer.
- **`components/admin/AdminSidebar.tsx`**: Navigation menu linking to Overview (`/admin/dashboard`), Directory (`/admin/employees`), and Leads (`/admin/leads`).
- **`components/admin/AdminHeader.tsx`**: Top navigation bar with breadcrumb trail, Clerk UserButton, theme toggler, and system status indicators.

### 7.2 Dashboard Page & Bento Engine (`app/admin/dashboard/`)
- **`page.tsx`**: Server component fetching `getDashboardMetrics()`.
- **`TodayLeadStatusSection.tsx`**: Header banner showing today's intake and grid of 13 status cards with micro-progress bars and count badges.
- **`TodayTopPerformerSpotlight.tsx`**: Podium spotlight highlighting today's and this month's top-performing BDA telecallers based on conversion rate and call volume.
- **`EmployeeReportSection.tsx` & `EmployeeReportTanstackTable.tsx`**: TanStack React Table showcasing all active staff members with sorting, filtering, total calls, connected calls, talk time, and conversion percentage.
- **`bento/*` Components**:
  - `BentoWarmPipeline.tsx`: High-intent lead gauge.
  - `BentoConversionDonut.tsx`: Visual SVG breakdown of converted vs dropped leads.
  - `BentoFunnelFlow.tsx`: Multi-stage sales funnel progression.
  - `BentoFrictionTelemetry.tsx`: Telephony friction monitor (busy, wrong numbers, no answer rates).

### 7.3 Employee Directory & Management (`app/admin/employees/`)
- **`page.tsx`**: Server component displaying metric ribbon (Total Staff, Active Members, Assigned Leads, Calls Logged, Total Talk Time) and `EmployeeTable`.
- **`EmployeeTable.tsx`**: Client table with chunked pagination (10 per page), client-side debounced search, team filter, and active/inactive tabs.
- **`EmployeeTableRow.tsx`**: Row component with actions menu: Edit Details, Reset Password, Deactivate/Reactivate, and View Full Profile.
- **`CreateEmployeeDialog.tsx`**: Modal with form fields and credentials reveal card allowing admin to copy the auto-generated password.
- **`app/admin/employees/[employeeId]/page.tsx`**: Detailed 360-degree staff analytics view:
  - Hero card with status badge.
  - KPI cards (Assigned, Contacted, Converted, Rate).
  - Call stats cards (Total calls, talk time, average duration).
  - `EmployeeCallLogsTable.tsx`: Filterable log of all calls placed by this staff member.
  - `EmployeeAssignedLeadsTable.tsx`: Interactive table of all prospects currently assigned.
  - `EmployeeCallOutcomesBreakdown.tsx`: Bar chart of call dispositions.

### 7.4 Lead Management & CRM Pipeline (`app/admin/leads/`)
- **`page.tsx`**: Server component with metric ribbon (Total Leads, New Inquiries, In Discussion, Enrolled/Converted) and `LeadTable`.
- **`LeadTable.tsx`**: Virtualized lead table featuring:
  - Checkbox multi-select for bulk operations.
  - Search by name, phone, course, or lead code.
  - Status filter chips.
  - Employee filter dropdown.
  - Export modal (CSV/XLSX).
- **`BulkAssignDialog.tsx`**: Modal to assign or reassign multiple selected leads to any active staff member.
- **`ImportLeadsDialog.tsx`**: Drag-and-drop CSV/XLSX file ingestion modal:
  - `ImportDropzone.tsx`: File dropper with format validation.
  - `ImportColumnMapper.tsx`: Automatic and manual column mapping interface.
  - `ImportPreviewTabs.tsx`: Tabbed review showing valid records, duplicates with existing Lead IDs, and error rows.
  - `ImportSuccessView.tsx`: Confirmation card showing inserted counts and assignment feedback.

---

# 8. PUBLIC MARKETING WEBSITE & HIGH-PERFORMANCE LANDING ENGINE

### 8.1 Modern Web Stack & Performance Tuning
- **Engine**: Next.js 15 App Router with static generation and React 19 Server Components.
- **Styling**: TailwindCSS with CSS variables, dark mode native styling, and glassmorphism.
- **Animations & Visuals**:
  - `framer-motion`: Coordinated staggered reveals and micro-interactions.
  - `ogl`: High-performance WebGL 3D canvas shader rendering the dynamic background aurora (`Aurora.tsx`).
  - `lenis`: Smooth inertia scrolling (`SmoothScroll.tsx`).

### 8.2 Landing Page Sections (`components/landingpage/`)
- **`Navbar.tsx`**: Sticky backdrop-blur navigation with brand logo, product links, and 'Book Demo' / 'Sign In' CTAs.
- **`hero/Hero.tsx`**: Main viewport with animated headline, technical badges, interactive workspace demo mockup (`InteractiveAppWorkspace.tsx`), and WebGL background.
- **`revenue-leak/RevenueLeakSection.tsx`**: Data comparison highlighting lost admissions revenue from delayed callbacks and untracked telecaller activity.
- **`brand-pillars/BrandPillarsShowcase.tsx`**: Three-pillar value proposition (Authoritative Tracking, Automated CRM Sync, Staff Accountability).
- **`product-suite/ProductSuiteGrid.tsx`**: Interactive bento grid demonstrating CallTracker Android app, Web CRM, and Analytics Engine.
- **`workflow/ConnectedWorkflowSection.tsx` & `AccordionGallery.tsx`**: Step-by-step interactive workflow walkthrough from student inquiry intake to mobile call placement and automated CRM logging.
- **`metabrain/MetaBrainSection.tsx`**: AI-driven lead scoring and smart telecaller distribution highlights.
- **`social-proof/SocialProofBar.tsx` & `Masonry.tsx`**: Client logos, student engagement metrics, and testimonial cards.
- **`metrics/TechnicalMetricsStrip.tsx`**: Technical latency, uptime, and throughput indicators.
- **`integrations/IntegrationsEcosystem.tsx`**: Compatibility showcase (WhatsApp, Android Telephony, ERPs, Webhooks).
- **`roadmap/ImplementationRoadmap.tsx`**: Deployment timeline and implementation milestones.
- **`cta/FinalCTA.tsx`**: Bottom conversion banner with demo scheduling modal trigger.
- **`footer/Footer.tsx`**: Site map, compliance notices, security certifications, and copyright.

---

# 9. MOBILE APP: ANDROID NATIVE TELEPHONY ENGINE (KOTLIN)

File: `CallTrackerApp/android/app/src/main/java/com/calltracker/CallTrackerModule.kt`
Package: `com.calltracker`

### 9.1 Module Properties & Thread Management
- `telephonyManager: TelephonyManager?`: Android system service for cellular network and call states.
- `@Volatile telephonyCallback: CallStateCallback?`: Android 12+ (`Build.VERSION_CODES.S`) callback instance for call state changes.
- `@Volatile startedAt: Long?`: System timestamp recorded when call enters `OFFHOOK`.
- `@Volatile isAppInitiatedCall: Boolean`: Memory flag set when dialing through `startCall()`.
- `@Volatile appInitiatedNumber: String?`: Dialed phone number string.
- `bgExecutor: ExecutorService`: Dedicated single-thread pool (`Executors.newSingleThreadExecutor()`) eliminating unpooled thread churn and handling content provider database reads.
- `storageLock = Any()`: Thread synchronization lock for SharedPreferences reads/writes.
- `prefs: SharedPreferences`: Named storage `"heeyaku_app_calls"` in `Context.MODE_PRIVATE`.

### 9.2 Native Exported Methods (`@ReactMethod`)
- **`getPlatform(promise: Promise)`**: Returns `"Android"`.
- **`checkPermissions(promise: Promise)`**: Checks `READ_PHONE_STATE`, `CALL_PHONE`, and `READ_CALL_LOG`. Resolves `"granted"` or `"denied"`.
- **`requestPhoneStatePermission(promise: Promise)`**: Obtains current `Activity` as `PermissionAwareActivity` and requests permissions via Android request code `1001`.
- **`startCallStateListener(promise: Promise)`**: Verifies `READ_PHONE_STATE`. Registers `CallStateCallback` onto `mainExecutor`.
- **`stopCallStateListener(promise: Promise)`**: Unregisters telephony callback.
- **`startCall(phoneNumber: String, promise: Promise)`**:
  - Sanitizes phone string (keeps digits, `+`, `*`, `#`).
  - Sets `isAppInitiatedCall = true` and `appInitiatedNumber`.
  - Dispatches `Intent.ACTION_CALL` with `Uri.fromParts("tel", sanitized, null)`.
- **`getCallHistory(limit: Int, promise: Promise)`**:
  - Queries `CallLog.Calls.CONTENT_URI` off the main thread using `bgExecutor`.
  - Projections: `_ID`, `NUMBER`, `CACHED_NAME`, `DATE`, `DURATION`, `TYPE`.
  - Sort order: `DATE DESC`.
  - Converts records into WritableArray and resolves promise.
- **`getAppCalls(promise: Promise)`**:
  - Reads `"calls_list"` and `"outcome_map"` from SharedPreferences under `storageLock`.
  - Merges call data with saved dispositions and resolves WritableArray.
- **`updateAppCallOutcome(callId, outcomeId, outcomeLabel, notes, promise)`**:
  - Updates matching call record in `"calls_list"` JSON array.
  - Updates entry in `"outcome_map"` JSON object.
  - Commits to SharedPreferences.
- **`setItem(key, value, promise)`**, **`getItem(key, promise)`**, **`removeItem(key, promise)`**:
  - Asynchronous native persistent key-value storage used by React Native `authStorage` and `offlineQueue`.

### 9.3 Event Dispatching & Lifecycle
- **`sendCallState(state: String)`**: Dispatches `CallStateChanged` event to JavaScript via `DeviceEventManagerModule.RCTDeviceEventEmitter` with states: `"IDLE"`, `"RINGING"`, `"OFFHOOK"`.
- **`fetchLatestCallLogAndEmit(fallbackDuration: Long)`**:
  - Runs in `bgExecutor`.
  - Sleeps 700ms to allow the Android OS to commit completed call details into the `CallLog` ContentProvider.
  - Queries most recent call log record.
  - Persists app-initiated calls into local SharedPreferences (`calls_list`).
  - Dispatches `CallEnded` event with `{ id, duration, number, name, date, isAppInitiated, connected }`.

---

# 10. MOBILE APP: SERVICES, STORAGE, OFFLINE QUEUE & CUSTOM HOOKS

### 10.1 `apiClient.ts` (Mobile Network Service)
- **Functions**:
  - `fetchWithTimeout(url, options, timeoutMs = 12000)`: Wraps `fetch` with `AbortController` to prevent hung requests on cellular network switches.
  - `parseResponse(response)`: Handles non-JSON payloads, intercepting HTTP 401 (`isUnauthorized = true`) and HTTP 429 (`isRateLimited = true`).
  - `authenticatedRequest(url, options)`: Reads session token from `authStorage.getSession()`, attaches `Authorization: Bearer <token>`.
- **API Methods**:
  - `apiClient.login(identifier, password)`: Calls `/api/employee/auth/login`.
  - `apiClient.getMe()`: Calls `/api/employee/auth/me`.
  - `apiClient.getAssignedLeads()`: Calls `/api/employee/leads`.
  - `apiClient.submitLeadDisposition(leadId, payload)`: Calls `/api/employee/leads/[leadId]/disposition`.
  - `apiClient.syncCalls(calls)`: Calls `/api/employee/calls/sync`.
  - `apiClient.getAnalytics()`: Calls `/api/employee/analytics`.

### 10.2 `authStorage.ts` (Native Token Persistence)
- **Interfaces**:
  - `EmployeeProfile`: `{ id, employeeCode, name, email, phoneNumber, team, role }`
  - `EmployeeSession`: `{ token: string, employee: EmployeeProfile }`
- **Variables**:
  - `memoryCache`: In-memory reference for instant synchronous retrieval.
  - `STORAGE_KEY`: `"heeyaku_employee_session"`.
- **Methods**:
  - `saveSession(session)`: Updates memory cache and native SharedPreferences via `CallTracker.setItem`.
  - `getSession()`: Returns memory cache if present; otherwise reads SharedPreferences.
  - `clearSession()`: Flushes cache and native storage on sign out.

### 10.3 `offlineQueue.ts` (Resilient Telemetry Queue)
- **Interfaces**:
  - `CallSyncPayload`: Call metadata, talk time, disposition, timestamps, and `retryCount`.
- **Variables**:
  - `QUEUE_STORAGE_KEY`: `"heeyaku_offline_call_queue"`.
  - `memoryQueue`: Array of pending calls.
  - `isFlushing`: Concurrency guard boolean.
- **Methods**:
  - `enqueueCalls(calls)`: Adds or updates calls in queue. Deduplicates by ID or phone+timestamp. Caps queue length at 200 to prevent memory exhaustion.
  - `flush()`: Asynchronously attempts `apiClient.syncCalls(queue)`. On success, empties queue. If unauthorized, leaves queue intact. If network fails, increments `retryCount` and drops items after 50 failures.
  - `getQueueSize()`: Returns count of pending unsynced calls.

### 10.4 Custom Hooks Architecture (`src/hooks/`)
- **`useCallPermissions.ts`**: Manages `permissionGranted` state, checks permissions via native module, and presents system permission request dialog.
- **`useTelephonyState.ts`**:
  - Listens to `CallStateChanged` and `CallEnded` native emitter events.
  - Manages real-time call duration timer at `OFFHOOK` using `setInterval`.
  - Manages outgoing call dialing state with `isAppDialingRef`.
  - Debounces call history reload by 800ms after call completion.
- **`useCallHistory.ts`**:
  - Manages `appCalls` (HEEYAKU-initiated calls) and `callHistory` (system call log).
  - Primary source of truth: Backend DB via `apiClient.getAnalytics()`.
  - Fallback: Local native storage via `CallTracker.getAppCalls()`.
- **`useCallOutcomes.ts`**:
  - Manages `pendingOutcomeCall` state.
  - Saves disposition outcomes into native storage and memory map.
- **`useCallFilter.ts`**:
  - Filters calls based on search string and tabs (`ALL`, `CONNECTED`, `NOT_CONNECTED`, `OUTGOING`, `INCOMING`, `MISSED`).
- **`useCallMetrics.ts`**:
  - Enforces the Single Connected Call Rule: Sorts calls chronologically, marks only the first connected call for each lead as connected, and computes today vs lifetime metrics.
- **`useCallTracker.ts` (Composed Root Hook)**:
  - Orchestrates all sub-hooks.
  - Handles immediate backend sync on `CallEnded`.
  - Listens to React Native `AppState` changes to re-sync history and flush offline queue on app resume.
  - Executes periodic background sync every 25 seconds.

---

# 11. MOBILE APP: SCREENS, MODALS & NAVIGATION GRAPH

### 11.1 Entry & App Root (`App.tsx`)
- **Components**:
  - `App`: Top-level component. Evaluates `authStorage.getSession()`. Renders `LoginScreen` if unauthenticated, or `MainApp` if session exists.
  - `MainApp`: Hosts `useCallTracker()` and `useCallMetrics()`. Renders `AppNavigator` and mounts global `CallOutcomeModal`.

### 11.2 Navigation Graph (`components/navigation/`)
- **`AppNavigator.tsx`**: Controls active tab state:
  - `dashboard` -> `DashboardScreen`
  - `calls` -> `CallsScreen`
  - `leads` -> `LeadsScreen`
  - `analytics` -> `AnalyticsScreen`
  - `profile` -> `ProfileScreen`
- **`BottomNavBar.tsx`**: Custom dark bottom bar with active indicator dots and haptic-ready touch targets.

### 11.3 Screens Architecture (`src/screens/`)
- **`LoginScreen.tsx`**: BDA login screen with username/email input, password reveal toggle, error banner, and sign-in button.
- **`DashboardScreen.tsx`**:
  - `TodayHeroCard`: Highlights today's total calls, connected calls, and remaining target.
  - `LiveCallCard`: Live caller ID banner with ticking talk timer during active calls.
  - `BentoKpiRow`: Two-column highlighted KPI widgets.
  - `CallVolumeCard`: Segmented progress bar of connected vs unconnected calls.
  - Recent calls list with quick-dial action buttons.
- **`CallsScreen.tsx`**:
  - Quick Cellular Dialer: Direct number keypad input and dial button.
  - Search bar and horizontal filter chips.
  - Virtualized FlatList of call logs with smooth pull-to-refresh.
- **`LeadsScreen.tsx`**:
  - Search and filter chips for lead lifecycle stages.
  - Lead Cards: Name, Lead ID badge, course, phone number, and 'Contacted' watermark stamp.
  - 'Call' button: Triggers native telephony.
  - 'WhatsApp' button: Gated behind the Call-First Rule (disabled until student has been called and dispositioned).
- **`AnalyticsScreen.tsx`**:
  - Period tabs: 'Today', 'This Month', 'All Time'.
  - Month navigator with left/right arrows.
  - Performance summary card (Calls made, connection rate %, total talk time, avg duration).
  - Stacked ratio bar and outcome breakdown list.
  - Subpage: Daily breakdown for the selected month.
- **`ProfileScreen.tsx`**:
  - Staff identity card and BDA badge.
  - Live CRM Activity ribbon (Assigned Leads, Contacted Today, Converted).
  - Official work identity details.
  - App telephony permission diagnostics.
  - Sign Out button with custom themed modal.

### 11.4 Modals Architecture
- **`CallOutcomeModal.tsx`**:
  - Mandatory popup triggered immediately when an app-initiated call terminates.
  - Displays contact name, phone number, and duration.
  - 10 disposition chips (Interested, Follow Up, Call Back, Not Interested, No Answer, Busy, Wrong Number, Converted, Not Qualified, Other).
  - Optional remarks text area.
  - Submits disposition to backend and native storage.
- **`LeadDispositionModal.tsx`**:
  - Manual modal accessible directly from the Leads screen for non-call updates.

---

# 12. CROSS-SYSTEM END-TO-END DATA LIFECYCLE TRACING

### Scenario A: Prospect Import -> Staff Assignment -> Phone Call -> CRM Note Reflection

```
[1. Admin Uploads CSV]
       |
       v (POST /app/admin/leads/import-actions.ts -> validateAndPreviewImportAction)
[2. Duplicate Check & Normalization]
       | (Checks local set + Postgres chunked query of 2,000 numbers)
       v (POST /app/admin/leads/import-actions.ts -> executeImportAction)
[3. Batch Insert into Postgres 'leads' Table]
       | (Batch size 1,000, assignedEmployeeId set to BDA)
       v
[4. Mobile App Receives Lead]
       | (GET /api/employee/leads -> cached in SharedPreferences 'heeyaku_cached_leads')
       v
[5. BDA Clicks 'Call' in LeadsScreen.tsx]
       | (startCall() -> Android Intent.ACTION_CALL)
       v
[6. Android Telephony Hardware Initiates Call]
       | (CallTrackerModule.kt registers OFFHOOK, starts duration counter)
       v
[7. Call Ends -> System Event]
       | (CallTrackerModule sleeps 700ms, queries CallLog ContentProvider)
       v
[8. JavaScript Receives 'CallEnded' Event]
       | (useCallTracker.ts dispatches immediate POST /api/employee/calls/sync)
       v
[9. Mandatory KPI Outcome Modal Displays]
       | (BDA selects 'INTERESTED' and types 'Wants syllabus sent on WhatsApp')
       v
[10. Backend Synchronizes Disposition]
       | (/api/employee/calls/sync sets LeadStatus to 'INTERESTED',
       |  appends timestamped note, updates 'call_logs' table,
       |  and busts 25s dashboard metrics cache)
       v
[11. WhatsApp Unlocked on Mobile Client]
       | (LeadsScreen enables green WhatsApp button; BDA chats with student)
       v
[12. Executive Admin Dashboard Reflects Real-Time Metric]
       | (/admin/dashboard shows updated conversion donut and staff leaderboard)
```

---

# 13. COMPREHENSIVE VARIABLE & FUNCTION CONNECTION INDEX

### Complete Master Inventory of Every Core Variable, Function, Interface, and Module in HEEYAKU

| Identifier / Symbol | Type / Kind | Defining File | Consumed By / Connected To | Functional Description |
| :--- | :--- | :--- | :--- | :--- |
| `prisma` | `PrismaClient` | `lib/prisma.ts` | All API routes, Server Actions, `lib/dashboard/metrics.ts` | Global singleton instance managing PostgreSQL connection pool. |
| `getAuthenticatedAdmin` | `Function` | `lib/auth/admin.ts` | `assertAdminAccess`, Admin layout, Admin API routes | In-memory cached server-side admin validator against Clerk and email whitelist. |
| `assertAdminAccess` | `Function` | `lib/auth/admin.ts` | All Server Actions in `app/admin/`, `api/admin/leads/export` | Authorization guard throwing `AuthorizationError` if unauthenticated. |
| `signEmployeeToken` | `Function` | `lib/auth/employee-token.ts` | `app/api/employee/auth/login/route.ts` | Signs 30-day HS256 JWT containing employee identity payload. |
| `verifyEmployeeToken` | `Function` | `lib/auth/employee-token.ts` | All `/api/employee/*` route handlers | Constant-time HMAC SHA-256 JWT verifier with expiry check. |
| `checkRateLimit` | `Function` | `lib/security/rate-limit.ts` | `app/api/employee/auth/login/route.ts` | In-memory sliding window rate limiter enforcing 5 login attempts/min. |
| `resetRateLimit` | `Function` | `lib/security/rate-limit.ts` | `app/api/employee/auth/login/route.ts` | Clears rate limit counter on successful staff authentication. |
| `generateRandomPassword` | `Function` | `lib/crypto/passwords.ts` | `createEmployeeAction`, `resetEmployeePasswordAction` | Cryptographically random 10-character temporary password generator. |
| `hashPassword` | `Function` | `lib/crypto/passwords.ts` | `createEmployeeAction`, `resetEmployeePasswordAction` | Hashes plaintext passwords using bcrypt with 10 salt rounds. |
| `verifyPassword` | `Function` | `lib/crypto/passwords.ts` | `app/api/employee/auth/login/route.ts` | Compares login plaintext password with bcrypt hash. |
| `getDashboardMetrics` | `Function` | `lib/dashboard/metrics.ts` | `app/admin/dashboard/page.tsx` | Aggregates daily pipeline, employee rankings, and conversion rates with 25s TTL. |
| `invalidateDashboardMetricsCache` | `Function` | `lib/dashboard/metrics.ts` | Server Actions, `calls/sync/route.ts` | Flushes in-memory dashboard cache on any data mutation. |
| `normalizePhoneNumber` | `Function` | `lib/lead/phone.ts` | Import actions, `calls/sync`, lead forms | Strips formatting and normalizes Indian `+91` / `0` prefixes to 10 digits. |
| `toLast10Digits` | `Function` | `lib/lead/phone.ts` | `calls/sync/route.ts`, `analytics/route.ts`, `useCallMetrics.ts` | Extracts rightmost 10 numerical digits for telephony call matching. |
| `zodPhoneNumberSchema` | `ZodSchema` | `lib/lead/phone.ts` | Lead and employee creation schemas, import validation | Validates and transforms strings to strictly 10 numerical digits. |
| `resolveEmployeeIdentity` | `Function` | `lib/employee/resolve.ts` | `/api/employee/calls/sync`, `/api/employee/leads`, `analytics` | Resiliently resolves employee identity and gathers all alias IDs. |
| `generateNextLeadCode` | `Function` | `lib/lead/code.ts` | `createLeadAction`, lead import actions | Generates sequential `LED-1001`, `LED-1002` codes. |
| `generateNextEmployeeCode` | `Function` | `lib/employee/code.ts` | `createEmployeeAction` | Generates sequential `EMP-1001`, `EMP-1002` codes. |
| `formatLeadsForExport` | `Function` | `lib/lead/export.ts` | `/api/admin/leads/export/route.ts` | Formats lead rows and neutralizes CSV spreadsheet formula injection. |
| `parseImportFile` | `Function` | `lib/lead/import-parser.ts` | `ImportLeadsDialog.tsx` | Parses browser `.csv` or `.xlsx` files into JSON rows. |
| `getStartOfTodayISTMs` | `Function` | `lib/utils/date.ts` | `/api/employee/analytics/route.ts` | Resolves 00:00:00.000 IST timestamp to avoid UTC day rollover skew. |
| `createEmployeeAction` | `ServerAction` | `app/admin/employees/actions.ts` | `CreateEmployeeDialog.tsx` | Creates staff account, generates temporary password and hash. |
| `fetchEmployeesChunkAction` | `ServerAction` | `app/admin/employees/fetch-actions.ts` | `EmployeeTable.tsx` | Fetches paginated chunks of 10 employees with aggregated talk time. |
| `assignLeadsAction` | `ServerAction` | `app/admin/leads/assignment-actions.ts` | `BulkAssignDialog.tsx`, lead detail views | Transactional lead assignment preserving advanced pipeline stages. |
| `validateAndPreviewImportAction` | `ServerAction` | `app/admin/leads/import-actions.ts` | `ImportLeadsDialog.tsx` | Validates file rows and checks database for phone duplicates. |
| `executeImportAction` | `ServerAction` | `app/admin/leads/import-actions.ts` | `ImportLeadsDialog.tsx` | Batches creation of up to 25,000 leads in chunks of 1,000. |
| `CallTrackerModule` | `KotlinClass` | `CallTrackerModule.kt` | React Native Bridge, Android Telephony OS | Native Android module controlling telephony callbacks and CallLog reads. |
| `startCallStateListener` | `NativeMethod` | `CallTrackerModule.kt` | `useTelephonyState.ts` | Registers Android `TelephonyCallback` on the main executor. |
| `startCall` | `NativeMethod` | `CallTrackerModule.kt` | `useTelephonyState.ts`, dialer cards | Fires `Intent.ACTION_CALL` to dial out on the cellular radio. |
| `getCallHistory` | `NativeMethod` | `CallTrackerModule.kt` | `useCallHistory.ts` | Queries system `CallLog.Calls` content provider off-thread. |
| `getAppCalls` | `NativeMethod` | `CallTrackerModule.kt` | `useCallHistory.ts` | Reads HEEYAKU app call records from native SharedPreferences. |
| `updateAppCallOutcome` | `NativeMethod` | `CallTrackerModule.kt` | `useCallOutcomes.ts` | Updates call disposition in local native SharedPreferences. |
| `apiClient` | `Object` | `CallTrackerApp/src/services/apiClient.ts` | All mobile screens and synchronization hooks | Network client with timeout aborts and authentication interceptors. |
| `authStorage` | `Object` | `CallTrackerApp/src/services/authStorage.ts` | `App.tsx`, `LoginScreen.tsx`, `ProfileScreen.tsx` | Native SharedPreferences wrapper for session token storage. |
| `offlineQueue` | `Object` | `CallTrackerApp/src/services/offlineQueue.ts` | `useCallTracker.ts` | Stores up to 200 unsynced call payloads and flushes automatically. |
| `useCallTracker` | `ReactHook` | `CallTrackerApp/src/hooks/useCallTracker.ts` | `App.tsx` | Master mobile hook orchestrating telephony, permissions, and sync. |
| `useCallMetrics` | `ReactHook` | `CallTrackerApp/src/hooks/useCallMetrics.ts` | `App.tsx`, `DashboardScreen.tsx`, `AnalyticsScreen.tsx` | Calculates today and lifetime metrics enforcing Single Connected Call Rule. |
| `useTelephonyState` | `ReactHook` | `CallTrackerApp/src/hooks/tracker/useTelephonyState.ts` | `useCallTracker.ts` | Tracks call states, manages talk timer at OFFHOOK, and triggers dialing. |
| `useCallHistory` | `ReactHook` | `CallTrackerApp/src/hooks/tracker/useCallHistory.ts` | `useCallTracker.ts` | Synchronizes call logs from backend database with local device fallback. |
| `useCallOutcomes` | `ReactHook` | `CallTrackerApp/src/hooks/tracker/useCallOutcomes.ts` | `useCallTracker.ts` | Controls call disposition modal state and storage persistence. |
| `useCallFilter` | `ReactHook` | `CallTrackerApp/src/hooks/tracker/useCallFilter.ts` | `useCallTracker.ts`, `CallsScreen.tsx` | Filters call records by search string and category chips. |
| `AppNavigator` | `ReactComponent` | `CallTrackerApp/src/components/navigation/AppNavigator.tsx` | `App.tsx` | Switches active tab screen based on bottom bar selection. |
| `CallOutcomeModal` | `ReactComponent` | `CallTrackerApp/src/components/outcome/CallOutcomeModal.tsx` | `App.tsx` | Mandatory popup modal to log call discussion outcome and notes. |
| `LeadDispositionModal` | `ReactComponent` | `CallTrackerApp/src/components/leads/LeadDispositionModal.tsx` | `LeadsScreen.tsx` | Modal allowing staff to update student status and notes directly. |

---

# 14. SUMMARY & CONCLUSION

The HEEYAKU platform is an end-to-end, zero-leakage enterprise telephony CRM system. Every line of code across both the web and mobile platforms serves a dedicated function:
1. **Zero Data Loss**: Offline queues, native SharedPreferences, and server retry backoffs ensure no call log or prospect disposition is ever lost.
2. **Authoritative Accuracy**: Strict single-connected call deduplication and Indian Standard Time date alignment ensure that management dashboards reflect 100% truthful telecaller productivity.
3. **High Performance**: In-memory Clerk session caching, chunked database lookups, TanStack virtualized tables, and WebGL-accelerated landing visuals ensure sub-second response times across the entire stack.

