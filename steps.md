# HEEYAKU — Admin Panel & Lead Management MVP Implementation Steps

## Overview
This document tracks the incremental progress, architecture decisions, and verification steps across each development milestone for the HEEYAKU Admin Panel MVP.

---

## Milestone Status Matrix

| Milestone | Description | Status | Verification Summary |
| :--- | :--- | :--- | :--- |
| **Milestone 0** | Existing Project Audit | ✅ Complete | Inspected Clerk, Next.js 16 `proxy.ts`, Tailwind v4, mock telemetry, and mobile app isolation. |
| **Milestone 1** | Database & Prisma Setup | ✅ Complete | Supabase PostgreSQL connected via Prisma 6, models `Employee` and `Lead` defined with enums, indexes, and relations. Verified live connection. |
| **Milestone 2** | Admin Authorization | ✅ Complete | Server-side Clerk authorization (`lib/auth/admin.ts`), `ADMIN_EMAIL` guard, `proxy.ts` edge matcher, and `app/admin/layout.tsx` server protection. |
| **Milestone 3** | Employee Management | ✅ Complete | Employee list, credentials modal (`EMP-xxxx` + temporary password), bcrypt hashing, status toggle, reset password, and employee detail page. |
| **Milestone 4** | Lead Management | ✅ Complete | Manual lead entry, lead directory, pipeline status filtering, employee/assignment filtering, lead editing, and deletion. |
| **Milestone 5** | Lead Assignment | ✅ Complete | Single and bulk lead assignment, employee selector modal, row multi-selection, atomic database transactions (`$transaction`), unassignment, and status transitions. |
| **Milestone 6** | Lead Import | ✅ Complete | CSV & XLSX file parsing (`papaparse`, `xlsx`), automatic column mapping, phone normalization (+91/0/core 10), in-file and database duplicate detection, preview tabs, optional batch staff assignment, and sequential code generation. |
| **Milestone 7** | Lead Export | ✅ Complete | Streamed CSV/XLSX export route (`/api/admin/leads/export`), client-side fast export for filtered views and selected rows, employee-specific lead export, sanitized headers. |
| **Milestone 8** | Employee Monitoring | ✅ Complete | Dedicated counselor monitoring view with real-time KPI metrics, pipeline breakdown filter, assigned leads directory with course/program details, and transparent Android Call Tracker sync status. |
| **Milestone 9** | Replace Mock Telemetry | ✅ Complete | Connected admin dashboard to real Supabase PostgreSQL queries (`prisma.lead.count()`, `prisma.employee.count()`, unassigned pool, conversion rate, live recent inquiries feed) without fake telemetry. |
| **Milestone 10**| Testing & Hardening | ✅ Complete | Full end-to-end verification passing 12/12 test suites: live Supabase connection, 13 LeadStatus enum integrity, bcrypt security, phone normalization, mobile app isolation, landing page integrity, and 0 TypeScript errors. |
| **Milestone 16**| BDA Role Consolidation | ✅ Complete | Unified company staff to single role: Business Development Associate (BDA). Removed deprecated team/department dropdown options and filters across forms and views. |
| **Milestone 17**| Clean Design & Layout Polish | ✅ Complete | Eliminated AI slop aesthetic across dashboard and directories. Simplified section headers, removed icon soup, set leads filter default to UNASSIGNED, and added endless scrolling/sticky tables. |
| **Milestone 18**| Bulk Assign & Sonner Toasts | ✅ Complete | Replaced cramped dropdown with spacious search-integrated associate selector matching native dialogs. Integrated Sonner toasts replacing in-UI DOM alert banners. Zero TypeScript errors and strict `< 200 lines` adherence. |

---

## Detailed Milestone Log

### Milestone 0: Project Audit
- Confirmed Next.js 16.3.4 (App Router) with `proxy.ts` (Next 16 migration from `middleware.ts`).
- Confirmed Clerk `@clerk/nextjs` installed and active in root layout and navbar.
- Documented mock values in `/admin/dashboard`.
- Preserved `components/landingpage/` and `CallTrackerApp/` without modification.

