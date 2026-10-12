# HEEYAKU: Safe DynamoDB Migration Plan

## Decision

Do **not** replace Prisma calls one file at a time. The web dashboard, Google
Sheets integration, and Android app all depend on the current PostgreSQL data
contracts. Introduce repository interfaces, keep response shapes and existing
IDs unchanged, and cut over only after shadow-read comparison succeeds.

PostgreSQL remains the source of truth until the cutover checkpoint is passed.
The app must have a flag-controlled, immediate rollback to PostgreSQL.

## Current contracts that must not change

| Consumer | Contract to preserve |
| --- | --- |
| Android app | `/api/employee/*` JSON shapes, employee JWT claims, existing lead and call IDs, offline-call `id` idempotency |
| Admin web app | Clerk-to-employee lookup, role/squad visibility, lead filters, cursor/page ordering, exported CSV/XLSX columns |
| Integrations | `leadCode`, last-10-digit phone deduplication, Google Sheets change feed, external API-key behavior |
| Reporting | IST daily boundaries, dashboard counts, conversions, call duration and leaderboards |

`cuid`/UUID values already in PostgreSQL must be copied verbatim. Never create
new employee, team, lead, or call IDs during import.

## Problems in the previous draft

1. A single `GSI1` cannot simultaneously be a team-lead index and an employee
   index for the same lead item. A DynamoDB item has one value per index key.
2. Reading an entire squad into memory is unbounded and will eventually exceed
   response, Lambda, and DynamoDB capacity limits. Use paginated queries.
3. `ADD byEmployee.#id.calls :one` is invalid: DynamoDB `ADD` only operates on
   top-level attributes. Per-employee metrics must be separate items.
4. `PHONE#...` as a GSI detects duplicates but cannot prevent concurrent writes.
   A conditional phone-claim item is required.
5. PostgreSQL uses joins, `groupBy`, case-insensitive search, and transactions.
   Those access patterns need explicit DynamoDB read models; no table scans in
   application request paths.

## Target table

Use one on-demand table initially: `HeeyakuCRM-v1` (`PK` and `SK`, strings).
On-demand avoids throttling while traffic and item size are measured. Move to
provisioned capacity only after CloudWatch evidence supports it; the former
"25 RCU / 25 WCU forever" assumption is not an availability strategy.

Store canonical entities plus small, transactionally maintained lookup/read
model items. Every item includes `entityType`, `schemaVersion: 1`, `createdAt`,
and `updatedAt` (ISO-8601 UTC strings).

| Item | PK / SK | Purpose |
| --- | --- | --- |
| Employee | `EMP#<id>` / `PROFILE` | Canonical employee record, including bcrypt hash and Clerk ID |
| Team | `TEAM#<id>` / `PROFILE` | Canonical team record |
| Lead | `LEAD#<id>` / `PROFILE` | Canonical lead record |
| Call | `CALL#<id>` / `PROFILE` | Canonical call and Android idempotency key |
| Phone claim | `PHONE#<last10>` / `UNIQUE` | One owner lead; written with `attribute_not_exists(PK)` |
| Employee lookup | `EMPLOYEE_CODE#<code>` / `LOOKUP` (and email / Clerk variants) | Direct `GetItem` identity resolution |
| Sheet feed event | `FEED#<UTC-hour>` / `<updatedAt>#LEAD#<id>` | Bounded, TTL-backed Google Sheets delta feed |
| Metric | `METRIC#<IST-date>` / `ORG`, `TEAM#<id>`, or `EMP#<id>` | Independent atomic daily counters |

### Required indexes

All indexes should project only attributes required by their endpoint; read the
canonical item with `BatchGetItem` only when the projection is insufficient.

| Index | Partition / sort key | Replaces current access pattern |
| --- | --- | --- |
| `GSI1TeamLeads` | `TEAM#<teamId>` / `<status>#<updatedAt>#<leadId>` | Team Lead lead list and status-filtered pipeline |
| `GSI2AssigneeLeads` | `ASSIGNEE#<employeeId>` / `<status>#<updatedAt>#<leadId>` | Android assigned leads; employee queue |
| `GSI3EmployeeCalls` | `EMP#<employeeId>` / `<startedAt>#<callId>` | Analytics and call-history queries |
| `GSI4LeadCalls` | `LEAD#<leadId>` / `<startedAt>#<callId>` | Disposition connected-call proof and lead history |
| `GSI5TeamEmployees` | `TEAM#<teamId>` / `<role>#<employeeCode>` | Team membership and BDA selection |

For organization-wide employee/team lists, write explicit `ORG#HEEYAKU`
directory items. This avoids a scan and keeps the list queryable with a cursor.

Name/email substring search does not map safely to DynamoDB. Preserve it as a
bounded filter only after a team or assignee query, and introduce OpenSearch (or
another search service) before supporting global substring search at scale.

## Write rules

### Lead create or ingest

Use `TransactWriteItems` for:

1. `ConditionCheck` or `Put` of the phone claim with
   `attribute_not_exists(PK)`.
2. Canonical lead `Put` with the pre-existing `id` and `leadCode`.
3. Directory/index projection items as necessary.
4. A feed event for integrations.

If the phone claim already exists, read its owner lead and preserve today’s
"duplicate skipped / optional note update" behavior. Do not rely on a prior
read followed by an unconditional write; that has a race in the current system.

