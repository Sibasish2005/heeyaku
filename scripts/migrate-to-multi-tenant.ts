/**
 * HEEYAKU MULTI-TENANT ZERO-DATA-LOSS MIGRATION SCRIPT
 *
 * 1. Seeds the primary default company: "Heeyaku Primary" (status: ACTIVE)
 * 2. Links all existing orphaned records (Employees, Teams, Leads, CallLogs, SyncMeta) to it.
 * 3. Preserves all existing IDs, relations, and data.
 */

import { PrismaClient, CompanyStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('======================================================================');
  console.log('🏢 HEEYAKU MULTI-TENANT INITIALIZATION & DATA LINKING MIGRATION');
  console.log('======================================================================\n');

  // 1. Seed or find the default primary company
  console.log('1. Upserting default primary company "Heeyaku Primary"...');
  const defaultCompany = await prisma.company.upsert({
    where: { slug: 'heeyaku-primary' },
    update: {
      status: CompanyStatus.ACTIVE,
    },
    create: {
      name: 'Heeyaku Primary',
      slug: 'heeyaku-primary',
      status: CompanyStatus.ACTIVE,
      maxBdas: 100,
      requestedBdas: 100,
      trialEndsAt: new Date('2030-01-01T00:00:00.000Z'), // Permanent enterprise allocation
      verifiedAt: new Date(),
      verifiedBy: 'system-migration',
    },
  });

  console.log(`✅ Default Company ID: ${defaultCompany.id} (${defaultCompany.name})\n`);

  // 2. Link existing Teams
  console.log('2. Linking existing squads (teams) to default company...');
  const teamsUpdated = await prisma.team.updateMany({
    where: { companyId: null },
    data: { companyId: defaultCompany.id },
  });
  console.log(`✅ Updated ${teamsUpdated.count} squads.\n`);

  // 3. Link existing Employees
  console.log('3. Linking existing employees to default company...');
  const employeesUpdated = await prisma.employee.updateMany({
    where: { companyId: null },
    data: { companyId: defaultCompany.id },
  });
  console.log(`✅ Updated ${employeesUpdated.count} employees.\n`);

  // 4. Link existing Leads
  console.log('4. Linking existing customer leads to default company...');
  const leadsUpdated = await prisma.lead.updateMany({
    where: { companyId: null },
    data: { companyId: defaultCompany.id },
  });
  console.log(`✅ Updated ${leadsUpdated.count} customer leads.\n`);

  // 5. Link existing CallLogs
  console.log('5. Linking existing call logs to default company...');
  const callsUpdated = await prisma.callLog.updateMany({
    where: { companyId: null },
    data: { companyId: defaultCompany.id },
  });
  console.log(`✅ Updated ${callsUpdated.count} call logs.\n`);

  // 6. Link existing SyncMeta
  console.log('6. Linking existing sync metadata to default company...');
  const syncUpdated = await prisma.syncMeta.updateMany({
    where: { companyId: null },
    data: { companyId: defaultCompany.id },
  });
  console.log(`✅ Updated ${syncUpdated.count} sync metadata records.\n`);

  console.log('======================================================================');
  console.log('🎉 MULTI-TENANT DATA MIGRATION COMPLETE WITH ZERO DATA LOSS!');
  console.log('======================================================================');
}

runMigration()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
