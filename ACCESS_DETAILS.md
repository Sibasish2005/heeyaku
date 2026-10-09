# HEEYAKU STARTUP CRM — MASTER ACCESS & OPERATIONS GUIDE

> **Production Reference Manual**  
> Complete operational specifications, access credentials, API endpoints, role permissions, and integration guides for running Heeyaku as a high-velocity Startup Telephony CRM.

---

## 1. System Overview & Architecture

Heeyaku is an integrated Enterprise Telephony & Outbound Sales CRM tailored for fast-moving startups and high-touch sales teams (BDAs / SDRs / Account Executives).

```
                                  ┌─────────────────────────────────────┐
                                  │      SUPABASE POSTGRESQL (DB)       │
                                  │  • employees (sales accounts)       │
                                  │  • leads (pipeline prospects)       │
                                  │  • call_logs (telephony telemetry)  │
                                  └──────────────────┬──────────────────┘
                                                     │
                                      (Prisma ORM Client / Edge Pooler)
                                                     │
                     ┌───────────────────────────────┴───────────────────────────────┐
                     ▼                                                               ▼
┌─────────────────────────────────────────┐                     ┌─────────────────────────────────────────┐
│         FOUNDER / ADMIN PORTAL          │                     │         MOBILE TELEPHONY CLIENT         │
│         Next.js Web Dashboard           │                     │        React Native Android App         │
│                                         │                     │                                         │
│ • Real-time conversion & call metrics   │                     │ • Server-assigned lead queue            │
│ • Bulk CSV/XLSX & Google Sheet import   │                     │ • Native phone dialer & duration timer  │
│ • Round-Robin & auto lead distribution  │                     │ • Mandatory disposition / outcome gate  │
│ • Live BDA talk-time monitoring         │                     │ • Offline resilient telemetry queue     │
│ • Filtered CSV / Excel data exports     │                     │ • Post-call WhatsApp redirect engine    │
└─────────────────────────────────────────┘                     └─────────────────────────────────────────┘
```

---

## 2. Access Portals & Role Breakdown

### Role 1: Super Admin / Founder
The Admin Portal provides executive oversight, pipeline control, associate monitoring, and bulk data operations.

* **Portal URL**: `https://<YOUR_DOMAIN>/admin/dashboard`
* **Direct Access Sub-Pages**:
  * **Lead Pipeline**: `https://<YOUR_DOMAIN>/admin/leads`
  * **Team Management**: `https://<YOUR_DOMAIN>/admin/employees`
  * **Associate Performance**: `https://<YOUR_DOMAIN>/admin/employees/<employeeId>`
* **Authentication Method**: Clerk Secure Authentication (`/sign-in`)
* **Authorization Guard**:
  * Controlled by the `ADMIN_EMAIL` environment variable in `.env`.
  * Accepts single or comma-separated emails (e.g., `founder@startup.com,ops@startup.com`).
  * **Fail-closed security**: If an authenticated Clerk account does not match an email in `ADMIN_EMAIL`, access is strictly rejected with a 403 Forbidden alert.

---

### Role 2: Sales Associate / BDA (Business Development Associate)
Sales Associates interact directly with leads through the mobile telephony dialer and backend CRM sync.

* **Identifier Format**: Sequential employee code `EMP-XXXX` (e.g., `EMP-1001`, `EMP-1002`) or registered work email.
* **Authentication Method**: Bcrypt password verification via `POST /api/employee/auth/login`.
* **Session Lifecycle**: 30-day cryptographically signed HMAC-SHA256 bearer token.
* **Onboarding Process**:
  1. Founder opens `https://<YOUR_DOMAIN>/admin/employees`.
  2. Clicks **"Add Associate"**.
  3. Enters Name, Email, Phone, and Team (`General`, `Inbound`, `Outbound`, etc.).
  4. System automatically generates the unique `EMP-XXXX` code and temporary password.
  5. The associate logs into the mobile app using either their `employeeCode` or `email` along with the assigned password.
  6. Admins can toggle account status (`Active` / `Inactive`) or reset passwords with one click.

---

### Role 3: Mobile Telephony App (Call Tracker Android)
Turns any company Android smartphone into an automated call logger without requiring expensive cloud telephony PBX hardware.

* **Download APK**: `https://<YOUR_DOMAIN>/download` (Direct binary download via `/api/download/apk`)
* **Mobile Configuration**:
  * Set API Base URL: `https://<YOUR_DOMAIN>`
* **Required Android Permissions**:
  * `READ_PHONE_STATE` (Detect ringing, offhook, call disconnect)
  * `CALL_PHONE` (Direct click-to-dial from lead card)
  * `READ_CALL_LOG` (Calculate precise talk time duration)
* **Offline Resilience**:
  * If calls are placed in low-connectivity areas, records are buffered in persistent local storage.
  * The queue automatically retries syncing whenever the network reconnects.

---

## 3. Lead Ingestion & Pipeline Management

### Lead Status Pipeline Matrix

| Status | Code | Meaning |
| :--- | :--- | :--- |
| **New** | `NEW` | Uncontacted inbound lead or newly imported row |
| **Assigned** | `ASSIGNED` | Allocated to a sales associate awaiting first outreach |
| **Contacted** | `CONTACTED` | Call connected (> 0s duration) with prospect |
| **Interested** | `INTERESTED` | Expressed product interest, pitch in progress |
| **Follow Up** | `FOLLOW_UP` | Scheduled follow-up session or demo booked |
| **Call Back** | `CALL_BACK` | Prospect requested a callback at a later time |
| **Converted** | `CONVERTED` | Deal closed / Sale won |
| **Busy** | `BUSY` | Line busy during attempt |
| **No Answer** | `NO_ANSWER` | Ringing with no response (0s duration) |
| **Wrong Number**| `WRONG_NUMBER`| Invalid or unreachable contact number |
| **Not Interested** | `NOT_INTERESTED` | Prospect declined the offering |
| **Not Qualified** | `NOT_QUALIFIED` | Does not fit target demographic / ICP |
| **Other** | `OTHER` | Miscellaneous disposition |

