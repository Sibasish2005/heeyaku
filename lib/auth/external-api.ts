import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Constant-time string comparison using SHA-256 digests to prevent timing attacks.
 * Even if string lengths differ, hashing ensures uniform comparison time.
 */
export function secureCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  try {
    const hashA = crypto.createHash('sha256').update(a).digest();
    const hashB = crypto.createHash('sha256').update(b).digest();
    return crypto.timingSafeEqual(hashA, hashB);
  } catch {
    return false;
  }
}

/**
 * Returns the server master secret used to sign and verify tenant API keys.
 */
function getMasterSecret(): string {
  const secret = process.env.EXTERNAL_INGESTION_API_KEY || process.env.ENCRYPTION_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Security Exception] EXTERNAL_INGESTION_API_KEY or ENCRYPTION_KEY must be configured.');
    }
    return 'development-heeyaku-external-api-secret-key-fallback';
  }
  return secret;
}

/**
 * Generates a cryptographically bound per-tenant API key.
 * Format: hk_live_<tenantSlug>_<hmac-signature>
 *
 * @param companySlug - The unique slug of the company tenant
 * @returns {string} The tenant-scoped API key
 */
export function generateTenantApiKey(companySlug: string): string {
  const secret = getMasterSecret();
  const cleanSlug = companySlug.trim().toLowerCase();
  const signature = crypto.createHmac('sha256', secret).update(cleanSlug).digest('hex').substring(0, 32);
  return `hk_live_${cleanSlug}_${signature}`;
}

export interface TenantKeyVerification {
  valid: boolean;
  tenantSlug?: string;
  error?: string;
}

/**
 * Verifies a tenant-scoped API key using constant-time cryptographic HMAC verification.
 * Supports standard format (hk_live_<slug>_<signature>) and rotated nonced format (hk_live_<slug>_<nonce>_<signature>).
 */
export function verifyTenantApiKey(apiKey: string): TenantKeyVerification {
  if (!apiKey || typeof apiKey !== 'string') {
    return { valid: false, error: 'API key is missing.' };
  }

  const trimmed = apiKey.trim();
  const parts = trimmed.split('_');
  if (parts.length < 4 || parts[0] !== 'hk' || parts[1] !== 'live') {
    return { valid: false, error: 'Invalid API key format. Expected tenant-scoped key (hk_live_<tenant>_<signature>).' };
  }

  const secret = getMasterSecret();

  if (parts.length === 4) {
    // Standard format: hk_live_<slug>_<signature>
    const tenantSlug = parts[2].toLowerCase();
    const signature = parts[3].toLowerCase();
    const expectedSignature = crypto.createHmac('sha256', secret).update(tenantSlug).digest('hex').substring(0, 32);

    const sigBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return { valid: false, error: 'Invalid API key signature.' };
    }

    return { valid: true, tenantSlug };
  } else if (parts.length === 5) {
    // Rotated format with entropy nonce: hk_live_<slug>_<nonce>_<signature>
    const tenantSlug = parts[2].toLowerCase();
    const nonce = parts[3];
    const signature = parts[4].toLowerCase();
    const expectedSignature = crypto.createHmac('sha256', secret).update(`${tenantSlug}:${nonce}`).digest('hex').substring(0, 32);

    const sigBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return { valid: false, error: 'Invalid API key signature.' };
    }

    return { valid: true, tenantSlug };
  }

  return { valid: false, error: 'Invalid API key format.' };
}

/**
 * Computes a SHA-256 hash of an API key for safe storage and revocation indexing.
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey.trim()).digest('hex');
}

/**
 * Revokes a tenant API key by marking its revocation timestamp in the database.
 */
export async function revokeTenantApiKey(apiKeyOrHash: string, txClient?: any): Promise<boolean> {
  const { prisma } = await import('@/lib/prisma');
  const client = txClient || prisma;
  const keyHash = apiKeyOrHash.startsWith('hk_live_') ? hashApiKey(apiKeyOrHash) : apiKeyOrHash;

  try {
    if (client.companyApiKey?.update) {
      await client.companyApiKey.update({
        where: { keyHash },
        data: { revokedAt: new Date() },
      });
      return true;
    }
  } catch (err) {
    console.warn('[Security] Could not mark key revoked in companyApiKey table:', err);
  }
  return false;
}

