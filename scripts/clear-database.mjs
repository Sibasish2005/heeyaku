import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Checking Database Row Counts Before Wipe ===');
  const beforeCounts = {
    callLogs: await prisma.callLog.count(),
    leads: await prisma.lead.count(),
    employees: await prisma.employee.count(),
    teams: await prisma.team.count(),
    syncMeta: await prisma.syncMeta.count(),
  };
  console.log('Before wipe:', beforeCounts);

  console.log('\n=== Wiping Entire Database ===');

  await prisma.$transaction(async (tx) => {
    // 1. Delete dependent tables
    await tx.callLog.deleteMany({});
    await tx.lead.deleteMany({});

    // 2. Disconnect circular relations between teams and employees
    await tx.team.updateMany({ data: { teamLeadId: null } });
    await tx.employee.updateMany({ data: { teamId: null } });

    // 3. Delete employees, teams, and sync metadata
    await tx.employee.deleteMany({});
    await tx.team.deleteMany({});
    await tx.syncMeta.deleteMany({});

    // 4. Run TRUNCATE CASCADE for absolute thoroughness and identity reset
    await tx.$executeRawUnsafe(`
      TRUNCATE TABLE "call_logs", "leads", "employees", "teams", "sync_meta" CASCADE;
    `);
  });

  const afterCounts = {
    callLogs: await prisma.callLog.count(),
    leads: await prisma.lead.count(),
    employees: await prisma.employee.count(),
    teams: await prisma.team.count(),
    syncMeta: await prisma.syncMeta.count(),
  };

  console.log('After wipe:', afterCounts);
  console.log('\n=== Entire Database Wiped Clean (0 Records Remaining) ===');
}

main()
  .catch((e) => {
    console.error('Error clearing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

