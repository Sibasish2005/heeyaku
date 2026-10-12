# HEEYAKU CRM: DynamoDB Migration & Architectural Blueprint

> **Status:** Pre-Migration Architectural Specification & Pre-Flight Audit Report  
> **Target Cloud:** AWS DynamoDB (Provisioned 25 RCU / 25 WCU — 100% Free Tier Forever)  
> **Source System:** PostgreSQL (Supabase) via Prisma ORM 6.19.3  

---

## 1. Pre-Migration Assessment & System State Report

### 1.1 Existing Entities & Access Patterns
The HEEYAKU platform currently manages 5 core relational entities:
1. **`Employee`**: Staff members (CEOs, HR, Team Leads, BDAs) authenticated via Clerk and mobile HMAC-SHA256 tokens.
2. **`Team`**: Squads led by a `teamLeadId` containing multiple BDA members.
3. **`Lead`**: Sales prospects identified by `leadCode` and `phoneDigits`, tracked through sales stages (`NEW`, `ASSIGNED`, `CONTACTED`, `INTERESTED`, `CALL_BACK`, `FOLLOW_UP`, `CONVERTED`, etc.).
4. **`CallLog`**: Telephony records generated from Android devices with call durations, connection flags, and outcomes.
5. **`Daily Metrics`**: Aggregations calculating daily/monthly talk time, connected call rates, and employee leaderboards.

### 1.2 Critical Pre-Migration Migration Hazards (And Solutions)
| Relational Feature | The DynamoDB Risk on Free Tier | The Engineered Solution |
| :--- | :--- | :--- |
| **Multi-field Lead Table Filters** (Squad + Status + Assignee) | Standard DynamoDB queries cannot handle multiple dynamic filter dropdowns without Table Scans (which exceed 25 RCU). | **Squad-Partitioned In-Memory Client Filtering:** Leads for an active squad are queried once into client/server memory. Dynamic filtering, sorting, and search run in pure JavaScript (0 RCU). |
| **Global Text Search** (Name, Phone, Email) | No SQL `ILIKE '%term%'`. Table scans throttle immediately. | **GSI 3 Reverse Phone Lookup (`PHONE#<last10>`):** Direct $O(1)$ lookups for phone numbers. Client-side regex for names/emails within squad partitions. |
| **Dashboard Metrics** (`SUM(durationSeconds)`) | DynamoDB has no native `SUM()`, `COUNT(*)`, or `GROUP BY`. Querying raw call logs burns read capacity. | **Pre-Aggregated Atomic Metric Counter (`METRICS#YYYY-MM-DD`):** Updated via atomic `ADD` commands on every call sync. Dashboard reads exactly 1 item (0.5 RCU). |
| **Relational Integrity** (`onDelete: Cascade` / `SetNull`) | DynamoDB does not have foreign keys. | **Application-Level Referential Guarding:** Enforced explicitly in the service layer before deletion. |

---

## 2. Single-Table Schema Specification

To qualify for the **AWS Free Tier Forever (25 RCU, 25 WCU, 25 GB storage)**, all entities MUST share a single table:
- **Table Name:** `HeeyakuCRM`
- **Primary Partition Key (`PK`):** `string`
- **Primary Sort Key (`SK`):** `string`
- **Billing Mode:** `PROVISIONED` (25 RCU / 25 WCU)

```
+----------------------------------------------------------------------------------------------------+
|                                      TABLE: HeeyakuCRM                                             |
+---------------------+-------------------+---------------------+------------------+-----------------+
| PK                  | SK                | GSI1PK              | GSI1SK           | GSI2PK / GSI3PK |
+---------------------+-------------------+---------------------+------------------+-----------------+
| LEAD#<leadId>       | METADATA          | TEAM#<teamId>       | <status>#<date>  | GSI3: PHONE#<d> |
| EMP#<employeeId>    | METADATA          | ROLE#<role>         | <employeeCode>   | GSI2: CLERK#<id>|
| TEAM#<teamId>       | METADATA          | ORG#HEEYAKU         | <teamName>       |                 |
| CALL#<callId>       | METADATA          | EMP#<employeeId>    | <startedAt>      | GSI2: LEAD#<id> |
| METRICS#<YYYY-MM-DD>| SUMMARY           | -                   | -                |                 |
+---------------------+-------------------+---------------------+------------------+-----------------+
```

### 2.1 Entity Key Structure

#### 1. Lead Item
- **`PK`**: `LEAD#<leadId>`
- **`SK`**: `METADATA`
- **`GSI1PK`**: `TEAM#<teamId>` (or `EMP#<assignedEmployeeId>` for personal assignment)
- **`GSI1SK`**: `<status>#<updatedAt>` (e.g., `INTERESTED#2026-10-12T10:00:00.000Z`)
- **`GSI3PK`**: `PHONE#<phoneDigits>` (Last 10 digits)
- **`GSI3SK`**: `LEAD#<leadId>`
- **Attributes:** `leadCode`, `name`, `phoneNumber`, `phoneDigits`, `email`, `company`, `status`, `notes`, `isProspect`, `promotedToProspectAt`, `originalBdaId`, `createdAt`, `updatedAt`

#### 2. Employee Item
- **`PK`**: `EMP#<employeeId>`
- **`SK`**: `METADATA`
- **`GSI1PK`**: `TEAM#<teamId>`
- **`GSI1SK`**: `ROLE#<role>#<employeeCode>`
- **`GSI2PK`**: `CLERK#<clerkUserId>`
- **`GSI2SK`**: `METADATA`
- **Attributes:** `name`, `email`, `role`, `teamId`, `teamName`, `employeeCode`, `clerkUserId`, `isActive`, `createdAt`

