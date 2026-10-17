/**
 * HEEYAKU CRM & MOBILE TELEPHONY — UNIFIED PRODUCTION TEST HARNESS
 *
 * Runs all automated integration, security, multi-tenancy, production readiness,
 * and Android mobile telemetry test suites sequentially.
 *
 * Exits with code 0 only if ALL assertions across all suites pass.
 */

import { execSync } from 'child_process';

interface TestSuiteConfig {
  name: string;
  category: 'WEB' | 'MOBILE' | 'STATIC';
  cmd: string;
  description: string;
}

const TEST_SUITES: TestSuiteConfig[] = [
  {
    name: 'TypeScript Static Verification',
    category: 'STATIC',
    cmd: 'npx tsc --noEmit',
    description: 'Validates strict TypeScript types, imports, and interface contracts across the entire web application.',
  },
  {
    name: 'Multi-Tenant & Super Admin Governance Suite',
    category: 'WEB',
    cmd: 'npx tsx scripts/test-multi-tenant-edge-cases.ts',
    description: 'Verifies company data isolation, 1-click master kill switch, 30-day trial engine, seat adjustments, and Super Admin boundaries.',
  },
  {
    name: 'Role-Based Access Control (RBAC) & Security Suite',
    category: 'WEB',
    cmd: 'npx tsx scripts/test-all-integrations-security.ts',
    description: 'Verifies 4-tier RBAC matrix (CEO/HR/TL/BDA), squad boundaries, customer PII masking, JWT HMAC signatures, and rate limiters.',
  },
  {
    name: 'End-to-End Production Readiness Suite',
    category: 'WEB',
    cmd: 'npx tsx scripts/test-prod-readiness.ts',
    description: 'Verifies CORS preflights, public lead intake, verified connected call disposition gates, prospect promotion, and XLSX/CSV lead export.',
  },
  {
    name: 'Android Mobile Telephony & Offline Queue Suite',
    category: 'MOBILE',
    cmd: 'npm test --prefix CallTrackerAndroid',
    description: 'Verifies Android app root rendering, telephony native emitter hooks, auth storage, offline FIFO queue, date buckets, and formatters.',
  },
];

async function runAll() {
  console.log('======================================================================');
  console.log('🛡️  HEEYAKU UNIFIED INDUSTRIAL TEST HARNESS (WEB & MOBILE)');
  console.log('======================================================================\n');

  let totalFailed = 0;
  const suiteResults: { name: string; category: string; durationMs: number; status: 'PASS' | 'FAIL' }[] = [];
  const globalStartTime = Date.now();

  for (let i = 0; i < TEST_SUITES.length; i++) {
    const suite = TEST_SUITES[i];
    console.log(`----------------------------------------------------------------------`);
    console.log(`[${i + 1}/${TEST_SUITES.length}] [${suite.category}] ${suite.name}`);
    console.log(`ℹ️  ${suite.description}`);
    console.log(`⚡ Command: ${suite.cmd}\n`);

    const suiteStart = Date.now();
    try {
      execSync(suite.cmd, { stdio: 'inherit', env: process.env });
      const durationMs = Date.now() - suiteStart;
      suiteResults.push({ name: suite.name, category: suite.category, durationMs, status: 'PASS' });
      console.log(`\n✅ [PASSED] ${suite.name} (${(durationMs / 1000).toFixed(1)}s)\n`);
    } catch (err) {
      const durationMs = Date.now() - suiteStart;
      suiteResults.push({ name: suite.name, category: suite.category, durationMs, status: 'FAIL' });
      console.error(`\n❌ [FAILED] ${suite.name} (${(durationMs / 1000).toFixed(1)}s)\n`);
      totalFailed++;
      // Stop on first failure to enable immediate root-cause investigation
      break;
    }
  }

  const totalDurationSec = ((Date.now() - globalStartTime) / 1000).toFixed(1);

  console.log('======================================================================');
  console.log('📊 TEST EXECUTION SUMMARY:');
  console.log('======================================================================');
  suiteResults.forEach((res) => {
    const icon = res.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${icon} [${res.category.padEnd(6)}] ${res.name.padEnd(52)} [${(res.durationMs / 1000).toFixed(1)}s]`);
  });
  console.log('======================================================================');

  if (totalFailed === 0) {
    console.log(`🎉 ALL ${suiteResults.length} SUITES PASSED IN ${totalDurationSec}s — ZERO REGRESSIONS DETECTED.`);
    console.log('🌟 APPLICATION (WEB & MOBILE) IS FULLY PRODUCTION-READY.');
    console.log('======================================================================\n');
    process.exit(0);
  } else {
    console.error(`💥 FAILURE DETECTED: ${totalFailed} suite(s) failed.`);
    console.error('Please inspect the failure trace above and correct the issue before deployment.');
    console.log('======================================================================\n');
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error('Fatal harness error:', err);
  process.exit(1);
});
