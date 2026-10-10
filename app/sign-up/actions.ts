'use server';

import { isAllowedCeoEmail } from '@/lib/auth/rbac';

export interface AdminEmailValidationResponse {
  allowed: boolean;
  error?: string;
}

/**
 * Server Action: Validates whether an email address is authorized to register as Root CEO / Administrator.
 * Enforces security policy: only emails explicitly listed in ADMIN_EMAIL in the environment configuration
 * are permitted to complete self-registration. Staff (HR, Team Leads, BDAs) must be provisioned internally.
 *
 * @param email - The email address entered in the signup registration form
 * @returns {Promise<AdminEmailValidationResponse>} Object indicating whether registration is allowed, with human-friendly error if rejected
 */
export async function validateAdminEmailAction(email: string): Promise<AdminEmailValidationResponse> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) {
    return { allowed: false, error: 'Email address is required.' };
  }

  if (!isAllowedCeoEmail(normalized)) {
    return {
      allowed: false,
      error: 'Unauthorized access',
    };
  }

  return { allowed: true };
}
