# HEEYAKU — Production Architecture & Audit Reports (Stages 1 – 4)

This directory contains the complete, authoritative documentation, security audits, and verification reports for the HEEYAKU CRM and Telephony platform across Stages 1 through 4.

---

## 📚 Master Index of Reports

| Report Document | Stage & Scope | Core Topics Covered | Status |
| :--- | :--- | :--- | :---: |
| [**Stage 1: Multi-Tenant Architecture & Governance**](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/reports/STAGE_1_MULTI_TENANT_ARCHITECTURE_REPORT.md) | **Stage 1** | Multi-tenant domain model, role-based access control (CEO, HR, TL, BDA), tenant isolation, BDA seat quotas, company suspension kill-switch, Clerk auth sync. | **VERIFIED** |
| [**Stage 2: Telephony CRM & Mobile Application**](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/reports/STAGE_2_TELEPHONY_CRM_MOBILE_REPORT.md) | **Stage 2** | Android React Native/Kotlin CallTracker, hardware telephony listeners, offline SQLite FIFO queue, device-bound HMAC-SHA256 JWTs, Clerk email OTP, call outcome modal. | **VERIFIED** |
| [**Stage 3: Lead Pipeline & Integrations**](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/reports/STAGE_3_LEAD_PIPELINE_INTEGRATIONS_REPORT.md) | **Stage 3** | External API lead ingestion, Google Sheets two-way sync, connected-call KPI disposition gating (talk time > 0s), prospect promotion, cross-squad transfer, ExcelJS/PapaParse export. | **VERIFIED** |
| [**Stage 4: Production Hardening & Security**](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/reports/STAGE_4_PRODUCTION_HARDENING_VERIFICATION_REPORT.md) | **Stage 4** | Complete synthesis of Stages 4.1 – 4.8.4: CWE-209 sanitization, ingress anti-spoofing, distributed rate limiting with $0 in-memory fallback, timing-safe nonce purge, 5-layer restore isolation, off-server AES-256 replication. | **VERIFIED** |
| [**Stage 4.8.3 & 4.8.4 Deployment & Release Gate**](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/reports/STAGE_4_8_3_REPORT.md) | **Stage 4.8.3 / 4.8.4** | Detailed deployment ingress configuration, Vercel cron registration, backup & recovery runbooks, automated test outputs, and operator release checklist. | **PARTIAL** (Pending Operator Actions) |

---

## 🛡️ Overall System Architecture

```mermaid
graph TD
    Client[Web & Mobile Clients] --> Ingress[Vercel Edge / Ingress Defense]
    Ingress --> Middleware[RBAC & Rate Limiting Engine]
    Middleware --> AppRouter[Next.js App Router API & Server Actions]
    AppRouter --> Prisma[Prisma ORM 6.19.3]
    Prisma --> DB[(Self-Hosted PostgreSQL)]
    
    Mobile[Android CallTracker App] --> Telemetry[Telephony Native Module]
    Telemetry --> SQLite[(Offline SQLite FIFO Queue)]
    SQLite --> CallSyncAPI[/api/employee/calls/sync]
    CallSyncAPI --> Prisma

    Cron[Vercel Daily Cron: 02:00 UTC] --> NoncePurge[/api/cron/cleanup-nonces]
    NoncePurge --> DB

    DB --> Backup[scripts/backup-db.sh]
    Backup --> Encrypt[scripts/replicate-backup.sh]
    Encrypt --> R2[(Cloudflare R2 / AWS S3)]
```

---

## 🚀 Pre-Production Operator Checklist

To transition the release gate from **PARTIAL** to **PASS**, execute the 3 operational steps detailed in [Stage 4.8.3 Report Section 8](file:///c:/Users/sibas/OneDrive/Desktop/Heeyaku%20Project/heeyaku/reports/STAGE_4_8_3_REPORT.md#8-operator-actions-required-for-final-production-release):
1. **Set `CRON_SECRET`:** Add the variable in Vercel Project Settings > Environment Variables.
2. **Run Restore Drill:** Execute `./scripts/restore-drill.sh <DUMP_PATH> heeyaku_drill_temp` on the PostgreSQL server.
3. **Configure Offsite Backup:** Configure `R2_BACKUP_BUCKET` and `BACKUP_ENCRYPTION_KEY` on the database server.
