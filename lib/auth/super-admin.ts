/**
 * Shared utility for identifying App-Level Super Admins.
 * Pure logic safe for both Server Components and Client Components ('use client').
 */

export const DEFAULT_SUPER_ADMIN_EMAILS: string[] = [
  'sibasishchakraborti@gmail.com',
  'sibasishchakraborty000@gmail.com',
  'subhra1234c@gmail.com',
];

export const DEFAULT_SUPER_ADMIN_EMAIL = DEFAULT_SUPER_ADMIN_EMAILS[0];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;

  const rawEnv =
    typeof process !== 'undefined'
      ? [
          process.env.SUPER_ADMIN_EMAILS,
          process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS,
          process.env.ADMIN_EMAIL,
        ]
          .filter(Boolean)
          .join(',')
      : '';

  const parsedEnvEmails = rawEnv
    .split(',')
    .map((e) => e.trim().replace(/^["']|["']$/g, '').toLowerCase())
    .filter(Boolean);

  const allowed = new Set([
    ...DEFAULT_SUPER_ADMIN_EMAILS.map((e) => e.toLowerCase()),
    ...parsedEnvEmails,
  ]);

  const normalized = email.toLowerCase().trim();
  return allowed.has(normalized);
}
