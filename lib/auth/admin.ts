import { cache } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';

export interface AuthenticatedAdmin {
  userId: string;
  email: string;
  name: string;
}

export class AuthorizationError extends Error {
  statusCode: number;
  constructor(message: string = 'Access denied.', statusCode: number = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
  }
}

interface CachedAdminSession {
  admin: AuthenticatedAdmin | null;
  expiresAt: number;
}

// Server-side in-memory cache to eliminate external Clerk API roundtrip (2.8s) across navigations
const adminSessionCache = new Map<string, CachedAdminSession>();
const ADMIN_SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Server-side helper to verify if the requesting user has valid admin privileges.
 * Wrapped in React cache() for request-level deduplication, plus an in-memory TTL
 * cache across navigations to eliminate Clerk API roundtrips (saves ~2800ms per click).
 */
export const getAuthenticatedAdmin = cache(async (): Promise<AuthenticatedAdmin | null> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return null;
    }

    // Check fast in-memory session cache
    const cached = adminSessionCache.get(userId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.admin;
    }

    const user = await currentUser();
    if (!user) {
      adminSessionCache.set(userId, { admin: null, expiresAt: Date.now() + 30 * 1000 });
      return null;
    }

    const primaryEmail =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
      user.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) {
      adminSessionCache.set(userId, { admin: null, expiresAt: Date.now() + 30 * 1000 });
      return null;
    }

    const rawAdminEmails = process.env.ADMIN_EMAIL || '';
    const allowedAdminEmails = Array.from(
      new Set(
        rawAdminEmails
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
      )
    );

    if (allowedAdminEmails.length === 0) {
      console.error('[SECURITY ERROR] ADMIN_EMAIL is not configured in environment. Admin access is disabled.');
      adminSessionCache.set(userId, { admin: null, expiresAt: Date.now() + 30 * 1000 });
      return null;
    }

    // Enforce strict fail-closed match: ONLY authorized emails can access admin
    const normalizedUserEmail = primaryEmail.toLowerCase().trim();
    const isAuthorized = allowedAdminEmails.includes(normalizedUserEmail);

    if (!isAuthorized) {
      console.warn(`[SECURITY ALERT] Unauthorized admin access attempt blocked for: ${normalizedUserEmail} (ID: ${userId})`);
      adminSessionCache.set(userId, { admin: null, expiresAt: Date.now() + 60 * 1000 });
      return null;
    }

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || primaryEmail;

    const authenticatedAdmin: AuthenticatedAdmin = {
      userId,
      email: primaryEmail,
      name,
    };

    // Cache valid admin session for 10 minutes
    adminSessionCache.set(userId, {
      admin: authenticatedAdmin,
      expiresAt: Date.now() + ADMIN_SESSION_TTL_MS,
    });

    return authenticatedAdmin;
  } catch (error) {
    console.error('Error verifying admin authorization:', error);
    return null;
  }
});

/**
 * Asserts admin privileges. Throws AuthorizationError if unauthenticated or unauthorized.
 * Wrapped in React cache() to prevent redundant lookups.
 */
export const assertAdminAccess = cache(async (): Promise<AuthenticatedAdmin> => {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    throw new AuthorizationError('Access denied.', 403);
  }
  return admin;
});
