/**
 * HEEYAKU Stage 4.8.1 — Verification Suite for Targeted Security Remediation
 * 
 * Verifies:
 * 1. Sanitization of /api/auth-status (Zero leakage of admin emails or build commit)
 * 2. Trusted Client IP Resolution (Anti-spoofing against X-Forwarded-For injection)
 * 3. Distributed Rate Limiter & Fail-Safe Fallback
 * 4. Bounded Expired Nonce Cleanup Logic & Cron Route Authorization
 */

import { getClientIp } from '../lib/security/client-ip';
import { checkRateLimit, checkRateLimitDistributed, clearAllRateLimits } from '../lib/security/rate-limit';
import { cleanupExpiredNonces } from '../lib/auth/nonce-cleanup';
import { GET as authStatusHandler } from '../app/api/auth-status/route';
import { GET as cronCleanupHandler } from '../app/api/cron/cleanup-nonces/route';
import { NextRequest } from 'next/server';

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
  console.log('\n======================================================');
  console.log('HEEYAKU Stage 4.8.1 Remediation Verification Suite');
  console.log('======================================================\n');

  // ---------------------------------------------------------------------------
  // Suite 1: Public Auth Status Endpoint Sanitization
  // ---------------------------------------------------------------------------
  console.log('--- Suite 1: /api/auth-status Sanitization ---');
  {
    const res = await authStatusHandler();
    const data = await res.json();

    assert(res.status === 200, 'Returns HTTP 200 operational status');
    assert(data.status === 'operational', 'Status field is operational');
    assert(data.authenticated === false, 'Anonymous caller marked authenticated: false');
    assert(data.configuredSuperEmails === undefined, 'No configuredSuperEmails field exposed');
    assert(data.configuredAdminEmails === undefined, 'No configuredAdminEmails field exposed');
    assert(data.deployedCommit === undefined, 'No deployedCommit hash exposed');
    assert(data.isSuperAdminByEmail === undefined, 'No isSuperAdminByEmail boolean exposed');
    assert(data.primaryEmail === undefined, 'No primaryEmail exposed to anonymous caller');
  }

  // ---------------------------------------------------------------------------
  // Suite 2: Trusted Client IP Resolution & Anti-Spoofing
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 2: Trusted Client-IP Resolution ---');
  {
    // Test 2.1: Cloudflare priority
    const cfHeaders = new Headers();
    cfHeaders.set('cf-connecting-ip', '198.51.100.25');
    cfHeaders.set('x-forwarded-for', '10.0.0.1, 192.168.1.1');
    const resolvedCf = getClientIp(cfHeaders);
    assert(resolvedCf === '198.51.100.25', 'Prefers authoritative cf-connecting-ip over x-forwarded-for');

    // Test 2.2: Vercel Edge priority
    const vercelHeaders = new Headers();
    vercelHeaders.set('x-vercel-forwarded-for', '198.51.100.42');
    vercelHeaders.set('x-forwarded-for', '1.2.3.4, 5.6.7.8');
    const resolvedVercel = getClientIp(vercelHeaders);
    assert(resolvedVercel === '198.51.100.42', 'Prefers authoritative x-vercel-forwarded-for over x-forwarded-for');

    // Test 2.3: Anti-spoofing multi-hop X-Forwarded-For (attacker on left, proxy on right)
    const spoofedHeaders = new Headers();
    spoofedHeaders.set('x-forwarded-for', '203.0.113.195, 198.51.100.99');
    const resolvedSpoofed = getClientIp(spoofedHeaders);
    assert(resolvedSpoofed !== '203.0.113.195', 'Does not trust spoofed leftmost IP from x-forwarded-for');
    assert(resolvedSpoofed === '198.51.100.99', 'Extracts genuine connecting IP from trusted proxy hop');

    // Test 2.4: Malformed / Injection prevention
    const maliciousHeaders = new Headers();
    maliciousHeaders.set('x-forwarded-for', '<script>alert(1)</script>, invalid-ip');
    const resolvedMalicious = getClientIp(maliciousHeaders);
    assert(resolvedMalicious === 'unknown-ip' || resolvedMalicious === '127.0.0.1', 'Rejects malicious script injection strings in IP headers');

    // Test 2.5: Strip port from IP
    const portHeaders = new Headers();
    portHeaders.set('x-real-ip', '198.51.100.50:443');
    const resolvedPort = getClientIp(portHeaders);
    assert(resolvedPort === '198.51.100.50', 'Correctly strips port number from IPv4 string');
  }

  // ---------------------------------------------------------------------------
  // Suite 3: Distributed Rate Limiting & Fail-Safe Fallback
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 3: Rate Limiting & Fail-Safe Fallback ---');
  {
    clearAllRateLimits();
    const testKey = 'test:login:198.51.100.1';

    // Verify in-memory sliding window
    const firstAttempt = checkRateLimit(testKey, { windowMs: 60000, maxAttempts: 3 });
    assert(firstAttempt.allowed === true && firstAttempt.remaining === 2, 'Initial attempt allowed with remaining 2');

    checkRateLimit(testKey, { windowMs: 60000, maxAttempts: 3 });
    checkRateLimit(testKey, { windowMs: 60000, maxAttempts: 3 });

    const blockedAttempt = checkRateLimit(testKey, { windowMs: 60000, maxAttempts: 3 });
    assert(blockedAttempt.allowed === false && blockedAttempt.remaining === 0, '4th attempt correctly blocked');

    // Verify fail-safe fallback in checkRateLimitDistributed when external Redis is not configured
    const distKey = 'test:dist:198.51.100.2';
    const distRes = await checkRateLimitDistributed(distKey, { windowMs: 60000, maxAttempts: 5 });
    assert(distRes.allowed === true, 'Distributed check succeeds via fail-safe fallback');
    assert(distRes.source === 'fallback', 'Source indicates fail-safe fallback when Redis is unconfigured');

    clearAllRateLimits();
  }

  // ---------------------------------------------------------------------------
  // Suite 4: Bounded Expired Nonce Cleanup Logic
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 4: Bounded Expired Nonce Cleanup ---');
  {
    const now = Date.now();
    // Synthetic mock database records: 10 expired nonces, 5 active nonces
    const mockDbRecords: Array<{ id: string; nonce: string; expiresAt: Date }> = [];
    for (let i = 1; i <= 10; i++) {
      mockDbRecords.push({
        id: `expired-${i}`,
        nonce: `nonce-exp-${i}`,
        expiresAt: new Date(now - 10000 - i * 1000), // in the past
      });
    }
    for (let i = 1; i <= 5; i++) {
      mockDbRecords.push({
        id: `active-${i}`,
        nonce: `nonce-act-${i}`,
        expiresAt: new Date(now + 60000 + i * 1000), // in the future
      });
    }

    // Mock client simulating bounded queries
    const mockPrismaClient = {
      consumedNonce: {
        findMany: async ({ where, take }: { where: { expiresAt: { lt: Date } }; take: number }) => {
          return mockDbRecords
            .filter((r) => r.expiresAt.getTime() < where.expiresAt.lt.getTime())
            .slice(0, take)
            .map((r) => ({ id: r.id }));
        },
        deleteMany: async ({ where }: { where: { id: { in: string[] } } }) => {
          const idsToDelete = new Set(where.id.in);
          let count = 0;
          for (let i = mockDbRecords.length - 1; i >= 0; i--) {
            if (idsToDelete.has(mockDbRecords[i].id)) {
              mockDbRecords.splice(i, 1);
              count++;
            }
          }
          return { count };
        },
      },
    };

    // Run batch 1: batchSize 4, maxBatches 2 -> should delete 8 records and report hasMore: true
    const resBatch1 = await cleanupExpiredNonces({
      batchSize: 4,
      maxBatches: 2,
      cutoffDate: new Date(now),
      client: mockPrismaClient,
    });

    assert(resBatch1.success === true, 'Batch 1 cleanup executed successfully');
    assert(resBatch1.deletedCount === 8, 'Deleted exactly 8 expired records (4 * 2 batches)');
    assert(resBatch1.hasMore === true, 'Correctly flags hasMore: true when records remain');

    // Run batch 2: should delete remaining 2 expired records and report hasMore: false
    const resBatch2 = await cleanupExpiredNonces({
      batchSize: 4,
      maxBatches: 2,
      cutoffDate: new Date(now),
      client: mockPrismaClient,
    });

    assert(resBatch2.success === true, 'Batch 2 cleanup executed successfully');
    assert(resBatch2.deletedCount === 2, 'Deleted remaining 2 expired records');
    assert(resBatch2.hasMore === false, 'Flags hasMore: false when all expired nonces are cleaned');

    // Verify all 5 active nonces are completely intact
    const remainingActive = mockDbRecords.filter((r) => r.id.startsWith('active-'));
    assert(remainingActive.length === 5, 'All 5 active non-expired nonces remain intact');
    assert(mockDbRecords.length === 5, 'Zero expired nonces remain in table');
  }

  // ---------------------------------------------------------------------------
  // Suite 5: Cron Cleanup Endpoint Authorization
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 5: Cron Cleanup Endpoint Authorization ---');
  {
    // Test unauthenticated request
    const unauthReq = new NextRequest('http://localhost:3000/api/cron/cleanup-nonces');
    const unauthRes = await cronCleanupHandler(unauthReq);
    assert(unauthRes.status === 401, 'Anonymous request to cron cleanup is rejected (401)');

    // Test request with invalid secret
    const badSecretReq = new NextRequest('http://localhost:3000/api/cron/cleanup-nonces', {
      headers: {
        authorization: 'Bearer wrong-secret',
      },
    });
    const badSecretRes = await cronCleanupHandler(badSecretReq);
    assert(badSecretRes.status === 401, 'Request with incorrect CRON_SECRET is rejected (401)');
  }

  console.log('\n======================================================');
  console.log(`Remediation Suite Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