### Android call sync

Use the phone/lead mapping resolved from the server—not a client supplied
employee or team—as the authority. For each call, transact:

1. `Put` the canonical `CALL#<clientCallId>` with
   `attribute_not_exists(PK)`.
2. Update the lead conditionally (`version = :expectedVersion`) if its status
   changes.
3. `ADD` numeric fields on **separate** metric items (`ORG`, team, employee).

The unique call ID makes retried offline batches idempotent. Split a mobile
batch into chunks of at most 100 transaction items and return successful call
IDs plus per-item conflicts. Never clear the Android offline queue unless every
submitted call is acknowledged.

### Mutations with relationships

Employee deletion, team deletion, reassignment, and prospect promotion require
application-level transactions or asynchronous repair jobs. DynamoDB has no
foreign keys or cascade delete. The operation must either update all affected
read models atomically (up to the transaction limit) or mark the entity
deactivated and process a durable work item. Prefer soft deactivation for
employees during the migration.

## Repository boundary

Create these server-only interfaces before adding AWS calls:

```ts
interface LeadRepository {
  getById(id: string): Promise<Lead | null>
  listByTeam(input: TeamLeadQuery): Promise<Page<Lead>>
  listByAssignee(input: AssigneeLeadQuery): Promise<Page<Lead>>
  ingest(input: LeadIngestCommand): Promise<LeadIngestResult>
  updateDisposition(input: DispositionCommand): Promise<Lead>
}
```

Create equivalent `EmployeeRepository`, `TeamRepository`, `CallRepository`,
and `MetricsRepository` interfaces. Their returned types must be the current
Prisma-shaped domain types, not DynamoDB attribute maps. Route handlers and
Server Actions may call repositories only; they must not import the AWS SDK.

Implement `Postgres*Repository` first by moving existing Prisma logic without
semantic changes. Then add `Dynamo*Repository`, selected by a **server-only**
`DATA_STORE_MODE=postgres|dual_write|shadow_read|dynamodb` setting. Do not
expose the setting to browser code.

## Migration sequence

1. **Baseline and repair.** Export row counts/checksums; add deterministic
   contract tests for every API response consumed by Android and integrations.
   Fix current query correctness issues listed below before copying them.
2. **Provision.** Create table, indexes, PITR, encryption, least-privilege IAM,
   CloudWatch alarms, and a DynamoDB Local test configuration. Add AWS SDK v3
   and repository interfaces; keep Prisma production traffic unchanged.
3. **Backfill.** Export PostgreSQL in stable snapshots in dependency order:
   teams, employees/lookups, leads/phone claims, calls, metric backfill, then
   feed events. Use `BatchWriteItem` only for independent items; retry
   `UnprocessedItems` with exponential backoff. Use transactions for uniqueness
   claims and referential read models.
4. **Validate backfill.** Compare per-entity count, IDs, `leadCode`, phone
   claims, employee/team assignment, call count/duration, and status totals.
   Independently sample every critical API query and compare normalized JSON.
5. **Dual write.** PostgreSQL remains the read source. Write PostgreSQL first;
   enqueue/retry DynamoDB replication with an outbox record. Alert on lag and
   failed replication. Do not dual-write two databases inline without repair
   tracking.
6. **Shadow reads.** Read DynamoDB in the background for sampled requests,
   normalize ordering/null/date fields, and log mismatch metrics without
   changing responses. Require zero unexplained mismatches through at least one
   full business cycle and a mobile sync retry test.
7. **Canary and cutover.** Enable Dynamo reads for internal CEO traffic first,
   then a small percentage of users. Keep PostgreSQL dual writes active. Roll
   back by changing `DATA_STORE_MODE` only; no data restore should be needed.
8. **Retire safely.** After an agreed retention period, freeze PostgreSQL
   writes, run final reconciliation, take a verified backup, and only then
   remove Prisma/PostgreSQL infrastructure.

## Acceptance gates

- Every existing API contract test passes against both repository
  implementations.
- No `Scan` in request-serving code; all list APIs use a bounded `Query` plus
  cursor pagination.
- Duplicate phone attempts under concurrent load create at most one lead.
- Replaying the same Android call batch changes no counts after the first run.
- Role/squad authorization tests pass unchanged.
- Dashboard totals match PostgreSQL for selected IST dates and all teams.
- CloudWatch shows no sustained throttling, transaction conflicts have retry
  handling, and rollback is exercised in staging.

## Existing backend findings to resolve before cutover

1. `lib/lead/code.ts` calculates sequential codes from prior reads, which is
   race-prone under concurrent ingestion. Replace with a DynamoDB counter item
   (or preserve random codes) rather than trying to reproduce the scan-like
   algorithm.
2. `phoneDigits` is indexed but not unique in PostgreSQL, so concurrent ingest
   requests can still create duplicate leads. The phone-claim transaction above
   closes this gap.
3. `app/api/employee/analytics/route.ts` loads at most 1,000 recent calls and
   labels the result as lifetime analytics. Paginate or use the daily metric
   items for accurate lifetime values.
4. Team lifecycle methods perform several independent Prisma writes. They need
   transactional/compensating behavior before being translated to DynamoDB.
5. The in-process rate limiter and session caches are per instance. They are
   not reliable across serverless instances; use a shared limiter/cache if
   global enforcement is required.
