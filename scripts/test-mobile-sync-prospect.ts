import { prisma } from '../lib/prisma';
import { Role, LeadStatus } from '@prisma/client';
import assert from 'assert';
import { signEmployeeToken } from '../lib/auth/employee-token';
import { POST } from '../app/api/employee/calls/sync/route';
import { NextRequest } from 'next/server';

async function testMobileSyncProspectWorkflow() {
  console.log('🧪 Starting Mobile Call Sync Prospect Workflow Test...');

  const timestamp = Date.now();
  const testSuffix = `mob_${timestamp}`;

  // Clean up any stale records from earlier failed test
  await prisma.lead.deleteMany({ where: { name: { contains: 'Mobile Lead' } } });
  await prisma.employee.deleteMany({ where: { email: { contains: 'mob_' } } });
  await prisma.team.deleteMany({ where: { name: { contains: 'mob_' } } });

  // 1. Create a squad with Team Lead and BDA
  const teamLead = await prisma.employee.create({
    data: {
      employeeCode: `TL-${timestamp}`,
      name: `Mobile Test TL ${testSuffix}`,
      email: `tl_${testSuffix}@example.com`,
      phoneNumber: `+9191111${String(timestamp).slice(-5)}`,
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

  await prisma.employee.update({
    where: { id: teamLead.id },
    data: { teamId: squad.id },
  });

  const bda = await prisma.employee.create({
    data: {
      employeeCode: `BDA-${timestamp}`,
      name: `Mobile Test BDA ${testSuffix}`,
      email: `bda_${testSuffix}@example.com`,
      phoneNumber: `+9192222${String(timestamp).slice(-5)}`,
      role: Role.BDA,
      teamId: squad.id,
      passwordHash: 'dummyhash',
      isActive: true,
    },
  });

  // 2. Create a Lead assigned to BDA
  const rawPhone = `+9193333${String(timestamp).slice(-5)}`;
  const phoneDigits = String(timestamp).slice(-10);
  const lead = await prisma.lead.create({
    data: {
      leadCode: `LD-${timestamp}`,
      name: `Mobile Lead ${testSuffix}`,
      phoneNumber: rawPhone,
      phoneDigits,
      teamId: squad.id,
      assignedEmployeeId: bda.id,
      assignedAt: new Date(),
      status: LeadStatus.ASSIGNED,
    },
  });

  console.log(`✅ Provisioned Squad (${squad.name}), TL (${teamLead.name}), BDA (${bda.name}), and Lead (${lead.name})`);

  try {
    // 3. Generate Auth token for BDA
    const token = signEmployeeToken({
      employeeId: bda.id,
      employeeCode: bda.employeeCode,
      email: bda.email,
      name: bda.name,
      role: bda.role,
    });

    // 4. Simulate mobile app calling POST /api/employee/calls/sync
    const syncPayload = {
      calls: [
        {
          id: `call_${timestamp}`,
          leadId: lead.id,
          phoneNumber: rawPhone,
          callType: 'OUTGOING',
          durationSeconds: 45,
          connected: true,
          outcomeId: 'interested',
          outcomeLabel: 'Interested',
          notes: 'Student is very interested in the AI/ML course and requested a demo call.',
          startedAt: new Date(Date.now() - 60000).toISOString(),
          endedAt: new Date().toISOString(),
        },
      ],
    };

    const req = new NextRequest('http://localhost:3000/api/employee/calls/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(syncPayload),
    });

    const response = await POST(req);
    const resJson = await response.json();

    console.log('Sync API Response:', resJson);
    assert.strictEqual(response.status, 200, `Expected 200 OK, got ${response.status}`);
    assert.strictEqual(resJson.success, true, 'Sync should succeed');
    assert.strictEqual(resJson.syncedCount, 1, 'Should sync 1 call');

    // 5. Query updated lead from DB
    const updatedLead = await prisma.lead.findUnique({
      where: { id: lead.id },
      include: {
        assignedEmployee: true,
        originalBda: true,
      },
    });

    assert(updatedLead, 'Lead must exist');
    console.log('Updated Lead DB Record:');
    console.log({
      leadCode: updatedLead.leadCode,
      status: updatedLead.status,
      isProspect: updatedLead.isProspect,
      assignedEmployeeId: updatedLead.assignedEmployeeId,
      assignedEmployeeName: updatedLead.assignedEmployee?.name,
      assignedEmployeeRole: updatedLead.assignedEmployee?.role,
      originalBdaId: updatedLead.originalBdaId,
      originalBdaName: updatedLead.originalBda?.name,
      notes: updatedLead.notes,
    });

    // Assertions
    assert.strictEqual(updatedLead.status, LeadStatus.INTERESTED, 'Status should be INTERESTED');
    assert.strictEqual(updatedLead.isProspect, true, 'isProspect MUST be true');
    assert.strictEqual(updatedLead.assignedEmployeeId, teamLead.id, 'Lead MUST be reassigned to Team Lead');
    assert.strictEqual(updatedLead.originalBdaId, bda.id, 'originalBdaId MUST be preserved as BDA');
    assert(updatedLead.notes?.includes('⚡ Promoted to Prospect. Reassigned to Team Lead'), 'Notes must include escalation audit note');

    console.log('🎉 VERIFICATION SUCCESSFUL: Mobile call sync automatically promotes lead to Prospect and assigns to Team Lead!');
  } finally {
    // Cleanup test artifacts
    await prisma.callLog.deleteMany({ where: { leadId: lead.id } });
    await prisma.lead.delete({ where: { id: lead.id } }).catch(() => {});
    await prisma.employee.delete({ where: { id: bda.id } }).catch(() => {});
    await prisma.team.delete({ where: { id: squad.id } }).catch(() => {});
    await prisma.employee.delete({ where: { id: teamLead.id } }).catch(() => {});
    console.log('🧹 Test cleanup completed successfully.');
  }
}

testMobileSyncProspectWorkflow()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
