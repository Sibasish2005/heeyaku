# HEEYAKU Cloud Migration & Production Architecture Plan

## Executive Summary

HEEYAKU is migrating from a local/staging environment into a cost-controlled, production-grade cloud architecture tailored for **50 to 150 concurrent staff members (BDAs, Team Leads, HR, and Executives)**.

The architecture maximizes reliability, data durability, and low latency while maintaining a **₹0 / $0 monthly baseline infrastructure cost** using verified Always-Free tiers:

```
┌────────────────────────────────┐
│   Frontend: Cloudflare Pages   │  ◄── Custom Domain: app.heeyaku.com (Hostinger DNS via Cloudflare)
│   (Zero-Egress Edge Network)   │      DDoS Protection, Bot Fight Mode, Free SSL
└───────────────┬────────────────┘
                │ HTTPS (CORS)
                ▼
┌────────────────────────────────┐
│      Backend: AWS Lambda       │  ◄── API Gateway HTTP API: api.heeyaku.com
│      (Stateless API Layer)     │      1M free requests/mo, 512MB-1024MB RAM, 15s timeout
└───────────────┬────────────────┘
                │ Port 6432 (Transaction Pooler)
                ▼
┌────────────────────────────────┐
│   Database: Oracle Cloud VM    │  ◄── Host: [REDACTED_OCI_DB_IP] (VM.Standard.E2.1.Micro)
│  (PostgreSQL 18 + PgBouncer)   │      4 GB Swap Airbag, Tuned Memory, Stress-Tested @ 45 QPS
└────────────────────────────────┘
```

---

## 1. Verified Database Foundation (Oracle Cloud VM)

The production database is already provisioned, secured, and empirically stress-tested with real-world CRM data.

* **Host:** Oracle Cloud Infrastructure (`ap-mumbai-1` / `[REDACTED_OCI_DB_IP]`)
* **Shape:** `VM.Standard.E2.1.Micro` (Always Free Eligible)
* **Compute:** 1/8 OCPU AMD EPYC, 1 GB Physical RAM
* **Memory Safety Shield:** **4.0 GB Swap file** (`/swapfile`, `swappiness=20`) providing a total virtual memory space of **~5 GB**, preventing Out-Of-Memory (OOM) kernel kills.
* **Database Engine:** PostgreSQL 18 (`port 5432`)
* **Connection Pooler:** PgBouncer 1.25+ (`port 6432`) running in **Transaction Pooling Mode** (`pool_mode = transaction`, `max_client_conn = 300`, `default_pool_size = 20`).
* **Prisma Connection String Architecture:**
  * `DATABASE_URL`: `postgresql://heeyaku_user:[SECRET]@[REDACTED_OCI_DB_IP]:6432/heeyaku?pgbouncer=true&connection_limit=1` (Used by AWS Lambda & Runtime API).
  * `DIRECT_URL`: `postgresql://heeyaku_user:[SECRET]@[REDACTED_OCI_DB_IP]:5432/heeyaku` (Used exclusively for Prisma schema migrations and DDL operations).

### Verified Empirical Stress Test Results (5,550 Real SQL Queries)

| Concurrent BDAs | Total Operations | Throughput | Avg Latency | P95 Latency | Success Rate | Database Health |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **10** | 100 Workflows (300 queries) | 15 SQL QPS | 1,809ms | 4,127ms | **100.0%** | RAM ~260MB, 0% Swap |
| **25** | 250 Workflows (750 queries) | 36 SQL QPS | 1,951ms | 4,546ms | **100.0%** | RAM ~310MB, 0% Swap |
| **50 (Target Pilot)**| 500 Workflows (1,500 queries) | 45 SQL QPS | 3,335ms | 6,555ms | **100.0%** | RAM ~370MB, 0% Swap |
| **100 (Full Floor)** | 1,000 Workflows (3,000 queries)| 39 SQL QPS | 7,462ms | 10,811ms | **100.0%** | RAM ~440MB, 0% Swap |

*Zero crashes, zero connection drops, and zero data corruption under peak write loads.*

---

## 2. Stateless Backend Layer (AWS Lambda)

AWS Lambda serves as the scalable, stateless execution engine for the CRM backend (Next.js Route Handlers, Server Actions, and mobile synchronization).

### Lambda Configuration Standards

1. **Connection Pooling Enforcement:**
   * Lambda functions must connect **strictly via PgBouncer on port 6432** with `connection_limit=1`.
   * Each concurrent container handles one request at a time, preventing serverless connection storms.
2. **Container Sizing:**
   * **Memory:** Allocate **512 MB – 1,024 MB**. Prisma's query engine runs faster with adequate memory, reducing cold-start latency from 3s to <400ms.
   * **Execution Timeout:** Set to **15 seconds** (API Gateway default timeout is 29 seconds).
3. **Prisma Binary Targets:**
   Ensure `prisma/schema.prisma` includes the AWS Amazon Linux 2023 binary target:
   ```prisma
   generator client {
     provider      = "prisma-client-js"
     binaryTargets = ["native", "rhel-openssl-3.0.x"]
   }
   ```
