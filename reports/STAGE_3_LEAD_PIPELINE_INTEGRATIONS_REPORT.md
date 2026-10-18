# HEEYAKU — Stage 3: Lead Management Pipeline & Integrations Report

**Stage:** Stage 3  
**Domain:** External Lead Ingestion, Google Sheets Sync, Squad Distribution & Disposition Gating  
**Status:** COMPLETE & PRODUCTION-VERIFIED  
**Architecture:** Next.js Route Handlers, Prisma Atomic Transactions, ExcelJS, PapaParse  

---

## 1. Executive Summary

Stage 3 implemented the high-throughput lead processing and sales operations pipeline for HEEYAKU. It encompasses multi-source lead ingestion (external REST API and Google Sheets), automated deduplication, squad-level distribution, telephony-gated progression, prospect promotion, and high-performance export capabilities.

The pipeline enforces data integrity through atomic Prisma transactions and eliminates sales misreporting by strictly gating lead disposition updates against verified hardware telephony records.

---

## 2. Ingestion & Synchronization Engine

```
[External Sources]
  ├── Google Sheets (Live Two-Way Sync)
  └── Partner Webhooks / Ads / Portals
            │
            ▼
    [API Gateway / Edge Route Handlers]
            │ ──► Timing-Safe API Key Authentication (x-api-key / CompanyApiKey)
            │ ──► Distributed Rate Limiting (60 req/min per key/IP)
            │ ──► Payload Bound Check (MAX_INGEST_BATCH: 500 records)
            ▼
    [Phone Digit Normalization (Last 10 Digits) & Deduplication]
            │
            ▼
    [Atomic Prisma Transaction ($transaction)]
            │ ──► Insert / Update Lead Record
            │ ──► Squad Lead Assignment
            │ ──► Update Sync Metadata (sync_meta table)
            ▼
    [Database: leads Table]
```

### Ingestion Components
1. **External Ingestion Webhook ([`app/api/v1/leads/ingest/route.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku Project/heeyaku/app/api/v1/leads/ingest/route.ts)):**
   - Timing-safe cryptographic API key validation against `CompanyApiKey.keyHash`.
   - Batch size capped at 500 leads per request to prevent denial-of-service via memory exhaustion.
   - Robust normalization: strips country codes, whitespace, and non-numeric characters to store exact 10-digit phone signatures (`phoneDigits`).
2. **Google Sheets Integration ([`app/api/v1/integrations/google-sheets/sync/route.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku Project/heeyaku/app/api/v1/integrations/google-sheets/sync/route.ts)):**
   - Two-way sync with content hashing (`sheetHash`) in `sync_meta` to prevent redundant database writes.
   - Preserves existing lead notes and statuses during sheet reconciliation.

---

## 3. Lead Lifecycle & Telephony KPI Gate

The lead lifecycle advances across standardized operational states:
`NEW` ➔ `ASSIGNED` ➔ `CONTACTED` ➔ `INTERESTED` (Prospect) ➔ `CONVERTED` (Client).

### The Connected-Call Disposition Gate ([`app/api/employee/leads/[leadId]/disposition/route.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku Project/heeyaku/app/api/employee/leads/[leadId]/disposition/route.ts))
To prevent fraudulent reporting and ensure quality assurance, the API enforces a strict business rule:
> **A lead's status cannot be updated to `CONTACTED`, `INTERESTED`, or `CONVERTED` unless a verified connected call (`talk time > 0 seconds`) exists in `call_logs` for that specific lead and employee.**

- If an agent attempts to disposition a lead without placing a call or after an unanswered call (0s), the API rejects the request with **HTTP 403 Forbidden** (`VERIFIED_CONNECTED_CALL_REQUIRED`).
- Once a verified call is recorded (e.g. 45s talk time), the disposition update succeeds.

### Prospect Promotion & Squad Transfer
- **Prospect Promotion:** When a lead is marked `INTERESTED`, the system automatically flags `isProspect = true` and records `promotedToProspectAt`.
- **Cross-Squad Assignment:** Leads can be transferred across squads within the same company.
- **Original BDA Credit:** The system records `originalBdaId`, ensuring the associate who generated the prospect receives permanent attribution on company leaderboards, even after a Team Lead converts the lead.

---

## 4. Secure Lead Export Engine ([`lib/lead/export.ts`](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku Project/heeyaku/lib/lead/export.ts))

To resolve critical vulnerabilities present in legacy spreadsheet packages:
1. **Dependency Modernization:** Replaced `xlsx@0.18.5` with **ExcelJS** for binary `.xlsx` generation and **PapaParse** for `.csv` streaming.
2. **Denial-of-Service Defense:**
   - Enforced a hard limit of **25,000 rows** per export request.
   - Output streaming avoids memory spikes and Node.js process crashes.
3. **Data Sanitization:** Formula injection defense prefixes leading `=`, `+`, `-`, or `@` characters to prevent CSV injection attacks in Microsoft Excel.

---

## 5. Verification & Test Evidence

Stage 3 business rules were verified using end-to-end integration test harnesses:
- **Suites:** `scripts/test-all-integrations-security.ts` and `scripts/test-prod-readiness.ts`.
- **Results:**
  - API Key timing-safe authentication: **PASSED** (Rejects incorrect keys without timing leakage).
  - Ingestion payload bounding (500 limit): **PASSED** (HTTP 413 Payload Too Large on overflow).
  - Phone normalization: **PASSED** (Identical 10 digits parsed across formats).
  - Verified connected call gate: **PASSED** (Zero-call rejected; verified-call accepted).
  - Prospect promotion & credit preservation: **PASSED** (`originalBdaId` intact).
  - Leaderboard standings & concurrency: **PASSED** (10 concurrent transactions with zero contention).
  - XLSX & CSV export generation: **PASSED** (Clean buffers generated within memory budget).
