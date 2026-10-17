/**
 * Shared utility for identifying App-Level Super Admins.
 * Pure logic safe for both Server Components and Client Components ('use client').
 */

export const DEFAULT_SUPER_ADMIN_EMAIL = 'sibasishchakraborti@gmail.com';

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;

  const rawSuperEmails =
    (typeof process !== 'undefined' &&
      (process.env.SUPER_ADMIN_EMAILS || process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS)) ||
    DEFAULT_SUPER_ADMIN_EMAIL;

  const allowed = rawSuperEmails
    .split(',')
    .map((e) => e.trim().replace(/^["']|["']$/g, '').toLowerCase())
    .filter(Boolean);

  const normalized = email.toLowerCase().trim();
  return allowed.includes(normalized) || normalized === DEFAULT_SUPER_ADMIN_EMAIL;
}