---

### Ingestion Channels

#### Method A: Admin CSV / XLSX Upload
* Go to `/admin/leads` -> Click **"Import Leads"**.
* Drop any spreadsheet file (.csv, .xlsx, .xls).
* The parser automatically detects column headers (`Name`, `Phone`, `Email`, `Company`, `Notes`).
* Automatically cleans and normalizes phone numbers (removes country codes, handles 10-digit formats).
* Identifies duplicates against existing database records before writing.
* Offers optional immediate bulk assignment to an active associate.

#### Method B: Live Google Sheets Sync
* Go to `/admin/leads` -> Click **"Sync Google Sheet"**.
* Paste any public Google Sheet link (e.g. connected to Google Forms, Meta Ads, or Typeform).
* Syncs new rows directly without creating duplicate entries.

#### Method C: External REST API Ingestion
Integrate marketing landing pages, Facebook Lead Ads, Webflow, Zapier, or Make.com:

* **Endpoint**: `POST /api/v1/leads/ingest`
* **Header**: `x-api-key: <EXTERNAL_INGESTION_API_KEY>` (or `Authorization: Bearer <EXTERNAL_INGESTION_API_KEY>`)
* **Content-Type**: `application/json`

**Sample Request Body (Batch or Single):**
```json
{
  "leads": [
    {
      "name": "Alex Carter",
      "phoneNumber": "+91 98765 43210",
      "email": "alex.carter@startup.io",
      "company": "Growth Labs",
      "source": "Meta Ads",
      "notes": "Requested pricing details for team plan"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST https://<YOUR_DOMAIN>/api/v1/leads/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: crm_sync_secure_api_key_xxxxxxxx" \
  -d '{
    "leads": [
      {
        "name": "Sarah Jenkins",
        "phoneNumber": "9876543210",
        "company": "Apex Ventures",
        "source": "Website Demo Form"
      }
    ]
  }'
```

---

## 4. API Endpoints Master Reference

| HTTP Method | Route | Auth Header | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/employee/auth/login` | None (Rate Limited) | Associate login (Email/EMP-XXXX + Password) |
| `GET` | `/api/employee/auth/me` | `Authorization: Bearer <token>` | Verify employee session & details |
| `GET` | `/api/employee/leads` | `Authorization: Bearer <token>` | Fetch leads assigned to calling employee |
| `PATCH` | `/api/employee/leads/[leadId]/disposition`| `Authorization: Bearer <token>` | Update lead status & add call notes |
| `POST` | `/api/employee/calls/sync` | `Authorization: Bearer <token>` | Batch sync call records & durations |
| `GET` | `/api/employee/analytics` | `Authorization: Bearer <token>` | Today/Monthly KPI metrics for associate |
| `POST` | `/api/v1/leads/ingest` | `x-api-key: <KEY>` | Ingest leads from external forms & ads |
| `POST` | `/api/v1/integrations/google-sheets/sync` | Clerk Admin Session | Execute Google Sheets synchronization |
| `GET` | `/api/admin/leads/export` | Clerk Admin Session | Stream CSV/Excel export of filtered leads |
| `POST` | `/api/demo` | None | Public lead intake form from landing page |
| `GET` | `/api/download/apk` | None | Direct download link for Android Call Tracker |

---

## 5. Production Environment Variables Reference

Ensure all variables are populated in your hosting environment (Vercel / Cloudflare / VPS):

```env
# 1. DATABASE CONNECTION (Supabase PostgreSQL Mumbai ap-south-1)
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# 2. CLERK AUTHENTICATION (Web Admin Portal)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_placeholder_key"
CLERK_SECRET_KEY="clerk_secret_key_placeholder"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/admin/dashboard"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/admin/dashboard"

# 3. ADMIN ACCESS CONTROL
# Comma-separated list of emails allowed into /admin
ADMIN_EMAIL="founder@yourstartup.com,ops@yourstartup.com"

# 4. ASSOCIATE SESSION TOKENS
# 64-character secret string for mobile JWT signing
EMPLOYEE_JWT_SECRET="generate_a_secure_random_64_char_hex_secret_here"

# 5. EXTERNAL LEAD SYNC KEY
# Used for external webhooks, Zapier, landing page integrations
EXTERNAL_INGESTION_API_KEY="crm_sync_secure_api_key_xxxxxxxx"

# 6. OPTIONAL DEFAULTS
GOOGLE_SHEET_URL="https://docs.google.com/spreadsheets/d/your_sheet_id/edit#gid=0"
```

---

## 6. Daily Startup CRM Workflow Checklist

1. **Morning Kickoff**:
   * Open `/admin/dashboard` to check unassigned leads and prior-day connection rates.
   * Run bulk assignment or Auto-Assign (Evenly distribute unassigned pool across active BDAs).
2. **Sales Operations**:
   * Sales reps open Android Call Tracker app -> Tap lead card to dial.
   * On call completion, the disposition modal appears automatically.
   * Rep selects outcome (`Interested`, `Follow Up`, `Callback`, `Converted`) and taps **"Save"** or **"Send WhatsApp"**.
3. **Founder Live Monitoring**:
   * Inspect real-time talk times, connected call counts, and conversion percentages under `/admin/dashboard`.
   * Click any associate under `/admin/employees/[id]` to review their full call log timeline and assigned directory.
4. **End of Week**:
   * Export closed won / converted leads via `/admin/leads` -> **"Export"** for onboarding and finance.
