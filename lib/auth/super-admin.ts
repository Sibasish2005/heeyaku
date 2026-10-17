/**
 * Shared utility for identifying App-Level Super Admins.
 * Pure logic safe for both Server Components and Client Components ('use client').
 * Strictly environment-driven: never hardcodes credentials or email addresses in source files.
 */

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;

  const rawEnv =
    typeof process !== 'undefined'
      ? [
          process.env.SUPER_ADMIN_EMAILS,
          process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS,
        ]
          .filter(Boolean)
          .join(',')
      : '';

  if (!rawEnv) return false;

  const allowed = new Set(
    rawEnv
      .split(',')
      .map((e) => e.trim().replace(/^["']|["']$/g, '').toLowerCase())
      .filter(Boolean)
  );

  const normalized = email.toLowerCase().trim();
  return allowed.has(normalized);
}