#### 3. Team Item
- **`PK`**: `TEAM#<teamId>`
- **`SK`**: `METADATA`
- **`GSI1PK`**: `ORG#HEEYAKU`
- **`GSI1SK`**: `NAME#<teamName>`
- **Attributes:** `name`, `description`, `teamLeadId`, `createdAt`, `updatedAt`

#### 4. CallLog Item
- **`PK`**: `CALL#<callId>`
- **`SK`**: `METADATA`
- **`GSI1PK`**: `EMP#<employeeId>`
- **`GSI1SK`**: `TIMESTAMP#<startedAt>`
- **`GSI2PK`**: `LEAD#<leadId>`
- **`GSI2SK`**: `TIMESTAMP#<startedAt>`
- **Attributes:** `employeeId`, `leadId`, `phoneNumber`, `contactName`, `callType`, `durationSeconds`, `connected`, `outcomeId`, `outcomeLabel`, `notes`, `startedAt`, `endedAt`

#### 5. Daily Metrics Aggregate Item
- **`PK`**: `METRICS#<YYYY-MM-DD>` (IST Date)
- **`SK`**: `SUMMARY`
- **Attributes:**
  - `totalCalls`: `number`
  - `totalTalkTimeSeconds`: `number`
  - `connectedCalls`: `number`
  - `conversions`: `number`
  - `byEmployee`: Map of `{ [empId]: { calls, talkTime, connected, conversions } }`
  - `byTeam`: Map of `{ [teamId]: { calls, talkTime, connected, conversions } }`

---

## 3. Global Secondary Indexes (GSIs)

Only **3 GSIs** are required, staying well below AWS's 20 GSI limit:

1. **`GSI1` (Squad & Employee Operational Pipeline)**
   - Partition Key: `GSI1PK` (String)
   - Sort Key: `GSI1SK` (String)
   - Projection: `ALL`
   - *Access pattern:* Fetch all leads for a team or employee sorted by status and recency.
2. **`GSI2` (Entity Secondary Relationship)**
   - Partition Key: `GSI2PK` (String)
   - Sort Key: `GSI2SK` (String)
   - Projection: `ALL`
   - *Access pattern:* Lookup employee by `clerkUserId`, lookup calls by `leadId`.
3. **`GSI3` (Instant Phone Deduplication)**
   - Partition Key: `GSI3PK` (String)
   - Sort Key: `GSI3SK` (String)
   - Projection: `KEYS_ONLY`
   - *Access pattern:* Instant duplicate verification for Google Sheets sync & webhooks.

---

## 4. The 4 Core Implementation Patterns

### Pattern 1: In-Memory Client-Side Filtering
```typescript
// Next.js Server Component or Action
export async function getSquadLeads(teamId: string) {
  // Single DynamoDB query: consumes only ~5 RCUs
  const res = await ddbDocClient.send(new QueryCommand({
    TableName: 'HeeyakuCRM',
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :tpk',
    ExpressionAttributeValues: { ':tpk': `TEAM#${teamId}` },
  }));
  return res.Items || [];
}
// Client component applies status filter, search query, and pagination in pure JS!
```

### Pattern 2: Atomic Pre-Aggregated Daily Counters
```typescript
export async function recordCallMetric(call: CallLogPayload) {
  const istDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  await ddbDocClient.send(new UpdateCommand({
    TableName: 'HeeyakuCRM',
    Key: { PK: `METRICS#${istDate}`, SK: 'SUMMARY' },
    UpdateExpression: `
      ADD totalCalls :one, 
          totalTalkTimeSeconds :dur, 
          connectedCalls :conn,
          byEmployee.#emp.calls :one,
          byEmployee.#emp.talkTime :dur
    `,
    ExpressionAttributeNames: { '#emp': call.employeeId },
    ExpressionAttributeValues: {
      ':one': 1,
      ':dur': call.durationSeconds,
      ':conn': call.connected ? 1 : 0,
    },
  }));
}
```

### Pattern 3: Phone Deduplication via Direct Item Read
```typescript
export async function isDuplicatePhone(phoneDigits: string): Promise<string | null> {
  const res = await ddbDocClient.send(new QueryCommand({
    TableName: 'HeeyakuCRM',
    IndexName: 'GSI3',
    KeyConditionExpression: 'GSI3PK = :phone',
    ExpressionAttributeValues: { ':phone': `PHONE#${phoneDigits}` },
    Limit: 1,
  }));
  return res.Items?.[0]?.leadId || null;
}
```

### Pattern 4: 60-Second Server Cache
```typescript
import { unstable_cache } from 'next/cache';

export const getCachedDashboardMetrics = unstable_cache(
  async (dateString: string) => fetchDailyMetricsFromDDB(dateString),
  ['daily-dashboard-metrics'],
  { revalidate: 60 } // Cached for 60 seconds across all user requests
);
```

---

## 5. Migration Execution Plan (When Ready)

1. **Step 1: Codebase Bug Fixes (IN PROGRESS)**  
   Resolve all existing authorization, deduplication, and sequential parsing bugs in application logic first.
2. **Step 2: DynamoDB Client & Model Service Creation**  
   Create `lib/dynamo/client.ts` and `lib/dynamo/lead.repo.ts`, mirroring existing TypeScript contracts.
3. **Step 3: Dual-Write / Data Export Script**  
   Export PostgreSQL tables to NDJSON and execute `BatchWriteItem` in chunks of 25 items to seed `HeeyakuCRM`.
4. **Step 4: Cutover & Validation**  
   Switch route handlers and Server Actions to read/write via the DynamoDB repository layer.
