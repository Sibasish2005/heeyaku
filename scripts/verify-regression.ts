/**
 * HEEYAKU REGRESSION VERIFICATION RUNNER
 *
 * Runs all automated integration, security, telephony, and production readiness
 * test suites sequentially. Exits with code 0 only if ALL assertions across all suites pass.
 */

import { execSync } from 'child_process';

const TEST_SUITES = [
  { name: 'TypeScript Static Typecheck', cmd: 'npx tsc --noEmit' },
  { name: 'Production Readiness End-to-End Suite', cmd: 'npx tsx scripts/test-prod-readiness.ts' },
  { name: 'Integration & RBAC Security Suite', cmd: 'npx tsx scripts/test-all-integrations-security.ts' },
  { name: 'Mobile Call Sync & Prospect Workflow', cmd: 'npx tsx scripts/test-mobile-sync-prospect.ts' },
  { name: 'Team Lead Prospect Escalation Workflow', cmd: 'npx tsx scripts/test-tl-prospect-workflow.ts' },
];

async function runAll() {
  console.log('======================================================================');
  console.log('🧪 HEEYAKU COMPREHENSIVE REGRESSION & INTEGRITY VERIFICATION');
  console.log('======================================================================\n');

  let totalFailed = 0;
  const startTime = Date.now();

  for (let i = 0; i < TEST_SUITES.length; i++) {
    const suite = TEST_SUITES[i];
    console.log(`[${i + 1}/${TEST_SUITES.length}] Running: ${suite.name}...`);
    try {
      execSync(suite.cmd, { stdio: 'inherit', env: process.env });
      console.log(`✅ [PASSED]: ${suite.name}\n`);
    } catch (err) {
      console.error(`❌ [FAILED]: ${suite.name}`);
      totalFailed++;
      // Stop on first failure to enable immediate root-cause debugging
      break;
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('======================================================================');
  if (totalFailed === 0) {
    console.log(`🎉 ALL SUITES PASSED (${durationSec}s). ZERO REGRESSIONS DETECTED.`);
    console.log('======================================================================');
    process.exit(0);
  } else {
    console.error(`💥 REGRESSION DETECTED! ${totalFailed} suite(s) failed.`);
    console.error('Please inspect the failure above and fix the regression before proceeding.');
    console.log('======================================================================');
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
