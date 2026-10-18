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
  email?: string;
  clerkUserId?: string;
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
      const prepErr = prepData.errors?.[0]?.code;
      if (prepErr === 'form_identifier_already_verified') {
        return {
          clerkUserId,
          emailAddressId,
          verificationId: 'already_verified',
          alreadyVerified: true,
        };
      }
      throw new Error('Unable to send verification code. Please try again.');
    }

    return {
      clerkUserId,
      emailAddressId,
      verificationId: prepData.id,
      alreadyVerified: false,
    };
  }

  /**
   * Attempts verification of the verification code sent to the employee's email.
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
      return {
        verified: false,
        error: 'Invalid or expired verification code. Please try again.',
      };
    }

    if (verifyData.status === 'verified' || verifyData.verification?.status === 'verified') {
      const verifiedEmail = (typeof verifyData.email_address === 'string' ? verifyData.email_address : undefined);
      let verifiedUserId: string | undefined = undefined;
      if (typeof verifyData.user_id === 'string') {
        verifiedUserId = verifyData.user_id;
      } else if (Array.isArray(verifyData.linked_to) && verifyData.linked_to[0]?.id) {
        verifiedUserId = verifyData.linked_to[0].id;
      }

      return {
        verified: true,
        email: verifiedEmail,
        clerkUserId: verifiedUserId,
      };
    }

    return {
      verified: false,
      attempts: verifyData.attempts || verifyData.verification?.attempts,
      error: 'Incorrect verification code. Please try again.',
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
      } catch {
        // Handled silently
      }

      return null;
    } catch {
      throw new Error('Credential update could not be processed.');
    }
  }

  /**
   * Updates an employee's password upon administrative password reset.
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
    } catch {
      return false;
    }
  }

  /**
   * Updates an employee's display name when modified in the management dashboard.
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
    } catch {
      return false;
    }
  }

  /**
   * Deletes a user upon employee account deletion.
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
          // Handled silently
        }
      }
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Extracts generic sanitized message from vendor errors.
 */
function extractClerkErrorMessage(_error: unknown, fallback: string = 'Operation could not be completed.'): string {
  return fallback;
}