### Milestone 1: Supabase & Prisma Setup
- Installed `prisma@6.19.3` and `@prisma/client@6.19.3`.
- Fixed Supabase `DATABASE_URL` password formatting (removed literal brackets).
- Defined models `Employee` and `Lead` with `LeadStatus` enum in `prisma/schema.prisma`.
- Built `lib/prisma.ts` singleton client.
- Excluded `CallTrackerApp` in `tsconfig.json` for zero-error `tsc --noEmit`.
- Successfully pushed schema and verified live count (`Connected! Employee count: 0`).

### Milestone 2: Admin Authorization
- Installed `zod` for request validation.
- Created `lib/auth/admin.ts` with `getAuthenticatedAdmin()`, `assertAdminAccess()`, and `AuthorizationError`.
- Configured edge proxy protection in `proxy.ts` using Clerk's `createRouteMatcher` and `auth.protect()` for `/admin(.*)` and `/api/admin(.*)`.
- Created Server Component layout `app/admin/layout.tsx` enforcing server-side admin role checks before rendering any admin subroute, showing an Access Denied state if an unauthorized user logs in.
- Created `components/admin/AdminHeader.tsx` with responsive navigation tabs (Overview, Employees, Leads CRM) and user profile button.
- Cleaned up redundant local header from `app/admin/dashboard/page.tsx`.
- Verified type safety via `tsc --noEmit`.

### Milestone 3: Employee Management
- Installed `bcryptjs` and `@types/bcryptjs` for secure password hashing.
- Created `lib/crypto/passwords.ts` for cryptographically random temporary password generation (`generateRandomPassword`) and hashing (`hashPassword`).
- Created `lib/employee/code.ts` for sequential employee code generation (`EMP-1001`, `EMP-1002`, ...).
- Built server actions in `app/admin/employees/actions.ts`:
  - `createEmployeeAction`: validates with Zod, checks email uniqueness, hashes password, returns credentials once.
  - `updateEmployeeAction`: updates employee profile.
  - `toggleEmployeeStatusAction`: activates/deactivates employee.
  - `resetEmployeePasswordAction`: generates new temporary password, hashes it, and returns the temporary password once.
- Built interactive UI components:
  - `CreateEmployeeDialog.tsx`: employee creation with one-time credentials card and copy button.
  - `ResetPasswordDialog.tsx`: password reset confirmation and copy dialog.
  - `EditEmployeeDialog.tsx`: profile editing dialog.
  - `EmployeeTable.tsx`: search, status/team filtering, leads count link, action menu.
  - `EmployeeDetailView.tsx`: employee profile hero, lead breakdown cards by status, assigned leads table, and Android call-tracking integration placeholder notice.
- Created Server Pages:
  - `app/admin/employees/page.tsx`: directory with KPI metric cards.
  - `app/admin/employees/[employeeId]/page.tsx`: individual employee profile and assigned leads.
  - Verified type safety cleanly with `npx tsc --noEmit`.

### Milestone 4: Lead Management
- Created `lib/lead/code.ts` for sequential unique lead code generation (`LED-1001`, `LED-1002`, ...).
- Built server actions in `app/admin/leads/actions.ts`:
  - `createLeadAction`: input validation with Zod, checks active employee state, generates `leadCode`, transitions status to `ASSIGNED` if assigned.
  - `updateLeadAction`: edits prospect details, manages reassignment or unassignment, preserves advanced pipeline stages.
  - `deleteLeadAction`: deletes/archives a lead with admin authorization.
- Built interactive UI components:
  - `CreateLeadDialog.tsx`: manual entry modal with prospect contact, source, target course, and tele-caller assignment.
  - `EditLeadDialog.tsx`: editing modal with pipeline status selector, staff reassignment, and delete lead confirmation.
  - `LeadTable.tsx`: interactive table with search, status filters (`NEW`, `ASSIGNED`, `CONTACTED`, `INTERESTED`, `FOLLOW_UP`, `CONVERTED`, `NOT_INTERESTED`), assignment filter (assigned vs unassigned pool), and tele-caller dropdown filter.
- Created Server Page:
  - `app/admin/leads/page.tsx`: CRM control center with real-time KPI metrics cards (Total Leads, New Inquiries, In Discussion, Admissions/Converted).
- Verified database operations against Supabase and type safety cleanly with `npx tsc --noEmit`.

