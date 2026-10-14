import { createClerkClient } from '@clerk/backend';

function getClerkBackendClient() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('CLERK_SECRET_KEY environment variable is missing.');
  return createClerkClient({
    secretKey,
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });
}

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

export interface PrepareOtpResult {
  clerkUserId: string;
  emailAddressId: string;
  verificationId: string;
  alreadyVerified?: boolean;
}

export interface AttemptOtpResult {
  verified: boolean;
  attempts?: number;
  error?: string;
}

/**
 * Low-level authenticated fetch helper for Clerk REST API endpoints.
 */
async function clerkFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('CLERK_SECRET_KEY environment variable is missing.');
  return await fetch(`https://api.clerk.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}

/**
 * Domain Service: Clerk Backend Synchronization
 * Handles user provisioning, password updates, and identity deletion in Clerk's user directory.
 */
export class ClerkSyncService {
  /**
   * Pre-registers a staff user in Clerk with reserved status and triggers
   * a genuine Clerk email verification OTP to the employee's email inbox.
   */
  static async prepareEmailOtpVerification(input: {
    email: string;
    name: string;
    password?: string;
  }): Promise<PrepareOtpResult> {
    const normalizedEmail = input.email.toLowerCase().trim();
    const nameParts = input.name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Staff';
    const lastName = nameParts.slice(1).join(' ') || undefined;

    const clerk = getClerkBackendClient();

    // 1. Ensure email is on allowlist so Clerk permits sign-in/up
    try {
      await clerk.allowlistIdentifiers.createAllowlistIdentifier({
        identifier: normalizedEmail,
        notify: false,
      });
    } catch {
      // Ignore if already allowed or allowlist is disabled
    }

    // 2. Check if user already exists in Clerk
    const existing = await clerk.users.getUserList({
      emailAddress: [normalizedEmail],
    });

    let clerkUserId: string;
    let emailAddressId: string;

    if (existing.data && existing.data.length > 0) {
      const user = existing.data[0];
      clerkUserId = user.id;
      const foundEmail = user.emailAddresses.find((e) => e.emailAddress.toLowerCase() === normalizedEmail);
      emailAddressId = foundEmail?.id || user.emailAddresses[0]?.id;

      if (input.password && input.password.trim().length >= 8) {
        try {
          await clerk.users.updateUser(clerkUserId, {
            password: input.password.trim(),
            firstName,
            lastName,
          });
        } catch {
          // Non-blocking password update on existing account
        }
      }
    } else {
      // Create user in Clerk with reserved (unverified) status so OTP is required
      const newUser = await clerk.users.createUser({
        emailAddress: [normalizedEmail],
        password: input.password && input.password.trim().length >= 8 ? input.password.trim() : undefined,
        firstName,
        lastName,
        skipPasswordChecks: true,
        skipPasswordRequirement: !input.password,
        emailAddressIdentificationStatus: ['reserved'],
      });
      clerkUserId = newUser.id;
      emailAddressId = newUser.emailAddresses[0].id;
    }

    // 3. Trigger prepare_verification with strategy: 'email_code'
    const prepRes = await clerkFetch(`/email_addresses/${emailAddressId}/prepare_verification`, {
      method: 'POST',
      body: JSON.stringify({ strategy: 'email_code' }),
    });

    const prepData = await prepRes.json();
    if (!prepRes.ok) {
      const errMsg = extractClerkErrorMessage(prepData);
      if (
        errMsg?.toLowerCase().includes('already verified') ||
        prepData.errors?.[0]?.code === 'form_identifier_already_verified'
      ) {
        return {
          clerkUserId,
          emailAddressId,
          verificationId: 'already_verified',
          alreadyVerified: true,
        };
      }
      throw new Error(errMsg || 'Failed to send OTP verification email via Clerk');
    }

    return {
      clerkUserId,
      emailAddressId,
      verificationId: prepData.id,
      alreadyVerified: false,
    };
  }

  /**
   * Attempts verification of the Clerk OTP code sent to the employee's email.
   * If correct, Clerk marks the email address as verified!
   */
  static async attemptEmailOtpVerification(input: {
    emailAddressId: string;
    verificationId: string;
    code: string;
  }): Promise<AttemptOtpResult> {
    const { emailAddressId, verificationId, code } = input;
    const cleanCode = code.trim();

    const verifyRes = await clerkFetch(`/email_addresses/${emailAddressId}/attempt_verification`, {
      method: 'POST',
      body: JSON.stringify({
        code: cleanCode,
        verification_id: verificationId,
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) {
      const errMsg = extractClerkErrorMessage(verifyData, 'Verification code failed');
      return {
        verified: false,
        error: errMsg,
      };
    }

    if (verifyData.status === 'verified' || verifyData.verification?.status === 'verified') {
      return {
        verified: true,
      };
    }

    return {
      verified: false,
      attempts: verifyData.attempts || verifyData.verification?.attempts,
      error: 'Incorrect verification code. Please check staff email and try again.',
    };
  }

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
  static async provisionUser(input: ClerkCreateUserInput): Promise<string> {
    const normalizedEmail = input.email.toLowerCase().trim();
    const nameParts = input.name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Staff';
    const lastName = nameParts.slice(1).join(' ') || undefined;

    const clerk = getClerkBackendClient();

    // 1. If Clerk has allowlist restrictions enabled, ensure email is on allowlist
    try {
      await clerk.allowlistIdentifiers.createAllowlistIdentifier({
        identifier: normalizedEmail,
        notify: false,
      });
    } catch {
      // Ignore if already allowed or allowlist is not enabled
    }

    // 2. Check if user with this email already exists in Clerk
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

    // 3. Create user in Clerk
    try {
      const newUser = await clerk.users.createUser({
        emailAddress: [normalizedEmail],
        password: input.password,
        firstName,
        lastName,
        skipPasswordChecks: true,
        skipPasswordRequirement: false,
      });

      return newUser.id;
    } catch (error: unknown) {
      const clerkMsg = extractClerkErrorMessage(error, 'Failed to create employee in Clerk');
      throw new Error(`Failed to create employee in Clerk: ${clerkMsg}`);
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
      const clerk = getClerkBackendClient();

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
      const clerkMsg = extractClerkErrorMessage(error, 'Password update rejected.');
      throw new Error(clerkMsg);
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
      const clerk = getClerkBackendClient();
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
      const clerk = getClerkBackendClient();
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
  static async deleteUser(clerkUserId: string, email?: string): Promise<boolean> {
    if (!clerkUserId) return false;
    try {
      const clerk = getClerkBackendClient();
      await clerk.users.deleteUser(clerkUserId);
      if (email) {
        try {
          const alList = await clerk.allowlistIdentifiers.getAllowlistIdentifierList();
          const al = alList.data.find((a) => a.identifier.toLowerCase() === email.toLowerCase().trim());
          if (al) await clerk.allowlistIdentifiers.deleteAllowlistIdentifier(al.id);
        } catch {
          // Ignore allowlist deletion cleanup error
        }
      }
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
function extractClerkErrorMessage(error: unknown, fallback: string = 'Operation rejected.'): string {
  if (error && typeof error === 'object') {
    const clerkErr = error as {
      errors?: Array<{ message?: string; long_message?: string; longMessage?: string }>;
      message?: string;
    };
    if (Array.isArray(clerkErr.errors) && clerkErr.errors.length > 0) {
      return (
        clerkErr.errors[0].long_message ||
        clerkErr.errors[0].longMessage ||
        clerkErr.errors[0].message ||
        clerkErr.message ||
        fallback
      );
    }
    if (clerkErr.message) {
      return clerkErr.message;
    }
  }
  return fallback;
}

