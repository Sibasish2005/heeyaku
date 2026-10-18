# HEEYAKU — Stage 5: Decoupled Architecture Migration Plan

**Stage:** Stage 5 (Target Architecture & Migration Roadmap)  
**Target Ingress:** Cloudflare Pages (Frontend) + AWS API Gateway / Lambda (Backend)  
**Database:** Self-Hosted PostgreSQL (with PgBouncer connection pooling)  
**Mobile:** Android CallTracker Application (Calling AWS API Gateway)  
**APK Distribution:** Cloudflare R2 Object Storage (Zero Egress Fees)  

---

## 1. Executive Architectural Assessment

### The Reality: Why HEEYAKU Cannot Simply "Switch Hosts"
HEEYAKU is currently an integrated **Next.js 16.4.2 App Router Monolith**. The application tightly couples:
1. **Frontend Presentation:** React 19 UI (Admin dashboard, teams, leads, prospects, employees, onboarding).
2. **52 Server Actions:** Direct server-side database mutations across 11 action files.
3. **15 REST API Route Handlers:** Dedicated endpoints for Android telephony synchronization, external webhooks, and Google Sheets sync.
4. **Data Access Layer:** Direct Prisma ORM 6.19.3 queries executed within Server Actions and API routes.
5. **Authentication:** Clerk user session resolution tightly coupled to Next.js middleware ([`proxy.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku Project/heeyaku/proxy.ts)) and Next.js server context.

Decoupling HEEYAKU into **Cloudflare Pages** and **AWS Lambda** requires an **incremental code refactoring and modularization roadmap**, not just changing deployment configurations.

---

## 2. Target Decoupled Architecture

```mermaid
graph TD
    subgraph Clients
        Web[Web Browser / CRM Users]
        Mobile[Android CallTracker App]
    end

    subgraph Cloudflare
        CFPages[Cloudflare Pages: Static UI / Edge SSR]
        R2[Cloudflare R2 Bucket: APK Distribution]
    end

    subgraph AWS
        APIGW[AWS API Gateway: HTTPS Routing, CORS, Throttling]
        Lambda[AWS Lambda: Micro-handlers / Container Functions]
    end

    subgraph Database Host
        PgBouncer[PgBouncer Connection Pooler]
        Postgres[(Self-Hosted PostgreSQL)]
    end

    Web -->|Static Assets & HTML| CFPages
    Web -->|Authenticated REST Calls| APIGW
    Mobile -->|Download APK| R2
    Mobile -->|Telephony Sync & Auth| APIGW

    APIGW --> Lambda
    Lambda -->|Port 5432 / SSL| PgBouncer
    PgBouncer --> Postgres
```

---

## 3. Target Monorepo Structure (`npm workspaces`)

To preserve a single repository, git history, and synchronized release cycles, the repository will transition to an `npm workspaces` monorepo:

```text
heeyaku/
├── apps/
│   ├── web/                     # Next.js Static/Client UI → Cloudflare Pages
│   │   ├── app/                 # Client routes, pages, and components
│   │   ├── components/          # Reusable UI components & design system
│   │   └── package.json
│   └── api/                     # Backend Handlers → AWS Lambda / API Gateway
│       ├── handlers/            # REST route controllers & migrated actions
│       ├── middleware/          # Clerk JWT validation & RBAC guards
│       └── package.json
├── packages/
│   ├── shared/                  # Zod validation schemas, TypeScript DTO types
│   │   ├── src/                 # Business validation rules, role definitions
│   │   └── package.json
│   └── db/                      # Prisma ORM schema, client singleton, migrations
│       ├── prisma/
│       │   └── schema.prisma    # Single source of truth for database schema
│       └── src/
│           └── client.ts        # PrismaClient singleton with serverless pooling
├── infra/
│   ├── sst.config.ts            # SST / AWS SAM infrastructure-as-code
│   └── github-actions/          # Separate CI/CD workflows for Web, API, and Android
├── CallTrackerAndroid/          # Existing React Native / Kotlin mobile app
└── package.json                 # Root monorepo workspace configuration
```

---

## 4. The Three Major Technical Risks & Engineering Solutions

### Risk 1: Clerk Authentication on AWS Lambda
- **The Challenge:** Next.js Server Actions currently rely on `auth()` from `@clerk/nextjs/server`, which reads Next.js request cookies. In a decoupled architecture, Cloudflare Pages will run as a client application, and AWS Lambda will run as an independent REST API.
- **The Solution:**
  1. The Cloudflare Pages frontend retrieves the user's active Clerk session JWT using `useAuth().getToken()`.
  2. The frontend attaches the token as `Authorization: Bearer <clerk_jwt>` to all API requests.
  3. AWS Lambda uses `@clerk/backend` to verify the JWT offline using Clerk’s JSON Web Key Set (JWKS).
  4. Lambda extracts `userId` and queries tenant role permissions in [`lib/auth/rbac.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku Project/heeyaku/lib/auth/rbac.ts) independently.

### Risk 2: PostgreSQL Serverless Connection Limits
- **The Challenge:** AWS Lambda scales dynamically to handle concurrency. If 100 Lambda instances spawn simultaneously, 100 direct connections will overwhelm your self-hosted PostgreSQL server (`max_connections = 100`), causing catastrophic connection timeouts.
- **The Solution:**
  1. **Deploy PgBouncer** on your self-hosted PostgreSQL server in `transaction` pooling mode.
  2. Configure Prisma on Lambda to connect through PgBouncer:
     `DATABASE_URL="postgresql://user:pass@db.heeyaku.com:6432/heeyaku?pgbouncer=true&connection_limit=3&sslmode=require"`
  3. Restrict incoming traffic on port `6432` to the static outbound IP of your AWS NAT Gateway or allowlist.

### Risk 3: Decoupling Process-Local Caches & Rate Limits
- **The Challenge:** In-memory `Map` stores (such as the fallback rate-limiter in [`lib/security/rate-limit.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku Project/heeyaku/lib/security/rate-limit.ts)) do not persist across multiple AWS Lambda instances.
- **The Solution:**
  1. Configure **Upstash Redis** (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`).
  2. The existing `checkRateLimitDistributed` helper already supports Upstash Redis natively.
  3. AWS API Gateway Usage Plans provide native edge throttling before requests even hit Lambda.

---

## 5. Complete Inventory of Operations to Migrate

### A. The 15 REST API Route Handlers (Direct Lift to Lambda)
All 15 existing route handlers preserve their exact endpoint paths and request/response payloads to ensure the Android mobile app and external webhooks never break:

| Existing Route | Purpose | HTTP Method | Target Lambda Handler |
| :--- | :--- | :---: | :--- |
| `app/api/employee/auth/login/route.ts` | Mobile BDA login | POST | `handlers/auth/login.ts` |
| `app/api/employee/auth/me/route.ts` | Session info | GET | `handlers/auth/me.ts` |
| `app/api/employee/auth/verify-device-otp/route.ts` | Device OTP validation | POST | `handlers/auth/verify-otp.ts` |
| `app/api/employee/auth/resend-device-otp/route.ts` | Resend device OTP | POST | `handlers/auth/resend-otp.ts` |
| `app/api/employee/calls/sync/route.ts` | Android call telemetry sync | POST | `handlers/calls/sync.ts` |
| `app/api/employee/leads/route.ts` | BDA lead retrieval | GET | `handlers/leads/list.ts` |
| `app/api/employee/leads/[leadId]/disposition/route.ts` | Hardware-gated disposition | POST | `handlers/leads/disposition.ts` |
| `app/api/employee/analytics/route.ts` | BDA performance metrics | GET | `handlers/analytics/bda.ts` |
| `app/api/v1/leads/ingest/route.ts` | External lead webhook | POST | `handlers/ingest/lead-webhook.ts` |
| `app/api/v1/integrations/google-sheets/sync/route.ts`| Google Sheets sync | GET / POST | `handlers/integrations/sheets.ts` |
| `app/api/admin/leads/export/route.ts` | XLSX & CSV stream export | POST | `handlers/leads/export.ts` |
| `app/api/cron/cleanup-nonces/route.ts` | Replay nonce cleanup | POST | `handlers/cron/cleanup-nonces.ts` |
| `app/api/demo/route.ts` | Public demo request | POST | `handlers/public/demo.ts` |
| `app/api/auth-status/route.ts` | Sanitized health diagnostics | GET | `handlers/diagnostics/status.ts` |
| `app/api/download/apk/route.ts` | APK download redirect | GET | `handlers/public/apk-redirect.ts` |

### B. The 52 Server Actions to Migrate into Authenticated REST Endpoints
The 52 Server Actions currently spread across 11 files will be converted into clean, authenticated REST endpoints on AWS API Gateway:
1. **Employee Management (9 Actions):** `app/admin/employees/actions.ts` & `fetch-actions.ts`
   ➔ `POST /api/admin/employees`, `PATCH /api/admin/employees/:id`, `DELETE /api/admin/employees/:id`, `GET /api/admin/employees/roster`.
2. **Lead Operations & Assignment (18 Actions):** `app/admin/leads/actions.ts`, `assignment-actions.ts`, `import-actions.ts`, `sync-sheet-action.ts`
   ➔ `POST /api/admin/leads`, `POST /api/admin/leads/bulk-assign`, `POST /api/admin/leads/import`, `POST /api/admin/leads/sync-sheet`.
3. **Prospect Operations (5 Actions):** `app/admin/prospects/actions.ts`
   ➔ `GET /api/admin/prospects`, `POST /api/admin/prospects/:id/convert`.
4. **Team & Squad Management (8 Actions):** `app/admin/teams/actions.ts`
   ➔ `POST /api/admin/teams`, `PATCH /api/admin/teams/:id`, `DELETE /api/admin/teams/:id`.
5. **Onboarding & Super Admin Governance (12 Actions):** `app/onboarding/actions.ts`, `app/sign-up/actions.ts`, `app/super-admin/actions.ts`
   ➔ `POST /api/onboarding/company`, `POST /api/super-admin/companies/:id/suspend`, `POST /api/super-admin/companies/:id/verify`.

---

## 6. Android APK Hosting & Distribution Architecture

To distribute the Android APK without hosting large binary files in git or Lambda memory:

1. **Storage Tier: Cloudflare R2 Bucket:**
   - Create a private bucket: `heeyaku-releases`.
   - **Cost:** 10 GB free storage, $0 egress fees (completely free distribution).
2. **Custom Download URL:**
   - Connect custom domain: `https://download.heeyaku.com/heeyaku-calltracker.apk`.
3. **Build & Release Automation (GitHub Actions):**
   ```yaml
   # .github/workflows/release-android.yml
   name: Build & Release Android APK
   on:
     push:
       tags: ['v*']
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-java@v4
           with: { distribution: 'temurin', java-version: '17' }
         - run: cd CallTrackerAndroid/android && ./gradlew assembleRelease
         - name: Upload to Cloudflare R2
           run: |
             aws s3 cp CallTrackerAndroid/android/app/build/outputs/apk/release/app-release.apk \
               s3://heeyaku-releases/heeyaku-calltracker.apk \
               --endpoint-url https://${{ secrets.R2_ACCOUNT_ID }}.r2.cloudflarestorage.com
   ```
4. **In-App Update Check:**
   - The Android app checks `GET /api/download/apk/version` and prompts the user to download the latest APK when a new release tag is detected.

---

## 7. Phased 6-Step Incremental Migration Roadmap

```
Phase 5.1 ──► Extract Shared Schemas & DB Packages (packages/shared, packages/db)
     │
Phase 5.2 ──► Database Infrastructure: Install PgBouncer & Configure SSL
     │
Phase 5.3 ──► Prototype 1 Server Action & 1 API Route on AWS Lambda
     │
Phase 5.4 ──► Domain-by-Domain Migration of all 52 Server Actions & 15 Routes
     │
Phase 5.5 ──► Cloudflare Pages Static Build & API Gateway URL Rewriting
     │
Phase 5.6 ──► Dual-Run Staging Acceptance & Final Production Cutover
```

### Detailed Phase Execution Plan:
- **Phase 5.1 (Shared Packages):** Initialize `npm workspaces`. Extract Zod validation schemas and TypeScript types into `packages/shared`. Move Prisma schema and client into `packages/db`. Keep current monolith building and passing all 5 test suites.
- **Phase 5.2 (Database Hardening):** Install and configure PgBouncer on your self-hosted PostgreSQL server. Enforce SSL encryption (`hostssl`) and test connection pool limits.
- **Phase 5.3 (Prototype Validation):** Implement a single representative endpoint (e.g. `POST /api/employee/auth/login`) and a single Server Action (e.g. `updateLeadStatus`) on AWS Lambda with API Gateway. Validate Clerk JWT authentication, Prisma access, and zero contract regressions.
- **Phase 5.4 (Complete Backend Migration):** Migrate the remaining 51 Server Actions and 14 API routes domain by domain. Run the full regression test suite against the Lambda API staging endpoint.
- **Phase 5.5 (Cloudflare Pages Frontend):** Configure `apps/web` with `@cloudflare/next-on-pages` or Next.js static export. Point API requests to AWS API Gateway (`https://api.heeyaku.com`).
- **Phase 5.6 (Dual-Run & Cutover):** Deploy Cloudflare Pages staging and AWS Lambda staging against the isolated test database. Run full end-to-end regression tests. Cut over production DNS once all checks pass.
