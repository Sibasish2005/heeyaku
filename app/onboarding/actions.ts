'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { CompanyStatus, Role } from '@prisma/client';
import { invalidateUserSessionCache } from '@/lib/auth/rbac';
import { ClerkSyncService } from '@/lib/auth/clerk-sync';
import { signOnboardingToken, consumeOnboardingToken } from '@/lib/auth/onboarding-token';
import { z } from 'zod';

const onboardingSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(50).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  phoneNumber: z.string().min(7, 'Valid contact phone number required').max(20),
  industry: z.string().optional(),
  requestedBdas: z.number().min(1).max(500).default(5),
  email: z.string().email('Valid official email address required'),
  clerkUserId: z.string().optional(),
  onboardingToken: z.string().optional(),
});

/**
 * Server Action: Dispatches a genuine 6-digit verification code to the CEO's corporate email via Clerk.
 */
export async function sendOnboardingOtpAction(input: {
  email: string;
  name?: string;
}): Promise<{
  success: boolean;
  emailAddressId?: string;
  verificationId?: string;
  clerkUserId?: string;
  alreadyVerified?: boolean;
  error?: string;
}> {
  try {
    const normalizedEmail = (input.email || '').toLowerCase().trim();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return {
        success: false,
        error: 'Please enter a valid official email address.',
      };
    }

    const result = await ClerkSyncService.prepareEmailOtpVerification({
      email: normalizedEmail,
      name: input.name?.trim() || 'Company CEO',
    });

    if (result.alreadyVerified) {
      let isCallerOwner = false;
      try {
        const clerkUser = await currentUser();
        const callerEmails = clerkUser?.emailAddresses?.map((e) => e.emailAddress.toLowerCase().trim()) || [];
        isCallerOwner = callerEmails.includes(normalizedEmail);
      } catch {
        // Not authenticated
      }

      if (isCallerOwner) {
        return {
          success: true,
          emailAddressId: result.emailAddressId,
          verificationId: result.verificationId,
          clerkUserId: result.clerkUserId,
          alreadyVerified: true,
        };
      }

      // If caller is NOT the authenticated owner of this verified email, fail safe:
      return {
        success: false,
        error: 'This email is already registered with an existing account. Please sign in to continue onboarding.',
      };
    }

    return {
      success: true,
      emailAddressId: result.emailAddressId,
      verificationId: result.verificationId,
      clerkUserId: result.clerkUserId,
      alreadyVerified: false,
    };
  } catch (error: any) {
    console.error('sendOnboardingOtpAction error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to dispatch Clerk verification email.',
    };
  }
}

/**
 * Server Action: Validates the 6-digit Clerk OTP code entered by the CEO and issues a signed onboarding token.
 * Enforces genuine OTP challenge verification against Clerk. Sentinel bypass values are strictly rejected.
 */
export async function verifyOnboardingOtpAction(input: {
  emailAddressId: string;
  verificationId: string;
  code: string;
  email?: string;
  clerkUserId?: string;
}): Promise<{
  success: boolean;
  verified?: boolean;
  onboardingToken?: string;
  error?: string;
}> {
  try {
    const normalizedEmail = input.email ? input.email.toLowerCase().trim() : '';

    // ZERO BYPASS: Any client-controlled sentinel values like 'already_verified' are explicitly rejected.
    if (!input.emailAddressId || !input.verificationId || !input.code?.trim() || input.verificationId === 'already_verified') {
      return { success: false, error: 'Please enter a valid 6-digit verification code.' };
    }

    const cleanCode = input.code.trim();
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      return { success: false, error: 'Verification code must be exactly 6 digits.' };
    }

    const result = await ClerkSyncService.attemptEmailOtpVerification({
      emailAddressId: input.emailAddressId,
      verificationId: input.verificationId,
      code: cleanCode,
    });

    if (!result.verified) {
      return {
        success: false,
        error: result.error || 'Invalid verification code. Please check your email inbox.',
      };
    }

    // Derive verified identity directly from server-side verification results
    const verifiedEmail = result.email ? result.email.toLowerCase().trim() : normalizedEmail;
    const verifiedClerkUserId = result.clerkUserId || input.clerkUserId;

    if (!verifiedEmail || !verifiedClerkUserId) {
      return {
        success: false,
        error: 'Unable to resolve verified identity attributes. Please try again.',
      };
    }

    const token = signOnboardingToken({
      email: verifiedEmail,
      clerkUserId: verifiedClerkUserId,
      verificationId: input.verificationId,
    });

    return { success: true, verified: true, onboardingToken: token };
  } catch (error: any) {
    console.error('verifyOnboardingOtpAction error:', error);
    return {
      success: false,
      error: 'Verification failed. Please check your code and try again.',
    };
  }
}

/**
 * Server Action: Registers the new company workspace with 30-Day trial and provisions the CEO account.
 */
