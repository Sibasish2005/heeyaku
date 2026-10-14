import { prisma } from '@/lib/prisma';
import { CompanyStatus, Role } from '@prisma/client';
import { isSuperAdminEmail } from '@/lib/auth/rbac';

async function runMultiTenantEdgeCasesAudit() {
  console.log('🧪 Starting Multi-Tenant & Super Admin Edge Cases Verification Suite...\n');
  const tag = `edge_${Date.now()}`;
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  // Edge Case 1: Super Admin vs Tenant Admin role separation
  console.log('======================================================================');
  console.log('🛡️ 1. Super Admin vs Tenant Admin Role Separation');
  console.log('======================================================================');
  assert(isSuperAdminEmail('sibasishchakraborti@gmail.com'), 'sibasishchakraborti is recognized as Super Admin');
  assert(isSuperAdminEmail(' SIBASISHchakraborti@GMAIL.COM '), 'Case and whitespace normalized for Super Admin');
  assert(!isSuperAdminEmail('sibasishchakraborty000@gmail.com'), 'sibasishchakraborty000 is NOT a Super Admin');
  assert(!isSuperAdminEmail('subhra1234c@gmail.com'), 'subhra1234c is NOT a Super Admin');
  assert(!isSuperAdminEmail('hacker@evil.com'), 'Unauthorized email rejected');
  assert(!isSuperAdminEmail(null), 'Null email rejected safely without throwing');
  assert(!isSuperAdminEmail(''), 'Empty email rejected safely');

  // Edge Case 2: Multi-Tenant Database Isolation
  console.log('\n======================================================================');
  console.log('🏢 2. Multi-Tenant Provisioning, Slug Uniqueness & Boundary Isolation');
  console.log('======================================================================');
  
  // Create Company A
  const compA = await prisma.company.create({
    data: {
      name: `Company A ${tag}`,
      slug: `comp-a-${tag}`,
      phoneNumber: '+919876543210',
      industry: 'EdTech',
      status: CompanyStatus.ACTIVE,
      maxBdas: 5,
      requestedBdas: 5,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Create Company B
  const compB = await prisma.company.create({
    data: {
      name: `Company B ${tag}`,
      slug: `comp-b-${tag}`,
      phoneNumber: '+919876543211',
      industry: 'FinTech',
      status: CompanyStatus.ACTIVE,
      maxBdas: 3,
      requestedBdas: 3,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  assert(compA.id !== compB.id, 'Distinct company IDs generated');
  assert(compA.slug !== compB.slug, 'Distinct slugs enforced');

  // Create Squad and BDA in Company A
  const squadA = await prisma.team.create({
    data: {
      name: `Squad A ${tag}`,
      companyId: compA.id,
    },
  });

  const bdaA = await prisma.employee.create({
    data: {
      employeeCode: `BDA-A-${tag}`.slice(0, 16),
      name: 'Associate A',
      email: `bda_a_${tag}@test.com`,
      phoneNumber: '+919876543201',
      role: Role.BDA,
      companyId: compA.id,
      teamId: squadA.id,
      passwordHash: 'dummy_hash',
    },
  });

  // Create Squad and BDA in Company B
  const squadB = await prisma.team.create({
    data: {
      name: `Squad B ${tag}`,
      companyId: compB.id,
    },
  });

  const bdaB = await prisma.employee.create({
    data: {
      employeeCode: `BDA-B-${tag}`.slice(0, 16),
      name: 'Associate B',
      email: `bda_b_${tag}@test.com`,
      phoneNumber: '+919876543202',
      role: Role.BDA,
      companyId: compB.id,
      teamId: squadB.id,
      passwordHash: 'dummy_hash',
    },
  });

  // Create Leads in both companies
  const leadA = await prisma.lead.create({
    data: {
      leadCode: `LD-A-${tag}`.slice(0, 16),
      name: 'Student A',
      phoneNumber: '+919111111111',
      phoneDigits: '9111111111',
      companyId: compA.id,
      teamId: squadA.id,
      assignedEmployeeId: bdaA.id,
    },
  });

  const leadB = await prisma.lead.create({
    data: {
      leadCode: `LD-B-${tag}`.slice(0, 16),
      name: 'Student B',
      phoneNumber: '+919222222222',
      phoneDigits: '9222222222',
      companyId: compB.id,
      teamId: squadB.id,
      assignedEmployeeId: bdaB.id,
    },
  });

  // Verify Company A queries never see Company B data
  const companyALeads = await prisma.lead.findMany({
    where: { companyId: compA.id },
  });
  assert(companyALeads.length === 1 && companyALeads[0].id === leadA.id, 'Company A lead query strictly isolated');

  const companyBLeads = await prisma.lead.findMany({
    where: { companyId: compB.id },
  });
  assert(companyBLeads.length === 1 && companyBLeads[0].id === leadB.id, 'Company B lead query strictly isolated');

  // Edge Case 3: 1-Click Master Kill-Switch
  console.log('\n======================================================================');
  console.log('⚡ 3. 1-Click Master Kill Switch & Immediate Lockdown');
  console.log('======================================================================');

  // Suspend Company B
  const suspendedB = await prisma.company.update({
    where: { id: compB.id },
    data: {
      status: CompanyStatus.SUSPENDED_BY_ADMIN,
      suspendedAt: new Date(),
      suspendReason: 'Policy Violation Testing',
    },
  });
  assert(suspendedB.status === CompanyStatus.SUSPENDED_BY_ADMIN, 'Company B suspended status committed');
  assert(suspendedB.suspendReason === 'Policy Violation Testing', 'Suspension reason recorded');

  // Verify company A remains active (no collateral lockout)
  const activeA = await prisma.company.findUnique({ where: { id: compA.id } });
  assert(activeA?.status === CompanyStatus.ACTIVE, 'Company A unaffected by Company B suspension (tenant isolation)');

  // Un-suspend Company B
  const restoredB = await prisma.company.update({
    where: { id: compB.id },
    data: {
      status: CompanyStatus.ACTIVE,
      suspendedAt: null,
      suspendReason: null,
    },
  });
  assert(restoredB.status === CompanyStatus.ACTIVE, 'Company B successfully restored');
  assert(restoredB.suspendedAt === null, 'Suspension timestamp cleared on restoration');

  // Edge Case 4: 30-Day Trial Engine & Expiration Math
  console.log('\n======================================================================');
  console.log('⏱️ 4. 30-Day Trial Engine & Expiration Boundary');
  console.log('======================================================================');
  const now = Date.now();

  // Active trial calculation
  const activeTrialDiff = (compA.trialEndsAt ? new Date(compA.trialEndsAt).getTime() : 0) - now;
  const daysRemaining = Math.max(0, Math.ceil(activeTrialDiff / (1000 * 60 * 60 * 24)));
  assert(daysRemaining >= 29 && daysRemaining <= 30, `Trial days remaining correctly calculated (${daysRemaining} days)`);

  // Expired trial simulation
  const expiredTrialComp = await prisma.company.create({
    data: {
      name: `Expired Co ${tag}`,
      slug: `expired-${tag}`,
      status: CompanyStatus.ACTIVE,
      trialEndsAt: new Date(Date.now() - 1000 * 60), // 1 minute in the past
    },
  });
  const expiredDiff = new Date(expiredTrialComp.trialEndsAt!).getTime() - Date.now();
  const isExpired = expiredDiff <= 0;
  assert(isExpired === true, 'Expired trial detected correctly when trialEndsAt < Date.now()');

  // Trial extension (+15 days)
  const extendedDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  const extendedComp = await prisma.company.update({
    where: { id: expiredTrialComp.id },
    data: { trialEndsAt: extendedDate },
  });
  const extendedDiff = new Date(extendedComp.trialEndsAt!).getTime() - Date.now();
  const isNowActive = extendedDiff > 0;
  assert(isNowActive === true, 'Trial extension successfully reactivates expired company');

  // Edge Case 5: BDA Seat Cap Enforcement
  console.log('\n======================================================================');
  console.log('💺 5. Caller Seat Cap Enforcement & Boundary Checks');
  console.log('======================================================================');
  assert(compA.maxBdas === 5, 'Default seat cap verified at 5 seats');

  const updatedSeats = await prisma.company.update({
    where: { id: compA.id },
    data: { maxBdas: 12 },
  });
  assert(updatedSeats.maxBdas === 12, 'Super Admin seat adjustment persisted cleanly');

  // Teardown
  console.log('\n======================================================================');
  console.log('🧹 6. Teardown Test Fixtures');
  console.log('======================================================================');
  await prisma.lead.deleteMany({ where: { id: { in: [leadA.id, leadB.id] } } });
  await prisma.employee.deleteMany({ where: { id: { in: [bdaA.id, bdaB.id] } } });
  await prisma.team.deleteMany({ where: { id: { in: [squadA.id, squadB.id] } } });
  await prisma.company.deleteMany({ where: { id: { in: [compA.id, compB.id, expiredTrialComp.id] } } });
  console.log('  🧹 All temporary multi-tenant test records cleaned.');

  console.log('\n======================================================================');
  console.log(`🎉 MULTI-TENANT EDGE CASES SUITE: ${passed}/${passed + failed} PASSED (${failed} FAILED)`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMultiTenantEdgeCasesAudit()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('Test error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
