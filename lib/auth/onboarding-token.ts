import crypto from 'crypto';

export interface OnboardingTokenPayload {
  email: string;
  clerkUserId: string;
  verificationId: string;
  nonce: string;
  exp: number; // Unix timestamp in seconds
}

/**
 * Returns the server master secret used to sign and verify onboarding tokens.
 * FAIL-CLOSED: Rejects execution if neither EMPLOYEE_JWT_SECRET nor CLERK_SECRET_KEY is configured.
 * Hardcoded fallback secrets are strictly prohibited.
 */
function getOnboardingSecret(): string {
  const secret = process.env.EMPLOYEE_JWT_SECRET || process.env.CLERK_SECRET_KEY;
  if (!secret || !secret.trim()) {
    throw new Error('[Security Exception] Onboarding secret is not configured. Set EMPLOYEE_JWT_SECRET or CLERK_SECRET_KEY in server environment.');
  }
  return secret.trim();
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Signs a short-lived cryptographic authorization token upon successful email OTP verification.
 * Binds the verified email, clerkUserId, and verificationId to prevent identity spoofing.
 */
export function signOnboardingToken(
  data: { email: string; clerkUserId: string; verificationId: string },
  expiresInMinutes = 15
): string {
  const header = { alg: 'HS256', typ: 'JWT', purpose: 'company_onboarding' };
  const exp = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;
  const nonce = crypto.randomBytes(16).toString('hex');

  const payload: OnboardingTokenPayload = {
    email: data.email.toLowerCase().trim(),
    clerkUserId: data.clerkUserId.trim(),
    verificationId: data.verificationId.trim(),
    nonce,
    exp,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const secret = getOnboardingSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies the cryptographic integrity, purpose, and expiration of an onboarding token.
 * Fails closed if the secret is unconfigured, token is malformed, or signature is invalid.
 */
export function verifyOnboardingToken(token: string): OnboardingTokenPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const secret = getOnboardingSecret();

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const header = JSON.parse(base64UrlDecode(encodedHeader));
    if (header.purpose !== 'company_onboarding') return null;

    const payload: OnboardingTokenPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Consumes an onboarding token ensuring single-use execution across multi-instance environments.
 * Prevents replay attacks by atomically recording the nonce in persistent storage (PostgreSQL).
 * If shared persistence rejects the duplicate or encounters an infrastructure failure, it fails closed.
 */
export async function consumeOnboardingToken(
  token: string,
  txClient?: any
): Promise<OnboardingTokenPayload | null> {
  const payload = verifyOnboardingToken(token);
  if (!payload || !payload.nonce) return null;

  const expiresAt = new Date(payload.exp * 1000);
  if (expiresAt.getTime() <= Date.now()) {
    return null; // Expired
  }

  const { prisma } = await import('@/lib/prisma');
  const client = txClient || prisma;

  try {
    // Shared atomic persistence: insert nonce record
    if (client.consumedNonce?.create) {
      await client.consumedNonce.create({
        data: {
          nonce: payload.nonce,
          purpose: 'onboarding',
          expiresAt,
        },
      });
    } else if (client.$executeRaw) {
      // Fallback via raw SQL for direct database execution or mock transaction clients
      await client.$executeRaw`INSERT INTO "consumed_nonces" ("nonce", "purpose", "expiresAt", "createdAt") VALUES (${payload.nonce}, 'onboarding', ${expiresAt}, NOW());`;
    } else {
      // If store is completely missing, fail closed immediately
      throw new Error('Shared atomic nonce store is unavailable.');
    }
    return payload;
  } catch (err: any) {
    // Duplicate key constraint violation (Prisma P2002 or Postgres 23505) indicates token replay!
    const isDuplicate =
      err?.code === 'P2002' ||
      err?.code === '23505' ||
      String(err?.message || '').toLowerCase().includes('unique') ||
      String(err?.message || '').toLowerCase().includes('duplicate') ||
      String(err?.message || '').toLowerCase().includes('already exists');

    if (isDuplicate) {
      console.warn(`[Security Alert] Onboarding token replay detected for nonce: ${payload.nonce}`);
      return null;
    }

    // Fail-closed: infrastructure error must NOT allow token consumption
    console.error('[Security Exception] Failed to record single-use nonce in shared store:', err?.message || err);
    return null;
  }
}
