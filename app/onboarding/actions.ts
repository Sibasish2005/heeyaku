'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { CompanyStatus, Role } from '@prisma/client';
import { invalidateUserSessionCache } from '@/lib/auth/rbac';
import { ClerkSyncService } from '@/lib/auth/clerk-sync';
import { z } from 'zod';

const onboardingSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(50).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  phoneNumber: z.string().min(7, 'Valid contact phone number required').max(20),
  industry: z.string().optional(),
  requestedBdas: z.number().min(1).max(500).default(5),
  email: z.string().email('Valid official email address required'),
  clerkUserId: z.string().optional(),
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

    return {
      success: true,
      emailAddressId: result.emailAddressId,
      verificationId: result.verificationId,
      clerkUserId: result.clerkUserId,
      alreadyVerified: result.alreadyVerified,
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
 * Server Action: Validates the 6-digit Clerk OTP code entered by the CEO.
 */
export async function verifyOnboardingOtpAction(input: {
  emailAddressId: string;
  verificationId: string;
  code: string;
}): Promise<{
  success: boolean;
  verified?: boolean;
  error?: string;
}> {
  try {
    if (input.verificationId === 'already_verified') {
      return { success: true, verified: true };
    }

    if (!input.emailAddressId || !input.verificationId || !input.code?.trim()) {
      return { success: false, error: 'Please enter the 6-digit verification code.' };
    }

    const result = await ClerkSyncService.attemptEmailOtpVerification({
      emailAddressId: input.emailAddressId,
      verificationId: input.verificationId,
      code: input.code.trim(),
    });

    if (!result.verified) {
      return {
        success: false,
        error: result.error || 'Invalid verification code. Please check your email inbox.',
      };
    }

    return { success: true, verified: true };
  } catch (error: any) {
    console.error('verifyOnboardingOtpAction error:', error);
    return {
      success: false,
      error: error?.message || 'Verification failed. Please try again.',
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
}): Promise<{ success: boolean; companyId?: string; error?: string }> {
  try {
    const validated = onboardingSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || 'Invalid form input' };
    }

    const { companyName, slug, phoneNumber, industry, requestedBdas, email, clerkUserId } = validated.data;
    const primaryEmail = email.toLowerCase().trim();

    // Resolve Clerk User ID: check session, currentUser, or validated clerkUserId from OTP
    const authState = await auth();
    let resolvedUserId = authState.userId;

    if (!resolvedUserId) {
      try {
        const clerkUser = await currentUser();
        resolvedUserId = clerkUser?.id || null;
      } catch {
        // Fallback
      }
    }

    if (!resolvedUserId && clerkUserId) {
      resolvedUserId = clerkUserId;
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
        // Link to new company as CEO
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
    return { success: false, error: err?.message || 'Failed to submit company registration.' };
  }
}