### Milestone 5: Lead Assignment
- Built atomic transaction server actions in `app/admin/leads/assignment-actions.ts`:
  - `assignLeadsAction`: bulk/single assignment with employee active-status validation and automatic status transition (`NEW` -> `ASSIGNED` while preserving advanced stages).
  - `unassignLeadsAction`: bulk/single unassignment returning leads to the unassigned pool (`ASSIGNED` -> `NEW` while preserving advanced stages).
- Built `BulkAssignDialog.tsx` for modal employee selection and real-time confirmation.
- Updated `LeadTable.tsx` with:
  - Multi-selection checkboxes and "Select All" toggle.
  - Sticky floating bulk action bar with selected counter, "Assign to Staff", "Unassign", and "Clear".
  - Quick inline assignment button on unassigned rows.
  - Real-time confirmation feedback banners.
- Verified atomic `$transaction` execution and zero TypeScript errors.

### Milestone 6: Lead Import (CSV & XLSX)
- Installed `papaparse`, `@types/papaparse`, and `xlsx`.
- Created `lib/lead/phone.ts` with country code normalization (+91, 91, 0, and core 10-digit matcher).
- Created `lib/lead/import-parser.ts` supporting CSV and Excel spreadsheet parsing and auto-detection of column headers.
- Built server actions in `app/admin/leads/import-actions.ts`:
  - `validateAndPreviewImportAction`: required field validation, in-file duplicate detection, and database duplicate checks against existing leads.
  - `executeImportAction`: batch sequential `LED-xxxx` code generation and database insertion with optional staff assignment.
- Built `ImportLeadsDialog.tsx`:
  - Drag-and-drop / file picker for CSV, XLSX, and XLS.
  - Sample CSV template download button.
  - Automated column mapping with manual overrides.
  - Preview tabs: Valid Leads, Duplicates to skip, and Invalid rows.
  - Optional counselor assignment selector.
  - Success summary and auto-refresh.
- Added "Import File" action to `LeadTable.tsx`.
- Verified type safety and parsing logic with zero compiler errors.

### Milestone 7: Lead Export (CSV & XLSX)
- Created `lib/lead/export.ts` with:
  - `formatLeadsForExport`: Sanitizes lead objects into clean tabular dictionaries with business headers (`Lead ID`, `Prospect Name`, `Phone Number`, `Email Address`, `Target Course / School`, `Pipeline Status`, `Lead Source`, `Assigned Staff ID`, `Assigned Staff Name`, `Assigned Date`, `Date Registered`, `Notes / Remarks`). Never exposes raw hashes or internal cuid tokens.
  - `downloadLeadsAsXlsx`: Generates structured Excel spreadsheets with auto-calculated column widths.
  - `downloadLeadsAsCsv`: Blob-based standard CSV generator.
- Built Server-Side Export Route Handler in `app/api/admin/leads/export/route.ts`:
  - Protected with `assertAdminAccess()`.
  - Supports query filters: `format` (`xlsx` | `csv`), `status`, `employeeId`, `assignment`, `search`.
  - Returns appropriate headers (`Content-Disposition: attachment; filename="HEEYAKU_Leads_..."`).
- Enhanced `components/admin/leads/LeadTable.tsx`:
  - Added "Export View" dropdown button (Excel XLSX and CSV) exporting current active search, status, and tele-caller filters.
  - Added "Export Selected" button in the sticky floating action bar for exporting arbitrary selections.
- Enhanced `components/admin/employees/EmployeeDetailView.tsx`:
  - Added "Export Leads" dropdown button (Excel XLSX and CSV) exporting all or filtered leads currently assigned to the specific employee.
- Verified compilation with `npx tsc --noEmit` (0 errors).

### Milestone 8: Employee Monitoring View & Mobile Outcome Alignment
- Aligned Web CRM with the mobile app call outcomes from `CallTrackerApp/src/config/outcomes.ts`:
  - Expanded `LeadStatus` enum in `prisma/schema.prisma` to include all mobile call dispositions: `NEW`, `ASSIGNED`, `CONTACTED`, `INTERESTED`, `FOLLOW_UP`, `CALL_BACK`, `NOT_INTERESTED`, `NO_ANSWER`, `BUSY`, `WRONG_NUMBER`, `CONVERTED`, `NOT_QUALIFIED`, `OTHER`.
  - Pushed schema update to Supabase PostgreSQL (`npx prisma db push`).
  - Aligned Zod schemas in `app/admin/leads/actions.ts`, and status selection options in `components/admin/leads/EditLeadDialog.tsx` and `LeadTable.tsx`.
