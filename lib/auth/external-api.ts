import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Constant-time string comparison using SHA-256 digests to prevent timing attacks.
 * Even if string lengths differ, hashing ensures uniform comparison time.
 *
 * @param a - First string (e.g. provided token or key)
 * @param b - Second string (e.g. configured environment secret)
 * @returns {boolean} True if strings match identically, false otherwise
 */
function secureCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  try {
    const hashA = crypto.createHash('sha256').update(a).digest();
    const hashB = crypto.createHash('sha256').update(b).digest();
    return crypto.timingSafeEqual(hashA, hashB);
  } catch (err) {
    return false;
  }
}

/**
 * Validates the API key from incoming external webhook/integration requests
 * (e.g., Google Sheets Apps Script, Zapier, Make.com, or custom lead intake services).
 * Checks the following locations in order of preference:
 * 1. Request header `x-api-key`
 * 2. Request header `Authorization: Bearer <key>`
 * 3. URL query parameter `?apiKey=<key>` (deprecated fallback)
 *
 * @param req - NextRequest instance from Next.js App Router route handler
 * @returns {boolean} True if the request contains a valid, matching API key
 */
export function verifyExternalApiKey(req: NextRequest): boolean {
  const configuredKey = process.env.EXTERNAL_INGESTION_API_KEY?.trim();
  if (!configuredKey) {
    console.error('[ExternalAuth] EXTERNAL_INGESTION_API_KEY is not configured in .env');
    return false;
  }

  // 1. Header check: x-api-key
  const headerKey = req.headers.get('x-api-key')?.trim();
  if (headerKey && secureCompare(headerKey, configuredKey)) {
    return true;
  }

  // 2. Header check: Authorization: Bearer <key>
  const authHeader = req.headers.get('authorization') || '';
  const bearerKey = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (bearerKey && secureCompare(bearerKey, configuredKey)) {
    return true;
  }

  // 3. Query param check: ?apiKey=<key> (Supported for backward compatibility with external webhooks/Apps Script)
  const queryKey = req.nextUrl.searchParams.get('apiKey')?.trim();
  if (queryKey && secureCompare(queryKey, configuredKey)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[SECURITY ADVISORY] API key received via URL query parameter (?apiKey=). Recommend migrating callers to the "x-api-key" header.');
    }
    return true;
  }

  return false;
}
