import { prisma } from '../lib/prisma';

async function clearDatabase() {
  console.log('🧹 Clearing all data from database (Fresh Reset)...');

  try {
    // Truncate all tables with cascade in PostgreSQL
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE 
        "call_logs",
        "leads",
        "sync_meta",
        "teams",
        "employees",
        "companies"
      CASCADE;
    `);

    console.log('✅ All tables truncated successfully:');
    console.log('  - call_logs: 0');
    console.log('  - leads: 0');
    console.log('  - sync_meta: 0');
    console.log('  - teams: 0');
    console.log('  - employees: 0');
    console.log('  - companies: 0');
    console.log('\n🌟 Database is 100% clean and fresh.');
  } catch (err: any) {
    console.error('❌ Error clearing database:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
