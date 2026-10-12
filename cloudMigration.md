# HEEYAKU Cloud Migration Plan

## Goal

Move HEEYAKU from PostgreSQL/Prisma to AWS Lambda and DynamoDB without breaking
the Android app, admin portal, Clerk authentication, Google Sheets integration,
or existing IDs. This is a low-volume, cost-controlled design—not a guarantee
of a permanently zero AWS bill.

Create AWS Budget alerts before exposing a public endpoint. DynamoDB's current
always-free allowance is 25 GB Standard storage and 25 provisioned RCUs/WCUs;
Lambda includes 1 million requests and 400,000 GB-seconds/month. Confirm
regional prices before launch:

- <https://aws.amazon.com/dynamodb/pricing/>
- <https://docs.aws.amazon.com/decision-guides/latest/decision-guides/fargate-or-lambda.html>

## Mandatory fixes before migration

Do these while PostgreSQL is still live. Migration must not carry existing
security and correctness gaps into the new platform.

1. **Fix BDA authorization.** An authenticated BDA must be explicitly denied
   from every admin Server Action. UI visibility is not authorization.
2. **Require a dedicated JWT secret.** Production must require
   \`EMPLOYEE_JWT_SECRET\`; do not fall back to \`CLERK_SECRET_KEY\`. Use a
   random 256-bit secret, an 8–24 hour expiry, and an employee token-version
   that changes when a password is reset or an account is deactivated.
3. **Remove URL API keys.** Delete \`?apiKey=\` support. Only accept
   \`Authorization: Bearer\` or \`x-api-key\`.
4. **Validate every route payload with Zod.** Call sync needs strict dates,
   enums and duration values, bounded notes, a request-body limit, and at most
   50–100 calls per request.
5. **Replace in-memory rate limiting.** Lambda instances do not share a
   JavaScript \`Map\`; use DynamoDB TTL-backed counters and API Gateway
   throttling.
6. **Make Android call sync idempotent.** A device call ID must be conditionally
   written once so retries cannot duplicate calls or metrics.
7. **Correct analytics.** Replace the current 1,000-call “lifetime” cap with
   paginated history and daily metric items.

## AWS architecture

\`\`\`text
Admin web / Android / Google Sheets
                |
        API Gateway HTTP API
   route throttles + request-size limits
                |
  +-------------+--------------+----------------+
  |             |              |                |
Auth Lambda  CRM Lambda    Admin Lambda   Integration Lambda
  |             |              |                |
  +-------------+--------------+----------------+
                |
           DynamoDB tables
  +-------------------------------------------+
  | EmployeesAuth | Leads | Calls | Metrics   |
  | Security / Idempotency                    |
  +-------------------------------------------+
                |
     DynamoDB Streams -> Metrics Lambda
\`\`\`

Use API Gateway HTTP API rather than a raw public Lambda Function URL. It gives
route-level throttling and a clearer edge boundary. See AWS guidance:
<https://docs.aws.amazon.com/lambda/latest/dg/apig-http-invoke-decision.html>

Deploy the Next.js web runtime with a maintained AWS adapter that supports App
Router, Route Handlers, Server Actions, and Clerk. Keep the web/admin runtime,
mobile API, integration API, and metrics worker as separate Lambda functions.

Do not place Lambdas in a VPC solely for DynamoDB. DynamoDB is an AWS endpoint;
a VPC plus NAT Gateway adds avoidable cost. Use a VPC only for a real private
resource requirement.

## Least-privilege service roles

| Function | May access | Must not access |
| --- | --- | --- |
| Auth Lambda | employee authentication record | leads, calls, metrics |
| CRM/mobile Lambda | public employee profile, leads, calls, metrics | password hashes |
| Admin Lambda | staff, teams, scoped CRM records | secret administration |
| Integration Lambda | leads plus integration idempotency records | employees, passwords, calls |
| Metrics Lambda | calls stream and metrics table | auth/employee records |

Give each function a unique IAM role. Never use \`AdministratorAccess\`,
\`dynamodb:*\`, \`Resource: "*"\`, long-lived AWS keys, or browser/mobile AWS
credentials.

Grant only necessary DynamoDB operations:

\`\`\`text
GetItem, PutItem, UpdateItem, Query, BatchGetItem, TransactWriteItems
\`\`\`

Never give an internet-facing Lambda \`Scan\`. A temporary offline migration role
may use it only if it is required and tightly scoped.

## DynamoDB tables

Use separate tables. A one-table design can work, but multiple tables make IAM
boundaries and recovery much safer here. The DynamoDB free allowance is
account/Region based, so do not assume each table receives an independent
25 RCU/25 WCU budget.

### HeeyakuEmployees

| Item | Key | Contents |
| --- | --- | --- |
| Auth | \`EMP#<id> / AUTH\` | bcrypt hash, active flag, token version; Auth Lambda only |
| Profile | \`EMP#<id> / PROFILE\` | name, role, team, employee/Clerk code; no password hash |
| Email lookup | \`EMAIL#<normalized> / EMP#<id>\` | direct identity lookup |
| Code lookup | \`CODE#<employeeCode> / EMP#<id>\` | mobile login lookup |
| Clerk lookup | \`CLERK#<clerkId> / EMP#<id>\` | web RBAC lookup |

Use transactions to maintain the profile and lookup records together.

### HeeyakuLeads

Canonical lead:

\`\`\`text
PK = LEAD#<leadId>
SK = PROFILE
\`\`\`

Keep existing ID, \`leadCode\`, customer fields, status, team/assignee/original
BDA fields, prospect state, timestamps, and a numeric \`version\`.

Required indexes:

| Index | Partition key | Sort key | Use |
| --- | --- | --- | --- |
| Team pipeline | \`TEAM#<teamId>\` | \`<status>#<updatedAt>#<leadId>\` | TL dashboard |
| Assignee queue | \`EMP#<employeeId>\` | \`<status>#<updatedAt>#<leadId>\` | Android leads |
| Lead-code lookup | \`LEADCODE#<leadCode>\` | \`<leadId>\` | import/export |

Phone uniqueness must use a conditional claim item—not merely a GSI:

\`\`\`text
PK = PHONE#<last10digits>
SK = UNIQUE
leadId = <owner lead ID>
\`\`\`

Create it with \`attribute_not_exists(PK)\` in the same transaction as the new
lead. This closes the concurrent-ingestion duplicate race.

### HeeyakuCalls

\`\`\`text
PK = CALL#<android-or-server-callId>
SK = PROFILE
\`\`\`

Store employee/lead IDs, normalized phone, timestamps, duration, connection,
outcome, and notes. Use an employee/date index for analytics and a lead/date
index for disposition proof. Insert calls conditionally by ID.

### HeeyakuMetrics

\`\`\`text
PK = DATE#<YYYY-MM-DD-in-Asia-Kolkata>
SK = ORG | TEAM#<teamId> | EMP#<employeeId>
\`\`\`

Store \`totalCalls\`, \`connectedCalls\`, \`talkSeconds\`, \`conversions\`, and
\`updatedAt\`. Keep every scope as a separate item; do not build a growing nested
\`byEmployee\` object.

### HeeyakuSecurity

Use TTL records for shared rate limits and short-lived idempotency:

\`\`\`text
PK = RATE#LOGIN#IP#<sha256-ip>
SK = WINDOW#<epoch-window>
ttl = <epoch>

PK = IDEMPOTENCY#<actorId>
SK = <request-or-call-id>
ttl = <epoch>
\`\`\`

Hash IPs/keys before storage. Never store raw access tokens or API keys.

## Critical write patterns

### Lead ingestion

Use \`TransactWriteItems\` to:

1. conditionally claim the normalized phone;
2. write the canonical lead while preserving the existing ID and code;
3. write any needed lookup/feed records; and
4. write the integration idempotency key.

A “read duplicate, then write” sequence is unsafe under concurrent webhooks.

### Android call sync

For each call:

1. authenticate the employee and resolve the permitted lead on the server;
2. enforce payload, count, duration, and note limits;
3. conditionally create \`CALL#<id>\`;
4. update the lead only when its \`version\` matches; and
5. return success/conflict for each submitted call.

The mobile app clears only acknowledged calls from its local queue.

### Metrics

Use DynamoDB Streams from Calls into a dedicated Metrics Lambda. Stream delivery
can retry, so write a processed-event marker or use a transactional idempotency
check before incrementing daily counters. Dashboards become eventually consistent
for a few seconds but avoid expensive call-log scans.

## Authorization model

Every Server Action and route must use one central authorization helper:

1. validate Clerk/mobile token;
2. resolve employee profile;
3. explicitly allow the required role; and
4. apply team/ownership scope inside the repository query.

| Role | Scope |
| --- | --- |
| CEO | all organization records |
| HR | employee/team administration; no CRM/export data |
| TEAM_LEAD | own team’s BDAs, leads, calls, and metrics |
| BDA | mobile APIs and only assigned/worked leads |

There must be no catch-all \`else\` branch that turns a non-Team-Lead into a
global administrator.

## Rate limits and edge controls

Use API Gateway throttling plus DynamoDB-backed per-identity limits.

| Route | Suggested application limit |
| --- | ---: |
| Employee login | 5/minute/IP and 5/15-minutes/account |
| Call sync | 30/minute/employee; 100 calls/request max |
| Mobile reads | 60/minute/employee |
| Lead ingestion | 30/minute/API key; 500 leads/request max |
| Google Sheets sync | 10/minute/API key |
| Admin mutation | 30/minute/user |

Clients must handle \`429\` with exponential backoff. API Gateway throttling:
<https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-throttling.html>

AWS WAF rate-based rules are useful for public endpoints but may cost extra; use
them after the application and API Gateway limits are working.

## Secrets, logs, backups, and cost safety

- Keep Clerk, JWT, and integration secrets out of \`NEXT_PUBLIC_*\`.
- Use encrypted Lambda environment variables or a managed secret/parameter
  store; check the selected service’s price.
- Rotate JWT and integration secrets with a short two-key verification overlap.
- Never log authorization headers, API keys, JWTs, passwords, or full PII.
- Enable DynamoDB point-in-time recovery before importing live data; verify its
  cost and retention policy.
- Set short CloudWatch log retention, such as 7–14 days for development.
- Create budgets covering Lambda, DynamoDB, API Gateway, CloudWatch, backups,
  data transfer, and optional WAF.
- Start at 25 provisioned RCU/25 provisioned WCU. Item size, GSIs, and
  transactions consume capacity; load-test realistic Android retry bursts.
- Move to on-demand only when traffic is truly bursty, and configure a maximum
  throughput cap. See AWS throttling guidance:
  <https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TroubleshootingThrottling.html>

## Migration sequence

1. **Secure current PostgreSQL backend.** Fix the mandatory issues and add tests
   for BDA denial, TL scope, cross-team denial, duplicate leads, and replayed
   mobile calls.
2. **Introduce repositories.** Route handlers/actions call typed repositories;
   first move current behavior to \`Postgres*Repository\` without changing JSON.
3. **Build AWS staging.** Use infrastructure-as-code, test data only, alarms,
   least-privilege IAM, and DynamoDB Local contract tests.
4. **Backfill.** Export teams, employee profiles/lookups, auth records, leads
   plus phone claims, calls, then metrics. Preserve every existing ID/code.
5. **Validate.** Compare record counts, assignments, phone claims, IST metrics,
   and normalized Android/admin API responses.
6. **Dual write.** PostgreSQL stays primary. Write it first, enqueue a durable
   outbox record, then retry DynamoDB replication.
7. **Shadow read.** Read DynamoDB for sampled requests and compare normalized
   results without changing the user response.
8. **Canary.** Enable DynamoDB reads for internal users, then a small percentage
   of traffic. Roll back instantly with \`DATA_STORE_MODE=postgres\`.
9. **Retire PostgreSQL.** Only after a full business cycle, final reconciliation,
   and a verified backup/restore exercise.

## Production acceptance checklist

- BDA cannot invoke admin actions or retrieve staff PII.
- All endpoints use strict input validation and safe error messages.
- API keys are never accepted in a URL.
- Replaying an Android call has no duplicate data or metric effect.
- Request-serving code uses no DynamoDB \`Scan\`.
- Pagination uses \`LastEvaluatedKey\`, not unbounded client-side filtering.
- Every Lambda role is least privilege and contains no wildcard DynamoDB access.
- Point-in-time recovery, alarms, budget alerts, and log retention are enabled.
- Staging has passed a cutover and rollback rehearsal.

