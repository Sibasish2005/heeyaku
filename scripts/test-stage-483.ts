/**
 * HEEYAKU Stage 4.8.3 — Deployment Configuration & Recovery Readiness Verification Suite
 * 
 * Verifies:
 * 1. Ingress resolution & anti-spoofing (CF-Connecting-IP rogue header protection & Vercel edge precedence)
 * 2. Multi-instance rate limiting via checkRateLimitDistributed with fail-safe fallback
 * 3. Timing-safe CRON_SECRET authentication on /api/cron/cleanup-nonces
 * 4. vercel.json cron scheduler configuration validity
 * 5. Restore drill script production safety guard (strictly rejects production target DB names)
 */

import { getClientIp } from '../lib/security/client-ip';
import { checkRateLimitDistributed, clearAllRateLimits } from '../lib/security/rate-limit';
import { GET as cronCleanupHandler } from '../app/api/cron/cleanup-nonces/route';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('HEEYAKU Stage 4.8.3 Deployment Configuration Verification Suite');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // Suite 1: Ingress Resolution & Anti-Spoofing
  // ---------------------------------------------------------------------------
  console.log('--- Suite 1: Ingress Resolution & Anti-Spoofing ---');
  {
    // Test 1.1: When deployed on Vercel, x-vercel-forwarded-for takes precedence over unverified cf-connecting-ip
    const vercelHeaders = new Headers();
    vercelHeaders.set('cf-connecting-ip', '203.0.113.50'); // Attacker spoof
    vercelHeaders.set('x-vercel-forwarded-for', '198.51.100.99'); // Genuine Vercel edge IP
    delete process.env.TRUSTED_INGRESS_PROVIDER;

    const resolvedDefault = getClientIp(vercelHeaders);
    assert(resolvedDefault === '198.51.100.99', 'Prioritizes authoritative x-vercel-forwarded-for over unverified cf-connecting-ip');

    // Test 1.2: When TRUSTED_INGRESS_PROVIDER is explicitly 'cloudflare', cf-connecting-ip is trusted
    process.env.TRUSTED_INGRESS_PROVIDER = 'cloudflare';
    const resolvedCf = getClientIp(vercelHeaders);
    assert(resolvedCf === '203.0.113.50', 'Trusts cf-connecting-ip when TRUSTED_INGRESS_PROVIDER is set to cloudflare');
    delete process.env.TRUSTED_INGRESS_PROVIDER;

    // Test 1.3: Multi-hop X-Forwarded-For selects trusted hop (rightmost), rejecting leftmost attacker input
    const multiHopHeaders = new Headers();
    multiHopHeaders.set('x-forwarded-for', '1.1.1.1, 2.2.2.2, 198.51.100.77');
    process.env.TRUSTED_PROXY_HOPS = '1';
    const resolvedHop = getClientIp(multiHopHeaders);
    assert(resolvedHop === '198.51.100.77', 'Correctly resolves rightmost hop from x-forwarded-for');

    // Test 1.4: Malformed IP characters are rejected safely
    const malformedHeaders = new Headers();
    malformedHeaders.set('x-forwarded-for', '999.999.999.999, invalid-host');
    const resolvedMalformed = getClientIp(malformedHeaders);
    assert(resolvedMalformed === 'unknown-ip' || resolvedMalformed === '127.0.0.1', 'Rejects out-of-range or malformed IP string');
  }

  // ---------------------------------------------------------------------------
  // Suite 2: Distributed Rate Limiting & Fail-Safe Fallback
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 2: Distributed Rate Limiting & Fail-Safe Fallback ---');
  {
    clearAllRateLimits();
    const testKey = 'test:dist:rate:198.51.100.1';

    // Verify fallback when Redis is unconfigured
    const r1 = await checkRateLimitDistributed(testKey, { windowMs: 60000, maxAttempts: 2 });
    assert(r1.allowed === true && r1.remaining === 1, 'First attempt allowed with 1 remaining');
    assert(r1.source === 'fallback', 'Source reflects fail-safe in-memory fallback');

    const r2 = await checkRateLimitDistributed(testKey, { windowMs: 60000, maxAttempts: 2 });
    assert(r2.allowed === true && r2.remaining === 0, 'Second attempt allowed with 0 remaining');

    const r3 = await checkRateLimitDistributed(testKey, { windowMs: 60000, maxAttempts: 2 });
    assert(r3.allowed === false && r3.remaining === 0, 'Third attempt blocked');

    clearAllRateLimits();
  }

  // ---------------------------------------------------------------------------
  // Suite 3: Timing-Safe CRON_SECRET Authentication
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 3: Timing-Safe CRON_SECRET Authentication ---');
  {
    const secret = 'test-cron-secret-1234567890-abcdef';
    process.env.CRON_SECRET = secret;

    // Test 3.1: Anonymous request rejected (401)
    const unauthReq = new NextRequest('http://localhost:3000/api/cron/cleanup-nonces');
    const unauthRes = await cronCleanupHandler(unauthReq);
    assert(unauthRes.status === 401, 'Rejects request without authorization header');

    // Test 3.2: Incorrect secret rejected (401)
    const wrongReq = new NextRequest('http://localhost:3000/api/cron/cleanup-nonces', {
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const wrongRes = await cronCleanupHandler(wrongReq);
    assert(wrongRes.status === 401, 'Rejects request with incorrect bearer secret');

    // Test 3.3: Matching secret accepted via Bearer header
    const validReq = new NextRequest('http://localhost:3000/api/cron/cleanup-nonces', {
      headers: { authorization: `Bearer ${secret}` },
    });
    const validRes = await cronCleanupHandler(validReq);
    assert(validRes.status === 200, 'Accepts valid bearer secret with HTTP 200');

    // Test 3.4: Matching secret accepted via x-cron-secret header
    const headerReq = new NextRequest('http://localhost:3000/api/cron/cleanup-nonces', {
      headers: { 'x-cron-secret': secret },
    });
    const headerRes = await cronCleanupHandler(headerReq);
    assert(headerRes.status === 200, 'Accepts valid x-cron-secret header with HTTP 200');

    delete process.env.CRON_SECRET;
  }

  // ---------------------------------------------------------------------------
  // Suite 4: vercel.json Cron Scheduler Configuration
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 4: vercel.json Cron Scheduler Configuration ---');
  {
    const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
    assert(fs.existsSync(vercelConfigPath), 'vercel.json exists in root directory');

    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    assert(Array.isArray(config.regions) && config.regions.includes('bom1'), 'Region bom1 configured in vercel.json');
    assert(Array.isArray(config.crons), 'crons array configured in vercel.json');

    const nonceCron = config.crons?.find((c: any) => c.path === '/api/cron/cleanup-nonces');
    assert(Boolean(nonceCron), 'Cron job configured for /api/cron/cleanup-nonces');
    assert(nonceCron?.schedule === '0 2 * * *', 'Cron schedule set to 02:00 UTC daily (0 2 * * *)');
  }

  // ---------------------------------------------------------------------------
  // Suite 5: Backup & Restore Drill Safety Guards
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 5: Backup & Restore Drill Safety Guards ---');
  {
    const backupSh = path.join(process.cwd(), 'scripts', 'backup-db.sh');
    const backupPs1 = path.join(process.cwd(), 'scripts', 'backup-db.ps1');
    const restoreSh = path.join(process.cwd(), 'scripts', 'restore-drill.sh');
    const restorePs1 = path.join(process.cwd(), 'scripts', 'restore-drill.ps1');

    assert(fs.existsSync(backupSh), 'scripts/backup-db.sh exists');
    assert(fs.existsSync(backupPs1), 'scripts/backup-db.ps1 exists');
    assert(fs.existsSync(restoreSh), 'scripts/restore-drill.sh exists');
    assert(fs.existsSync(restorePs1), 'scripts/restore-drill.ps1 exists');

    const restoreShContent = fs.readFileSync(restoreSh, 'utf8');
    assert(
      restoreShContent.includes('prod|production|heeyaku$|postgres$'),
      'restore-drill.sh enforces strict regex protection blocking production database names'
    );
    assert(
      restoreShContent.includes('(test_restore_|drill_restore_|heeyaku_drill_)'),
      'restore-drill.sh enforces strict naming prefix requirement'
    );
    assert(
      restoreShContent.includes('PROD_DB_NAME='),
      'restore-drill.sh independently checks target against DATABASE_URL/DIRECT_URL'
    );
    assert(
      restoreShContent.includes('SELECT current_database();'),
      'restore-drill.sh verifies connected database identity post-creation'
    );

    const restorePs1Content = fs.readFileSync(restorePs1, 'utf8');
    assert(
      restorePs1Content.includes('(prod|production|heeyaku$|postgres$)'),
      'restore-drill.ps1 enforces strict regex protection blocking production database names'
    );
    assert(
      restorePs1Content.includes('(test_restore_|drill_restore_|heeyaku_drill_)'),
      'restore-drill.ps1 enforces strict naming prefix requirement'
    );

    // Off-server replication checks
    const replicateSh = path.join(process.cwd(), 'scripts', 'replicate-backup.sh');
    const replicatePs1 = path.join(process.cwd(), 'scripts', 'replicate-backup.ps1');
    assert(fs.existsSync(replicateSh), 'scripts/replicate-backup.sh exists');
    assert(fs.existsSync(replicatePs1), 'scripts/replicate-backup.ps1 exists');

    const replicateShContent = fs.readFileSync(replicateSh, 'utf8');
    assert(
      replicateShContent.includes('aes-256-cbc'),
      'replicate-backup.sh enforces AES-256 client-side encryption'
    );
    assert(
      replicateShContent.includes('sha256sum --check'),
      'replicate-backup.sh verifies local checksum prior to remote upload'
    );
    assert(
      replicateShContent.includes('BACKUP_ENCRYPTION_KEY'),
      'replicate-backup.sh requires symmetric encryption key'
    );
  }

  console.log('\n================================================================');
  console.log(`Stage 4.8.3 Verification Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
