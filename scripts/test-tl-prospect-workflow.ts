import { prisma } from '../lib/prisma';
import { Role, LeadStatus } from '@prisma/client';
import assert from 'assert';
import { getDashboardMetrics } from '../lib/dashboard/metrics';

async function runTest() {
  console.log('🧪 Starting TL Prospect Promotion & Performance Table Test...');

  const timestamp = Date.now();
  const testSuffix = `test_${timestamp}`;

  // 1. Create a squad with Team Lead and BDA
  const teamLead = await prisma.employee.create({
    data: {
      employeeCode: `TL-${timestamp}`,
      name: `Test Team Lead ${testSuffix}`,
      email: `tl_${testSuffix}@example.com`,
      phoneNumber: `+9198765${String(timestamp).slice(-5)}`,
      role: Role.TEAM_LEAD,
      passwordHash: 'dummyhash',
      isActive: true,
    },
  });

  const squad = await prisma.team.create({
    data: {
      name: `Squad ${testSuffix}`,
      teamLeadId: teamLead.id,
    },
  });

  // Update TL teamId
  await prisma.employee.update({
    where: { id: teamLead.id },
    data: { teamId: squad.id },
  });

  const bda = await prisma.employee.create({
    data: {
      employeeCode: `BDA-${timestamp}`,
      name: `Test BDA ${testSuffix}`,
      email: `bda_${testSuffix}@example.com`,
      phoneNumber: `+9198764${String(timestamp).slice(-5)}`,
      role: Role.BDA,
      teamId: squad.id,
      passwordHash: 'dummyhash',
      isActive: true,
    },
  });

  // 2. Create a lead assigned to BDA
  const lead = await prisma.lead.create({
    data: {
      leadCode: `LD-${timestamp}`,
      name: `Prospect Target ${testSuffix}`,
      phoneNumber: `+9198763${String(timestamp).slice(-5)}`,
      phoneDigits: String(timestamp).slice(-10),
      teamId: squad.id,
      assignedEmployeeId: bda.id,
      assignedAt: new Date(),
      status: LeadStatus.ASSIGNED,
    },
  });

  console.log(`✅ Provisioned Squad with TL: ${teamLead.name} and BDA: ${bda.name}`);

  // 3. Create a connected call log
  await prisma.callLog.create({
    data: {
      employeeId: bda.id,
      leadId: lead.id,
      phoneNumber: lead.phoneNumber,
      durationSeconds: 120,
      connected: true,
      startedAt: new Date(),
    },
  });

  // 4. Simulate BDA marking INTERESTED via the promotion logic
  const squadDetails = await prisma.team.findUnique({
    where: { id: bda.teamId! },
    include: { teamLead: true },
  });

  assert(squadDetails?.teamLeadId === teamLead.id, 'Squad team lead matches');

  const updatedLead = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: LeadStatus.INTERESTED,
      isProspect: true,
      promotedToProspectAt: new Date(),
      originalBdaId: bda.id,
      assignedEmployeeId: squadDetails.teamLeadId,
      assignedAt: new Date(),
      notes: `[System]: Promoted to Prospect. Reassigned to Team Lead ${teamLead.name}.`,
    },
  });

  assert(updatedLead.isProspect === true, 'Lead is flagged as isProspect = true');
  assert(updatedLead.assignedEmployeeId === teamLead.id, 'Lead is now assigned to Team Lead!');
  assert(updatedLead.originalBdaId === bda.id, 'Original BDA is preserved for credit attribution');
  console.log('✅ Lead successfully promoted to Prospect and transferred to Team Lead!');

  // 5. Team Lead converts the prospect
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: LeadStatus.CONVERTED,
      updatedAt: new Date(),
    },
  });
  console.log('✅ Team Lead successfully converted the Prospect!');

  // 6. Check Dashboard Metrics for Squad
  const metrics = await getDashboardMetrics(squad.id);
  const tlReport = metrics.employeeReports.find((e) => e.id === teamLead.id);
  const bdaReport = metrics.employeeReports.find((e) => e.id === bda.id);

  assert(tlReport, 'Team Lead appears in employeeReports table!');
  assert(tlReport.isTeamLead === true, 'Team Lead has isTeamLead flag');
  assert(tlReport.totalAssignedToday >= 1, 'Team Lead has assigned prospect counted');
  assert(tlReport.convertedToday >= 1, 'Team Lead has converted prospect counted');

  assert(bdaReport, 'BDA appears in employeeReports table alongside Team Lead!');

  console.log(`✅ Table Metrics Verified:
  - Team Lead (${tlReport.name}): Role=${tlReport.role}, Assigned Prospects=${tlReport.totalAssignedToday}, Converted=${tlReport.convertedToday}, ConvRate=${tlReport.conversionRate}%
  - BDA (${bdaReport.name}): Role=${bdaReport.role}, Assigned=${bdaReport.totalAssignedToday}`);

  // 7. Cleanup
  await prisma.callLog.deleteMany({ where: { employeeId: { in: [bda.id, teamLead.id] } } });
  await prisma.lead.delete({ where: { id: lead.id } });
  await prisma.employee.delete({ where: { id: bda.id } });
  await prisma.team.delete({ where: { id: squad.id } });
  await prisma.employee.delete({ where: { id: teamLead.id } });

  console.log('🎉 ALL TL PROSPECT PROMOTION & TABLE REFLECTION TESTS PASSED!');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
