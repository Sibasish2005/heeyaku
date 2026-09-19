import { NextRequest } from 'next/server';

/**
 * Validates the API key from incoming external requests (Google Sheets Apps Script, Zapier, Webhooks).
 * Checks 'x-api-key' header, 'Authorization: Bearer <key>', or query parameter '?apiKey=<key>'.
 */
export function verifyExternalApiKey(req: NextRequest): boolean {
  const configuredKey = process.env.EXTERNAL_INGESTION_API_KEY?.trim();
  if (!configuredKey) {
    console.error('[ExternalAuth] EXTERNAL_INGESTION_API_KEY is not configured in .env');
    return false;
  }

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
