import { prisma } from '../lib/prisma';

async function main() {
  console.log('--- Initializing / Migrating Teams in Heeyaku CRM ---');

  // 1. Check or create default Team Alpha
  let defaultTeam = await prisma.team.findFirst({
    where: { name: 'Alpha Squad' },
  });

  if (!defaultTeam) {
    defaultTeam = await prisma.team.create({
      data: {
        name: 'Alpha Squad',
        description: 'Core Outbound Sales & Admissions Squad',
        colorTag: '#2563EB',
      },
    });
    console.log('Created default team:', defaultTeam.name, defaultTeam.id);
  } else {
    console.log('Default team exists:', defaultTeam.name, defaultTeam.id);
  }

  // 2. Link unlinked employees to default team
  const unlinkedEmployees = await prisma.employee.findMany({
    where: { teamId: null },
  });

  if (unlinkedEmployees.length > 0) {
    console.log(`Linking ${unlinkedEmployees.length} unassigned employees to default team...`);
    await prisma.employee.updateMany({
      where: { teamId: null },
      data: {
        teamId: defaultTeam.id,
        role: 'BDA',
      },
    });
  }

  // 3. Link unlinked leads to default team or assigned employee's team
  const unlinkedLeads = await prisma.lead.findMany({
    where: { teamId: null },
    select: { id: true, assignedEmployeeId: true },
  });

  if (unlinkedLeads.length > 0) {
    console.log(`Linking ${unlinkedLeads.length} leads with default team...`);
    await prisma.lead.updateMany({
      where: { teamId: null },
      data: {
        teamId: defaultTeam.id,
      },
    });
  }

  console.log('--- Team initialization completed successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
