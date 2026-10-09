# HEEYAKU — High-Velocity Telephony & Sales CRM

> Complete Startup Telephony CRM platform featuring an executive web admin dashboard, automatic lead assignment, spreadsheet ingestion, and real-time mobile call tracking integration.

---

## 🚀 Key Features

* **Founder & Admin Dashboard**: Real-time sales telemetry, team talk time, connection rate, and conversion pipeline metrics.
* **Lead Ingestion Engine**:
  * Bulk import from CSV & XLSX spreadsheets with automatic header detection and phone normalization.
  * 1-Click live Google Sheets sync.
  * REST API ingestion (`POST /api/v1/leads/ingest`) for webhooks, Meta Ads, and marketing sites.
* **Smart Lead Distribution**:
  * Manual assignment with instant search and multi-select.
  * Automated round-robin and even-batch lead distribution.
* **Telephony Synchronization**:
  * Connects with the companion Android Call Tracker app.
  * Real-time talk time tracking, call connection detection, and mandatory post-call dispositions.
  * WhatsApp follow-up redirect integration.
* **Production-Grade Security**:
  * Multi-layer authentication with Clerk SSO and bcrypt-hashed employee credentials.
  * Role-based access control with fail-closed admin email whitelist (`ADMIN_EMAIL`).
  * Rate-limiting, HMAC token validation, strict CSP, and security headers.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 16 (App Router with Turbopack) & React 19
* **Database**: PostgreSQL (Supabase) with Prisma ORM 6
* **Authentication**: Clerk (Admin Web Portal) & Custom JWT + Bcrypt (Mobile Sales Staff)
* **Styling**: Tailwind CSS v4, Lucide Icons, Sonner Notifications
* **Deployment**: Vercel (Configured for Mumbai `bom1` region to minimize DB latency)

---

## 🏁 Quick Start

### 1. Prerequisites
* Node.js 20+
* PostgreSQL database (e.g. Supabase)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```
Fill in your database URL, Clerk keys, and authorized admin email:
```env
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_placeholder_key"
CLERK_SECRET_KEY="clerk_secret_key_placeholder"
ADMIN_EMAIL="founder@yourstartup.com"
EMPLOYEE_JWT_SECRET="secure_random_hex_string"
EXTERNAL_INGESTION_API_KEY="crm_sync_secure_api_key_..."
```

### 4. Database Sync
```bash
npx prisma db push
npx prisma generate
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the public landing page, or [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard) for the CRM admin panel.

---

## 📖 Operational Documentation

For complete access details, credentials setup, API schemas, and mobile app integration, refer to:
* **[ACCESS_DETAILS.md](ACCESS_DETAILS.md)** — Master guide for roles, credentials, endpoints, and workflows.

---

## 📦 Production Build

```bash
npm run build
npm run start
```
