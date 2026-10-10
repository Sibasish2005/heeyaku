import crypto from 'crypto';

export interface EmployeeTokenPayload {
  employeeId: string;
  employeeCode: string;
  email: string;
  name: string;
  role?: string;
  exp: number; // Unix timestamp in seconds
}

/**
 * Retrieves the cryptographic secret key used for signing employee JWTs.
 * Prioritizes EMPLOYEE_JWT_SECRET, falling back to CLERK_SECRET_KEY, or throwing in production.
 *
 * @returns {string} The secret string key
 * @throws {Error} If no secret is configured in production environment
 */
function getJwtSecret(): string {
  const secret = process.env.EMPLOYEE_JWT_SECRET || process.env.CLERK_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[SECURITY FATAL] EMPLOYEE_JWT_SECRET must be configured in production environment.');
    }
    return 'dev_ephemeral_heeyaku_secret_2026';
  }
  return secret;
}

/**
 * Encodes a string into URL-safe Base64 format (RFC 7515).
 * Removes padding '=' and replaces '+' with '-' and '/' with '_'.
 *
 * @param str - The raw UTF-8 string to encode
 * @returns {string} URL-safe base64 string
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Decodes a URL-safe Base64 string back into standard UTF-8 text.
 * Restores necessary '=' padding before standard base64 decoding.
 *
 * @param str - The URL-safe base64 string to decode
 * @returns {string} Decoded UTF-8 string
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Signs a custom JWT bearer token for mobile app employee sessions.
 * Uses HMAC-SHA256 (HS256) signature and includes an expiration timestamp.
 *
 * @param data - The employee identity claims
 * @param data.employeeId - Database ID of the employee
 * @param data.employeeCode - Alphanumeric code (e.g. EMP-0001)
 * @param data.email - Staff email address
 * @param data.name - Employee full name
 * @param expiresInDays - Number of days until token expiration (default: 30)
 *
 * @returns {string} Compact serialized JWT format: `<header>.<payload>.<signature>`
 */
export function signEmployeeToken(data: Omit<EmployeeTokenPayload, 'exp'>, expiresInDays = 30): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const payload: EmployeeTokenPayload = { ...data, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const secret = getJwtSecret();
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
 * Cryptographically verifies an employee session token in constant time.
 * Validates HMAC-SHA256 signature using `crypto.timingSafeEqual` to prevent timing attacks,
 * and confirms that the expiration timestamp has not elapsed.
 *
 * @param token - Compact JWT string provided by client Authorization header
 *
 * @returns {EmployeeTokenPayload | null} Decoded payload if authentic and unexpired, otherwise null
 */
export function verifyEmployeeToken(token: string): EmployeeTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const secret = getJwtSecret();

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

    const payload: EmployeeTokenPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
