import { clerkClient } from '@clerk/nextjs/server';

export interface ClerkCreateUserInput {
  email: string;
  password: string;
  name: string;
  employeeCode?: string;
}

export interface ClerkUpdateUserInput {
  name?: string;
  password?: string;
}

/**
 * Domain Service: Clerk Backend Synchronization
 * Handles user provisioning, password updates, and identity deletion in Clerk's user directory.
 */
export class ClerkSyncService {
  /**
   * Provisions or synchronizes an employee account in Clerk so they can log in via the web portal.
   * If a user with the matching email already exists in Clerk, their password and name are updated.
   * Otherwise, a new user account is created with `skipPasswordChecks: true` to support admin-issued temporary passwords.
   *
   * @param input - The provisioning details
   * @param input.email - Email address for Clerk user account
   * @param input.password - Temporary password assigned to the account
   * @param input.name - Full name (split into firstName and lastName)
   * @param input.employeeCode - Optional employee identifier (e.g. EMP-0001)
   *
   * @returns {Promise<string | null>} The Clerk user ID if successful, or null if Clerk sync failed
   */
  static async provisionUser(input: ClerkCreateUserInput): Promise<string | null> {
    const normalizedEmail = input.email.toLowerCase().trim();
    const nameParts = input.name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Staff';
    const lastName = nameParts.slice(1).join(' ') || undefined;

    try {
      const clerk = await clerkClient();
      const existing = await clerk.users.getUserList({
        emailAddress: [normalizedEmail],
      });

      if (existing.data && existing.data.length > 0) {
        const existingId = existing.data[0].id;
        await clerk.users.updateUser(existingId, {
          password: input.password,
          firstName,
          lastName,
        });
        return existingId;
      }

      const newUser = await clerk.users.createUser({
        emailAddress: [normalizedEmail],
        password: input.password,
        firstName,
        lastName,
        skipPasswordChecks: true,
        skipPasswordRequirement: false,
      });

      return newUser.id;
    } catch (error) {
      console.warn('[ClerkSyncService] Warning: Could not auto-provision Clerk user (proceeding with local DB):', error);
      return null;
    }
  }

  /**
   * Directly updates or provisions an employee's password in Clerk's user directory.
   * Throws an explicit error if Clerk rejects the update (e.g. password policy violation),
   * ensuring that the caller never reports success unless Clerk has genuinely updated the credentials.
   *
   * @param input - Employee identity and new password
   * @param input.clerkUserId - Optional existing Clerk user identifier
   * @param input.email - Staff email address
   * @param input.password - The new plain-text password to set in Clerk
   * @param input.name - Full name of the employee
   *
   * @returns {Promise<string>} The active Clerk user ID
   * @throws {Error} If Clerk rejects the password or fails to communicate
   */
  static async updatePasswordDirectly(input: {
    clerkUserId?: string | null;
    email: string;
    password: string;
    name?: string;
  }): Promise<string | null> {
    const { clerkUserId, email, password, name } = input;
    const normalizedEmail = email.toLowerCase().trim();

    try {
      const clerk = await clerkClient();

      // 1. If clerkUserId is present, update user directly
      if (clerkUserId) {
        try {
          await clerk.users.updateUser(clerkUserId, {
            password,
            signOutOfOtherSessions: true,
          });
          return clerkUserId;
        } catch (updateErr: unknown) {
          // If the user was not found by clerkUserId in current environment, fall through to email lookup
          const errMsg = String(updateErr).toLowerCase();
          const status = (updateErr as { status?: number })?.status;
          if (!errMsg.includes('not found') && !errMsg.includes('404') && status !== 404) {
            throw updateErr;
          }
        }
      }

      // 2. Look up user by email in Clerk directory
      const existing = await clerk.users.getUserList({
        emailAddress: [normalizedEmail],
      });

      if (existing.data && existing.data.length > 0) {
        const foundUserId = existing.data[0].id;
        await clerk.users.updateUser(foundUserId, {
          password,
          signOutOfOtherSessions: true,
        });
        return foundUserId;
      }

      // 3. User does not exist in Clerk yet: Send Clerk invitation so they can activate their web portal access
      try {
        await clerk.invitations.createInvitation({
          emailAddress: normalizedEmail,
          ignoreExisting: true,
        });
      } catch (invErr) {
        console.warn('[ClerkSyncService] Note: Could not send Clerk invitation (email already invited or pending):', invErr);
      }

      return null;
    } catch (error: unknown) {
      const clerkMsg = extractClerkErrorMessage(error);
      throw new Error(`Clerk rejected password: ${clerkMsg}`);
    }
  }

  /**
   * Updates an employee's password in Clerk upon administrative password reset.
   *
   * @param clerkUserId - Clerk user identifier (e.g. 'user_2xyz...')
   * @param newPassword - Newly generated plain-text password to apply in Clerk
   *
   * @returns {Promise<boolean>} True if password updated successfully, false otherwise
   */
  static async updatePassword(clerkUserId: string, newPassword: string): Promise<boolean> {
    if (!clerkUserId) return false;
    try {
      const clerk = await clerkClient();
      await clerk.users.updateUser(clerkUserId, {
        password: newPassword,
        signOutOfOtherSessions: true,
      });
      return true;
    } catch (error) {
      console.warn('[ClerkSyncService] Warning: Failed to sync password to Clerk:', error);
      return false;
    }
  }

  /**
   * Updates an employee's display name in Clerk when modified in the management dashboard.
   *
   * @param clerkUserId - Clerk user identifier
   * @param name - Updated full display name (split into first and last names)
   *
   * @returns {Promise<boolean>} True if profile updated successfully in Clerk, false otherwise
   */
  static async updateProfile(clerkUserId: string, name: string): Promise<boolean> {
    if (!clerkUserId) return false;
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Staff';
    const lastName = nameParts.slice(1).join(' ') || undefined;

    try {
      const clerk = await clerkClient();
      await clerk.users.updateUser(clerkUserId, {
        firstName,
        lastName,
      });
      return true;
    } catch (error) {
      console.warn('[ClerkSyncService] Warning: Failed to sync profile to Clerk:', error);
      return false;
    }
  }

  /**
   * Permanently deletes a user from Clerk upon employee account deletion.
   *
   * @param clerkUserId - Clerk user identifier to remove
   *
   * @returns {Promise<boolean>} True if successfully deleted, false otherwise
   */
  static async deleteUser(clerkUserId: string): Promise<boolean> {
    if (!clerkUserId) return false;
    try {
      const clerk = await clerkClient();
      await clerk.users.deleteUser(clerkUserId);
      return true;
    } catch (error) {
      console.warn('[ClerkSyncService] Warning: Failed to delete user from Clerk:', error);
      return false;
    }
  }
}

/**
 * Extracts human-friendly validation error message from Clerk API errors.
 */
function extractClerkErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const clerkErr = error as { errors?: Array<{ message?: string; longMessage?: string }>; message?: string };
    if (Array.isArray(clerkErr.errors) && clerkErr.errors.length > 0) {
      return clerkErr.errors[0].longMessage || clerkErr.errors[0].message || clerkErr.message || 'Password update rejected.';
    }
    if (clerkErr.message) {
      return clerkErr.message;
    }
  }
  return 'Password update rejected.';
}

