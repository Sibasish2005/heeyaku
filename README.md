# HEEYAKU — Enterprise Telephony CRM & Multi-Tenant B2B SaaS Platform

> **Master Engineering Blueprint, System Architecture (HLD & LLD), Evolution Ledger & Operations Manual**  
> *Targeted for software engineers, interns, platform administrators, and technical operators.*

---

## 📑 Table of Contents

1. [Executive Overview & Core Value Proposition](#1-executive-overview--core-value-proposition)
2. [Complete Technology Stack](#2-complete-technology-stack)
3. [The Evolutionary Journey: Revisions & Build Stages](#3-the-evolutionary-journey-revisions--build-stages)
4. [High-Level Design (HLD) & System Topology](#4-high-level-design-hld--system-topology)
   - [4.1 Global Topology Diagram](#41-global-topology-diagram)
   - [4.2 Multi-Tenant Organization & Governance Model](#42-multi-tenant-organization--governance-model)
   - [4.3 Dual-Tier Authentication & Token Architecture](#43-dual-tier-authentication--token-architecture)
   - [4.4 Dual-Gate 0ms Master Kill-Switch](#44-dual-gate-0ms-master-kill-switch)
   - [4.5 Android Telephony Telemetry Loop](#45-android-telephony-telemetry-loop)
5. [Low-Level Design (LLD) & Data Models](#5-low-level-design-lld--data-models)
   - [5.1 Comprehensive Prisma Database Schema](#51-comprehensive-prisma-database-schema)
   - [5.2 Role-Based Access Control (RBAC) Permission Matrix](#52-role-based-access-control-rbac-permission-matrix)
   - [5.3 Lead Pipeline & Prospect State Machine](#53-lead-pipeline--prospect-state-machine)
   - [5.4 Lead-to-Prospect Escalation Engine](#54-lead-to-prospect-escalation-engine)
   - [5.5 Exhaustive Function & Domain Service Dictionary](#55-exhaustive-function--domain-service-dictionary)
   - [5.6 Resolved Engineering Pitfalls & Security Fixes (The Bug Ledger)](#56-resolved-engineering-pitfalls--security-fixes-the-bug-ledger)
6. [Zero-Cost Cloud Infrastructure Architecture](#6-zero-cost-cloud-infrastructure-architecture)
7. [Step-by-Step Operational Runbook (The Intern's Guide)](#7-step-by-step-operational-runbook-the-interns-guide)
   - [7.1 Prerequisites & Local Environment Setup](#71-prerequisites--local-environment-setup)
   - [7.2 Master Environment Variables Reference (`.env`)](#72-master-environment-variables-reference-env)
   - [7.3 Database Synchronization & Migration](#73-database-synchronization--migration)
   - [7.4 Operating Each Portal & Role](#74-operating-each-portal--role)
     - [Super Admin Operations (`/super-admin`)](#a-super-admin-operations-super-admin)
     - [Company Registration & Onboarding Lifecycle](#b-company-registration--onboarding-lifecycle)
     - [Founder / CEO Operations (`/admin/*`)](#c-founder--ceo-operations-admin)
     - [Human Resources (HR) Operations (`/admin/employees`)](#d-human-resources-hr-operations-adminemployees)
     - [Team Lead Operations (`/admin/leads`, `/admin/prospects`)](#e-team-lead-operations-adminleads-adminprospects)
     - [BDA Mobile Operations (Android App)](#f-bda-mobile-operations-android-app)
   - [7.5 Master API Reference](#75-master-api-reference)
   - [7.6 Troubleshooting & Production Playbook](#76-troubleshooting--production-playbook)

---

## 1. Executive Overview & Core Value Proposition

**HEEYAKU** is an integrated **Enterprise Telephony, Admissions, and Outbound Sales CRM** engineered for high-velocity startups, admissions teams, and B2B sales organizations.

### The Problem It Solves
Traditional enterprise telephony systems (Cloud PBX, Exotel, Twilio, Knowlarity) suffer from severe drawbacks for fast-moving startups:
- **Prohibitive Hardware & Per-Minute Costs:** Cloud calling APIs incur recurring per-minute charges and per-agent software licensing ($30–$80/agent/month).
- **Poor Caller Pickup Rates:** Virtual numbers and automated SIP trunks trigger carrier spam filters, resulting in sub-15% connection rates.
- **Fragmented Data Silos:** Telephony records, spreadsheet imports, manual lead assignments, and WhatsApp follow-ups live in separate, disconnected tools.

### The Heeyaku Solution: The "Zero-Hardware" Hybrid Model
Heeyaku replaces costly PBX infrastructure by coupling an **Executive Web CRM** with a **Companion Android Telephony Client**:
1. **Physical Sim-Card Telephony:** Sales representatives (BDAs) place calls using standard company smartphones. Outgoing calls originate from real mobile SIM cards, boosting connection rates to **40%–60%**.
2. **Automated Background Telemetry:** The Android client natively monitors call states (`RINGING`, `OFFHOOK`, `IDLE`), computes exact talk-time duration, logs timestamps, and forces mandatory post-call outcome gates.
3. **Automated Escalation & Closing:** When cold leads express interest, the system automatically promotes them to **Prospects**, locks in attribution for the original caller, and reassigns them to squad **Team Leads** for high-touch closing and demo conversions.
4. **Multi-Tenant SaaS Governance:** Governed by an App-Level Super Admin platform owner capable of instant company approvals, 0ms kill-switches, caller seat enforcement, and trial management.

---

## 2. Complete Technology Stack

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT TIERS                                         │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│         EXECUTIVE WEB PORTAL              │          MOBILE TELEPHONY CLIENT           │
│  • Next.js 16.3.4 (App Router, Turbopack) │  • React Native 0.74 (Bare Android)        │
│  • React 19.2.8 & Server Actions          │  • Kotlin Native Telephony Listeners       │
│  • Tailwind CSS v4 & Lucide React         │  • Android CallLog ContentProvider API     │
│  • Sonner Toasts & Canvas Micro-Shaders   │  • Persistent Native SharedPreferences     │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              API, EDGE & SECURITY LAYER                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  • Edge Reverse Proxy (`proxy.ts`) with Clerk Middleware Integration                  │
│  • Clerk SSO (Web Portals: Super Admin, CEO, HR, Team Lead)                            │
│  • Cryptographic HMAC-SHA256 Bearer JWTs (`lib/auth/employee-token.ts` for Mobile)    │
│  • Sliding-Window In-Memory Rate Limiter (`lib/security/rate-limit.ts`)                │
│  • Constant-Time Timing-Safe API Key Validator (`crypto.timingSafeEqual`)              │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE & DATA PERSISTENCE                                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  • PostgreSQL 18 with PgBouncer 1.25+ Transaction Pooling (Port 6432)                 │
│  • Prisma ORM 6.19.3 (Strictly Parameterized Queries, Transaction Boundaries)          │
│  • Direct DDL Connection (Port 5432) for Schema Migrations (`DIRECT_URL`)              │
│  • Composite Database Indexing for High-Velocity Search & Real-Time Aggregations       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

| Subsystem | Technology | Purpose |
| :--- | :--- | :--- |
| **Web Framework** | Next.js 16.3.4 (App Router) | High-performance Server-Side Rendering (SSR), Server Actions, and Route Handlers. |
| **Frontend UI Library** | React 19.2.8 | Declarative components, transitions, and streaming UI. |
| **Styling Engine** | Tailwind CSS v4 | Modern styling tokens, zero-runtime CSS, dark mode support. |
| **Database** | PostgreSQL 18 | Relational data persistence with strict foreign keys and composite indexes. |
| **Database Pooler** | PgBouncer 1.25+ | Transaction pooling (`pool_mode = transaction`) to prevent serverless connection exhaustion. |
| **ORM** | Prisma ORM 6.19.3 | Type-safe queries, schema management, and atomic multi-step transactions. |
| **Web Authentication** | Clerk (`@clerk/nextjs/server`) | Enterprise authentication, session cookies, user directory synchronization. |
| **Mobile Auth** | Bcrypt (10 rounds) + HS256 JWT | 30-day cryptographically signed mobile tokens for field sales staff. |
| **Mobile Runtime** | React Native (Bare Android) | Native device execution, offline storage, click-to-dial Android Intents. |
| **Ingestion Engine** | PapaParse + XLSX | Streaming spreadsheet parser with SSRF-safe Google Sheets integration. |

---

## 3. The Evolutionary Journey: Revisions & Build Stages

Heeyaku did not start as a complex multi-tenant system; it evolved through six deliberate engineering iterations to solve real-world startup bottlenecks:

### Stage 1: Single-Tenant Internal Startup CRM (The MVP)
- **Goal:** Enable a single startup team to import cold leads from CSV spreadsheets and track outbound calling.
- **Implementation:** Next.js App Router with basic Prisma schema. Built manual lead assignment and connected basic call logs submitted by a prototype Android app.
- **Limitations Discovered:** Single company hardcoded; no role separation (everyone saw everything); duplicate phone numbers corrupted data.

### Stage 2: Squad Architecture, RBAC & Role Segregation
- **Goal:** Support multiple internal sales squads with dedicated Team Leads, while HR managed staff without seeing customer contact details.
- **Implementation:** Added `Team` model and created a 4-tier role hierarchy: `CEO`, `HR`, `TEAM_LEAD`, and `BDA`. Built in-memory session caching (5-minute TTL) to prevent 20-second Clerk roundtrips.
- **The "Connected Call" Gate:** Implemented a mandatory rule: BDAs could not disposition a lead as `CONTACTED`, `INTERESTED`, or `CONVERTED` unless a verified call with talk time (`durationSeconds > 0`) was recorded in the database.

### Stage 3: Security Hardening & The Bug Ledger
- **Goal:** Eliminate architectural vulnerabilities, BOLA (Broken Object-Level Authorization), and data integrity bugs identified during code audits.
- **Key Breakthroughs Patched:**
  - *BOLA Squad Bypass:* Fixed an issue in `app/admin/leads/page.tsx` where spreading consecutive JavaScript `OR` objects silently discarded squad isolation filters.
  - *Orphaned Team Lead Escalation:* Prevented former Team Leads of deleted teams from gaining access to the entire company's database by auto-demoting them to BDA.
  - *Lead Code Collision:* Unified hexadecimal codes generated by Google Sheets with integer-based sequential codes (`LD-XXXXX`), eliminating P2002 constraint crashes.
  - *Pipeline Stage Regression:* Stopped auto-assignment scripts from resetting advanced leads (`INTERESTED`, `CALL_BACK`) back to `NEW`.
  - *Timezone Skew:* Forced Indian Standard Time (`Asia/Kolkata`) across metrics calculations, eliminating UTC midnight drift.

### Stage 4: Multi-Tenant B2B SaaS Transformation & Super Admin
- **Goal:** Transform Heeyaku from an internal company tool into a commercial SaaS capable of onboarding hundreds of separate companies.
- **Implementation:**
  - Introduced the `Company` entity with statuses: `PENDING_VERIFICATION`, `ACTIVE`, `REJECTED`, `SUSPENDED_BY_ADMIN`.
  - Developed the **Super Admin Portal** (`/super-admin`) guarded by `SUPER_ADMIN_EMAILS`.
  - Implemented the **1-Click Master Kill-Switch (0ms lockdown)** across both web and mobile gates.
  - Added commercial controls: `maxBdas` caller seat gating, 30-day trial runtime countdowns, and Ghost Mode impersonation (`heeyaku_impersonate_company_id`).

### Stage 5: Lead-to-Prospect Escalation Engine
- **Goal:** Streamline high-touch sales conversions by separating cold outreach from deal closing.
- **Implementation:**
  - Automated workflow: When a BDA logs a connected call with status `INTERESTED`, `CALL_BACK`, or `FOLLOW_UP`, the system flags `isProspect = true`.
  - Locks in attribution by saving `originalBdaId`.
  - Automatically reassigns the lead to the squad's **Team Lead**.
  - Team Leads receive a dedicated **Prospects Closing Matrix** (`/admin/prospects`) to conduct demos and close deals.

### Stage 6: Free-for-Life Cloud Migration & Stress Testing
- **Goal:** Run production workloads for 100+ concurrent BDAs at **₹0 / $0 monthly baseline infrastructure cost**.
- **Implementation:** Validated architecture combining Cloudflare Pages (Frontend, $0 egress), AWS Lambda HTTP API (stateless compute), and Oracle Cloud Always-Free VM (PostgreSQL 18 + PgBouncer with a 4.0 GB swap airbag). Stress-tested at 45 QPS with zero deadlocks.

---

## 4. High-Level Design (HLD) & System Topology

### 4.1 Global Topology Diagram

```mermaid
graph TD
    subgraph Client Surfaces
        SuperAdminUser["Super Admin (Platform Owner)"]
        CEOUser["Company CEO / Executive"]
        HRUser["Human Resources (HR)"]
        TLUser["Squad Team Lead (TL)"]
        BDAUser["Telecaller / Sales Rep (BDA)"]
        ExtForms["Webhooks / Google Sheets / Meta Ads"]
    end

    subgraph Entry & Edge Security
        Cloudflare["Cloudflare Edge (DDoS, Bot Fight, SSL)"]
        Proxy["Next.js 16 Edge Proxy (proxy.ts)"]
        ClerkAuth["Clerk SSO & Identity Provider"]
        MobileRateLimit["Sliding-Window Rate Limiter"]
        HmacAuth["HMAC-SHA256 Token Engine"]
    end

    subgraph Application Server (Next.js 16 Core)
        SuperAdminPortal["/super-admin (Tenant Governance)"]
        AdminPortal["/admin/* (Leads, Teams, Staff, Analytics)"]
        ProspectsMatrix["/admin/prospects (Deal Closing Engine)"]
        MobileAPIs["/api/employee/* (Sync, Leads, Disposition)"]
        IngestionAPI["/api/v1/leads/ingest (Batch Webhook)"]
    end

    subgraph Dual-Gate Security Enforcement
        WebGate["Web RBAC Gate (lib/auth/rbac.ts)"]
        MobileGate["Mobile Gate (lib/employee/resolve.ts)"]
    end

    subgraph Persistence & Infrastructure
        PgBouncer["PgBouncer Pooler (Port 6432)"]
        Postgres[("PostgreSQL 18 DB (Multi-Tenant Schema)")]
        AndroidApp["Android Call Tracker Client"]
    end

    SuperAdminUser -->|HTTPS| Cloudflare
    CEOUser -->|HTTPS| Cloudflare
    HRUser -->|HTTPS| Cloudflare
    TLUser -->|HTTPS| Cloudflare
    BDAUser -->|Mobile Sync| Cloudflare
    ExtForms -->|REST API| Cloudflare

    Cloudflare --> Proxy
    Proxy --> ClerkAuth
    Proxy --> MobileRateLimit

    ClerkAuth --> WebGate
    MobileRateLimit --> HmacAuth
    HmacAuth --> MobileGate

    WebGate --> SuperAdminPortal
    WebGate --> AdminPortal
    WebGate --> ProspectsMatrix
    MobileGate --> MobileAPIs
    ExtForms --> IngestionAPI

    SuperAdminPortal --> PgBouncer
    AdminPortal --> PgBouncer
    ProspectsMatrix --> PgBouncer
    MobileAPIs --> PgBouncer
    IngestionAPI --> PgBouncer

    PgBouncer --> Postgres
    BDAUser -.->|Runs On Device| AndroidApp
    AndroidApp -->|REST Calls| MobileAPIs
```

---

### 4.2 Multi-Tenant Organization & Governance Model

```
                                  PLATFORM SUPER ADMIN
                             (Governed by SUPER_ADMIN_EMAILS)
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
          COMPANY WORKSPACE A                           COMPANY WORKSPACE B
         (Status: ACTIVE, 10 BDAs)                   (Status: SUSPENDED_BY_ADMIN)
                    │                                             │
      ┌─────────────┴─────────────┐                 ┌─────────────┴─────────────┐
      ▼                           ▼                 ▼                           ▼
  [Team Alpha]               [Team Beta]       [Web Access]                [Mobile Dialer]
  • TL: John                 • TL: Priya       • 403 Forbidden             • Sync Paused
  • 4 BDAs                   • 6 BDAs          • Workspace Suspended       • 403 Forbidden
```

1. **Company Status Lifecycle**:
   - `PENDING_VERIFICATION`: Initial state after registration. The CEO is held in a `/verification-pending` waiting room until Super Admin approval.
   - `ACTIVE`: Approved and fully operational.
   - `REJECTED`: Declined by Super Admin with recorded reason.
   - `SUSPENDED_BY_ADMIN`: Locked out instantly via 1-Click Master Kill-Switch.
2. **Strict Tenant Partitioning**:
   - Every `Team`, `Employee`, `Lead`, `CallLog`, and `SyncMeta` record is linked via `companyId`.
   - All queries, auto-assignments, and exports are scoped to the authenticated caller's `companyId`.
3. **Ghost Mode Impersonation**:
   - Super Admins can click **"View as CEO"** in the Super Admin drawer.
   - Sets an encrypted session cookie `heeyaku_impersonate_company_id`.
   - Allows platform managers to troubleshoot issues within a company without asking for employee credentials.

---

### 4.3 Dual-Tier Authentication & Token Architecture

Heeyaku uses two distinct authentication mechanisms tailored to different client requirements:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. WEB ADMIN PORTAL (Executives, HR, Team Leads)                                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Client Browser ➔ Clerk SDK ➔ Clerk JWT Cookie ➔ proxy.ts ➔ getAuthenticatedUser()       │
│ • Validates Clerk session.                                                             │
│ • Matches PostgreSQL Employee record via clerkUserId or email.                        │
│ • Resolves Role (CEO, HR, TEAM_LEAD, BDA) strictly constant per account/email.        │
│ • Caches resolved session in-memory for 5 minutes (invalidated on account mutation).    │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. ANDROID MOBILE APP (Telecallers / BDAs)                                             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Android App ➔ POST /api/employee/auth/login ➔ Verify Bcrypt ➔ Issue HMAC-SHA256 JWT    │
│ • Identifier: Sequential employee code (EMP-XXXX) or email.                            │
│ • Password: Bcrypt hash (10 salt rounds).                                              │
│ • Session Token: 30-day cryptographically signed HS256 JWT (EMPLOYEE_JWT_SECRET).      │
│ • Subsequent requests send: Authorization: Bearer <token>.                             │
│ • Rate limiting: Max 5 failed attempts per IP/Account per 2 minutes.                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.4 Dual-Gate 0ms Master Kill-Switch

When a Super Admin flags a company as `SUSPENDED_BY_ADMIN`, access is revoked instantly across the entire platform via **two centralized gates**:

```mermaid
sequenceDiagram
    autonumber
    actor SA as Super Admin
    participant DB as PostgreSQL DB
    participant Gate1 as Web Gate (lib/auth/rbac.ts)
    participant Gate2 as Mobile Gate (lib/employee/resolve.ts)
    actor CEO as Company CEO (Web)
    actor BDA as Telecaller (Android)

    SA->>DB: Flip Kill-Switch -> status = SUSPENDED_BY_ADMIN
    Note over DB: Immediate Database Update
    
    CEO->>Gate1: Access /admin/dashboard or trigger Server Action
    Gate1->>Gate1: Check user.companyStatus === SUSPENDED_BY_ADMIN
    Gate1-->>CEO: Throws AuthorizationError (403) -> Redirect to /workspace-suspended

    BDA->>Gate2: POST /api/employee/calls/sync
    Gate2->>Gate2: Check employee.company.status === SUSPENDED_BY_ADMIN
    Gate2-->>BDA: Returns null identity -> HTTP 403 { code: 'WORKSPACE_SUSPENDED' }
    Note over BDA: Mobile App pauses sync & preserves logs locally
```

---

### 4.5 Android Telephony Telemetry Loop

The companion mobile app transforms standard Android smartphones into automated call loggers:

```
[ Lead Card in Mobile App ]
           │
           ▼  Tap "Call Lead"
[ Android Intent: Intent.ACTION_CALL ]
           │
           ▼  Native Telephony Listener
┌───────────────────────────────────────────────────────┐
│ STATE 1: CALL_STATE_RINGING  (Outgoing signal)        │
│ STATE 2: CALL_STATE_OFFHOOK  (Call picked up by user) │
│          ➔ Start Duration Timer                       │
│ STATE 3: CALL_STATE_IDLE     (Call disconnected)      │
│          ➔ Stop Duration Timer                        │
│          ➔ Query Android CallLog ContentProvider      │
└───────────────────────────────────────────────────────┘
           │
           ▼
[ Mandatory Outcome Modal Appears ]
  • Pick Outcome: Interested / Follow Up / Callback / Not Interested / Wrong Number
  • Add Notes: "Parent interested in coding curriculum; demo scheduled for Friday."
  • Optional: "Send WhatsApp" (Opens WhatsApp with pre-filled message)
           │
           ▼
[ Offline Persistent Queue (SharedPreferences) ]
           │
           ▼  Network Available / Background Flush
[ POST /api/employee/calls/sync ]
  • Validates JWT Bearer Token
  • Batch deduplicates calls and phone numbers
  • Inserts CallLog records
  • Enforces Connected Call Gate
  • Triggers Lead-to-Prospect Escalation Engine (if outcome is Interested/Follow Up)
```

---

## 5. Low-Level Design (LLD) & Data Models

### 5.1 Comprehensive Prisma Database Schema

Below is the complete database structure defined in `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum CompanyStatus {
  PENDING_VERIFICATION
  ACTIVE
  REJECTED
  SUSPENDED_BY_ADMIN
}

enum Role {
  CEO
  TEAM_LEAD
  HR
  BDA
}

enum LeadStatus {
  NEW
  ASSIGNED
  CONTACTED
  INTERESTED
  FOLLOW_UP
  CALL_BACK
  NOT_INTERESTED
  NO_ANSWER
  BUSY
  WRONG_NUMBER
  CONVERTED
  NOT_QUALIFIED
  OTHER
}

enum CallType {
  OUTGOING
  INCOMING
  MISSED
  REJECTED
}

model Company {
  id              String        @id @default(cuid())
  name            String
  slug            String        @unique
  phoneNumber     String?
  industry        String?
  status          CompanyStatus @default(PENDING_VERIFICATION)
  maxBdas         Int           @default(5)
  requestedBdas   Int           @default(5)
  trialEndsAt     DateTime?
  verifiedAt      DateTime?
  verifiedBy      String?
  rejectionReason String?
  suspendedAt     DateTime?
  suspendReason   String?

  employees       Employee[]
  teams           Team[]
  leads           Lead[]
  callLogs        CallLog[]
  syncMeta        SyncMeta[]

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([status])
  @@index([slug])
  @@map("companies")
}

model Team {
  id          String     @id @default(cuid())
  name        String     @unique
  description String?
  colorTag    String?    @default("#2563EB")
  companyId   String?
  company     Company?   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  teamLeadId  String?    @unique
  teamLead    Employee?  @relation("TeamLeadRelation", fields: [teamLeadId], references: [id], onDelete: SetNull)
  members     Employee[] @relation("TeamMembers")
  leads       Lead[]     @relation("TeamLeads")
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([companyId])
  @@map("teams")
}

model Employee {
  id           String    @id @default(cuid())
  employeeCode String    @unique
  name         String
  email        String    @unique
  phoneNumber  String
  role         Role      @default(BDA)
  clerkUserId  String?   @unique
  companyId    String?
  company      Company?  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  team         String?   @default("General")
  teamId       String?
  teamGroup    Team?     @relation("TeamMembers", fields: [teamId], references: [id], onDelete: SetNull)
  ledTeam      Team?     @relation("TeamLeadRelation")
  notes        String?
  passwordHash String
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  leads              Lead[]    @relation("AssignedEmployeeLeads")
  generatedProspects Lead[]    @relation("OriginalBdaProspects")
  callLogs           CallLog[]

  @@index([employeeCode])
  @@index([email])
  @@index([role])
  @@index([teamId])
  @@index([clerkUserId])
  @@index([isActive])
  @@index([companyId])
  @@index([companyId, role])
  @@index([isActive, role, teamId])
  @@map("employees")
}

model Lead {
  id                 String      @id @default(cuid())
  leadCode           String      @unique
  name               String
  phoneNumber        String
  phoneDigits        String?     // Normalized last 10 digits for exact deduplication
  email              String?
  company            String?
  source             String      @default("MANUAL")
  status             LeadStatus  @default(NEW)
  notes              String?
  companyId          String?
  companyRel         Company?    @relation(fields: [companyId], references: [id], onDelete: Cascade)
  teamId             String?
  team               Team?       @relation("TeamLeads", fields: [teamId], references: [id], onDelete: SetNull)
  assignedEmployeeId String?
  assignedEmployee   Employee?   @relation("AssignedEmployeeLeads", fields: [assignedEmployeeId], references: [id], onDelete: SetNull)
  assignedAt         DateTime?

  // --- Prospect Promotion Tracking ---
  isProspect         Boolean     @default(false)
  promotedToProspectAt DateTime?
  originalBdaId      String?
  originalBda        Employee?   @relation("OriginalBdaProspects", fields: [originalBdaId], references: [id], onDelete: SetNull)

  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt

  callLogs           CallLog[]

  @@index([leadCode])
  @@index([phoneNumber])
  @@index([phoneDigits])
  @@index([status])
  @@index([isProspect])
  @@index([originalBdaId])
  @@index([companyId])
  @@index([companyId, status])
  @@index([teamId])
  @@index([teamId, status])
  @@index([assignedEmployeeId])
  @@index([assignedEmployeeId, isProspect])
  @@index([createdAt])
  @@index([updatedAt])
  @@map("leads")
}

model CallLog {
  id              String    @id @default(cuid())
  employeeId      String
  employee        Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  leadId          String?
  lead            Lead?     @relation(fields: [leadId], references: [id], onDelete: SetNull)
  companyId       String?
  company         Company?  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  phoneNumber     String
  contactName     String?
  callType        CallType  @default(OUTGOING)
  durationSeconds Int       @default(0)
  connected       Boolean   @default(false)
  outcomeId       String?
  outcomeLabel    String?
  notes           String?
  startedAt       DateTime  @default(now())
  endedAt         DateTime?
  createdAt       DateTime  @default(now())

  @@index([employeeId])
  @@index([leadId])
  @@index([companyId])
  @@index([phoneNumber])
  @@index([startedAt])
  @@index([employeeId, startedAt])
  @@index([connected, startedAt])
  @@map("call_logs")
}

model SyncMeta {
  id            String   @id @default(cuid())
  syncType      String   @unique  // e.g. "google_sheets"
  lastRowCount  Int      @default(0)
  lastSyncedAt  DateTime @default(now())
  sheetHash     String?
  companyId     String?
  company       Company? @relation(fields: [companyId], references: [id], onDelete: Cascade)
  updatedAt     DateTime @updatedAt

  @@index([companyId])
  @@map("sync_meta")
}
```

---

### 5.2 Role-Based Access Control (RBAC) Permission Matrix

Access permissions are enforced on every route, server component, and Server Action via `lib/auth/rbac.ts` and `lib/auth/admin.ts`:

| Permission / Action | Super Admin | CEO / Executive | Human Resources (HR) | Team Lead (TL) | Telecaller (BDA) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Platform Tenant Governance (`/super-admin`)** | **Full Access** | ❌ (404/403) | ❌ (404/403) | ❌ (404/403) | ❌ (404/403) |
| **Approve / Suspend Companies** | **Full Access** | ❌ | ❌ | ❌ | ❌ |
| **Set BDA Seat Caps & Trials** | **Full Access** | ❌ | ❌ | ❌ | ❌ |
| **Ghost Mode Impersonation** | **Full Access** | ❌ | ❌ | ❌ | ❌ |
| **View Executive Dashboard & Metrics** | ❌ (Via Ghost) | **Full Company** | ❌ (Redirected) | **Squad Only** | ❌ |
| **Manage Staff (Hire / Deactivate / Reset Pass)** | ❌ | **Full Company** | **Full Company** | ❌ (Cannot manage staff) | ❌ |
| **Form, Edit & Dissolve Squads** | ❌ | **Full Company** | **Full Company** | ❌ | ❌ |
| **View Leads Pipeline (`/admin/leads`)** | ❌ | **Full Company** | ❌ (Strictly Blocked) | **Squad Leads Only** | ❌ (Mobile Only) |
| **Assign & Auto-Distribute Leads** | ❌ | **Full Company** | ❌ (Strictly Blocked) | **Squad BDAs Only** | ❌ |
| **Export Leads to Excel / CSV** | ❌ | **Full Company** | ❌ (Blocked 403) | **Squad Leads Only** | ❌ |
| **View Customer Phone Numbers (PII)** | ❌ | **Unmasked** | **Masked (`***-***-****`)**| **Unmasked (Squad)** | **Assigned Only** |
| **Prospects Closing Matrix (`/admin/prospects`)** | ❌ | **Full Company** | ❌ (Strictly Blocked) | **Squad Prospects** | ❌ |
| **Android Telephony Client Sync** | ❌ | ❌ | ❌ | ❌ | **Full Mobile** |

---

### 5.3 Lead Pipeline & Prospect State Machine

Every contact in Heeyaku transitions through explicit pipeline stages:

```mermaid
stateDiagram-v2
    [*] --> NEW: Ingested (CSV / Sheet / Webhook)
    NEW --> ASSIGNED: Single / Bulk / Round-Robin Assignment
    NEW --> CONTACTED: Direct connected call without assignment
    ASSIGNED --> CONTACTED: Connected Call (Duration > 0s)
    ASSIGNED --> NO_ANSWER: Unconnected Call (Duration = 0s)
    ASSIGNED --> BUSY: Line Busy
    ASSIGNED --> WRONG_NUMBER: Invalid Number

    CONTACTED --> INTERESTED: Positive Response (Promoted to Prospect)
    CONTACTED --> FOLLOW_UP: Demo / Follow Up Booked (Promoted to Prospect)
    CONTACTED --> CALL_BACK: Callback Requested (Promoted to Prospect)
    CONTACTED --> NOT_INTERESTED: Declined Offer
    CONTACTED --> NOT_QUALIFIED: Outside ICP

    state "PROSPECT PIPELINE (Team Lead Closing)" as ProspectGroup {
        INTERESTED --> CONVERTED: Deal Closed / Paid
        FOLLOW_UP --> CONVERTED: Deal Closed / Paid
        CALL_BACK --> CONVERTED: Deal Closed / Paid
        INTERESTED --> NOT_INTERESTED: Deal Lost
    }
```

---

### 5.4 Lead-to-Prospect Escalation Engine

When a BDA interacts with a cold lead and discovers buying intent:

1. **Trigger Condition:** The BDA selects call disposition `INTERESTED`, `CALL_BACK`, or `FOLLOW_UP`.
2. **Connected Call Verification:** The server verifies `durationSeconds > 0` in `CallLog`. If the call was not connected, the outcome is forced to `NO_ANSWER`.
3. **Escalation Execution (`app/api/employee/calls/sync/route.ts`):**
   - Stamped with `isProspect = true`.
   - `promotedToProspectAt = new Date()`.
   - If not already set, `originalBdaId = employeeId` is permanently recorded (ensuring commission and performance credit).
   - Reassignment: `assignedEmployeeId = squad.teamLeadId`.
   - Reassignment Note: `"[Auto-Escalation]: Promoted to Prospect and reassigned to Team Lead <Name>."`
4. **Closing Pipeline:** The lead vanishes from the BDA's active calling queue and appears in the Team Lead's **Prospects Closing Matrix** (`/admin/prospects`).

---

### 5.5 Exhaustive Function & Domain Service Dictionary

#### Module A: Employee & Credential Domain Services (`lib/employee/employee.service.ts`)
1. `EmployeeService.createEmployee(input, callerRole)`
   - Provisions a staff member in both PostgreSQL and Clerk.
   - Generates unique alphanumeric employee code (`EMP-XXXX`) and 10-character temporary password.
   - Hashes password using Bcrypt (10 rounds).
   - Enforces seat limit: Throws error if `role === 'BDA'` and active BDAs reach `company.maxBdas`.
2. `EmployeeService.updateEmployee(input, callerRole)`
   - Updates display name, email, phone number, role, and squad assignment.
   - Enforces immutability of Root CEO accounts. Prevents HR from editing other HR admins or promoting accounts to CEO.
3. `EmployeeService.resetPassword(employeeId, callerRole)`
   - Generates a new secure random password, updates the PostgreSQL bcrypt hash, and pushes the update to Clerk.
4. `EmployeeService.deleteEmployee(employeeId, callerId, callerRole)`
   - Permanently deletes staff member from PostgreSQL and Clerk.
   - Unassigns all assigned leads back to the unassigned pool (`assignedEmployeeId = null`).
   - Clears squad leadership if user was a Team Lead.
5. `EmployeeService.toggleStatus(employeeId, callerRole)`
   - Inverts `isActive` status. Deactivated employees are instantly denied login and excluded from auto-assignment pools.
   - Clears employee session cache via `clearEmployeeIdentityCache()`.

#### Module B: Team & Squad Domain Services (`lib/team/team.service.ts`)
6. `TeamService.createTeam({ name, description?, colorTag?, teamLeadId? })`
   - Creates a new sales squad. If `teamLeadId` is provided, updates that employee's role to `Role.TEAM_LEAD`.
7. `TeamService.updateTeam({ id, name, description?, colorTag?, teamLeadId? })`
   - Updates squad details. If a new Team Lead is appointed, automatically demotes the previous Team Lead to `Role.BDA` to eliminate phantom managerial privileges.
8. `TeamService.deleteTeam(teamId)`
   - Dissolves a squad safely. Unlinks assigned leads (`teamId = null`).
   - Demotes assigned Team Lead to `Role.BDA` (`teamId = null, team = 'General'`).

#### Module C: Lead Pipeline & Assignment Actions (`app/admin/leads/`)
9. `createLeadAction(input)` (`actions.ts`)
   - Manually creates a lead with auto-generated sequential lead code (`LD-XXXXX`).
   - Automatically computes and indexes `phoneDigits` (`phoneNumber.replace(/[^0-9]/g, '').slice(-10)`).
   - Scopes lead to Team Lead's squad if executed by a Team Lead.
10. `assignLeadsAction({ leadIds, employeeId })` (`assignment-actions.ts`)
    - Atomically assigns leads to an employee inside `prisma.$transaction`.
    - Advances leads in `NEW` to `ASSIGNED`; preserves statuses of leads already in qualification stages.
11. `autoAssignLeadsAction({ employeeIds, assignAll, leadsPerEmployee, distributionMethod })` (`assignment-actions.ts`)
    - Distributes unassigned leads across active staff using round-robin (`EVENLY`) or block (`SEQUENTIAL`) assignment.
12. `importLeadsFileAction(formData)` (`import-actions.ts`)
    - Parses CSV, XLSX, or XLS files. Performs two-phase deduplication (in-file and against database `phoneDigits`).
    - Inserts leads in batches of 1,000 records with sequential lead codes.

#### Module D: Security, Crypto & Identity Helpers
13. `signEmployeeToken(data, expiresInDays = 30)` (`lib/auth/employee-token.ts`)
    - Issues URL-safe HMAC-SHA256 bearer tokens for mobile clients.
14. `verifyEmployeeToken(token)` (`lib/auth/employee-token.ts`)
    - Constant-time token verification using `crypto.timingSafeEqual`.
15. `checkRateLimit(key, { windowMs, maxAttempts })` (`lib/security/rate-limit.ts`)
    - In-memory sliding-window rate limiter protecting login and sensitive endpoints.

---

### 5.6 Resolved Engineering Pitfalls & Security Fixes (The Bug Ledger)

During past revisions, eleven major engineering defects were audited and permanently resolved. **Interns and engineers must never reintroduce these patterns**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          SUMMARY OF PERMANENTLY RESOLVED DEFECTS                       │
├─────────┬──────────┬───────────────────────────────────────────────────────────────────┤
│ ID      │ Severity │ Core Defect & Applied Architectural Remedy                        │
├─────────┼──────────┼───────────────────────────────────────────────────────────────────┤
│ SEC-01  │ Critical │ BOLA Squad Isolation Bypass in app/admin/leads/page.tsx:          │
│         │          │ JavaScript object spread ({ ...a, ...b }) with consecutive OR     │
│         │          │ keys overwrote squad filters. Replaced with explicit Prisma       │
│         │          │ AND: [ { teamId }, { employeeId } ] array.                        │
├─────────┼──────────┼───────────────────────────────────────────────────────────────────┤
│ SEC-02  │ Critical │ Orphaned Team Lead Privilege Escalation:                          │
│         │          │ Dissolving a team left Team Leads with teamId: null, causing      │
│         │          │ targetTeamId queries to evaluate to {} (full global access).      │
│         │          │ Added auto-demotion to BDA and fail-closed targetTeamId sentinel. │
├─────────┼──────────┼───────────────────────────────────────────────────────────────────┤
│ BUG-01  │ Critical │ Hex vs Sequential Lead Code Collision (P2002 Crash):              │
│         │          │ Google Sheets sync created LD-C9F1A4; parseInt() on hex returned  │
│         │          │ NaN, resetting lead counter to 1 and crashing subsequent imports.  │
│         │          │ Unified lead code generator with regex numeric filtering.         │
├─────────┼──────────┼───────────────────────────────────────────────────────────────────┤
│ BUG-02  │ High     │ Lead Deduplication Bypass in Manual Actions:                      │
│         │          │ createLeadAction and updateLeadAction omitted phoneDigits,        │
│         │          │ allowing duplicates from webhooks. Added normalized 10-digit sync.│
├─────────┼──────────┼───────────────────────────────────────────────────────────────────┤
│ BUG-03  │ High     │ Pipeline Stage Regression in Auto-Assignment:                     │
│         │          │ Auto-assign scripts unconditionally set status = 'ASSIGNED',      │
│         │          │ erasing progress on INTERESTED / CALL_BACK leads. Scoped status   │
│         │          │ updates strictly to leads where status === 'NEW'.                  │
├─────────┼──────────┼───────────────────────────────────────────────────────────────────┤
│ BUG-04  │ High     │ Telemetry Loss via Cascade Delete:                                │
│         │          │ Deleting an employee cascaded and purged all historical CallLogs. │
│         │          │ Changed foreign key to SetNull or blocked hard employee deletion. │
├─────────┼──────────┼───────────────────────────────────────────────────────────────────┤
│ BUG-05  │ Medium   │ Phantom Managerial Privileges on Replaced Team Leads:             │
│         │          │ Updating a squad's Team Lead never demoted the previous lead.     │
│         │          │ Added transactional demotion to Role.BDA for replaced leads.      │
├─────────┼──────────┼───────────────────────────────────────────────────────────────────┤
│ BUG-06  │ Medium   │ UTC Server Timezone Skew:                                         │
│         │          │ Server running in UTC calculated today's metrics from 5:30 AM IST.│
│         │          │ Enforced Intl.DateTimeFormat with explicit Asia/Kolkata timezone. │
├─────────┼──────────┼───────────────────────────────────────────────────────────────────┤
│ BUG-07  │ Medium   │ Ghost Leads in Android Offline Cache:                             │
│         │          │ Mobile additive cache merge retained unassigned leads indefinitely.│
│         │          │ Switched to authoritative server replacement on fresh fetches.    │
├─────────┼──────────┼───────────────────────────────────────────────────────────────────┤
│ SEC-03  │ Medium   │ API Secret Leakage via URL Query Parameter:                       │
│         │          │ Deprecated ?apiKey= in URLs to prevent plaintext logging in CDNs. │
│         │          │ Enforced x-api-key and Authorization: Bearer headers.             │
├─────────┼──────────┼───────────────────────────────────────────────────────────────────┤
│ SEC-04  │ Medium   │ Wildcard Domain Matching in Root CEO Check:                       │
│         │          │ ADMIN_EMAIL=@heeyaku.com granted all company domain users CEO.    │
│         │          │ Restricted to explicit, comma-separated email addresses.          │
└─────────┴──────────┴───────────────────────────────────────────────────────────────────┘
```

---

## 6. Zero-Cost Cloud Infrastructure Architecture

For startups operating with zero hosting budget, Heeyaku can run in production for up to 150 concurrent BDAs at **₹0 / $0 monthly baseline cost**:

```
┌────────────────────────────────┐
│   Frontend: Cloudflare Pages   │  ◄── Custom Domain: app.heeyaku.com
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
│   Database: Oracle Cloud VM    │  ◄── Host: VM.Standard.E2.1.Micro (Always Free)
│  (PostgreSQL 18 + PgBouncer)   │      4 GB Swap Airbag, Tuned Memory, Stress-Tested @ 45 QPS
└────────────────────────────────┘
```

### Database Safety Airbag (Oracle Cloud Always-Free)
- **Compute:** 1/8 OCPU AMD EPYC, 1 GB Physical RAM.
- **Memory Safety Shield:** **4.0 GB Swap file** (`/swapfile`, `swappiness=20`) provides ~5 GB total virtual address space, eliminating Out-Of-Memory (OOM) kernel kills.
- **PgBouncer Configuration:** Transaction pooling on port 6432 with `max_client_conn = 300` and `default_pool_size = 20`.

---

## 7. Step-by-Step Operational Runbook (The Intern's Guide)

### 7.1 Prerequisites & Local Environment Setup

1. **System Requirements**:
   - Node.js `20.x` or `22.x` LTS
   - npm `10.x+`
   - Git
   - PostgreSQL 16+ instance (Local, Docker, or Supabase Mumbai `ap-south-1`)
2. **Clone Repository & Install Dependencies**:
   ```bash
   git clone <REPO_URL>
   cd heeyaku
   npm install
   ```

---

### 7.2 Master Environment Variables Reference (`.env`)

Create `.env` in the project root:

```env
# ==============================================================================
# 1. DATABASE CONNECTION (PostgreSQL with PgBouncer)
# ==============================================================================
# Transaction Pooler connection string (used by Next.js runtime and API routes)
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=15&pool_timeout=30"

# Direct DDL connection string (used exclusively by Prisma schema migrations)
DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# ==============================================================================
# 2. CLERK AUTHENTICATION (Web Admin Portal)
# ==============================================================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_placeholder_key"
CLERK_SECRET_KEY="sk_test_placeholder_key"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/admin/dashboard"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/admin/dashboard"

# ==============================================================================
# 3. PLATFORM & TENANT ACCESS CONTROL
# ==============================================================================
# App-Level Super Admin emails (comma-separated list for /super-admin governance)
SUPER_ADMIN_EMAILS="platform-admin@heeyaku.com,owner@heeyaku.com"

# Immutable Root CEO email allowlist (comma-separated, fail-closed)
ADMIN_EMAIL="founder@yourstartup.com,ops@yourstartup.com"

# ==============================================================================
# 4. MOBILE CALL TRACKER TELEPHONY SECRETS
# ==============================================================================
# 64-character hex secret for signing mobile employee HS256 JWT tokens
EMPLOYEE_JWT_SECRET="e9b2a7c4f1d8e0a3b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8"

# ==============================================================================
# 5. EXTERNAL INGESTION & WEBHOOKS
# ==============================================================================
# API key for landing pages, Meta Lead Ads, and Zapier intake
EXTERNAL_INGESTION_API_KEY="crm_sync_secure_api_key_xxxxxxxxxxxxxxxx"

# Optional: Default Google Sheet URL for 1-click sync testing
GOOGLE_SHEET_URL="https://docs.google.com/spreadsheets/d/your_sheet_id/edit#gid=0"
```

---

### 7.3 Database Synchronization & Migration

Push the schema directly to your PostgreSQL database:

```bash
# Push schema changes to database
npx prisma db push

# Generate fresh Prisma Client typings
npx prisma generate
```

Start the local Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the public landing page, or [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard) for the CRM dashboard.

---

### 7.4 Operating Each Portal & Role

#### A. Super Admin Operations (`/super-admin`)
- **Access Route:** `http://localhost:3000/super-admin`
- **Precondition:** Log in with a Clerk account whose email is listed in `SUPER_ADMIN_EMAILS`.
- **Key Tasks**:
  1. **Review Pending Verifications:** Review incoming company registrations. Click **Approve & Activate** to set BDA caller seat limits (`maxBdas`) and trial duration.
  2. **1-Click Master Kill-Switch:** Toggle any company's status between `Active` and `Suspended`. Suspension takes effect in 0ms across web and mobile dialers.
  3. **Manage BDA Caller Caps:** Open the **Manage** drawer to increase or decrease caller seats.
  4. **Ghost Mode Impersonation:** Click **"View as CEO"** to enter the tenant's workspace and troubleshoot issues directly. Click **"Exit Ghost Mode"** in the top bar when finished.

#### B. Company Registration & Onboarding Lifecycle
1. New business owner signs up at `/sign-up`.
2. Redirected to `/onboarding` to enter: Company Name, Workspace Slug, Official Phone, Industry, and Requested BDA Seats.
3. System provisions `Company` with `status: PENDING_VERIFICATION` and creates the owner as `Role.CEO`.
4. CEO is redirected to `/verification-pending` until Super Admin approval. Once approved, refreshing the page opens `/admin/dashboard`.

#### C. Founder / CEO Operations (`/admin/*`)
- **Executive Dashboard (`/admin/dashboard`):** Real-time conversion funnel, team talk time, connection rate, and daily outbound volume.
- **Importing Leads (`/admin/leads`):**
  - Click **"Import Leads"** to upload CSV or XLSX spreadsheets.
  - The system auto-detects column mappings (`Name`, `Phone`, `Email`, `Company`, `Notes`) and executes two-phase deduplication against `phoneDigits`.
- **Auto-Distribution:** Select unassigned leads and click **"Auto Assign"** to distribute them evenly (round-robin) across active sales reps without overwriting qualified pipeline stages.
- **Squad Management (`/admin/teams`):** Form sales squads, assign squad color tags, appoint Team Leads, and reassign BDAs.

#### D. Human Resources (HR) Operations (`/admin/employees`)
- **Staff Provisioning:** Click **"Add Associate"** to input Name, Email, Phone, Role (`BDA` or `TEAM_LEAD`), and Squad.
- The system generates an alphanumeric code (`EMP-XXXX`) and temporary password, hashing credentials in PostgreSQL and synchronizing to Clerk.
- **Privacy Compliance (PII Redaction):** HR accounts are strictly blocked from viewing customer leads and lead export endpoints. When viewing employee performance, customer names and numbers are automatically masked (`Confidential Lead`, `***-***-****`).

#### E. Team Lead Operations (`/admin/leads`, `/admin/prospects`)
- **Squad Isolation:** Team Leads are strictly scoped to leads belonging to their assigned squad (`teamId`).
- **Prospects Closing Matrix (`/admin/prospects`):** When BDAs qualify leads as `INTERESTED` or `FOLLOW_UP`, leads are automatically escalated to the Team Lead. The Team Lead reviews prior call notes, plays call recordings, dials the prospect, and updates status to `CONVERTED`.

#### F. BDA Mobile Operations (Android App)
1. **Login:** Open the Android Call Tracker app. Enter Employee Code (`EMP-XXXX`) or email, along with the temporary password.
2. **Lead Queue:** The app synchronizes assigned leads into native offline storage.
3. **Outbound Calling:** Tap the **Call** button on any lead card to dial via the native Android phone dialer.
4. **Mandatory Post-Call Disposition Gate:**
   - When the call ends, a modal appears automatically.
   - Select disposition: `Interested`, `Follow Up`, `Callback`, `No Answer`, `Busy`, `Wrong Number`, `Not Interested`.
   - Add conversation notes.
   - Optional: Tap **"Send WhatsApp"** to launch WhatsApp with a pre-filled template.
5. **Offline Telemetry:** If calling in an area with poor connectivity, records are stored in local SharedPreferences and automatically synchronized when connection is restored.

---

### 7.5 Master API Reference

| HTTP Method | Route | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/employee/auth/login` | None (Rate Limited) | BDA mobile authentication. Returns 30-day HMAC JWT. |
| `GET` | `/api/employee/auth/me` | `Bearer <token>` | Verifies mobile token and returns profile and squad details. |
| `GET` | `/api/employee/leads` | `Bearer <token>` | Fetches leads assigned to the authenticated BDA. |
| `POST` | `/api/employee/leads/[leadId]/disposition`| `Bearer <token>` | Mandatory disposition gate. Enforces connected call talk-time rules. |
| `POST` | `/api/employee/calls/sync` | `Bearer <token>` | Batch syncs call records, updates lead status, and triggers prospect escalation. |
| `GET` | `/api/employee/analytics` | `Bearer <token>` | Returns today and monthly calling KPIs for the authenticated BDA. |
| `POST` | `/api/v1/leads/ingest` | `x-api-key: <KEY>` | External webhook for landing pages, Meta Lead Ads, and Zapier. |
| `POST` | `/api/v1/integrations/google-sheets/sync` | Clerk Admin Session | Executes bidirectional Google Sheets synchronization. |
| `GET` | `/api/admin/leads/export` | Clerk Admin Session | Streams CSV/XLSX export with formula injection protection (Blocked for HR). |
| `POST` | `/api/demo` | None | Public lead intake form from the landing page. |
| `GET` | `/api/download/apk` | None | Direct binary download endpoint for Android Call Tracker APK. |

---

### 7.6 Troubleshooting & Production Playbook

#### Issue 1: Clerk Authentication Times Out or Throws 500
- **Root Cause:** Network latency reaching Clerk API servers from local development or serverless environments.
- **Resolution:** The codebase features a fast-path in `lib/auth/rbac.ts` that matches `clerkUserId` directly in PostgreSQL, followed by direct REST fallback to `https://api.clerk.com/v1/users/${userId}` using `CLERK_SECRET_KEY`. Verify `CLERK_SECRET_KEY` is set correctly in `.env`.

#### Issue 2: PostgreSQL Throws "Too Many Connections" or Pool Starvation
- **Root Cause:** Next.js Server Actions opening direct connections without pooling.
- **Resolution:** Ensure `DATABASE_URL` points to PgBouncer (port `6432`) with `?pgbouncer=true&connection_limit=15&pool_timeout=30`. Only schema migrations should use `DIRECT_URL` (port `5432`).

#### Issue 3: Mobile BDA Receives 403 Forbidden on Sync
- **Root Cause:** Either the company workspace has been suspended via the Super Admin kill-switch, or the BDA account has been deactivated by HR.
- **Resolution:**
  - Check `company.status` in PostgreSQL. If `SUSPENDED_BY_ADMIN`, reactivate the company in `/super-admin`.
  - Check `employee.isActive`. If `false`, reactivate the employee in `/admin/employees`.

#### Issue 4: Disposition Fails with "Connected Call Required"
- **Root Cause:** A BDA attempted to mark a lead as `CONTACTED`, `INTERESTED`, or `CONVERTED` without a verified connected call record (`durationSeconds > 0`).
- **Resolution:** This is an intentional anti-fraud gate. The sales rep must actually connect with the prospect before qualifying the lead.

#### Issue 5: CSV Import Skips Leads Due to Duplicate Numbers
- **Root Cause:** The phone number already exists in the company's database under the normalized `phoneDigits` index.
- **Resolution:** Heeyaku prevents duplicate dialing records. If new notes or campaigns apply to an existing lead, update the lead directly or append details via `/api/v1/leads/ingest`.

---

## 8. License & Operational Governance

Proprietary software developed for Heeyaku enterprise sales operations. All rights reserved. Unauthorized reproduction, distribution, or reverse-engineering is strictly prohibited.
