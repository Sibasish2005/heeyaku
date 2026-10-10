import { AuthorizationError } from '@/lib/auth/rbac';

/**
 * Patterns indicating sensitive internal database, ORM, filesystem, or runtime details
 * that MUST NEVER be leaked to clients/attackers.
 */
const SENSITIVE_ERROR_PATTERNS = [
  /prisma/i,
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
];

/**
 * Sanitizes an error to prevent Information Disclosure (CWE-209).
 * Internal details (Prisma errors, table names, connection strings, stack traces)
 * are logged to server console, and a safe, generalized error message is returned.
 *
 * @param error - The caught exception or unknown error
 * @param fallback - Safe general error message to return to client
 * @returns {string} Sanitized, user-safe error message
 */
export function sanitizeErrorMessage(
  error: unknown,
  fallback: string = 'An unexpected error occurred. Please try again.'
): string {
  // Always log full internal error details on server for debugging
  console.error('[SYSTEM_INTERNAL_ERROR]:', error);

  if (error instanceof AuthorizationError) {
    return 'Access denied. You do not have permission to perform this action.';
  }

  if (error instanceof Error) {
    const msg = error.message;

    // Check if message leaks internal technical implementation details
    const isSensitive = SENSITIVE_ERROR_PATTERNS.some((pattern) => pattern.test(msg));
    if (isSensitive) {
      return fallback;
    }

    // Only allow brief, clean application-level domain validation messages (< 120 chars)
    if (msg.length <= 120 && !msg.includes('{') && !msg.includes('}')) {
      return msg;
    }
  }

  return fallback;
}
