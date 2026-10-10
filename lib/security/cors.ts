import { NextRequest, NextResponse } from 'next/server';

export interface CorsOptions {
  allowOrigin?: string;
  allowMethods?: string[];
  allowHeaders?: string[];
  maxAge?: number;
}

const DEFAULT_METHODS = ['GET', 'POST', 'OPTIONS'];
const DEFAULT_HEADERS = [
  'Content-Type',
  'Authorization',
  'x-api-key',
  'apiKey',
  'X-Requested-With',
  'Accept',
  'Origin',
];

/**
 * Returns standard CORS headers tailored for external integration and webhook endpoints.
 *
 * @param options - Custom configuration for origin, allowed methods, and headers
 * @returns {Record<string, string>} Header key-value pairs
 */
export function getCorsHeaders(options?: CorsOptions): Record<string, string> {
  const origin = options?.allowOrigin || '*';
  const methods = options?.allowMethods || DEFAULT_METHODS;
  const headers = options?.allowHeaders || DEFAULT_HEADERS;
  const maxAge = options?.maxAge ?? 86400; // 24 hours

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': methods.join(', '),
    'Access-Control-Allow-Headers': headers.join(', '),
    'Access-Control-Max-Age': String(maxAge),
  };
}

/**
 * Handles CORS OPTIONS preflight requests cleanly with a 204 No Content response.
 *
 * @param req - The incoming NextRequest
 * @param options - Optional custom CORS configuration
 * @returns {NextResponse} 204 No Content response with preflight CORS headers
 */
export function handleCorsPreflight(req?: NextRequest, options?: CorsOptions): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(options),
  });
}

/**
 * Attaches CORS headers to an outgoing NextResponse.
 *
 * @param res - The NextResponse to augment
 * @param options - Optional custom CORS configuration
 * @returns {NextResponse} The modified response with CORS headers applied
 */
export function withCors(res: NextResponse, options?: CorsOptions): NextResponse {
  const headers = getCorsHeaders(options);
  for (const [key, value] of Object.entries(headers)) {
    res.headers.set(key, value);
  }
  return res;
}
