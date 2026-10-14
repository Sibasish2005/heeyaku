import { PrismaClient, Role, LeadStatus, CallType } from '@prisma/client';

// Load testing connection pool: dynamically uses process.env.DATABASE_URL or test URL
const baseDbUrl = process.env.DATABASE_URL || '';
const testDbUrl = baseDbUrl.includes('?')
  ? baseDbUrl.replace(/connection_limit=\d+/, 'connection_limit=50')
  : baseDbUrl + '?connection_limit=50&pool_timeout=30';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: testDbUrl,
    },
  },
  log: ['error'],
});

const PREFIX = 'REAL_TEST_';

interface StageResult {
  concurrency: number;
  totalTransactions: number; // 1 Transaction = Read + Insert Call + Update Lead (3 SQL queries)
  successful: number;
  failed: number;
  durationMs: number;
  tps: number;
  qps: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  maxLatencyMs: number;
  errorSample?: string;
}

// Indian names and companies for realistic data
const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Diya', 'Saanvi', 'Ananya', 'Aadhya', 'Pari', 'Isha', 'Myra', 'Kavya', 'Riya', 'Anika'];
const LAST_NAMES = ['Sharma', 'Verma', 'Patel', 'Reddy', 'Mehta', 'Chopra', 'Nair', 'Iyer', 'Gupta', 'Singh', 'Deshmukh', 'Bose', 'Mukherjee', 'Rao', 'Kulkarni'];
const COMPANIES = ['Apex Logistics', 'TechVanguard', 'OmniRetail', 'NextGen FinTech', 'Zenith Pharma', 'Skyline Infra', 'Alpha Capital', 'CloudNexus'];

