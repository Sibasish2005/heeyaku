import { AuthorizationError } from '@/lib/auth/rbac';

/**
 * Patterns indicating sensitive internal database, vendor auth, ORM, filesystem,
 * or server runtime state that MUST NEVER be leaked to clients, console, or logs.
 */
const SENSITIVE_ERROR_PATTERNS = [
  /prisma/i,
  /postgres/i,
  /mysql/i,
  /sqlite/i,
  /clerk/i,
  /bda/i,
  /jwt/i,
  /token/i,
  /secret/i,
  /key/i,
  /strategy/i,
  /verification_id/i,
  /identification_status/i,
  /syntax error/i,
  /select\s+/i,
  /insert\s+into/i,
  /update\s+/i,
  /delete\s+from/i,
  /unique\s+constraint/i,
  /foreign\s+key/i,
  /column/i,
  /table\s+/i,
  /database/i,
  /relation\s+/i,
  /connection/i,
  /timeout/i,
  /stack/i,
  /node_modules/i,
  /[a-z]:[\\\/]/i, // Windows absolute path
  /\/var\/task/i, // AWS/Vercel Lambda path
  /\/home\//i,    // Linux path
  /failed\s+on\s+the\s+fields/i,
  /http\s+\d{3}/i,
  /status\s*[:=]\s*\d{3}/i,
];

/**
 * Sanitizes an error to prevent Information Disclosure (CWE-209).
 * Generic safe message is returned so client/console never display
 * which internal service, server state, or raw failure occurred.
 *
 * @param error - The caught exception or unknown error
 * @param fallback - Safe general error message to return to client
 * @returns {string} Sanitized, user-safe generic error message
 */
export function sanitizeErrorMessage(
  error: unknown,
  fallback: string = 'An error occurred while processing your request. Please try again.'
): string {
  // Generic abstracted server log without leaking sensitive internal state
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Operation Notice] Request could not be fulfilled');
  }

  if (error instanceof AuthorizationError) {
    return 'Access denied. You do not have permission to perform this action.';
  }

  if (error instanceof Error) {
    const msg = error.message;

    // Check if message leaks internal technical implementation or vendor details
    const isSensitive = SENSITIVE_ERROR_PATTERNS.some((pattern) => pattern.test(msg));
    if (isSensitive) {
      return fallback;
    }

    // Only allow brief, clean, generic domain messages (< 120 chars) that have no JSON or code
    if (msg.length <= 120 && !msg.includes('{') && !msg.includes('}') && !msg.includes('http') && !msg.includes('/')) {
      return msg;
    }
  }

  return fallback;
}

