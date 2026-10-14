# Systemic & Version-Relevant Engineering Rule

When diagnosing bugs, making fixes, or building new features in this codebase, you MUST ALWAYS follow these core principles:

## 1. See the Bigger Picture (Holistic Problem Solving)
- **Never apply quick, fragile, or localized patches** that fix one symptom while breaking adjacent features or leaving the user stranded.
- **Trace the full lifecycle:** Client UI state -> Routing & Proxy (`proxy.ts`) -> Server Actions & Middleware -> Domain Services -> Database & Clerk API.
- **Always provide end-to-end feedback:** If a failure happens anywhere in the pipeline, ensure the UI explicitly displays an error banner and dispatches a `toast.error()` so the user is never left with an unresponsive screen or silent failure.

## 2. Version-Relevant Solutions
- This project runs on **Next.js 16** (`next@16.3.4`), **React 19** (`react@19.2.8`), **Clerk Core 3** (`@clerk/nextjs@7.9.4`), and **Prisma 6** (`@prisma/client@6.19.3`).
- **Never rely on legacy conventions or outdated training patterns:**
  - Next.js 16 uses `proxy.ts` (NOT `middleware.ts`). Check `node_modules/next/dist/docs/`.
  - Next.js dynamic request helpers are strictly asynchronous (`await auth()`, `await cookies()`, `await headers()`).
  - Clerk Core 3 deprecates `<SignedIn>`/`<SignedOut>` in favor of `<Show when="signed-in">`.
  - Backend/Server Action Clerk synchronization must use `createClerkClient({ secretKey, publishableKey })` from `@clerk/backend` to guarantee resilience.
  - Clerk REST API errors use snake_case `long_message`, and email verification status resides in `verification.status`.

## 3. Durable, Long-Run Resilient Architecture
- **Environment Isolation:** Development on `localhost` must never proxy or mock production domains (`heeyaku.vercel.app`) unless explicitly intended. Keep test keys (`pk_test_...`) and production keys (`pk_live_...`) strictly isolated.
- **Graceful Fallbacks:** If a high-level helper (e.g. `currentUser()`) can fail or lack request context, provide an explicit direct backend fallback (e.g. `@clerk/backend` `getUser(userId)`).
- **Same-Origin Redirect Preservation:** When validating redirect parameters, safely extract relative paths from same-origin absolute URLs (e.g. `http://localhost:3000/admin/employees` -> `/admin/employees`) to prevent infinite redirect loops.
- **Verification Rule:** Always run `npx tsc --noEmit` and verify that no TypeScript errors exist before concluding any task.
- **Skill Maintenance:** Whenever a critical systemic pattern, bug fix, or gotcha is solved, persist it in `.agents/skills/` so future agent runs retain full architectural knowledge.
