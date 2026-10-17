/**
 * Server-side Logging Abstraction.
 * Ensures zero technical information disclosure in terminal, server logs, or stdout.
 * Never prints specific service names, internal server state, connection strings,
 * or raw unhandled vendor errors.
 */

const LEAKY_PATTERNS = [
  /clerk/i,
  /prisma/i,
  /postgres/i,
  /mysql/i,
  /redis/i,
  /password/i,
  /secret/i,
  /jwt/i,
  /token/i,
  /bearer/i,
  /strategy/i,
  /verification_id/i,
  /email_address_id/i,
  /http:\/\//i,
  /https:\/\//i,
  /[a-z]:[\\\/]/i,
  /\/var\/task/i,
  /status\s*[:=]\s*\d{3}/i,
];

function sanitizeMessage(arg: unknown): string {
  if (arg instanceof Error) {
    return 'Operation encountered an error.';
  }
  if (typeof arg !== 'string') {
    return '[Protected Payload]';
  }
  for (const pattern of LEAKY_PATTERNS) {
    if (pattern.test(arg)) {
      return '[Protected Notice] Operation processed.';
    }
  }
  return arg;
}

export const appLogger = {
  info: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[System] ${sanitizeMessage(message)}`);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[System] ${sanitizeMessage(message)}`);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[System] ${sanitizeMessage(message)}`);
  },
};
