# Heeyaku: Future Architecture & Startup Roadmap

This document serves as the master blueprint for transitioning **Heeyaku** from an internal sales tracking tool into a scalable, high-growth, **Multi-Tenant B2B SaaS Startup** operating at **$0 / ₹0 lifetime baseline hosting cost**.

---

## Table of Contents
1. [Cost & Infrastructure (Free for Life Stack)](#1-cost--infrastructure-free-for-life-stack)
2. [Multi-Tenancy & Data Isolation](#2-multi-tenancy--data-isolation)
3. [App-Level Super Admin & Instant Kill-Switch](#3-app-level-super-admin--instant-kill-switch)
4. [Razorpay Subscriptions (Auto-Debit & Auto-Discontinue)](#4-razorpay-subscriptions-auto-debit--auto-discontinue)
5. [Call Audio Recording Storage & Lifecycle Archive](#5-call-audio-recording-storage--lifecycle-archive)
6. [Android Mobile App SaaS Enhancements](#6-android-mobile-app-saas-enhancements)
7. [SaaS Monetization, Seat Gating & Growth Features](#7-saas-monetization-seat-gating--growth-features)
8. [Lead-to-Prospect Escalation & Team Lead Auto-Assignment](#8-lead-to-prospect-escalation--team-lead-auto-assignment)
9. [Implementation Phases Summary](#9-implementation-phases-summary)

---

## 1. Cost & Infrastructure (Free for Life Stack)

To support 100+ employees and multiple tenant companies with zero monthly hosting fees, the infrastructure leverages AWS and Cloudflare's **Always Free** tiers:

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND & CDN                         │
│  Cloudflare Pages (Next.js Static Export / Edge)           │
│  • $0 Bandwidth / Unlimited Egress                          │
│  • Unlimited Static Requests, 500 Builds/month             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND COMPUTE                        │
│  AWS Lambda with Function URLs (No API Gateway needed)      │
│  • 1,000,000 Invocations/month Always Free                 │
│  • 400,000 GB-seconds compute Always Free                  │
│  • Function URLs eliminate API Gateway 12-month expiration  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      CORE DATABASE                          │
│  Amazon DynamoDB (Single-Table Design: `heeyaku_core`)      │
│  • 25 GB Storage Always Free (stores ~25M records / 5-7 yrs)│
│  • 25 WCU / 25 RCU Provisioned Capacity Always Free         │
└─────────────────────────────────────────────────────────────┘
```

### DynamoDB Single-Table Schema Blueprint
All tenant entities reside in a single table `heeyaku_core` partitioned by company:

| Entity | Partition Key (`PK`) | Sort Key (`SK`) | Description |
| :--- | :--- | :--- | :--- |
| **Company** | `COMPANY#<companyId>` | `METADATA` | Profile, billing status, admin status, plan |
| **Employee** | `COMPANY#<companyId>` | `EMP#<employeeId>` | Staff profile, role (CEO, TL, BDA), Clerk ID |
| **Team** | `COMPANY#<companyId>` | `TEAM#<teamId>` | Squad details & Team Lead mapping |
| **Lead** | `COMPANY#<companyId>` | `LEAD#<leadId>` | Customer details, phone number, status |
| **Call Log** | `COMPANY#<companyId>` | `CALL#<callId>` | Duration, outcome notes, recording URL |
| **Daily KPI Stats** | `COMPANY#<companyId>` | `STATS#TODAY#<YYYY-MM-DD>` | Real-time atomic counters (replaces SQL `groupBy`) |
| **Invoice** | `COMPANY#<companyId>` | `INVOICE#<invoiceId>` | Razorpay payment records & invoices |

#### Global Secondary Indexes (GSIs):
* **GSI1 (Platform & Clerk Discovery):**
  * `GSI1PK = CLERK#<clerkUserId>` $\rightarrow$ instant resolution of which company an employee belongs to.
  * `GSI1PK = PLATFORM` $\rightarrow$ allows Super Admin to list all companies across the system.
* **GSI2 (Employee/Team Feed):**
  * `GSI2PK = COMPANY#<companyId>#EMP#<employeeId>`, `GSI2SK = STATUS#<status>#UPDATED#<date>`.
* **GSI3 (Lead Phone Deduplication):**
  * `GSI3PK = COMPANY#<companyId>#PHONE`, `GSI3SK = DIGITS#<phoneDigits>`.

---

## 2. Multi-Tenancy & Data Isolation

### Strict Tenant Data Isolation Rule
1. Every query in the application must use `PK = COMPANY#<companyId>`.
2. Because DynamoDB partitions data physically by Partition Key, Company A cannot read or modify Company B's leads or call logs.

### Dual-Gate Status Model
To prevent automatic payments from inadvertently overriding an administrative suspension:

```typescript
enum AdminStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED_BY_ADMIN = 'SUSPENDED_BY_ADMIN' // Super Admin manual ban
}

enum BillingStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',                   // Subscription paid & current
  GRACE_PERIOD = 'GRACE_PERIOD',       // Payment failed, 72-hour retry window
  HALTED = 'HALTED',                   // Retries exhausted, auto-discontinued
  CANCELLED = 'CANCELLED'              // CEO cancelled subscription
}
```

**Operational Rule:**
$$\text{CanOperate} = (\text{adminStatus} == \text{ACTIVE}) \land (\text{billingStatus} \in \{\text{ACTIVE}, \text{TRIAL}, \text{GRACE\_PERIOD}\})$$

---

## 3. App-Level Super Admin & Instant Kill-Switch

### Capabilities of Super Admin (Platform Owner)
* **Access Route:** `/super-admin` (Restricted to platform owner emails).
* **Company Directory:** View all onboarded companies, employee counts, monthly revenue, and health.
* **1-Click Instant Kill-Switch:**
  * Toggle button `[ Suspend Company Operations ]`.
  * Instantly sets `adminStatus: SUSPENDED_BY_ADMIN` on the company record.
  * Every API request from any employee of that company immediately rejects with `403 Forbidden`.
* **Reactivate Button:**
  * One-click restore to `adminStatus: ACTIVE`.
  * If the company's Razorpay subscription is valid, operations resume instantly without data re-entry.

---

## 4. Razorpay Subscriptions (Auto-Debit & Auto-Discontinue)

### Subscription Flow
1. **CEO Plan Selection:** CEO chooses a plan (Starter / Growth / Enterprise) and authorizes recurring e-Mandate (UPI Autopay or Credit/Debit Card).
2. **Recurring Auto-Debit:** Razorpay automatically debits the account monthly on the renewal date.

### Automated Webhook Lifecycle (`/api/webhooks/razorpay`)
All billing events are handled asynchronously via HMAC-verified webhooks:

| Webhook Event | System Reaction |
| :--- | :--- |
| `subscription.charged` | Payment succeeded. Sets `billingStatus = ACTIVE`, updates `currentPeriodEnd`, clears grace periods. |
| `subscription.pending` | Initial charge failed. Enters **72-Hour Grace Period** (`billingStatus = GRACE_PERIOD`). Telecallers stay active; CEO sees a warning banner to update card/UPI. |
| `subscription.halted` | All Razorpay retries (3 attempts) failed. **Trigger Auto-Discontinue:** Sets `billingStatus = HALTED`. Access is locked out immediately. |
| `subscription.cancelled` | Subscription cancelled. Allows operations until `currentPeriodEnd`, then halts. |

---

## 5. Call Audio Recording Storage & Lifecycle Archive

### The Audio Storage Strategy
* **Audio Optimization on Mobile:**
  * Android records in **AAC-HE / Opus / AMR-WB** mono at 16–24 kbps.
  * Average 2-minute call is compressed to **~250–300 KB** (85% smaller than raw audio).
* **Direct Client-to-Cloud Upload (Presigned URLs):**
  * Android requests a presigned PUT URL from Next.js.
  * Phone uploads audio directly to S3 / Cloudflare R2.
  * Next.js server consumes **0 MB bandwidth and 0 RAM**.

### 1-Week Hot + Glacier Deep Archive Strategy
* **Day 1 to 7 (S3 Standard / Cloudflare R2):**
  * Recordings are stored in hot storage for instant streaming in the manager dashboard (`[ ▶ Play Audio ]` in 200ms).
* **Day 8+ (AWS S3 Glacier Deep Archive):**
  * AWS S3 Lifecycle rule automatically sweeps objects older than 7 days into **Glacier Deep Archive**.
  * Storage cost drops to **$0.00099 / GB / month** (~**₹85 / month per 1,000 GB**).
* **UI Restore Flow for Archived Calls (> 7 days):**
  * Dashboard displays `[ 📦 Request from Archive ]`.
  * API calls `RestoreObjectCommand` (tier: Standard, 9–12 hours).
  * When restored, audio is playable for 3 days before freezing again.

---

## 6. Android Mobile App SaaS Enhancements

1. **Multi-Tenant Login:**
   * Support login via **Company Code** (`ACME`) + Employee Code, or email auto-discovery that routes the BDA to their company's partition.
2. **In-App Version Checker & Auto-Update:**
   * Mobile app checks `/api/download/apk/version` on launch.
   * Prompts user when a newer APK is available for seamless private distribution outside the Google Play Store.
3. **1-Click WhatsApp Integration:**
   * After completing a call disposition (*"Interested"* / *"Follow Up"*), show a 1-click button to launch WhatsApp with a pre-formatted message template.
4. **Lead Phone Number Masking:**
   * Web dashboard masks customer numbers for BDAs (`+91 98765 •••••`).
   * Mobile app dials via Android Intent without allowing the BDA to copy the raw number, preventing customer database theft.

---

## 7. SaaS Monetization, Seat Gating & Growth Features

### Recommended Pricing Tiers (Per-Seat Monthly Model)
* **Starter Plan (₹1,499 / month):** Up to 10 BDAs, 7-day recording retention.
* **Growth Plan (₹3,999 / month):** Up to 35 BDAs, 30-day recording retention.
* **Enterprise Plan (₹7,999 / month):** Unlimited BDAs, custom cold archive retention, priority support.

### Feature & Seat Limit Enforcement
* Backend checks `activeEmployeeCount < plan.maxAllowedSeats` before allowing new employee creation.
* Automated 7:00 PM daily summary email to company CEOs via AWS SES / Resend:
  * Total calls made, talk time, connection rate, and top performer spotlight.

---

## 8. Lead-to-Prospect Escalation & Team Lead Auto-Assignment

### Core Workflow Rules
1. **Cold Lead Filtering (BDA Phase):** BDAs dial cold intake data to filter out invalid or uninterested contacts (`NO_ANSWER`, `BUSY`, `WRONG_NUMBER`, `NOT_INTERESTED`).
2. **Automated Promotion to Prospect:**
   * When a BDA sets the disposition to **`INTERESTED`**, **`CALL_BACK`**, or **`FOLLOW_UP`**, the item is elevated from a **Lead** to a **Prospect**.
   * **Reassignment:** Ownership is automatically transferred to the **Team Lead (TL)** of that BDA's team (`assignedEmployeeId = team.teamLeadId`).
   * **Attribution:** The original BDA's ID is retained in `originalBdaId` to ensure performance attribution and commission tracking.
3. **Closing Pipeline (Team Lead Phase):**
   * The BDA can no longer call or edit the prospect.
   * The Prospect appears in the Team Lead's dedicated **"Team Prospects"** pipeline.
   * The Team Lead conducts the closing call, product demo, pricing negotiations, and final conversion.

### Schema Fields
* `isProspect: Boolean` (default: false)
* `promotedToProspectAt: DateTime?`
* `originalBdaId: String?` (references Employee)

---

## 9. Implementation Phases Summary

* **Phase 1:** Single-Table DynamoDB schema setup (`scripts/setup-dynamodb-table.ts`) and AWS SDK client.
* **Phase 2:** Multi-Tenant repository layer (Leads, Calls, Employees, Teams, Company Metadata).
* **Phase 3:** Lead $\rightarrow$ Prospect escalation engine & Team Lead auto-assignment logic.
* **Phase 4:** Dashboard atomic counters (`STATS#TODAY#<date>`) to replace SQL `groupBy`.
* **Phase 5:** Central Gatekeeper middleware, App-Level Super Admin dashboard & kill-switch.
* **Phase 6:** Razorpay Subscriptions integration, webhook handler, and automated grace period engine.
* **Phase 7:** S3 Presigned URL audio upload, 7-day lifecycle rule, and archive restore flow.
* **Phase 8:** Android multi-tenant login screen, in-app updater, and deployment to Cloudflare Pages.

