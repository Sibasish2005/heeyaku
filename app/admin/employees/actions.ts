'use server';

import { revalidatePath } from 'next/cache';
import { assertAuthenticatedUser, canManageEmployees, canDeleteEmployee, canManageTeams, invalidateUserSessionCache } from '@/lib/auth/rbac';
import { EmployeeService, EmployeeCreationResult, PasswordResetResult } from '@/lib/employee/employee.service';
import { CreateEmployeeSchema, UpdateEmployeeSchema } from '@/lib/employee/employee.schema';
import { TeamService, UpdateTeamInput, CandidateBdaItem, TeamLeadOption } from '@/lib/team/team.service';
import { invalidateDashboardMetricsCache } from '@/lib/dashboard/metrics';
import { clearEmployeeIdentityCache } from '@/lib/employee/resolve';
import { clearEmployeeChunkCache } from './fetch-actions';

import { prisma } from '@/lib/prisma';
import { ClerkSyncService } from '@/lib/auth/clerk-sync';
import { sanitizeErrorMessage } from '@/lib/security/errors';

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Server Action: Sends a genuine email verification OTP via Clerk to a staff email address.
 * Accessible ONLY by CEO and HR administrators.
 */
export async function sendEmployeeOtpAction(input: {
  email: string;
  name?: string;
  password?: string;
}): Promise<ActionResponse<{ emailAddressId: string; verificationId: string }>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageEmployees(user.role)) {
      return {
        success: false,
        error: 'Unauthorized access. Only CEO and HR administrators can onboard employees.',
      };
    }

    const normalizedEmail = (input.email || '').toLowerCase().trim();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return {
        success: false,
        error: 'Please enter a valid email address before requesting an OTP.',
      };
    }

    // Check email uniqueness in application database
    const existing = await prisma.employee.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return {
        success: false,
        error: 'An employee with this email address already exists in the system.',
      };
    }

    const result = await ClerkSyncService.prepareEmailOtpVerification({
      email: normalizedEmail,
      name: input.name?.trim() || 'Staff',
      password: input.password,
    });

    return {
      success: true,
      data: {
        emailAddressId: result.emailAddressId,
        verificationId: result.verificationId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Failed to send OTP verification email via Clerk.'),
    };
  }
}

/**
 * Server Action: Verifies the 6-digit OTP code against Clerk.
 * Accessible ONLY by CEO and HR administrators.
 */
export async function verifyEmployeeOtpAction(input: {
  emailAddressId: string;
  verificationId: string;
  code: string;
}): Promise<ActionResponse<{ verified: boolean }>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageEmployees(user.role)) {
      return {
        success: false,
        error: 'Unauthorized access. Only CEO and HR administrators can onboard employees.',
      };
    }

    if (!input.emailAddressId || !input.verificationId || !input.code?.trim()) {
      return {
        success: false,
        error: 'Please enter the 6-digit verification code.',
      };
    }

    const result = await ClerkSyncService.attemptEmailOtpVerification({
      emailAddressId: input.emailAddressId,
      verificationId: input.verificationId,
      code: input.code.trim(),
    });

    if (!result.verified) {
      return {
        success: false,
        error: result.error || 'Invalid verification code. Please check employee email inbox.',
      };
    }

    return {
      success: true,
      data: { verified: true },
    };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Verification failed. Please try again.'),
    };
  }
}

/**
 * Server Action: Creates a new employee with an admin-provisioned ID and secure temporary password.
 * Accessible ONLY by CEO and HR administrators (Team Leads are blocked).
 * Validates payload via Zod `CreateEmployeeSchema`, onboards in DB and Clerk, invalidates caches,
 * and revalidates `/admin/employees`, `/admin/dashboard`, and `/admin/teams`.
 *
 * @param input - Unknown client form input parsed against CreateEmployeeSchema
 * @returns {Promise<ActionResponse<EmployeeCreationResult>>} Response with created employee details and temp password
 */
