import { NextRequest } from 'next/server';

/**
 * Validates the API key from incoming external requests (Google Sheets Apps Script, Zapier, Webhooks).
 * Checks 'x-api-key' header, 'Authorization: Bearer <key>', or query parameter '?apiKey=<key>'.
 */
export function verifyExternalApiKey(req: NextRequest): boolean {
  // Uses configured env variable, with standard project default key fallback
  const configuredKey =
    process.env.EXTERNAL_INGESTION_API_KEY?.trim() ||
    'heeyaku_sync_9f4b8a2c7e1d5e3f9a2b4c6e8d0f1a3b';

  // 1. Header check: x-api-key
  const headerKey = req.headers.get('x-api-key')?.trim();
  if (headerKey && headerKey === configuredKey) {
    return true;
  }

  // 2. Header check: Authorization: Bearer <key>
  const authHeader = req.headers.get('authorization') || '';
  const bearerKey = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (bearerKey && bearerKey === configuredKey) {
    return true;
  }

  // 3. Query param check: ?apiKey=<key> (useful for Google Sheets Webhooks)
  const queryKey = req.nextUrl.searchParams.get('apiKey')?.trim();
  if (queryKey && queryKey === configuredKey) {
    return true;
  }

  return false;
}