export async function registerCompanyAction(formData: {
  companyName: string;
  slug: string;
  phoneNumber: string;
  industry?: string;
  requestedBdas: number;
  email: string;
  clerkUserId?: string;
  onboardingToken?: string;
}): Promise<{ success: boolean; companyId?: string; error?: string }> {
  try {
    const validated = onboardingSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || 'Invalid form input' };
    }

    const { companyName, slug, phoneNumber, industry, requestedBdas, email, clerkUserId, onboardingToken } = validated.data;
    const primaryEmail = email.toLowerCase().trim();

    // Authenticated identity resolution:
    // 1. Check for active Clerk session
    const authState = await auth();
    let resolvedUserId = authState.userId;
    let authenticatedUserEmails: string[] = [];

    try {
      const clerkUser = await currentUser();
      if (!resolvedUserId) {
        resolvedUserId = clerkUser?.id || null;
      }
      authenticatedUserEmails = clerkUser?.emailAddresses?.map((e) => e.emailAddress.toLowerCase().trim()) || [];
    } catch {
      // Fallback
    }

    // 2. Identity Verification Boundary:
    if (onboardingToken) {
      // Verified via single-use HMAC token issued upon genuine OTP verification
      const verifiedPayload = await consumeOnboardingToken(onboardingToken);
      if (!verifiedPayload) {
        return {
          success: false,
          error: 'Verification session has expired, is invalid, or was already used. Please verify your email again.',
        };
      }

      if (verifiedPayload.email !== primaryEmail) {
        return {
          success: false,
          error: 'Identity mismatch. Please complete verification with the matching official email address.',
        };
      }

      if (clerkUserId && verifiedPayload.clerkUserId !== clerkUserId) {
        return {
          success: false,
          error: 'Identity verification failed. Please request a new verification code.',
        };
      }

      resolvedUserId = verifiedPayload.clerkUserId;
    } else {
      // No token provided: Caller MUST have an active Clerk session whose verified email matches primaryEmail!
      if (!resolvedUserId || !authenticatedUserEmails.includes(primaryEmail)) {
        return {
          success: false,
          error: 'Authentication required. Please complete email OTP verification before submitting.',
        };
      }
    }

    if (!resolvedUserId) {
      return {
        success: false,
        error: 'Authentication required. Please verify your email via Clerk OTP or sign in.',
      };
    }

    // Check slug uniqueness
    const existingSlug = await prisma.company.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      return { success: false, error: 'This workspace URL slug is already taken. Please choose another.' };
    }

    // Resolve user display name
    let userName = 'Company Administrator';
    try {
      const clerkUser = await currentUser();
      userName =
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
        clerkUser?.username ||
        `${companyName} CEO`;
    } catch {
      // Fallback
    }

    // 30-Day Trial window set upon intake
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Atomic transaction: create Company in PENDING_VERIFICATION and link/provision CEO employee
    const company = await prisma.$transaction(async (tx) => {
      const newCompany = await tx.company.create({
        data: {
          name: companyName,
          slug,
          phoneNumber,
          industry: industry || 'B2B Sales',
          status: CompanyStatus.PENDING_VERIFICATION,
          requestedBdas,
          maxBdas: requestedBdas,
          trialEndsAt,
        },
      });

      // Check if employee record already exists by clerkUserId or email
      let employee = await tx.employee.findFirst({
        where: {
          OR: [
            { clerkUserId: resolvedUserId },
            { email: { equals: primaryEmail, mode: 'insensitive' } },
          ],
        },
      });

      if (employee) {
        // 🔒 Prevent Account Takeover / Tenant Reparenting: If employee already belongs to an organization, block takeover
        if (employee.companyId) {
          throw new Error('This account or email address is already associated with an existing organization. Please sign in to your workspace or contact support.');
        }

        // Link unattached employee record to new company as CEO
        await tx.employee.update({
          where: { id: employee.id },
          data: {
            role: Role.CEO,
            companyId: newCompany.id,
            clerkUserId: resolvedUserId,
          },
        });
      } else {
        // Generate sequential employee code for CEO
        const empCount = await tx.employee.count();
        const empCode = `EMP-${String(empCount + 1).padStart(4, '0')}`;

        await tx.employee.create({
          data: {
            employeeCode: empCode,
            name: userName,
            email: primaryEmail,
            phoneNumber,
            role: Role.CEO,
            clerkUserId: resolvedUserId,
            companyId: newCompany.id,
            passwordHash: 'clerk_managed_auth_placeholder',
            isActive: true,
          },
        });
      }

      return newCompany;
    });

    invalidateUserSessionCache();

    return { success: true, companyId: company.id };
  } catch (err: any) {
    console.error('registerCompanyAction error:', err);
    const safeMessage = typeof err?.message === 'string' && (
      err.message.includes('already associated with an existing organization') ||
      err.message.includes('A workspace with this name or URL slug already exists') ||
      err.message.includes('company registration')
    ) ? err.message : 'Unable to complete workspace registration. Please check your information and try again.';
    return { success: false, error: safeMessage };
  }
}
