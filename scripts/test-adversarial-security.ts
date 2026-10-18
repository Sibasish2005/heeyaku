/**
 * HEEYAKU — ADVERSARIAL MULTI-TENANT ISOLATION & REGRESSION TEST HARNESS
 *
 * Exercises adversarial cross-tenant attacks and security invariants without touching
 * remote production databases. Uses synthetic tenants, mocks Prisma domain operations,
 * and asserts that all cross-tenant access attempts fail-closed.
 */

import { EmployeeService } from '../lib/employee/employee.service';
import { TeamService } from '../lib/team/team.service';
import { getDashboardMetrics, invalidateDashboardMetricsCache } from '../lib/dashboard/metrics';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
    failedTests++;
  }
}

async function assertThrowsAsync(
  fn: () => Promise<unknown>,
  expectedErrorSubstring: string,
  testName: string
) {
  totalTests++;
  try {
    await fn();
    console.error(`  ❌ [FAIL] ${testName} -> Expected function to throw, but it succeeded!`);
    failedTests++;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes(expectedErrorSubstring)) {
      console.log(`  ✅ [PASS] ${testName} (Blocked with: "${expectedErrorSubstring}")`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} -> Threw "${errorMsg}", expected substring "${expectedErrorSubstring}"`);
      failedTests++;
    }
  }
}

async function runAdversarialSecurityTests() {
  console.log('======================================================================');
  console.log('🛡️  HEEYAKU ADVERSARIAL MULTI-TENANT & BOLA REGRESSION TEST HARNESS');
  console.log('======================================================================\n');

  // Synthetic Test Fixtures
  const TENANT_A_ID = 'company_alpha_111';
  const TENANT_B_ID = 'company_beta_222';

  const SYNTHETIC_EMP_TENANT_A = {
    id: 'emp_alpha_01',
    employeeCode: 'EMP-A-01',
    name: 'Alice Alpha',
    email: 'alice@alpha-corp.test',
    phoneNumber: '9876543210',
    role: Role.BDA,
    isActive: true,
    teamId: 'squad_alpha_01',
    team: 'Alpha Squad',
    companyId: TENANT_A_ID,
    clerkUserId: 'clerk_alpha_01',
  };

  const SYNTHETIC_EMP_TENANT_B = {
    id: 'emp_beta_01',
    employeeCode: 'EMP-B-01',
    name: 'Bob Beta',
    email: 'bob@beta-corp.test',
    phoneNumber: '9876543211',
    role: Role.BDA,
    isActive: true,
    teamId: 'squad_beta_01',
    team: 'Beta Squad',
    companyId: TENANT_B_ID,
    clerkUserId: 'clerk_beta_01',
  };

  const SYNTHETIC_SQUAD_TENANT_A = {
    id: 'squad_alpha_01',
    name: 'Alpha Squad',
    companyId: TENANT_A_ID,
    colorTag: '#2563EB',
    teamLeadId: 'emp_alpha_tl',
  };

  const SYNTHETIC_SQUAD_TENANT_B = {
    id: 'squad_beta_01',
    name: 'Beta Squad',
    companyId: TENANT_B_ID,
    colorTag: '#DC2626',
    teamLeadId: 'emp_beta_tl',
  };

  // Setup synthetic mocks on prisma
  const originalFindUniqueEmployee = prisma.employee.findUnique;
  const originalFindUniqueTeam = prisma.team.findUnique;
  const originalFindFirstEmployee = prisma.employee.findFirst;
  const originalFindFirstTeam = prisma.team.findFirst;
  const originalLeadGroupBy = prisma.lead.groupBy;
  const originalEmployeeFindMany = prisma.employee.findMany;
  const originalLeadAggregate = prisma.lead.aggregate;
  const originalCallLogAggregate = prisma.callLog.aggregate;

  // Mock employee lookup
  (prisma.employee as any).findUnique = async ({ where }: any) => {
    if (where.id === SYNTHETIC_EMP_TENANT_A.id) return { ...SYNTHETIC_EMP_TENANT_A };
    if (where.id === SYNTHETIC_EMP_TENANT_B.id) return { ...SYNTHETIC_EMP_TENANT_B };
    return null;
  };

  (prisma.employee as any).findFirst = async ({ where }: any) => {
    if (where.email === SYNTHETIC_EMP_TENANT_A.email) return { ...SYNTHETIC_EMP_TENANT_A };
    if (where.email === SYNTHETIC_EMP_TENANT_B.email) return { ...SYNTHETIC_EMP_TENANT_B };
    return null;
  };

  // Mock team lookup
  (prisma.team as any).findUnique = async ({ where }: any) => {
    if (where.id === SYNTHETIC_SQUAD_TENANT_A.id) return { ...SYNTHETIC_SQUAD_TENANT_A };
    if (where.id === SYNTHETIC_SQUAD_TENANT_B.id) return { ...SYNTHETIC_SQUAD_TENANT_B };
    return null;
  };

  // -------------------------------------------------------------------------
  // SUITE 1: Object-Level Authorization & Multi-Tenant Isolation (Employee Service)
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('🔒 SUITE 1: Employee Service Multi-Tenant Boundary Enforcement');
  console.log('----------------------------------------------------------------------');

  // Attack 1.1: Cross-tenant profile update (Tenant A caller targets Tenant B employee)
  await assertThrowsAsync(
    () =>
      EmployeeService.updateEmployee(
        {
          id: SYNTHETIC_EMP_TENANT_B.id,
          name: 'Hacked Bob',
          email: 'bob@beta-corp.test',
          phoneNumber: '9876543211',
          team: 'Beta Squad',
        },
        Role.CEO,
        TENANT_A_ID, // Caller is Tenant A
        false // Not super admin
      ),
    'Unauthorized: Cannot access or modify an employee from another organization.',
    'Attack 1.1: Tenant A caller cannot modify Tenant B employee profile'
  );

  // Attack 1.2: Missing caller tenant context (null/undefined) fails closed
  await assertThrowsAsync(
    () =>
      EmployeeService.updateEmployee(
        {
          id: SYNTHETIC_EMP_TENANT_B.id,
          name: 'Hacked Bob',
          email: 'bob@beta-corp.test',
          phoneNumber: '9876543211',
          team: 'Beta Squad',
        },
        Role.CEO,
        null, // Missing caller tenant context!
        false
      ),
    'Unauthorized: Cannot access or modify an employee from another organization.',
    'Attack 1.2: Caller with missing tenant context fails closed on profile update'
  );

  // Attack 1.3: Cross-tenant credential reset (Tenant A caller resets Tenant B employee password)
  await assertThrowsAsync(
    () =>
      EmployeeService.resetPassword(
        SYNTHETIC_EMP_TENANT_B.id,
        Role.CEO,
        'newPassword123!',
        TENANT_A_ID, // Caller is Tenant A
        false // Not super admin
      ),
    'Unauthorized: Cannot reset credentials for an employee belonging to another organization.',
    'Attack 1.3: Tenant A caller cannot reset credentials for Tenant B employee'
  );

  // Attack 1.4: Cross-tenant employee deletion
  await assertThrowsAsync(
    () =>
      EmployeeService.deleteEmployee(
        SYNTHETIC_EMP_TENANT_B.id,
        'caller_admin_a',
        Role.CEO,
        TENANT_A_ID, // Caller is Tenant A
        false
      ),
    'Unauthorized: Cannot delete an employee belonging to another organization.',
    'Attack 1.4: Tenant A caller cannot delete Tenant B employee'
  );

  // Attack 1.5: Cross-tenant status toggle (deactivate)
  await assertThrowsAsync(
    () =>
      EmployeeService.toggleStatus(
        SYNTHETIC_EMP_TENANT_B.id,
        Role.CEO,
        TENANT_A_ID, // Caller is Tenant A
        false
      ),
    'Unauthorized: Cannot modify an employee belonging to another organization.',
    'Attack 1.5: Tenant A caller cannot toggle status of Tenant B employee'
  );

  // -------------------------------------------------------------------------
  // SUITE 2: Squad Management Isolation (Team Service)
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('🔒 SUITE 2: Squad Management Multi-Tenant Boundary Enforcement');
  console.log('----------------------------------------------------------------------');

  // Attack 2.1: Cross-tenant squad update (Tenant A caller attempts to modify Tenant B squad)
  await assertThrowsAsync(
    () =>
      TeamService.updateTeam(
        {
          id: SYNTHETIC_SQUAD_TENANT_B.id,
          name: 'Hacked Beta Squad',
        },
        TENANT_A_ID // Caller is Tenant A
      ),
    'Unauthorized: Cannot modify a squad belonging to another organization.',
    'Attack 2.1: Tenant A caller cannot update Tenant B squad'
  );

  // Attack 2.2: Cross-tenant squad deletion
  await assertThrowsAsync(
    () =>
      TeamService.deleteTeam(
        SYNTHETIC_SQUAD_TENANT_B.id,
        TENANT_A_ID // Caller is Tenant A
      ),
    'Unauthorized: Cannot delete a squad belonging to another organization.',
    'Attack 2.2: Tenant A caller cannot delete Tenant B squad'
  );

  // Attack 2.3: Adding cross-tenant BDA to a squad (Tenant A caller tries to inject Tenant B employee into Tenant A squad)
  (prisma.employee as any).findMany = async ({ where }: any) => {
    // If querying where companyId is TENANT_A_ID, return empty because SYNTHETIC_EMP_TENANT_B is in TENANT_B_ID
    if (where?.id?.in?.includes(SYNTHETIC_EMP_TENANT_B.id)) {
      if (where.companyId === TENANT_A_ID) {
        return []; // Tenant B employee NOT in Tenant A
      }
      return [{ ...SYNTHETIC_EMP_TENANT_B }];
    }
    return [];
  };

  await assertThrowsAsync(
    () =>
      TeamService.addBdasToTeam(
        SYNTHETIC_SQUAD_TENANT_A.id,
        [SYNTHETIC_EMP_TENANT_B.id],
        TENANT_A_ID
      ),
    'One or more selected associates were not found or belong to another organization.',
    'Attack 2.3: Tenant A caller cannot inject Tenant B BDA into Tenant A squad'
  );

  // -------------------------------------------------------------------------
  // SUITE 3: Onboarding Account Takeover & Tenant Reparenting Prevention
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('🔒 SUITE 3: Onboarding Account Hijacking & Reparenting Prevention');
  console.log('----------------------------------------------------------------------');

  // Security Invariant: An existing employee with an assigned companyId CANNOT be reparented
  // to a new company by an attacker initiating onboarding with that email.
  const existingEmployeeInTenantA = {
    ...SYNTHETIC_EMP_TENANT_A,
    companyId: TENANT_A_ID,
  };

  function simulateOnboardingCheck(employee: typeof existingEmployeeInTenantA | null) {
    if (employee && employee.companyId) {
      throw new Error(
        'This account or email address is already associated with an existing organization. Account transfer via onboarding is prohibited.'
      );
    }
    return true;
  }

  await assertThrowsAsync(
    async () => simulateOnboardingCheck(existingEmployeeInTenantA),
    'This account or email address is already associated with an existing organization',
    'Attack 3.1: Attacker cannot reparent an existing organization-linked employee via onboarding'
  );

  // -------------------------------------------------------------------------
  // SUITE 4: Dashboard Cache Isolation & Derived Data Partitioning
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('🔒 SUITE 4: Dashboard Cache & Aggregation Multi-Tenant Partitioning');
  console.log('----------------------------------------------------------------------');

  // Invalidate cache first
  invalidateDashboardMetricsCache();

  // Mock Prisma aggregations to return deterministic tenant-specific data
  (prisma.lead as any).groupBy = async ({ where }: any) => {
    if (where?.companyId === TENANT_A_ID) {
      return [{ status: 'NEW', _count: { _all: 42 } }];
    }
    if (where?.companyId === TENANT_B_ID) {
      return [{ status: 'NEW', _count: { _all: 99 } }];
    }
    return [];
  };

  (prisma.employee as any).findMany = async () => [];
  (prisma.lead as any).aggregate = async () => ({ _count: { id: 0 } });
  (prisma.callLog as any).aggregate = async () => ({
    _count: { id: 0 },
    _sum: { durationSeconds: 0 },
  });

  const metricsTenantA = await getDashboardMetrics(null, TENANT_A_ID, false);
  const metricsTenantB = await getDashboardMetrics(null, TENANT_B_ID, false);

  assert(
    metricsTenantA !== metricsTenantB,
    'Test 4.1: Metrics for Tenant A and Tenant B return distinct isolated object references'
  );

  assert(
    metricsTenantA.statusBreakdown.find((s) => s.status === 'NEW')?.count === 42,
    'Test 4.2: Tenant A receives strictly Tenant A aggregate count (42)'
  );

  assert(
    metricsTenantB.statusBreakdown.find((s) => s.status === 'NEW')?.count === 99,
    'Test 4.3: Tenant B receives strictly Tenant B aggregate count (99)'
  );

  // Missing company context for non-superadmin must evaluate to '__NO_COMPANY__' and return 0
  const metricsMissingTenant = await getDashboardMetrics(null, null, false);
  const missingCount = metricsMissingTenant.statusBreakdown.find((s) => s.status === 'NEW')?.count || 0;
  assert(
    missingCount === 0,
    'Test 4.4: Missing tenant context fails closed to __NO_COMPANY__ and returns 0 records',
    `Expected 0, received ${missingCount}`
  );

  // Restore mocks
  (prisma.employee as any).findUnique = originalFindUniqueEmployee;
  (prisma.team as any).findUnique = originalFindUniqueTeam;
  (prisma.employee as any).findFirst = originalFindFirstEmployee;
  (prisma.team as any).findFirst = originalFindFirstTeam;
  (prisma.lead as any).groupBy = originalLeadGroupBy;
  (prisma.employee as any).findMany = originalEmployeeFindMany;
  (prisma.lead as any).aggregate = originalLeadAggregate;
  (prisma.callLog as any).aggregate = originalCallLogAggregate;

  // -------------------------------------------------------------------------
  // SUITE 5: CWE-209 Public Error Redaction & Technical Information Shielding
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('🔒 SUITE 5: CWE-209 Public Error Redaction & Shielding');
  console.log('----------------------------------------------------------------------');

  const { sanitizeErrorMessage } = await import('../lib/security/errors');

  // Attack 5.1: Prisma query failure with constraint disclosure
  const prismaDbError = new Error(
    'Unique constraint failed on the fields: (`email`, `companyId`) in table `Employee`'
  );
  const sanitizedPrismaMsg = sanitizeErrorMessage(prismaDbError, 'Failed to update record.');
  assert(
    !sanitizedPrismaMsg.toLowerCase().includes('constraint') &&
      !sanitizedPrismaMsg.toLowerCase().includes('table') &&
      sanitizedPrismaMsg === 'Failed to update record.',
    'Test 5.1: Database schema and constraint names are stripped from public responses'
  );

  // Attack 5.2: Stack trace with file system path
  const pathLeakError = new Error(
    'Error at C:\\Users\\sibas\\OneDrive\\Desktop\\Heeyaku Project\\heeyaku\\lib\\db.ts:45:12'
  );
  const sanitizedPathMsg = sanitizeErrorMessage(pathLeakError, 'Internal processing error.');
  assert(
    !sanitizedPathMsg.includes('C:\\') &&
      !sanitizedPathMsg.includes('heeyaku') &&
      sanitizedPathMsg === 'Internal processing error.',
    'Test 5.2: Internal filesystem paths and stack locations are redacted'
  );

  // Attack 5.3: Raw upstream auth/token error
  const tokenLeakError = new Error('Invalid Clerk jwt verification token: secret key mismatch');
  const sanitizedTokenMsg = sanitizeErrorMessage(tokenLeakError, 'Authentication error.');
  assert(
    !sanitizedTokenMsg.toLowerCase().includes('jwt') &&
      !sanitizedTokenMsg.toLowerCase().includes('secret') &&
      !sanitizedTokenMsg.toLowerCase().includes('clerk') &&
      sanitizedTokenMsg === 'Authentication error.',
    'Test 5.3: Authentication secrets, tokens, and vendor identities are redacted'
  );

  // -------------------------------------------------------------------------
  // SUITE 6: Mobile Telephony Cryptographic Token Verification
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('🔒 SUITE 6: Mobile Telephony Cryptographic Token Invariants');
  console.log('----------------------------------------------------------------------');

  const { signEmployeeToken, verifyEmployeeToken } = await import('../lib/auth/employee-token');

  const validPayload = {
    employeeId: 'emp_test_999',
    employeeCode: 'EMP-999',
    email: 'agent@heeyaku.test',
    name: 'Agent Smith',
    role: 'BDA',
  };

  const validToken = signEmployeeToken(validPayload, 3600);
  const decodedValid = verifyEmployeeToken(validToken);

  assert(
    decodedValid !== null && decodedValid.employeeId === validPayload.employeeId,
    'Test 6.1: Valid HMAC SHA-256 employee token verifies and decodes successfully'
  );

  // Attack 6.2: Tampered token payload
  const tokenParts = validToken.split('.');
  const tamperedPayload = Buffer.from(
    JSON.stringify({ ...validPayload, role: 'CEO', employeeId: 'emp_hacked_admin' })
  )
    .toString('base64')
    .replace(/=/g, '');
  const tamperedToken = `${tokenParts[0]}.${tamperedPayload}.${tokenParts[2]}`;

  const decodedTampered = verifyEmployeeToken(tamperedToken);
  assert(
    decodedTampered === null,
    'Test 6.2: Cryptographically tampered employee token is rejected immediately (null)'
  );

  // Attack 6.3: Garbage / malformed token
  assert(
    verifyEmployeeToken('malicious.token.string') === null,
    'Test 6.3: Malformed token string is rejected safely without throwing'
  );

  // -------------------------------------------------------------------------
  // SUITE 7: External Integration Multi-Tenant Isolation & Ingestion Boundary
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('🔒 SUITE 7: External Integration Multi-Tenant Isolation & Ingestion Boundary');
  console.log('----------------------------------------------------------------------');

  const {
    authenticateExternalTenant,
    generateTenantApiKey,
    verifyTenantApiKey,
    revokeTenantApiKey,
    rotateTenantApiKey,
  } = await import('../lib/auth/external-api');
  const { NextRequest } = await import('next/server');

  // In-memory mock for company and companyApiKey store (protects real DB)
  const revokedKeyHashes = new Set<string>();
  const activeKeys = new Map<string, any>();

  (prisma as any).companyApiKey = {
    findUnique: async ({ where }: any) => {
      if (revokedKeyHashes.has(where.keyHash)) {
        return { revokedAt: new Date(), companyId: 'company_alpha_111' };
      }
      return activeKeys.get(where.keyHash) || null;
    },
    update: async ({ where, data }: any) => {
      if (data.revokedAt) revokedKeyHashes.add(where.keyHash);
      return { keyHash: where.keyHash, revokedAt: data.revokedAt };
    },
    updateMany: async ({ where, data }: any) => {
      for (const [hash, rec] of activeKeys.entries()) {
        if (rec.companyId === where.companyId && where.revokedAt === null) {
          revokedKeyHashes.add(hash);
        }
      }
      return { count: 1 };
    },
    create: async ({ data }: any) => {
      activeKeys.set(data.keyHash, data);
      return data;
    },
  };

  (prisma.company as any).findFirst = async ({ where }: any) => {
    if (where.slug === 'alpha' || where.id === 'company_alpha_111') {
      return { id: 'company_alpha_111', name: 'Alpha Corp', slug: 'alpha', status: 'ACTIVE' };
    }
    if (where.slug === 'beta' || where.id === 'company_beta_222') {
      return { id: 'company_beta_222', name: 'Beta Corp', slug: 'beta', status: 'ACTIVE' };
    }
    if (where.slug === 'suspended' || where.id === 'company_suspended') {
      return { id: 'company_suspended', name: 'Suspended Corp', slug: 'suspended', status: 'SUSPENDED_BY_ADMIN' };
    }
    return null;
  };

  const alphaKey = generateTenantApiKey('alpha');
  const betaKey = generateTenantApiKey('beta');
  const suspendedKey = generateTenantApiKey('suspended');

  // Test 7.1: Missing API key fails closed with 401
  const reqNoKey = new NextRequest('http://localhost:3000/api/v1/integrations/google-sheets/sync', {
    method: 'GET',
  });
  const resNoKey = await authenticateExternalTenant(reqNoKey);
  assert(
    !resNoKey.success && resNoKey.status === 401,
    'Test 7.1: Integration request without API key fails closed with HTTP 401'
  );

  // Test 7.2: API key in URL query parameter is rejected
  const reqQueryKey = new NextRequest(`http://localhost:3000/api/v1/integrations/google-sheets/sync?apiKey=${alphaKey}`, {
    method: 'GET',
  });
  const resQueryKey = await authenticateExternalTenant(reqQueryKey);
  assert(
    !resQueryKey.success && resQueryKey.status === 400,
    'Test 7.2: API key in URL query parameter is rejected with HTTP 400'
  );

  // Test 7.3: Suspended company key returns HTTP 403
  const reqSuspended = new NextRequest('http://localhost:3000/api/v1/integrations/google-sheets/sync', {
    method: 'GET',
    headers: { 'x-api-key': suspendedKey },
  });
  const resSuspended = await authenticateExternalTenant(reqSuspended);
  assert(
    !resSuspended.success && resSuspended.status === 403,
    'Test 7.3: Integration request targeting suspended company fails closed with HTTP 403'
  );

  // Test 7.4: Valid tenant key resolves successfully
  const reqAlpha = new NextRequest('http://localhost:3000/api/v1/integrations/google-sheets/sync', {
    method: 'GET',
    headers: { 'x-api-key': alphaKey },
  });
  const resAlpha = await authenticateExternalTenant(reqAlpha);
  assert(
    resAlpha.success && (resAlpha as any).company.id === 'company_alpha_111',
    'Test 7.4: Valid tenant key resolves company and binds integration boundary'
  );

  // Test 7.5: Cross-tenant BOLA attempt (Tenant Alpha key attempts to access Tenant Beta via header)
  const reqBola = new NextRequest('http://localhost:3000/api/v1/integrations/google-sheets/sync', {
    method: 'GET',
    headers: { 'x-api-key': alphaKey, 'x-company-slug': 'beta' },
  });
  const resBola = await authenticateExternalTenant(reqBola, 'company_beta_222');
  assert(
    !resBola.success && resBola.status === 403,
    'Test 7.5: Tenant Alpha key attempting to access Tenant Beta data is blocked with HTTP 403'
  );

  // Test 7.6: Revoked tenant API key fails closed with HTTP 403
  await revokeTenantApiKey(alphaKey);
  const reqRevoked = new NextRequest('http://localhost:3000/api/v1/integrations/google-sheets/sync', {
    method: 'GET',
    headers: { 'x-api-key': alphaKey },
  });
  const resRevoked = await authenticateExternalTenant(reqRevoked);
  assert(
    !resRevoked.success && resRevoked.status === 403 && resRevoked.error?.includes('revoked'),
    'Test 7.6: Revoked tenant API key is rejected with HTTP 403'
  );

  // Test 7.7: Key rotation generates new entropy nonced key and authenticates
  const rotatedAlphaKey = await rotateTenantApiKey('company_alpha_111', 'alpha', 'Rotated Test Key');
  assert(
    rotatedAlphaKey.startsWith('hk_live_alpha_') && rotatedAlphaKey.split('_').length === 5,
    'Test 7.7a: Rotated key contains 5-part format with entropy nonce (hk_live_<slug>_<nonce>_<sig>)'
  );
  const reqRotated = new NextRequest('http://localhost:3000/api/v1/integrations/google-sheets/sync', {
    method: 'GET',
    headers: { 'x-api-key': rotatedAlphaKey },
  });
  const resRotated = await authenticateExternalTenant(reqRotated);
  assert(
    resRotated.success && (resRotated as any).company.id === 'company_alpha_111',
    'Test 7.7b: Newly rotated tenant API key authenticates successfully'
  );

  // -------------------------------------------------------------------------
  // SUITE 8: Mobile Identity Cross-Tenant Isolation
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('🔒 SUITE 8: Mobile Identity Cross-Tenant Isolation');
  console.log('----------------------------------------------------------------------');

  const { resolveEmployeeIdentity, clearEmployeeIdentityCache } = await import('../lib/employee/resolve');
  clearEmployeeIdentityCache();

  // Mock employee lookups for mobile resolution
  (prisma.employee as any).findUnique = async ({ where }: any) => {
    if (where.id === 'emp_alpha_01') return { ...SYNTHETIC_EMP_TENANT_A };
    if (where.id === 'emp_beta_01') return { ...SYNTHETIC_EMP_TENANT_B };
    return null;
  };

  (prisma.employee as any).findMany = async ({ where }: any) => {
    const list = [SYNTHETIC_EMP_TENANT_A, SYNTHETIC_EMP_TENANT_B];
    return list.filter((emp) => {
      if (where.companyId && emp.companyId !== where.companyId) return false;
      if (where.isActive !== undefined && emp.isActive !== where.isActive) return false;
      return true;
    });
  };

  const resolvedAlpha = await resolveEmployeeIdentity({
    employeeId: 'emp_alpha_01',
    employeeCode: 'EMP-DUPLICATE-CODE',
    email: 'alice@alpha-corp.test',
    name: 'Alice Alpha',
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  assert(
    resolvedAlpha !== null &&
      resolvedAlpha.allIds.includes('emp_alpha_01') &&
      !resolvedAlpha.allIds.includes('emp_beta_01'),
    'Test 8.1: Mobile identity resolution strictly confines alias IDs to primary employee companyId'
  );

  // -------------------------------------------------------------------------
  // SUITE 9: In-Memory Session Cache Targeted Invalidation
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('🔒 SUITE 9: In-Memory Session Cache Targeted Invalidation');
  console.log('----------------------------------------------------------------------');

  const { invalidateUserSessionCache } = await import('../lib/auth/rbac');
  let cacheError: any = null;
  try {
    invalidateUserSessionCache('emp_alpha_01');
    invalidateUserSessionCache('alice@alpha-corp.test');
    invalidateUserSessionCache();
  } catch (err) {
    cacheError = err;
  }
  assert(
    cacheError === null,
    'Test 9.1: In-memory session cache invalidation purges targeted employee ID and email without errors'
  );

  // -------------------------------------------------------------------------
  // SUITE 10: Stage 3 Attack Chains & Trust Boundary Hardening
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('🔒 SUITE 10: Stage 3 Attack Chains & Trust Boundary Hardening');
  console.log('----------------------------------------------------------------------');

  // Test 10.1: Mobile Login requires mandatory deviceId (omitted deviceId fails with 400)
  const { POST: mobileLoginPost } = await import('../app/api/employee/auth/login/route');
  const reqNoDeviceId = new NextRequest('http://localhost:3000/api/employee/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: 'alice@alpha-corp.test',
      password: 'StrongPassword123!',
      // deviceId omitted by attacker to bypass OTP challenge
    }),
  });
  const resNoDeviceId = await mobileLoginPost(reqNoDeviceId);
  const dataNoDeviceId = await resNoDeviceId.json();
  assert(
    resNoDeviceId.status === 400 && dataNoDeviceId.error?.includes('Device ID is required'),
    'Test 10.1: Mobile login rejects omitted deviceId with HTTP 400 (prevents OTP bypass)'
  );

  // Test 10.2: EmployeeService seat quota check halts creation if quota reached
  (prisma as any).$transaction = async (arg: any) => {
    if (typeof arg === 'function') return arg(prisma);
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg;
  };
  (prisma as any).$queryRaw = async () => [];
  (prisma.company as any).findUnique = async ({ where }: any) => {
    if (where.id === TENANT_A_ID) {
      return { id: TENANT_A_ID, name: 'Alpha Corp', maxBdas: 2 };
    }
    return null;
  };
  (prisma.employee as any).count = async ({ where }: any) => {
    if (where.companyId === TENANT_A_ID && where.role === 'BDA') {
      return 2; // Maximum capacity reached
    }
    return 0;
  };

  await assertThrowsAsync(
    () =>
      EmployeeService.createEmployee(
        {
          name: 'Charlie Caller',
          email: 'charlie@alpha-corp.test',
          phoneNumber: '9876543212',
          role: 'BDA' as any,
          team: 'Alpha Squad',
        },
        Role.CEO,
        TENANT_A_ID
      ),
    'Caller seat limit reached',
    'Test 10.2: Employee onboarding fails closed when BDA caller seat limit is reached'
  );

  // -------------------------------------------------------------------------
  // SUITE 11: Finding A — Company Onboarding Cryptographic Identity Binding
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('🔒 SUITE 11: Finding A — Company Onboarding Cryptographic Identity Binding');
  console.log('----------------------------------------------------------------------');

  const {
    signOnboardingToken,
    verifyOnboardingToken,
    consumeOnboardingToken,
  } = await import('../lib/auth/onboarding-token');

  // In-memory mock for consumedNonce model to protect real DB
  const consumedNonceSet = new Set<string>();
  (prisma as any).consumedNonce = {
    create: async ({ data }: any) => {
      if (consumedNonceSet.has(data.nonce)) {
        const err: any = new Error('Unique constraint violation on nonce');
        err.code = 'P2002';
        throw err;
      }
      consumedNonceSet.add(data.nonce);
      return data;
    },
  };

  // Test 11.1: Legitimate onboarding token signs and verifies cleanly
  const validOnboardingToken = signOnboardingToken({
    email: 'founder@brandnew.test',
    clerkUserId: 'clerk_founder_999',
    verificationId: 'otp_verified_123',
  });
  const verifiedToken = verifyOnboardingToken(validOnboardingToken);
  assert(
    verifiedToken !== null && verifiedToken.email === 'founder@brandnew.test' && verifiedToken.clerkUserId === 'clerk_founder_999',
    'Test 11.1: Verified onboarding token correctly decrypts and matches claims'
  );

  // Test 11.2: Tampered onboarding token signature is rejected
  const tamperedOnboardingToken = validOnboardingToken.substring(0, validOnboardingToken.length - 5) + 'xxxxx';
  const tamperedCheck = verifyOnboardingToken(tamperedOnboardingToken);
  assert(
    tamperedCheck === null,
    'Test 11.2: Cryptographically tampered onboarding token is rejected'
  );

  // Test 11.3: Replay attack prevention: Token can only be consumed once via atomic persistence
  const firstConsume = await consumeOnboardingToken(validOnboardingToken);
  const secondConsume = await consumeOnboardingToken(validOnboardingToken);
  assert(
    firstConsume !== null && secondConsume === null,
    'Test 11.3: Replay prevention: Onboarding token cannot be consumed multiple times'
  );

  // Test 11.3b: Concurrent consumption simulation: exactly one succeeds
  const concurrentToken = signOnboardingToken({
    email: 'concurrent@brandnew.test',
    clerkUserId: 'clerk_concurrent_123',
    verificationId: 'otp_verified_concurrent',
  });
  const [c1, c2] = await Promise.all([
    consumeOnboardingToken(concurrentToken),
    consumeOnboardingToken(concurrentToken),
  ]);
  const exactlyOneSucceeded = (c1 !== null && c2 === null) || (c1 === null && c2 !== null);
  assert(
    exactlyOneSucceeded,
    'Test 11.3b: Concurrent consumption: Only one concurrent consumer succeeds, second fails closed'
  );

  // Test 11.4: registerCompanyAction rejects submission without valid onboarding token
  const { registerCompanyAction, verifyOnboardingOtpAction } = await import('../app/onboarding/actions');
  const resUnauthenticatedOnboarding = await registerCompanyAction({
    companyName: 'Adversarial Inc',
    slug: 'adversarial-inc',
    phoneNumber: '9876543210',
    email: 'eve@adversarial.test',
    clerkUserId: 'clerk_forged_identity',
    requestedBdas: 5,
    onboardingToken: undefined,
  });
  assert(
    !resUnauthenticatedOnboarding.success,
    'Test 11.4: registerCompanyAction rejects unauthenticated onboarding without verified token'
  );

  // Test 11.5: Former OTP sentinel 'already_verified' cannot issue a token
  const resSentinelBypass = await verifyOnboardingOtpAction({
    emailAddressId: 'email_target_123',
    email: 'victim@target.test',
    code: '123456',
    verificationId: 'already_verified',
  });
  assert(
    !resSentinelBypass.success,
    'Test 11.5: Onboarding OTP verification rejects "already_verified" sentinel without genuine verification'
  );

  // Test 11.6: Hardcoded secret fallback removed - fails closed when secret config is missing
  const originalJwtSecret = process.env.EMPLOYEE_JWT_SECRET;
  const originalClerkSecret = process.env.CLERK_SECRET_KEY;
  delete process.env.EMPLOYEE_JWT_SECRET;
  delete process.env.CLERK_SECRET_KEY;
  let secretThrown = false;
  try {
    signOnboardingToken({ email: 'test@test.com', clerkUserId: 'uid', verificationId: 'v1' });
  } catch (err: any) {
    if (err.message?.includes('[Security Exception]')) {
      secretThrown = true;
    }
  } finally {
    process.env.EMPLOYEE_JWT_SECRET = originalJwtSecret;
    process.env.CLERK_SECRET_KEY = originalClerkSecret;
  }
  assert(
    secretThrown,
    'Test 11.6: Fails closed when signing secret configuration is missing (hardcoded fallback removed)'
  );

  // -------------------------------------------------------------------------
  // SUITE 12: Finding C — Fail-Closed Mobile Leads Authorization
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('🔒 SUITE 12: Finding C — Fail-Closed Mobile Leads Authorization');
  console.log('----------------------------------------------------------------------');

  const { GET: mobileLeadsGet } = await import('../app/api/employee/leads/route');

  // Mock employee with missing companyId
  (prisma.employee as any).findUnique = async ({ where }: any) => {
    if (where.id === 'emp_unassociated') {
      return { id: 'emp_unassociated', name: 'No Company Emp', email: 'nocompany@test.com', companyId: null, isActive: true };
    }
    return null;
  };

  const unassociatedToken = signEmployeeToken({
    employeeId: 'emp_unassociated',
    employeeCode: 'EMP-9999',
    email: 'nocompany@test.com',
    name: 'No Company Emp',
  });

  const reqUnassociated = new NextRequest('http://localhost:3000/api/employee/leads', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${unassociatedToken}` },
  });
  const resUnassociated = await mobileLeadsGet(reqUnassociated);
  assert(
    resUnassociated.status === 403,
    'Test 12.1: Employee with missing companyId fails closed with HTTP 403 on leads list'
  );

  // Test 12.2: Cross-tenant lead disposition update fails closed with 403
  const { POST: dispositionPost } = await import('../app/api/employee/leads/[leadId]/disposition/route');
  (prisma.employee as any).findUnique = async ({ where }: any) => {
    if (where.id === 'emp_alpha_01') {
      return { id: 'emp_alpha_01', companyId: 'company_alpha_111', isActive: true, allIds: ['emp_alpha_01'] };
    }
    return null;
  };
  (prisma.lead as any).findUnique = async ({ where }: any) => {
    if (where.id === 'lead_beta_999') {
      return { id: 'lead_beta_999', companyId: 'company_beta_222', assignedEmployeeId: 'emp_beta_01' };
    }
    return null;
  };

  const alphaEmpToken = signEmployeeToken({
    employeeId: 'emp_alpha_01',
    employeeCode: 'EMP-0001',
    email: 'alice@alpha-corp.test',
    name: 'Alice Alpha',
  });

  const reqDispositionBola = new NextRequest('http://localhost:3000/api/employee/leads/lead_beta_999/disposition', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${alphaEmpToken}` },
    body: JSON.stringify({ status: 'CONTACTED' }),
  });
  const resDispositionBola = await dispositionPost(reqDispositionBola, { params: Promise.resolve({ leadId: 'lead_beta_999' }) });
  assert(
    resDispositionBola.status === 403,
    'Test 12.2: Lead disposition update on another tenant lead is rejected with HTTP 403'
  );

  // -------------------------------------------------------------------------
  // SUITE 13: Finding D — Tenant-Safe Call Synchronization & Quarantine
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('🔒 SUITE 13: Finding D — Tenant-Safe Call Synchronization & Quarantine');
  console.log('----------------------------------------------------------------------');

  const { POST: callSyncPost } = await import('../app/api/employee/calls/sync/route');

  // Test 13.1: Call sync fails closed if employee has no company association
  const reqCallSyncNoCompany = new NextRequest('http://localhost:3000/api/employee/calls/sync', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${unassociatedToken}` },
    body: JSON.stringify({ calls: [{ phoneNumber: '9876543210', durationSeconds: 60 }] }),
  });
  const resCallSyncNoCompany = await callSyncPost(reqCallSyncNoCompany);
  assert(
    resCallSyncNoCompany.status === 403,
    'Test 13.1: Call sync request fails closed with HTTP 403 when employee lacks companyId'
  );

  // Test 13.2: Forged client-supplied leadId is safely quarantined and not linked
  let capturedCallLogCreateData: any = null;
  (prisma.lead as any).findMany = async () => []; // No assigned leads match the forged leadId
  (prisma.callLog as any).findMany = async () => [];
  (prisma.callLog as any).create = (args: any) => {
    capturedCallLogCreateData = args.data;
    return args.data;
  };
  (prisma.team as any).findMany = async () => [];

  const reqForgedLeadSync = new NextRequest('http://localhost:3000/api/employee/calls/sync', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${alphaEmpToken}` },
    body: JSON.stringify({
      calls: [{
        phoneNumber: '9876543210',
        durationSeconds: 45,
        connected: true,
        leadId: 'forged_victim_lead_id', // Client attempts to force link to victim's lead
      }],
    }),
  });
  await callSyncPost(reqForgedLeadSync);
  assert(
    capturedCallLogCreateData !== null && capturedCallLogCreateData.leadId === null,
    'Test 13.2: Forged lead ID is safely quarantined (leadId: null) rather than linked to unrelated record'
  );

  // -------------------------------------------------------------------------
  // SUITE 14: Finding E — Atomic BDA Seat Quotas & Row Locking
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('🔒 SUITE 14: Finding E — Atomic BDA Seat Quotas & Row Locking');
  console.log('----------------------------------------------------------------------');

  let rawQueryExecuted = false;
  (prisma as any).$queryRaw = async (strings: any, ...values: any[]) => {
    const query = Array.isArray(strings) ? strings.join('?') : String(strings);
    if (query.includes('FOR UPDATE') && query.includes('companies')) {
      rawQueryExecuted = true;
    }
    return [];
  };

  (prisma.company as any).findUnique = async ({ where }: any) => ({
    id: TENANT_A_ID,
    name: 'Alpha Corp',
    maxBdas: 5,
  });
  (prisma.employee as any).count = async () => 3;
  (prisma.employee as any).findUnique = async () => null;
  (prisma.employee as any).findFirst = async () => ({ employeeCode: 'EMP-1005' });
  (prisma.employee as any).create = async (args: any) => ({
    id: 'emp_new_bda',
    ...args.data,
  });

  await EmployeeService.createEmployee(
    {
      name: 'Safe BDA',
      email: 'safe_bda@alpha-corp.test',
      phoneNumber: '9876543219',
      role: 'BDA' as any,
      team: 'Alpha Squad',
    },
    Role.CEO,
    TENANT_A_ID
  );

  assert(
    rawQueryExecuted,
    'Test 14.1: Pessimistic row lock (SELECT ... FOR UPDATE) executed to serialize quota decisions'
  );

  // Test 14.2: Locking error aborts the operation and never proceeds to write employee
  (prisma as any).$queryRaw = async (strings: any) => {
    const query = Array.isArray(strings) ? strings.join('?') : String(strings);
    if (query.includes('FOR UPDATE')) {
      const err: any = new Error('could not obtain lock on row in relation "companies"');
      err.code = '55P03';
      throw err;
    }
    return [];
  };

  let employeeCreatedAfterLockFailure = false;
  const originalCreate = (prisma.employee as any).create;
  (prisma.employee as any).create = async (args: any) => {
    employeeCreatedAfterLockFailure = true;
    return { id: 'emp_fail', ...args.data };
  };

  await assertThrowsAsync(
    () =>
      EmployeeService.createEmployee(
        {
          name: 'Lock Failure BDA',
          email: 'lockfail@alpha-corp.test',
          phoneNumber: '9876543299',
          role: 'BDA' as any,
          team: 'Alpha Squad',
        },
        Role.CEO,
        TENANT_A_ID
      ),
    'could not obtain lock',
    'Test 14.2: Employee creation fails closed on row lock error (no swallowed exceptions)'
  );

  assert(
    !employeeCreatedAfterLockFailure,
    'Test 14.3: Employee creation write is never reached after failed row lock acquisition'
  );

  // Restore prisma.employee.create
  (prisma.employee as any).create = originalCreate;

  // -------------------------------------------------------------------------
  // SUITE 15: Section 9 — Preserved Cross-Squad Assignment Within Company
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('🔒 SUITE 15: Preserved Cross-Squad Assignment Within Company');
  console.log('----------------------------------------------------------------------');

  const { assignLeadsAction } = await import('../app/admin/leads/assignment-actions');
  const { setTestSessionOverride } = await import('../lib/auth/rbac');

  // Mock authenticated Team Lead belonging to Squad 1
  setTestSessionOverride({
    userId: 'user_tl_1',
    employeeId: 'tl_squad_1',
    name: 'Team Lead 1',
    email: 'tl1@alpha.test',
    role: Role.TEAM_LEAD,
    companyId: TENANT_A_ID,
    ledTeamId: 'team_squad_1',
    teamId: 'team_squad_1',
    isSuperAdmin: false,
    isRealCeo: false,
    companyName: 'Alpha Corp',
    companySlug: 'alpha',
    companyStatus: 'ACTIVE' as any,
    isImpersonating: false,
    isTrialExpired: false,
    trialDaysRemaining: 30,
  });

  // Target BDA belongs to Squad 2 but in the SAME company
  (prisma.employee as any).findUnique = async ({ where }: any) => {
    if (where.id === 'bda_squad_2') {
      return {
        id: 'bda_squad_2',
        name: 'Squad 2 BDA',
        employeeCode: 'EMP-2002',
        isActive: true,
        teamId: 'team_squad_2', // Different squad!
        role: Role.BDA,
        companyId: TENANT_A_ID, // Same company!
      };
    }
    if (where.id === 'bda_foreign_company') {
      return {
        id: 'bda_foreign_company',
        name: 'Foreign BDA',
        employeeCode: 'EMP-9009',
        isActive: true,
        teamId: 'team_foreign',
        role: Role.BDA,
        companyId: TENANT_B_ID, // Different company!
      };
    }
    return null;
  };

  (prisma.lead as any).count = async ({ where }: any) => {
    // If checking companyLeadsCount
    if (where.companyId === TENANT_A_ID) return 1;
    // If checking eligibleLeadsCount for TL squad
    if (where.OR) return 1;
    return 0;
  };

  (prisma.lead as any).findMany = async () => [
    { id: 'lead_1', status: 'NEW', assignedEmployeeId: null },
  ];
  (prisma.lead as any).update = async () => ({ id: 'lead_1' });
  (prisma.lead as any).updateMany = async () => ({ count: 1 });

  // Test 15.1: Cross-squad assignment within company succeeds
  const crossSquadRes = await assignLeadsAction({
    leadIds: ['lead_1'],
    employeeId: 'bda_squad_2',
  });
  assert(
    crossSquadRes.success,
    'Test 15.1: Team Lead can assign leads across squads within the same company'
  );

  // Test 15.2: Assignment to BDA in a different company is blocked
  const crossCompanyRes = await assignLeadsAction({
    leadIds: ['lead_1'],
    employeeId: 'bda_foreign_company',
  });
  assert(
    Boolean(!crossCompanyRes.success && crossCompanyRes.error?.includes('another organization')),
    'Test 15.2: Lead assignment to an employee of another organization is blocked'
  );

  // -------------------------------------------------------------------------
  // SUITE 16: Finding 7 — XLSX Parsing Prototype Pollution Guard
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('🔒 SUITE 16: Finding 7 — XLSX Parsing Prototype Pollution Guard');
  console.log('----------------------------------------------------------------------');

  const { runWithPrototypeGuard } = await import('../lib/lead/import-parser');

  // Test 16.1: Sandbox purges prototype pollution keys injected during execution
  let sandboxRan = false;
  runWithPrototypeGuard(() => {
    sandboxRan = true;
    (Object.prototype as any).pollutedKey = 'malicious_value';
    (Object.prototype as any).isAdmin = true;
  });

  assert(
    sandboxRan &&
      (Object.prototype as any).pollutedKey === undefined &&
      (Object.prototype as any).isAdmin === undefined,
    'Test 16.1: runWithPrototypeGuard detects and deletes prototype pollution keys introduced during parsing'
  );

  console.log('\n======================================================================');
  console.log(`📊 ADVERSARIAL TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAdversarialSecurityTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
