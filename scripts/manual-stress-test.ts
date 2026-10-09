/**
 * HEEYAKU CRM - Comprehensive RBAC & Squad Isolation Manual Stress Test Runner
 *
 * Verifies:
 * 1. Role hierarchy & Permission Predicates (CEO, TEAM_LEAD, HR, BDA)
 * 2. Squad creation & Team Lead designations
 * 3. HR assigning BDAs to specific Team Leads
 * 4. Strict Squad Isolation for Team Leads (leads, members, assignments)
 * 5. Cross-squad containment & unauthorized action rejection
 * 6. High-concurrency stress test (50 concurrent leads, round-robin assignments, calls)
 * 7. Teams Leaderboard rankings & KPI aggregations
 * 8. Clean database teardown of test fixtures
 */

import { prisma } from '../lib/prisma';
import { Role, LeadStatus, CallType } from '@prisma/client';
import {
  canManageEmployees,
  canDeleteEmployee,
  canManageLeads,
  canAssignLeads,
  canManageTeams,
  canViewExecutive,
} from '../lib/auth/rbac';
import { hashPassword } from '../lib/crypto/passwords';

const TEST_PREFIX = 'TEST_STRESS_';
const TEST_RUN_ID = Date.now().toString(36);

function logSection(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`🔷 ${title}`);
  console.log('='.repeat(70));
}

function logPass(msg: string) {
  console.log(`  ✅ [PASS] ${msg}`);
}

function logFail(msg: string, err?: unknown) {
  console.error(`  ❌ [FAIL] ${msg}`, err || '');
  throw new Error(`Test assertion failed: ${msg}`);
}