async function seedRealTestData(numLeads: number = 1000, numBdas: number = 10): Promise<{ teamId: string; bdaIds: string[]; leadIds: string[] }> {
  console.log(`📦 Seeding realistic CRM test fixtures (${numBdas} BDAs, ${numLeads} Leads)...`);

  // 1. Create Test Team
  const team = await prisma.team.create({
    data: {
      name: `${PREFIX}Squad_${Date.now()}`,
      description: 'Automated Benchmark Test Squad',
      colorTag: '#10B981',
    },
  });

  // 2. Create Test BDAs
  const bdaIds: string[] = [];
  for (let i = 0; i < numBdas; i++) {
    const emp = await prisma.employee.create({
      data: {
        employeeCode: `${PREFIX}BDA_${i + 1}_${Date.now()}`,
        name: `Agent ${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`,
        email: `bench_bda_${i + 1}_${Date.now()}@heeyaku.test`,
        phoneNumber: `+9198000000${i < 10 ? '0' + i : i}`,
        role: Role.BDA,
        teamId: team.id,
        passwordHash: 'dummy_hash_bench',
        isActive: true,
      },
    });
    bdaIds.push(emp.id);
  }

  // 3. Batch insert 1,000 realistic leads (chunked by 250 for speed)
  const leadsData = [];
  for (let i = 0; i < numLeads; i++) {
    const fName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lName = LAST_NAMES[i % LAST_NAMES.length];
    const comp = COMPANIES[i % COMPANIES.length];
    const assignedBda = bdaIds[i % bdaIds.length];
    const phone = `+919876${String(100000 + i).slice(-6)}`;

    leadsData.push({
      leadCode: `${PREFIX}LEAD_${i + 1}_${Date.now()}`,
      name: `${fName} ${lName}`,
      phoneNumber: phone,
      phoneDigits: phone.slice(-10),
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}_${i}@${comp.toLowerCase().replace(/\s+/g, '')}.com`,
      company: comp,
      source: i % 2 === 0 ? 'GOOGLE_ADS' : 'COLD_CALL',
      status: LeadStatus.NEW,
      teamId: team.id,
      assignedEmployeeId: assignedBda,
      assignedAt: new Date(),
    });
  }

  for (let c = 0; c < leadsData.length; c += 250) {
    await prisma.lead.createMany({
      data: leadsData.slice(c, c + 250),
      skipDuplicates: true,
    });
  }

  // Fetch created lead IDs
  const createdLeads = await prisma.lead.findMany({
    where: { teamId: team.id },
    select: { id: true },
  });

  console.log(`✅ Successfully seeded 1 Squad, ${numBdas} BDAs, and ${createdLeads.length} Leads!\n`);
  return { teamId: team.id, bdaIds, leadIds: createdLeads.map((l) => l.id) };
}

async function runRealWorkflowStage(
  concurrency: number,
  iterationsPerWorker: number,
  bdaIds: string[],
  leadIds: string[]
): Promise<StageResult> {
  const latencies: number[] = [];
  let successful = 0;
  let failed = 0;
  let firstError = '';

  const totalTransactions = concurrency * iterationsPerWorker;
  const startTime = Date.now();

  const workers = Array.from({ length: concurrency }, async (_, workerIndex) => {
    const assignedBdaId = bdaIds[workerIndex % bdaIds.length];

    for (let i = 0; i < iterationsPerWorker; i++) {
      const targetLeadId = leadIds[(workerIndex * iterationsPerWorker + i) % leadIds.length];
      const txStart = Date.now();

      try {
        // =====================================================================
        // FULL REAL-WORLD BDA WORKFLOW:
        // 1. READ: BDA views their lead details (SELECT)
        // 2. INSERT: BDA completes call, logs conversation (INSERT into call_logs)
        // 3. UPDATE: BDA marks lead as INTERESTED with timestamp (UPDATE leads)
        // =====================================================================

        // 1. Read lead
        const lead = await prisma.lead.findUnique({
          where: { id: targetLeadId },
          select: { id: true, leadCode: true, phoneNumber: true, status: true },
        });

        if (lead) {
          // 2. Insert Call Log
          await prisma.callLog.create({
            data: {
              employeeId: assignedBdaId,
              leadId: lead.id,
              phoneNumber: lead.phoneNumber,
              callType: CallType.OUTGOING,
              durationSeconds: Math.floor(Math.random() * 180) + 30, // 30s to 210s call
              connected: true,
              outcomeLabel: 'Interested in Product Demo',
              notes: 'Discussed CRM telephony features. Follow-up scheduled.',
              startedAt: new Date(Date.now() - 90000),
              endedAt: new Date(),
            },
          });

          // 3. Update Lead Status
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              status: LeadStatus.INTERESTED,
              notes: 'Updated disposition from call log benchmark.',
              updatedAt: new Date(),
            },
          });
        }

        const txDuration = Date.now() - txStart;
        latencies.push(txDuration);
        successful++;
      } catch (err: any) {
        failed++;
        if (!firstError) {
          firstError = err.message || String(err);
        }
      }
    }
  });

  await Promise.all(workers);
  const totalDuration = Date.now() - startTime;

  latencies.sort((a, b) => a - b);
  const avg = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const p95 = latencies.length ? latencies[Math.floor(latencies.length * 0.95)] : 0;
  const p99 = latencies.length ? latencies[Math.floor(latencies.length * 0.99)] : 0;
  const max = latencies.length ? latencies[latencies.length - 1] : 0;
  
  // 1 successful transaction = 3 SQL queries (1 SELECT + 1 INSERT + 1 UPDATE)
  const tps = totalDuration > 0 ? Math.round((successful / (totalDuration / 1000))) : 0;
  const qps = tps * 3;

  return {
    concurrency,
    totalTransactions,
    successful,
    failed,
    durationMs: totalDuration,
    tps,
    qps,
    avgLatencyMs: avg,
    p95LatencyMs: p95,
    p99LatencyMs: p99,
    maxLatencyMs: max,
    errorSample: firstError || undefined,
  };
}

async function cleanupFixtures(teamId: string) {
  console.log('\n🧹 Cleaning up benchmark fixtures from database...');
  try {
    await prisma.callLog.deleteMany({
      where: { lead: { teamId } },
    });
    await prisma.lead.deleteMany({
      where: { teamId },
    });
    await prisma.employee.deleteMany({
      where: { teamId },
    });
    await prisma.team.delete({
      where: { id: teamId },
    });
    console.log('✅ Database is 100% clean and pristine!\n');
  } catch (err: any) {
    console.error('Warning during cleanup:', err.message);
  }
}

async function main() {
  console.log('='.repeat(75));
  console.log('🔥 REAL-WORLD CRM WRITE & READ LOAD TEST (100 BDAs SIMULATION)');
  console.log('='.repeat(75));
  console.log('Target Host: [REDACTED_OCI_DB_IP] (Oracle AMD VM - 1GB RAM + 4GB Swap)');
  console.log('Workflow: 1 SELECT (Lead) + 1 INSERT (CallLog) + 1 UPDATE (Lead Status)');
  console.log('Database Engine: PostgreSQL 18 with PgBouncer Transaction Pooler\n');

  // Seed 1,000 real leads & 10 BDAs
  const fixtures = await seedRealTestData(1000, 10);

  // Concurrency Stages simulating increasing load
  const stages = [
    { concurrency: 10, iterations: 10 },  // 100 Transactions  = 300 SQL operations
    { concurrency: 25, iterations: 10 },  // 250 Transactions  = 750 SQL operations
    { concurrency: 50, iterations: 10 },  // 500 Transactions  = 1,500 SQL operations
    { concurrency: 100, iterations: 10 }, // 1,000 Transactions = 3,000 SQL operations (Full 100 BDAs)
  ];

  const results: StageResult[] = [];

  try {
    for (const stage of stages) {
      process.stdout.write(
        `⏳ Testing ${stage.concurrency} concurrent BDAs (${stage.concurrency * stage.iterations} calls + status updates)... `
      );
      const res = await runRealWorkflowStage(stage.concurrency, stage.iterations, fixtures.bdaIds, fixtures.leadIds);
      results.push(res);
      console.log(
        `Done in ${(res.durationMs / 1000).toFixed(2)}s | ${res.tps} Trans/s (~${res.qps} SQL QPS) | P95: ${res.p95LatencyMs}ms | Success: ${res.successful}/${res.totalTransactions}`
      );

      if (res.failed > 0) {
        console.log(`   ⚠️ Failures: ${res.failed}. Sample error: ${res.errorSample?.substring(0, 100)}`);
      }

      await new Promise((r) => setTimeout(r, 1000));
    }
  } finally {
    await cleanupFixtures(fixtures.teamId);
  }

  console.log('='.repeat(75));
  console.log('📊 REAL-WORLD BDA SIMULATION FINAL PERFORMANCE REPORT');
  console.log('='.repeat(75));
  console.log('| Concurrent BDAs | Total Workflows | SQL Queries | Workflow/s | SQL QPS  | Avg Latency | P95 Latency | Success Rate |');
  console.log('|-----------------|-----------------|-------------|------------|----------|-------------|-------------|--------------|');

  for (const r of results) {
    const successRate = ((r.successful / r.totalTransactions) * 100).toFixed(1) + '%';
    console.log(
      `| ${String(r.concurrency).padEnd(15)} | ${String(r.totalTransactions).padEnd(15)} | ${String(r.totalTransactions * 3).padEnd(11)} | ${String(r.tps + ' wf/s').padEnd(10)} | ${String(r.qps + ' q/s').padEnd(8)} | ${String(r.avgLatencyMs + 'ms').padEnd(11)} | ${String(r.p95LatencyMs + 'ms').padEnd(11)} | ${successRate.padEnd(12)} |`
    );
  }

  console.log('='.repeat(75));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Fatal load test failure:', e);
  process.exit(1);
});