export async function createEmployeeAction(input: unknown): Promise<ActionResponse<EmployeeCreationResult>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageEmployees(user.role)) {
      return {
        success: false,
        error: 'Unauthorized access. Only CEO and HR administrators can onboard employees.',
      };
    }

    const validated = CreateEmployeeSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    // Enforce Caller Seat Limit for BDAs
    if (validated.data.role === 'BDA' && user.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: { maxBdas: true, name: true },
      });

      if (company) {
        const activeBdaCount = await prisma.employee.count({
          where: {
            companyId: user.companyId,
            role: 'BDA',
            isActive: true,
          },
        });

        if (activeBdaCount >= company.maxBdas) {
          return {
            success: false,
            error: `Caller seat limit reached (${activeBdaCount} / ${company.maxBdas} BDAs). Contact platform administrator to increase caller seats.`,
          };
        }
      }
    }

    const result = await EmployeeService.createEmployee(validated.data, user.role, user.companyId);

    invalidateDashboardMetricsCache();
    clearEmployeeChunkCache();
    revalidatePath('/admin/employees');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/teams');

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to create employee. Please check the entered details and try again.'),
    };
  }
}

/**
 * Server Action: Updates an employee's profile, role, phone, or squad assignment.
 * Accessible ONLY by CEO and HR administrators.
 * Validates input against UpdateEmployeeSchema, updates DB and Clerk, purges identity cache,
 * and revalidates employee and team views.
 *
 * @param input - Unknown client form input parsed against UpdateEmployeeSchema
 * @returns {Promise<ActionResponse>} Success indicator
 */