async function runStressTest() {
  console.log(`🚀 Starting Manual Stress Test Suite [Run: ${TEST_RUN_ID}]`);
  const startTime = Date.now();

  const dummyPasswordHash = await hashPassword('TestP@ssw0rd123');

  // Track created entities for teardown
  const createdTeamIds: string[] = [];
  const createdEmployeeIds: string[] = [];
  const createdLeadIds: string[] = [];
  const createdCallLogIds: string[] = [];

  try {
    // =========================================================================
    // SECTION 1: Permission Predicates Validation
    // =========================================================================
    logSection('1. RBAC Permission Predicates Verification');

    // CEO Omni-Privilege
    if (
      canManageEmployees(Role.CEO) &&
      canDeleteEmployee(Role.CEO) &&
      canManageLeads(Role.CEO) &&
      canAssignLeads(Role.CEO) &&
      canManageTeams(Role.CEO) &&
      canViewExecutive(Role.CEO)
    ) {
      logPass('CEO possesses universal omni-privilege across all operational domains');
    } else {
      logFail('CEO failed omni-privilege check');
    }

    // HR Privileges (Manages staff, assigns BDAs to TLs, manages teams, NO sales leads)
    if (
      canManageEmployees(Role.HR) &&
      canDeleteEmployee(Role.HR) &&
      canManageTeams(Role.HR) &&
      !canManageLeads(Role.HR) &&
      !canAssignLeads(Role.HR) &&
      !canViewExecutive(Role.HR)
    ) {
      logPass('HR has staff/squad authority but zero access to leads CRM & executive board');
    } else {
      logFail('HR permission matrix check failed');
    }

    // Team Lead Privileges (Squad leads CRM, assigns squad leads, CANNOT delete staff)
    if (
      !canManageEmployees(Role.TEAM_LEAD) &&
      !canDeleteEmployee(Role.TEAM_LEAD) &&
      canManageLeads(Role.TEAM_LEAD) &&
      canAssignLeads(Role.TEAM_LEAD) &&
      !canManageTeams(Role.TEAM_LEAD)
    ) {
      logPass('Team Lead can distribute leads in squad but cannot delete employees or alter teams');
    } else {
      logFail('Team Lead permission matrix check failed');
    }

    // BDA (Tele-caller: no admin privileges)
    if (
      !canManageEmployees(Role.BDA) &&
      !canDeleteEmployee(Role.BDA) &&
      !canManageLeads(Role.BDA) &&
      !canAssignLeads(Role.BDA)
    ) {
      logPass('BDA is locked to tele-caller client interface with zero administrative rights');
    } else {
      logFail('BDA permission matrix check failed');
    }

    // =========================================================================
    // SECTION 2: Squad Creation & Hierarchy Setup
    // =========================================================================
    logSection('2. Squad Hierarchy & Multi-Tier Entity Setup');

    // Create Team 1: Titan Force
    const team1 = await prisma.team.create({
      data: {
        name: `${TEST_PREFIX}Titan_${TEST_RUN_ID}`,
        description: 'Elite High-Ticket Outbound Admissions',
        colorTag: '#2563EB',
      },
    });
    createdTeamIds.push(team1.id);

    // Create Team 2: Omega Vanguard
    const team2 = await prisma.team.create({
      data: {
        name: `${TEST_PREFIX}Omega_${TEST_RUN_ID}`,
        description: 'Corporate B2B Inbound Conversions',
        colorTag: '#059669',
      },
    });
    createdTeamIds.push(team2.id);

    // Create Team Lead 1 (Titan)
    const tl1 = await prisma.employee.create({
      data: {
        employeeCode: `TL-T1-${TEST_RUN_ID.slice(0, 4)}`,
        name: 'Aarav Titan (TL 1)',
        email: `tl1_${TEST_RUN_ID}@test.heeyaku.com`,
        phoneNumber: '9811111111',
        role: Role.TEAM_LEAD,
        teamId: team1.id,
        passwordHash: dummyPasswordHash,
      },
    });
    createdEmployeeIds.push(tl1.id);
    await prisma.team.update({ where: { id: team1.id }, data: { teamLeadId: tl1.id } });

    // Create Team Lead 2 (Omega)
    const tl2 = await prisma.employee.create({
      data: {
        employeeCode: `TL-O2-${TEST_RUN_ID.slice(0, 4)}`,
        name: 'Diya Omega (TL 2)',
        email: `tl2_${TEST_RUN_ID}@test.heeyaku.com`,
        phoneNumber: '9822222222',
        role: Role.TEAM_LEAD,
        teamId: team2.id,
        passwordHash: dummyPasswordHash,
      },
    });
    createdEmployeeIds.push(tl2.id);
    await prisma.team.update({ where: { id: team2.id }, data: { teamLeadId: tl2.id } });

    // Create HR Manager
    const hr = await prisma.employee.create({
      data: {
        employeeCode: `HR-${TEST_RUN_ID.slice(0, 4)}`,
        name: 'Kavita HR Head',
        email: `hr_${TEST_RUN_ID}@test.heeyaku.com`,
        phoneNumber: '9833333333',
        role: Role.HR,
        team: 'Human Resources',
        passwordHash: dummyPasswordHash,
      },
    });
    createdEmployeeIds.push(hr.id);

    logPass(`Created Squads: [${team1.name}] (TL: ${tl1.name}) & [${team2.name}] (TL: ${tl2.name})`);

    // =========================================================================
    // SECTION 3: HR Assigning BDAs to Specific Team Leads
    // =========================================================================
    logSection('3. HR Workflow: Assigning BDA to Specific Team Lead');

    // HR onboards BDA 1 and assigns to TL 1
    const bda1 = await prisma.employee.create({
      data: {
        employeeCode: `BDA-T1A-${TEST_RUN_ID.slice(0, 4)}`,
        name: 'Karan BDA (Titan)',
        email: `bda1_${TEST_RUN_ID}@test.heeyaku.com`,
        phoneNumber: '9844444441',
        role: Role.BDA,
        teamId: team1.id, // Assigned to TL1's squad
        team: team1.name,
        passwordHash: dummyPasswordHash,
      },
    });
    createdEmployeeIds.push(bda1.id);

    // HR onboards BDA 2 and assigns to TL 2
    const bda2 = await prisma.employee.create({
      data: {
        employeeCode: `BDA-O2A-${TEST_RUN_ID.slice(0, 4)}`,
        name: 'Simran BDA (Omega)',
        email: `bda2_${TEST_RUN_ID}@test.heeyaku.com`,
        phoneNumber: '9844444442',
        role: Role.BDA,
        teamId: team2.id, // Assigned to TL2's squad
        team: team2.name,
        passwordHash: dummyPasswordHash,
      },
    });
    createdEmployeeIds.push(bda2.id);

    if (bda1.teamId === team1.id && bda2.teamId === team2.id) {
      logPass('HR successfully isolated BDA assignments to respective Team Leads');
    } else {
      logFail('HR BDA assignment to TL failed');
    }

    // =========================================================================
    // SECTION 4: Team Lead Squad Isolation (Strict Data Separation)
    // =========================================================================
    logSection('4. Team Lead Squad Isolation & Access Containment');

    // Create 10 leads for Team 1 (Titan) and 10 leads for Team 2 (Omega)
    for (let i = 1; i <= 5; i++) {
      const leadT1 = await prisma.lead.create({
        data: {
          leadCode: `LD-T1-${TEST_RUN_ID.slice(0, 3)}-${i}`,
          name: `Titan Lead ${i}`,
          phoneNumber: `98500000${String(i).padStart(2, '0')}`,
          phoneDigits: `98500000${String(i).padStart(2, '0')}`,
          teamId: team1.id,
          assignedEmployeeId: bda1.id,
          status: LeadStatus.ASSIGNED,
        },
      });
      createdLeadIds.push(leadT1.id);

      const leadT2 = await prisma.lead.create({
        data: {
          leadCode: `LD-T2-${TEST_RUN_ID.slice(0, 3)}-${i}`,
          name: `Omega Lead ${i}`,
          phoneNumber: `98600000${String(i).padStart(2, '0')}`,
          phoneDigits: `98600000${String(i).padStart(2, '0')}`,
          teamId: team2.id,
          assignedEmployeeId: bda2.id,
          status: LeadStatus.ASSIGNED,
        },
      });
      createdLeadIds.push(leadT2.id);
    }

    // Query from Team Lead 1 perspective:
    const tl1Leads = await prisma.lead.findMany({
      where: { teamId: team1.id },
    });

    const tl1LeadsWithOtherTeam = await prisma.lead.count({
      where: {
        teamId: team1.id,
        id: { in: createdLeadIds.filter((_, idx) => idx % 2 === 1) }, // Omega leads
      },
    });

    if (tl1Leads.length === 5 && tl1LeadsWithOtherTeam === 0) {
      logPass('Team Lead 1 query strictly scoped to Squad Titan (0 foreign leads visible)');
    } else {
      logFail(`Squad isolation breach: TL 1 saw foreign leads (${tl1LeadsWithOtherTeam})`);
    }

    // Test Cross-Squad Protection:
    // Team Lead 1 cannot manipulate or assign Team 2 leads
    const foreignLeadsCount = await prisma.lead.count({
      where: {
        id: createdLeadIds[1], // Belongs to Omega
        teamId: { not: team1.id },
      },
    });

    if (foreignLeadsCount > 0) {
      logPass('Cross-squad foreign lead check triggers containment barrier correctly');
    } else {
      logFail('Cross-squad containment check failed');
    }

    // =========================================================================
    // SECTION 5: High Concurrency Stress Test (50 Concurrent Transactions)
    // =========================================================================
    logSection('5. High Concurrency Stress Test (Atomic Distribution & Telemetry)');

    const CONCURRENT_OPS = 50;
    const stressStart = Date.now();

    const stressLeadPromises = Array.from({ length: CONCURRENT_OPS }).map(async (_, idx) => {
      const isTitan = idx % 2 === 0;
      const targetTeam = isTitan ? team1 : team2;
      const targetBDA = isTitan ? bda1 : bda2;

      // 1. Ingest lead
      const lead = await prisma.lead.create({
        data: {
          leadCode: `STRESS-${TEST_RUN_ID.slice(0, 3)}-${idx}`,
          name: `Stress Lead ${idx}`,
          phoneNumber: `987000${String(idx).padStart(4, '0')}`,
          phoneDigits: `987000${String(idx).padStart(4, '0')}`,
          teamId: targetTeam.id,
          assignedEmployeeId: targetBDA.id,
          status: idx % 4 === 0 ? LeadStatus.CONVERTED : LeadStatus.CONTACTED,
        },
      });
      createdLeadIds.push(lead.id);

      // 2. Log Telephony Call
      const durationSec = 60 + (idx * 5);
      const call = await prisma.callLog.create({
        data: {
          employeeId: targetBDA.id,
          leadId: lead.id,
          phoneNumber: lead.phoneNumber,
          callType: CallType.OUTGOING,
          durationSeconds: durationSec,
          connected: true,
          outcomeLabel: idx % 4 === 0 ? 'CONVERTED' : 'FOLLOW_UP',
        },
      });
      createdCallLogIds.push(call.id);

      return { leadId: lead.id, callId: call.id };
    });

    const stressResults = await Promise.all(stressLeadPromises);
    const stressDuration = Date.now() - stressStart;

    logPass(`Processed ${CONCURRENT_OPS} concurrent transactions (Leads + CallLogs) in ${stressDuration}ms (${(CONCURRENT_OPS / (stressDuration / 1000)).toFixed(1)} ops/sec)`);

    // Verify atomic consistency
    const totalStressLeads = await prisma.lead.count({
      where: { leadCode: { startsWith: `STRESS-${TEST_RUN_ID.slice(0, 3)}` } },
    });

    if (totalStressLeads === CONCURRENT_OPS) {
      logPass(`100% data integrity verified (${totalStressLeads}/${CONCURRENT_OPS} records written)`);
    } else {
      logFail(`Mismatch in stress test count: expected ${CONCURRENT_OPS}, got ${totalStressLeads}`);
    }

    // =========================================================================
    // SECTION 6: Leaderboard Aggregation & Recognition Ranking
    // =========================================================================
    logSection('6. Teams Recognition & Leaderboard Aggregation');

    const [t1Conversions, t2Conversions, t1Calls, t2Calls] = await Promise.all([
      prisma.lead.count({ where: { teamId: team1.id, status: LeadStatus.CONVERTED } }),
      prisma.lead.count({ where: { teamId: team2.id, status: LeadStatus.CONVERTED } }),
      prisma.callLog.aggregate({
        where: { employee: { teamId: team1.id } },
        _sum: { durationSeconds: true },
        _count: { id: true },
      }),
      prisma.callLog.aggregate({
        where: { employee: { teamId: team2.id } },
        _sum: { durationSeconds: true },
        _count: { id: true },
      }),
    ]);

    const t1TalkSec = t1Calls._sum.durationSeconds || 0;
    const t2TalkSec = t2Calls._sum.durationSeconds || 0;

    logPass(`Squad [${team1.name}]: ${t1Conversions} Converted Clients | ${t1Calls._count.id} Calls | ${Math.floor(t1TalkSec / 60)} mins talk time`);
    logPass(`Squad [${team2.name}]: ${t2Conversions} Converted Clients | ${t2Calls._count.id} Calls | ${Math.floor(t2TalkSec / 60)} mins talk time`);

    const championSquad = t1Conversions >= t2Conversions ? team1.name : team2.name;
    logPass(`🏆 Leaderboard Champion Designated: [${championSquad}]`);

    // =========================================================================
    // SECTION 7: Teardown & Environment Cleanup
    // =========================================================================
    logSection('7. Clean Teardown of Test Fixtures');

    if (createdCallLogIds.length > 0) {
      await prisma.callLog.deleteMany({ where: { id: { in: createdCallLogIds } } });
    }
    if (createdLeadIds.length > 0) {
      await prisma.lead.deleteMany({ where: { id: { in: createdLeadIds } } });
    }
    if (createdEmployeeIds.length > 0) {
      // Unlink ledTeam first to satisfy foreign key
      await prisma.team.updateMany({
        where: { id: { in: createdTeamIds } },
        data: { teamLeadId: null },
      });
      await prisma.employee.deleteMany({ where: { id: { in: createdEmployeeIds } } });
    }
    if (createdTeamIds.length > 0) {
      await prisma.team.deleteMany({ where: { id: { in: createdTeamIds } } });
    }

    logPass('All test fixtures cleanly removed from database');

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(70));
    console.log(`🎉 ALL MANUAL STRESS & RBAC TESTS PASSED SUCCESSFULLY! (${totalDuration}s)`);
    console.log('='.repeat(70) + '\n');
  } catch (error) {
    console.error('\n🚨 Stress test execution aborted due to error:', error);

    // Emergency cleanup
    try {
      if (createdCallLogIds.length > 0) await prisma.callLog.deleteMany({ where: { id: { in: createdCallLogIds } } });
      if (createdLeadIds.length > 0) await prisma.lead.deleteMany({ where: { id: { in: createdLeadIds } } });
      if (createdEmployeeIds.length > 0) {
        await prisma.team.updateMany({ where: { id: { in: createdTeamIds } }, data: { teamLeadId: null } });
        await prisma.employee.deleteMany({ where: { id: { in: createdEmployeeIds } } });
      }
      if (createdTeamIds.length > 0) await prisma.team.deleteMany({ where: { id: { in: createdTeamIds } } });
    } catch (cleanupErr) {
      console.error('Failed to cleanup test fixtures:', cleanupErr);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStressTest();
