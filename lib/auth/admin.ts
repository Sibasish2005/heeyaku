import { cache } from 'react';
import { getAuthenticatedUser, assertAuthenticatedUser, AuthorizationError, AuthenticatedUser } from './rbac';

export type AuthenticatedAdmin = AuthenticatedUser;
export { AuthorizationError };

/**
 * Backward-compatible admin helper that delegates to RBAC engine.
 * Allows CEO, Team Lead, and HR to access the management portal.
 */
export const getAuthenticatedAdmin = cache(async (): Promise<AuthenticatedAdmin | null> => {
  return await getAuthenticatedUser();
});

/**
 * Backward-compatible assert helper that asserts authenticated management access.
 */
export const assertAdminAccess = cache(async (): Promise<AuthenticatedAdmin> => {
  return await assertAuthenticatedUser();
});