export async function updateEmployeeAction(input: unknown): Promise<ActionResponse> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageEmployees(user.role)) {
      return {
        success: false,
        error: 'Unauthorized access. Only CEO and HR administrators can edit employee profiles.',
      };
    }

    const validated = UpdateEmployeeSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    await EmployeeService.updateEmployee(validated.data, user.role, user.companyId, user.isSuperAdmin);

    clearEmployeeIdentityCache(validated.data.id);
    invalidateUserSessionCache(validated.data.id);
    if (validated.data.email) invalidateUserSessionCache(validated.data.email);
    invalidateDashboardMetricsCache();
    clearEmployeeChunkCache();
    revalidatePath('/admin/employees');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/teams');
    revalidatePath(`/admin/employees/${validated.data.id}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to update employee profile. Please verify details and try again.'),
    };
  }
}

/**
 * Server Action: Toggles an employee's active status between active and inactive.
 * Accessible ONLY by CEO and HR administrators.
 * Deactivated employees cannot log into mobile/web or be assigned leads.
 *
 * @param id - Target employee database ID
 * @returns {Promise<ActionResponse<{ isActive: boolean }>>} The updated status
 */
export async function toggleEmployeeStatusAction(id: string): Promise<ActionResponse<{ isActive: boolean }>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageEmployees(user.role)) {
      return {
        success: false,
        error: 'Unauthorized access.',
      };
    }

    const isActive = await EmployeeService.toggleStatus(id, user.role, user.companyId, user.isSuperAdmin);

    clearEmployeeIdentityCache(id);
    invalidateUserSessionCache(id);
    invalidateDashboardMetricsCache();
    clearEmployeeChunkCache();
    revalidatePath('/admin/employees');
    revalidatePath('/admin/dashboard');
    revalidatePath(`/admin/employees/${id}`);

    return { success: true, data: { isActive } };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to update employee status.'),
    };
  }
}

/**
 * Server Action: Resets an employee's password to an admin-assigned or auto-generated password.
 * Accessible ONLY by CEO and HR administrators.
 * Updates PostgreSQL bcrypt hash and synchronizes Clerk password.
 *
 * @param id - Target employee database ID
 * @param newPassword - Optional custom password specified by the admin
 * @returns {Promise<ActionResponse<PasswordResetResult>>} Contains new plain-text temporary password and employeeCode
 */
export async function resetEmployeePasswordAction(id: string, newPassword?: string): Promise<ActionResponse<PasswordResetResult>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageEmployees(user.role)) {
      return {
        success: false,
        error: 'Unauthorized access. Only CEO and HR administrators can reset passwords.',
      };
    }

    if (newPassword && newPassword.trim().length > 0 && newPassword.trim().length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long.',
      };
    }

    const result = await EmployeeService.resetPassword(id, user.role, newPassword?.trim(), user.companyId, user.isSuperAdmin);
    clearEmployeeIdentityCache(id);
    invalidateUserSessionCache(id);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to reset employee password.'),
    };
  }
}

/**
 * Server Action: Sends a Clerk 6-digit OTP verification email to an existing employee
 * before permitting a password reset.
 * Accessible ONLY by CEO and HR administrators.
 */
export async function sendResetPasswordOtpAction(employeeId: string): Promise<ActionResponse<{ emailAddressId: string; verificationId: string; targetEmail: string }>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageEmployees(user.role)) {
      return {
        success: false,
        error: 'Unauthorized access. Only CEO and HR administrators can reset employee passwords.',
      };
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true, email: true, employeeCode: true, role: true, companyId: true },
    });

    if (!employee) {
      return {
        success: false,
        error: 'Employee account not found.',
      };
    }

    if (user.companyId && employee.companyId && employee.companyId !== user.companyId && !user.isSuperAdmin) {
      return {
        success: false,
        error: 'Unauthorized access: Employee belongs to another organization.',
      };
    }

    const prep = await ClerkSyncService.prepareEmailOtpVerification({
      email: employee.email,
      name: employee.name,
    });

    return {
      success: true,
      data: {
        emailAddressId: prep.emailAddressId,
        verificationId: prep.verificationId,
        targetEmail: employee.email,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Failed to send OTP verification email via Clerk.'),
    };
  }
}

/**
 * Server Action: Verifies the 6-digit Clerk email OTP and resets the employee's password.
 * Accessible ONLY by CEO and HR administrators.
 */
export async function verifyResetPasswordOtpAndResetAction(input: {
  employeeId: string;
  emailAddressId: string;
  verificationId: string;
  code: string;
  newPassword?: string;
}): Promise<ActionResponse<PasswordResetResult>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageEmployees(user.role)) {
      return {
        success: false,
        error: 'Unauthorized access. Only CEO and HR administrators can reset employee passwords.',
      };
    }

    const { employeeId, emailAddressId, verificationId, code, newPassword } = input;
    const cleanCode = (code || '').trim();

    if (!employeeId || !emailAddressId || !verificationId || cleanCode.length !== 6) {
      return {
        success: false,
        error: 'Please enter the complete 6-digit verification code received by email.',
      };
    }

    if (newPassword && newPassword.trim().length > 0 && newPassword.trim().length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long.',
      };
    }

    // Verify OTP against Clerk
    const verifyRes = await ClerkSyncService.attemptEmailOtpVerification({
      emailAddressId,
      verificationId,
      code: cleanCode,
    });

    if (!verifyRes.verified) {
      return {
        success: false,
        error: verifyRes.error || 'Incorrect OTP verification code. Please check email and try again.',
      };
    }

    // OTP verified successfully: proceed to reset password in PostgreSQL and Clerk
    const result = await EmployeeService.resetPassword(employeeId, user.role, newPassword?.trim());
    clearEmployeeIdentityCache(employeeId);
    invalidateUserSessionCache(employeeId);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to reset employee password.'),
    };
  }
}

/**
 * Server Action: Permanently deletes an employee account, unlinks leads/squads, and purges Clerk user.
 * Accessible ONLY by CEO and HR administrators (prevents self-deletion).
 *
 * @param id - Target employee database ID to delete
 * @returns {Promise<ActionResponse>} Success indicator
 */
export async function deleteEmployeeAction(id: string): Promise<ActionResponse> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canDeleteEmployee(user.role)) {
      return {
        success: false,
        error: 'Unauthorized: Team Leads cannot delete or remove employees.',
      };
    }

    await EmployeeService.deleteEmployee(id, user.employeeId, user.role, user.companyId, user.isSuperAdmin);

    clearEmployeeIdentityCache(id);
    invalidateUserSessionCache(id);
    invalidateDashboardMetricsCache();
    clearEmployeeChunkCache();
    revalidatePath('/admin/employees');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/teams');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to delete employee.'),
    };
  }
}

/**
 * Creates a new squad / team.
 * Accessible ONLY by CEO and HR.
 */
export async function createTeamAction(input: {
  name: string;
  description?: string;
  colorTag?: string;
  teamLeadId?: string;
}): Promise<ActionResponse<{ id: string; name: string }>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageTeams(user.role)) {
      return { success: false, error: 'Unauthorized: Only CEO and HR can manage squads.' };
    }

    const team = await TeamService.createTeam(input, user.companyId, user.isSuperAdmin);

    revalidatePath('/admin/teams');
    revalidatePath('/admin/employees');

    return { success: true, data: team };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to create squad.'),
    };
  }
}

/**
 * Updates squad metadata and team lead assignments.
 * Accessible ONLY by CEO and HR.
 */
export async function updateTeamAction(input: UpdateTeamInput): Promise<ActionResponse<{ id: string; name: string }>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageTeams(user.role)) {
      return { success: false, error: 'Unauthorized: Only CEO and HR can manage squads.' };
    }

    const team = await TeamService.updateTeam(input, user.companyId, user.isSuperAdmin);

    revalidatePath('/admin/teams');
    revalidatePath(`/admin/teams/${team.id}`);
    revalidatePath('/admin/employees');

    return { success: true, data: team };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to update squad.'),
    };
  }
}

/**
 * Assigns one or more BDAs to a squad.
 * Accessible ONLY by CEO and HR.
 */
export async function addBdasToTeamAction(
  teamId: string,
  employeeIds: string[]
): Promise<ActionResponse<{ count: number }>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageTeams(user.role)) {
      return { success: false, error: 'Unauthorized: Only CEO and HR can manage squads.' };
    }

    const count = await TeamService.addBdasToTeam(teamId, employeeIds, user.companyId, user.isSuperAdmin);

    revalidatePath('/admin/teams');
    revalidatePath(`/admin/teams/${teamId}`);
    revalidatePath('/admin/employees');

    return { success: true, data: { count } };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to assign BDAs to squad.'),
    };
  }
}

/**
 * Removes a BDA from their current squad.
 * Accessible ONLY by CEO and HR.
 */
export async function removeBdaFromTeamAction(
  teamId: string,
  employeeId: string
): Promise<ActionResponse<boolean>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageTeams(user.role)) {
      return { success: false, error: 'Unauthorized: Only CEO and HR can manage squads.' };
    }

    await TeamService.removeBdaFromTeam(teamId, employeeId, user.companyId, user.isSuperAdmin);

    revalidatePath('/admin/teams');
    revalidatePath(`/admin/teams/${teamId}`);
    revalidatePath('/admin/employees');

    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to remove BDA from squad.'),
    };
  }
}

/**
 * Dissolves / deletes a squad safely.
 * Accessible ONLY by CEO and HR.
 */
export async function deleteTeamAction(teamId: string): Promise<ActionResponse<boolean>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageTeams(user.role)) {
      return { success: false, error: 'Unauthorized: Only CEO and HR can dissolve squads.' };
    }

    await TeamService.deleteTeam(teamId, user.companyId, user.isSuperAdmin);

    revalidatePath('/admin/teams');
    revalidatePath('/admin/employees');
    revalidatePath('/admin/leads');

    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to dissolve squad.'),
    };
  }
}

/**
 * Fetches available BDAs not yet in the target squad.
 */
export async function fetchAvailableBdasForTeamAction(teamId: string): Promise<ActionResponse<CandidateBdaItem[]>> {
  try {
    const user = await assertAuthenticatedUser();
    const data = await TeamService.fetchAvailableBdas(teamId, user.companyId, user.isSuperAdmin);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to fetch available BDAs.'),
    };
  }
}

/**
 * Fetches active Team Leads for assignment dropdowns.
 */
export async function fetchActiveTeamLeadsAction(): Promise<ActionResponse<TeamLeadOption[]>> {
  try {
    const user = await assertAuthenticatedUser();
    const data = await TeamService.fetchActiveTeamLeads(user.companyId, user.isSuperAdmin);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to fetch active team leads.'),
    };
  }
}