4. **API Gateway HTTP API:**
   * Use an **API Gateway HTTP API** rather than a raw Function URL for native edge routing, custom domain support (`api.heeyaku.com`), and built-in route throttling.
   * **CORS Configuration:**
     * `Access-Control-Allow-Origin`: `https://app.heeyaku.com`, `https://heeyaku.com`
     * `Access-Control-Allow-Methods`: `GET, POST, PUT, DELETE, OPTIONS, PATCH`
     * `Access-Control-Allow-Headers`: `Content-Type, Authorization, x-api-key`
     * `Access-Control-Allow-Credentials`: `true`

---

## 3. Frontend & Edge Layer (Cloudflare Pages + Hostinger DNS)

The client-facing portal and marketing web app are served globally via Cloudflare’s edge network with zero egress costs.

### DNS & Routing Architecture (Hostinger ➔ Cloudflare)

1. **Nameserver Delegation:**
   * Hostinger domain `heeyaku.com` nameservers delegated to Cloudflare (`*.ns.cloudflare.com`).
2. **Subdomain Mappings:**
   * `app.heeyaku.com`: CNAME to Cloudflare Pages project (Proxy: Orange Cloud enabled).
   * `api.heeyaku.com`: CNAME to AWS API Gateway endpoint (Proxy: Grey Cloud / DNS-only for direct API throughput).
   * `heeyaku.com`: Marketing website / Root landing page.
3. **Edge Security:**
   * **Always Use HTTPS:** Enabled (HSTS).
   * **Bot Fight Mode:** Enabled to stop automated credential stuffing and scraping on `/sign-in`.

---

## 4. Mandatory Application Hardening (Before Client Launch)

These items must be verified in the codebase to ensure multi-user stability:

1. **Dedicated JWT Secret:**
   * Require `EMPLOYEE_JWT_SECRET` in `.env`. Never fall back to Clerk secrets in production. Use a 64-character random hex key with 12–24 hour token expiry.
2. **BDA Authorization Boundaries:**
   * Authenticated BDAs must be explicitly denied from administrative Server Actions (`canManageEmployees`, `canManageTeams`, `canDeleteEmployee`). UI button hiding is not security.
3. **Android Call Sync Idempotency:**
   * In `/api/employee/calls/sync`, verify that duplicate submissions of the same device call ID do not create duplicate `CallLog` entries.
4. **Batch CSV Lead Ingestion:**
   * Limit file uploads to **5,000 leads per CSV**.
   * Batch insert using chunks of 500 (`chunkSize = 500`) with 50ms pauses to give the database breathing room during business hours.
5. **Scheduled Database Backups:**
   * Automatic nightly cron job on the Oracle server at 2:00 AM:
     ```bash
     0 2 * * * pg_dump heeyaku | gzip > /var/backups/postgres/heeyaku_$(date +\%F).sql.gz && find /var/backups/postgres/ -type f -mtime +7 -delete
     ```

---

## 5. Multi-Tenant SaaS Evolution (Phase 2 Post-Pilot)

Once the initial 50–100 BDA pilot is live and generating usage metrics for startup fundraising, transition the database into a multi-tenant B2B SaaS architecture:

### Schema Evolution:
1. **Tenant Model:**
   ```prisma
   model Tenant {
     id          String     @id @default(cuid())
     name        String
     slug        String     @unique
     plan        String     @default("TRIAL")
     maxBdas     Int        @default(100)
     isActive    Boolean    @default(true)
     createdAt   DateTime   @default(now())
     updatedAt   DateTime   @updatedAt

     teams       Team[]
     employees   Employee[]
     leads       Lead[]
     callLogs    CallLog[]
     syncMetas   SyncMeta[]

     @@map("tenants")
   }
   ```
2. **Compound Unique Scoping:**
   * Replace global unique constraints with tenant-scoped constraints:
     * `Team`: `@@unique([tenantId, name])`
     * `Employee`: `@@unique([tenantId, employeeCode])`
     * `Lead`: `@@unique([tenantId, leadCode])`
3. **Prisma Tenant Isolation Extension:**
   * Implement a centralized `$extends` middleware in `lib/prisma.ts` that automatically scopes all queries (`findMany`, `create`, `update`, `delete`) to the active user's `tenantId`, preventing cross-company data leakage.

---

## 6. Launch Readiness Checklist

- [x] Oracle VM provisioned and running (`[REDACTED_OCI_DB_IP]`).
- [x] 4 GB Swap memory airbag active (`free -h` shows 4.0Gi).
- [x] PostgreSQL 18 & PgBouncer 1.25 active and listening on ports 5432 & 6432.
- [x] Oracle Cloud VCN Ingress rules configured for ports 5432 & 6432.
- [x] Ubuntu internal iptables configured to allow ports 5432 & 6432.
- [x] Prisma schema synchronized (`npx prisma db push`).
- [x] Real-world BDA load test executed with 1,000 real leads and 100% success rate.
- [ ] Point Hostinger nameservers to Cloudflare.
- [ ] Deploy frontend to Cloudflare Pages (`app.heeyaku.com`).
- [ ] Configure AWS Lambda environment variables (`DATABASE_URL`, `EMPLOYEE_JWT_SECRET`, `CLERK_SECRET_KEY`).
- [ ] Conduct end-to-end dry run with test BDA account and Android Call Tracker APK.
- [ ] Onboard pilot company (50–100 BDAs).
