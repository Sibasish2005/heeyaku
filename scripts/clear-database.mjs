import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database records...');

  // 1. Delete all Call Logs
  const deletedCalls = await prisma.callLog.deleteMany({});
  console.log(`Deleted ${deletedCalls.count} call logs.`);

  // 2. Delete all Leads
  const deletedLeads = await prisma.lead.deleteMany({});
  console.log(`Deleted ${deletedLeads.count} leads.`);

  // Note: We preserve the Employee accounts so you can still log into the mobile app and admin dashboard!
  const employeeCount = await prisma.employee.count();
  console.log(`Preserved ${employeeCount} employee accounts.`);

  console.log('Database successfully cleared for fresh entries!');
}

main()
  .catch((e) => {
    console.error('Error clearing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