/**
 * Rotates a tenant API key by revoking existing active keys and issuing a new key with cryptographic entropy.
 */
export async function rotateTenantApiKey(
  companyId: string,
  companySlug: string,
  keyName = 'Primary Integration Key',
  txClient?: any
): Promise<string> {
  const { prisma } = await import('@/lib/prisma');
  const client = txClient || prisma;

  // Revoke active keys for company
  try {
    if (client.companyApiKey?.updateMany) {
      await client.companyApiKey.updateMany({
        where: { companyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  } catch (err) {
    console.warn('[Security] Failed to revoke previous keys during rotation:', err);
  }

  // Generate new key with unique random entropy
  const secret = getMasterSecret();
  const cleanSlug = companySlug.trim().toLowerCase();
  const nonce = crypto.randomBytes(8).toString('hex');
  const signature = crypto.createHmac('sha256', secret).update(`${cleanSlug}:${nonce}`).digest('hex').substring(0, 32);
  const newKey = `hk_live_${cleanSlug}_${nonce}_${signature}`;
  const keyHash = hashApiKey(newKey);

  try {
    if (client.companyApiKey?.create) {
      await client.companyApiKey.create({
        data: {
          companyId,
          keyPrefix: `hk_live_${cleanSlug}`,
          keyHash,
          name: keyName,
        },
      });
    }
  } catch (err) {
    console.warn('[Security] Could not persist new rotated key in companyApiKey table:', err);
  }

  return newKey;
}

/**
 * Extracts external API key credential from incoming request headers.
 * Query parameter (?apiKey=) is explicitly rejected to prevent credential leaks in logs/proxies.
 */
export function extractExternalApiKey(req: NextRequest): string | null {
  const headerKey = req.headers.get('x-api-key')?.trim();
  if (headerKey) return headerKey;

  const authHeader = req.headers.get('authorization') || '';
  const bearerKey = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (bearerKey) return bearerKey;

  return null;
}

/**
 * Legacy API key validation. Checks if the request contains the master platform key.
 * Note: Master platform key does not permit arbitrary multi-tenant access.
 */
export function verifyExternalApiKey(req: NextRequest): boolean {
  const key = extractExternalApiKey(req);
  if (!key) return false;

  const configuredKey = process.env.EXTERNAL_INGESTION_API_KEY?.trim();
  if (configuredKey && secureCompare(key, configuredKey)) {
    return true;
  }

  // Also accept tenant-scoped keys
  const tenantCheck = verifyTenantApiKey(key);
  return tenantCheck.valid;
}

export type ExternalTenantAuthResult =
  | { success: true; company: { id: string; name: string; slug: string } }
  | { success: false; status: number; error: string };

/**
 * Cryptographically authenticates and authorizes an external integration request.
 *
 * Security Properties:
 * 1. Derives tenant identity directly from the cryptographically verified tenant API key.
 * 2. Enforces revocation check: Revoked keys are rejected with 403 Forbidden.
 * 3. Rejects cross-tenant access attempts: If a caller attempts to specify a different company ID
 *    or slug in headers, parameters, or body, the request fails with 403 Forbidden.
 * 4. Never permits client-controlled tenant selection via shared/global keys.
 * 5. Fails closed if the key is missing, invalid, or belongs to a suspended/non-existent tenant.
 */
export async function authenticateExternalTenant(
  req: NextRequest,
  requestedSelector?: string | null,
  options?: { required?: boolean }
): Promise<ExternalTenantAuthResult> {
  const isRequired = options?.required ?? true;
  const apiKey = extractExternalApiKey(req);

  // Reject query param apiKey if present, with a clear security notice
  if (req.nextUrl.searchParams.get('apiKey')) {
    return {
      success: false,
      status: 400,
      error: 'API keys must not be passed in URL query parameters. Supply via "x-api-key" or "Authorization: Bearer <key>" header.',
    };
  }

  if (!apiKey) {
    return {
      success: false,
      status: 401,
      error: 'Unauthorized: Missing external API key in "x-api-key" or "Authorization" header.',
    };
  }

  const { prisma } = await import('@/lib/prisma');

  // 1. Verify if key is a tenant-scoped key
  const tenantCheck = verifyTenantApiKey(apiKey);
  if (tenantCheck.valid && tenantCheck.tenantSlug) {
    const boundSlug = tenantCheck.tenantSlug;

    // Check revocation status in shared database
    const keyHash = hashApiKey(apiKey);
    try {
      if ((prisma as any).companyApiKey?.findUnique) {
        const keyRecord = await (prisma as any).companyApiKey.findUnique({
          where: { keyHash },
          select: { revokedAt: true, companyId: true },
        });
        if (keyRecord?.revokedAt) {
          return {
            success: false,
            status: 403,
            error: 'Unauthorized: This integration API key has been revoked.',
          };
        }
      }
    } catch {
      // Allow fallback if table has not been migrated yet
    }

    const company = await prisma.company.findFirst({
      where: { slug: boundSlug },
      select: { id: true, name: true, slug: true, status: true },
    });

    if (!company) {
      return {
        success: false,
        status: 404,
        error: `Tenant organization '${boundSlug}' associated with this API key was not found.`,
      };
    }

    if (company.status === 'SUSPENDED_BY_ADMIN') {
      return {
        success: false,
        status: 403,
        error: 'This company workspace has been suspended by the platform administrator.',
      };
    }

    // Check for Cross-Tenant BOLA Tampering:
    // If the request also supplied explicit tenant selectors (headers, body, query),
    // they MUST match the company cryptographically bound to the key.
    const explicitSelector =
      req.headers.get('x-company-id')?.trim() ||
      req.headers.get('x-company-slug')?.trim() ||
      req.nextUrl.searchParams.get('companyId')?.trim() ||
      req.nextUrl.searchParams.get('companySlug')?.trim() ||
      requestedSelector?.trim();

    if (explicitSelector) {
      const matchesId = explicitSelector === company.id;
      const matchesSlug = explicitSelector.toLowerCase() === company.slug.toLowerCase();
      if (!matchesId && !matchesSlug) {
        return {
          success: false,
          status: 403,
          error: 'Cross-tenant access violation: API key is not authorized for the requested tenant organization.',
        };
      }
    }

    return { success: true, company };
  }

  // 2. Fallback check for Master Platform Key (if configured)
  const masterKey = process.env.EXTERNAL_INGESTION_API_KEY?.trim();
  if (masterKey && secureCompare(apiKey, masterKey)) {
    // A platform key must NEVER permit callers to select arbitrary tenants via headers/params
    // unless strictly bound to a designated system default company
    const defaultCompanyId = process.env.DEFAULT_COMPANY_ID?.trim();
    if (!defaultCompanyId) {
      return {
        success: false,
        status: 403,
        error: 'Global platform key cannot access multi-tenant data without tenant-scoped credentials (hk_live_<tenant>_<signature>).',
      };
    }

    const company = await prisma.company.findFirst({
      where: { id: defaultCompanyId },
      select: { id: true, name: true, slug: true, status: true },
    });

    if (!company) {
      return {
        success: false,
        status: 404,
        error: 'Default company organization not found.',
      };
    }

    return { success: true, company };
  }

  return {
    success: false,
    status: 401,
    error: 'Unauthorized: Invalid or unrecognized API key credential.',
  };
}

/**
 * Deprecated alias for backward compatibility. Prefer `authenticateExternalTenant`.
 */
export async function resolveExternalTenant(
  req: NextRequest,
  bodyCompany?: string | null,
  options?: { required?: boolean }
): Promise<ExternalTenantAuthResult> {
  return authenticateExternalTenant(req, bodyCompany, options);
}