- Upgraded `app/admin/employees/[employeeId]/page.tsx` query to fetch target course/school (`company`) along with prospect information.
- Rebuilt `components/admin/employees/EmployeeDetailView.tsx`:
  - **Workload & Conversion KPIs**: Real-time cards calculating Total Assigned Leads, In Active Discussion, Enrolled/Converted count, and live Conversion Rate %.
  - **Pipeline Stage Filters**: 14 filter pills with counts and active rings for every stage and outcome.
  - **Leads Directory**: Prospect table with student name, email, formatted phone number, target course/program, colored status pill matching the CRM design system, lead source, and assigned date.
  - **Android Telemetry Screen Mirror**: Implemented the exact design from the mobile app screenshot (`Calls Made`, `Connected`, `Not Connected`, `Connection Rate`, `Total Talk Time`, `Average Duration`, and **TODAY'S CALL RESULTS** with all 10 outcomes and matching color indicators).
- Verified compilation with `npx tsc --noEmit` (0 errors).

### Milestone 9: Replace Relevant Mock Data in Admin Dashboard
- Converted `app/admin/dashboard/page.tsx` from static client mock components to an authenticated Server Component.
- Connected real database aggregates via `prisma`:
  - `totalLeads`: Real count of all student inquiries registered in the database.
  - `activeEmployees`: Real count of currently active tele-calling staff.
  - `unassignedLeads`: Real count of leads currently unassigned in the pool awaiting counselor distribution.
  - `conversionRate`: Dynamically computed `(convertedLeads / totalLeads * 100)%`.
  - `recentLeadsRaw`: Real list of the latest registered leads with prospect name, code, course/institution, counselor assignment, and formatted creation date.
  - Empty state with direct deep link to add/import leads when the database is freshly initialized.
- System & Telemetry Status Panel:
  - Validates and shows live PostgreSQL status, Clerk RBAC authentication guard, and transparently flags Android call tracking as "Sync Ready" without fabricating call duration or phone call counts.
- Verified compilation with `npx tsc --noEmit` (0 errors).

### Milestone 10: Testing, Hardening & Final MVP Documentation
- Executed comprehensive automated verification suite:
  - **Phone Normalization Suite**: Validated Indian formats (`+91 98765-43210`, `919876543210`, `09876543210`, `9876543210`) normalizing to canonical core-10 digits, with robust invalid number detection.
  - **Cryptographic Security Suite**: Validated 10-character cryptographically random temporary passwords, bcrypt hashing (`$2`), and secure hash verification.
  - **Database & Schema Introspection**: Confirmed live Supabase PostgreSQL connection responding with active employee count and lead tables.
  - **Enum Parity**: Confirmed all 13 `LeadStatus` values are fully recognized by `@prisma/client` and Supabase.
  - **Code Generation**: Verified atomic sequential code generation (`EMP-xxxx` and `LED-xxxx`).
  - **Export Sanitization**: Confirmed export utility strips password hashes and internal primary keys, formatting clean business labels.
  - **Mobile App Isolation**: Confirmed `CallTrackerApp/` remains 100% untouched and independent.
  - **Landing Page Integrity**: Confirmed `components/landingpage/` remains 100% untouched.
  - **Type Safety**: Verified entire workspace compiles with zero errors (`npx tsc --noEmit`).
- All 10 project milestones are complete and production-ready.

### Milestone 11: Comprehensive Codebase Modularization (<200 Lines Constraint)
- **Rule Enforced**: No UI component or admin page file may exceed 200 lines of code.
- **Strict Preservations**: `components/landingpage/` and `CallTrackerApp/` left completely untouched.
- **Architectural Decompositions**:
  - `app/admin/dashboard/page.tsx` (reduced to 88 lines):
    - `components/admin/dashboard/DashboardHeader.tsx` (43 lines)
    - `components/admin/dashboard/DashboardKpiMetrics.tsx` (76 lines)
    - `components/admin/dashboard/DashboardRecentLeads.tsx` (114 lines)
    - `components/admin/dashboard/DashboardSystemStatus.tsx` (63 lines)
  - `components/admin/employees/EmployeeDetailView.tsx` (reduced to 161 lines):
    - `components/admin/employees/detail/EmployeeHeroCard.tsx` (142 lines)
    - `components/admin/employees/detail/EmployeeKpiCards.tsx` (51 lines)
    - `components/admin/employees/detail/EmployeePipelineFilters.tsx` (74 lines)
    - `components/admin/employees/detail/EmployeeAssignedLeadsTable.tsx` (152 lines)
    - `components/admin/employees/detail/EmployeeMobileTelemetryPanel.tsx` (135 lines)
    - `components/admin/employees/detail/types.ts` (54 lines)
  - `components/admin/employees/EmployeeTable.tsx` (reduced to 144 lines):
    - `components/admin/employees/table/EmployeeTableToolbar.tsx` (69 lines)
    - `components/admin/employees/table/EmployeeTableRow.tsx` (156 lines)
  - `components/admin/employees/CreateEmployeeDialog.tsx` (reduced to 130 lines):
    - `components/admin/employees/dialogs/CreateEmployeeFormFields.tsx` (88 lines)
    - `components/admin/employees/dialogs/CreateEmployeeCredentialsCard.tsx` (84 lines)
  - `components/admin/leads/CreateLeadDialog.tsx` (reduced to 121 lines):
    - `components/admin/leads/dialogs/CreateLeadFormFields.tsx` (101 lines)
  - `components/admin/leads/EditLeadDialog.tsx` (reduced to 190 lines):
    - `components/admin/leads/dialogs/EditLeadFormFields.tsx` (140 lines)
  - `components/admin/leads/LeadTable.tsx` (reduced to 180 lines):
    - `components/admin/leads/table/LeadTableToolbar.tsx` (140 lines)
    - `components/admin/leads/table/LeadTableFloatingBar.tsx` (88 lines)
    - `components/admin/leads/table/LeadTableRow.tsx` (112 lines)
    - `components/admin/leads/table/LeadTableModals.tsx` (64 lines)
    - `components/admin/leads/table/exportHelper.ts` (28 lines)
    - `components/admin/leads/table/types.ts` (41 lines)
  - `components/admin/leads/ImportLeadsDialog.tsx` (reduced to 187 lines):
    - `components/admin/leads/import/ImportDropzone.tsx` (55 lines)
    - `components/admin/leads/import/ImportColumnMapper.tsx` (140 lines)
    - `components/admin/leads/import/ImportPreviewTabs.tsx` (182 lines)
    - `components/admin/leads/import/ImportCompleteCard.tsx` (48 lines)
- **Verification Results**:
  - 100% of `.tsx` files in `components/admin/` and `app/admin/` are strictly `<= 190 lines`.
  - Zero TypeScript compiler errors (`npx tsc --noEmit`).
  - 12/12 automated test suite checks passing against live Supabase PostgreSQL.

### Milestone 12: Laptop-Friendly UI, Pinned Sidebar, Official Logo & Landing Page Integration
- **Laptop-Friendly UI**: Replaced the boxy/heavy card containers on the dashboard with a clean, low-profile grid with subtle dividers, streamlined KPI tiles, and modern table typography.
- **Pinned Sidebar with Hamburger Drawer**:
  - Created [`components/admin/AdminSidebar.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/admin/AdminSidebar.tsx) (111 lines) and [`components/admin/AdminShell.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/admin/AdminShell.tsx) (52 lines).
  - Pinned on desktop/laptop displays (`lg:pl-64`), with slide-over drawer triggered via hamburger menu on mobile devices.
  - Integrated Clerk user badge and security indicator in the sidebar footer.
- **Official Brand Logo**:
  - Embedded the official brand SVG logo via [`HeeyakuLogo`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/landingpage/shared/HeeyakuLogo.tsx) with official colors (`#0B1F33` bars and `#2563EB` dot) in both sidebar and mobile topbar.
- **Landing Page Dashboard Button**:
  - Updated [`components/landingpage/navbar/Navbar.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/landingpage/navbar/Navbar.tsx) to render a **"Dashboard"** pill button on desktop and **"Go to Dashboard"** button on mobile drawer inside `<Show when="signed-in">`, appearing only when the user is logged in.
- **Verification**:
  - 100% of admin `.tsx` files remain `< 200 lines`.
  - `npx tsc --noEmit` passed with 0 errors.
  - HTTP `GET http://localhost:3000/admin/dashboard` returns status `200 OK`.

### Milestone 13: Two-Section Overview Redesign (Today Pipeline & TanStack Employee Table)
- **Restructured `/admin/dashboard`**: Replaced boxy card metrics with exactly two dedicated operational sections:
  1. **Section 01: Today's Total Intake & Lead Pipeline Breakdown** ([`TodayLeadStatusSection.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/admin/dashboard/TodayLeadStatusSection.tsx) - 87 lines):
     - Calculates real-time lead updates/creations today (`updatedAt >= startOfToday`).
     - Renders a multi-color progress strip alongside a dense, flat, striped 7x2 status grid across all 13 official pipeline statuses (`NEW`, `ASSIGNED`, `CONTACTED`, `INTERESTED`, `FOLLOW_UP`, `CALL_BACK`, `NOT_INTERESTED`, `NO_ANSWER`, `BUSY`, `WRONG_NUMBER`, `CONVERTED`, `NOT_QUALIFIED`, `OTHER`).
  2. **Section 02: Staff Output, Today's Top Spot & TanStack Table** ([`EmployeeReportSection.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/admin/dashboard/EmployeeReportSection.tsx) - 36 lines):
     - **Top Performer Spotlight Banner** ([`TodayTopPerformerSpotlight.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/admin/dashboard/TodayTopPerformerSpotlight.tsx) - 97 lines): Highlights today's #1 counselor with trophy badge, assigned count today, converted count, conversion rate, and direct link to audit profile.
     - **TanStack Interactive Data Grid** ([`EmployeeReportTanstackTable.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/admin/dashboard/EmployeeReportTanstackTable.tsx) - 188 lines): Built with `@tanstack/react-table`, featuring column sorting by today's assignments/conversions, instant search filter, and all-time counselor metrics.
- **Verification**:
  - 100% real database aggregation using Prisma (`groupBy`, `findMany` with relations).
  - All components strictly `<= 190 lines` (complying with `< 200` line budget).
  - Clean compilation via `npx tsc --noEmit` (0 errors).
  - `GET /admin/dashboard` returns `200 OK`.

### Milestone 14: Removal of Android Telephony Telemetry Panel
- **Removed Component**: Completely removed the dark-themed `"Android Call Tracker & Telephony Analytics"` panel (`EmployeeMobileTelemetryPanel.tsx`) and unmounted it from [`EmployeeDetailView.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/admin/employees/EmployeeDetailView.tsx).
- **Reduced Line Count**: [`EmployeeDetailView.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/admin/employees/EmployeeDetailView.tsx) reduced from 179 lines to **153 lines**.
- **Verification**:
  - `npx tsc --noEmit` passed with 0 errors.
  - Zero dead code or unreferenced imports.
  - 100% of admin `.tsx` files remain `< 200 lines`.

### Milestone 15: ThemeToggler & Full Dark Theme Support
- **ThemeProvider Integration**: Added `next-themes` with `attribute="class"` and `defaultTheme="system"` wrapped in [`app/layout.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/app/layout.tsx).
- **Reusable ThemeToggler Widget**: Created [`components/ThemeToggler.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/ThemeToggler.tsx) featuring animated Sun/Moon icons, smooth state toggling, and hydration safety.
- **Admin Panel Dark Theme**:
  - Updated [`components/admin/AdminSidebar.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/admin/AdminSidebar.tsx) to embed the `ThemeToggler` in the footer with theme token colors (`bg-card`, `border-border`, `text-foreground`).
  - Updated [`components/admin/AdminShell.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/admin/AdminShell.tsx) with theme tokens and mobile header toggle.
  - Updated Overview components: [`TodayLeadStatusSection.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/admin/dashboard/TodayLeadStatusSection.tsx), [`TodayTopPerformerSpotlight.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/admin/dashboard/TodayTopPerformerSpotlight.tsx), [`EmployeeReportSection.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/admin/dashboard/EmployeeReportSection.tsx), and [`EmployeeReportTanstackTable.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/admin/dashboard/EmployeeReportTanstackTable.tsx).
- **Landing Page ThemeToggler**: Added `ThemeToggler` into [`components/landingpage/navbar/Navbar.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/landingpage/navbar/Navbar.tsx) in both desktop and mobile drawer menus.
- **Verification**:
  - `npx tsc --noEmit` passed with 0 errors.
  - 100% of admin `.tsx` files remain `< 200 lines`.
  
### Milestone 16: Single Role Consolidation (Business Development Associate / BDA)
- **Role Unification**: Standardized all organizational roles to a single unified role: **Business Development Associate (BDA)**.
- **Removed Deprecated Options**:
  - Removed outdated team/department selection options ("Inside Sales", "Telecalling", "Field Sales", "Support") across employee creation, edit dialogs, and table filters.
  - Standardized terminology to "BDA" or "Business Development Associate" across dialogs, headers, badges, and toolbars.
- **Database & State Safety**: Preserved schema compatibility while defaulting all employee creations and assignments to the unified BDA designation.
- **Verification**:
  - 100% of admin `.tsx` files remain `< 200 lines`.
  - `npx tsc --noEmit` passed with 0 errors.

### Milestone 17: Dashboard & Directory UI Polish (No-AI-Slop Minimal Aesthetic)
- **Header Simplification**: Replaced generic AI-slop descriptions and icon-heavy badges on dashboard Section 01 and Section 02 with crisp, minimal titles matching the website theme.
- **Unassigned-by-Default Lead CRM**: Set the leads management filter to default to `UNASSIGNED`, enabling instant intake routing without requiring manual filter toggling.
- **High-Density Sticky Tables**:
  - Configured sticky table headers and infinite scrolling with 10-item initial chunks and dynamic `Load More` triggers.
  - Kept lead table pagination controls intact and functional.
- **Verification**:
  - `npx tsc --noEmit` passed with 0 errors.
  - Live browser visual regression verification confirmed clean typography and responsive layout.

### Milestone 18: Bulk Assign Overhaul & Sonner Toast Integration
- **Eliminated AI Slop in Bulk Assign**:
  - Redesigned [`BulkAssignDialog.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/admin/leads/BulkAssignDialog.tsx) to match the native application design system established in `CreateLeadDialog` and `CreateEmployeeDialog`.
  - Removed redundant outer summary cards (`Selected leads: 10 leads`) and integrated lead counts directly into the modal header subtitle.
  - Replaced cramped, truncating select menus with a sleek, searchable associate list featuring real-time name and `EMP-XXXX` code filtering with checkmark selection indicators.
- **Sonner Toast Feedback System**:
  - Mounted `<Toaster richColors closeButton position="top-right" />` in root [`app/layout.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/app/layout.tsx).
  - Replaced DOM-rendered green alert banners in [`LeadTable.tsx`](file:///c:/Users/sibas/OneDrive/Desktop/HEEYAKU/heeyaku/components/admin/leads/LeadTable.tsx) with instant, non-blocking `toast.success` and `toast.error` notifications.
- **Dropdown Label Cleanup**:
  - Removed repetitive `— Business Development Associate` suffix concatenation from option labels in `CreateLeadFormFields.tsx`, `EditLeadFormFields.tsx`, and `ImportPreviewTabs.tsx` to eliminate horizontal text truncation.
- **Architectural Health & Codebase Audit**:
  - Conducted full 8-dimensional audit: identified dead dependencies (`cn`), unused UI primitives (`select.tsx`, `accordion.tsx`, `tabs.tsx`), and redundant in-memory filtering.
- **Verification**:
  - All admin components strictly comply with the `< 200 lines` limit (`BulkAssignDialog.tsx` is 189 lines, `LeadTable.tsx` is 180 lines).
  - TypeScript compilation `npx tsc --noEmit` exited with code `0`.
  - Live browser testing verified flawless toast rendering and responsive modal interaction.










