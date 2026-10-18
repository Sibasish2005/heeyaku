import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { isAllowedCeoEmail } from '@/lib/auth/rbac';
import { generateRandomPassword, hashPassword } from '@/lib/crypto/passwords';
import { generateNextEmployeeCode } from '@/lib/employee/code';
import { ClerkSyncService } from '@/lib/auth/clerk-sync';
import { CreateEmployeeInput, UpdateEmployeeInput } from './employee.schema';

export interface EmployeeCreationResult {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  role: Role;
  tempPassword: string;
}

export interface PasswordResetResult {
  tempPassword: string;
  employeeCode: string;
}

/**
 * Domain Service: Employee & Credential Management
 * Encapsulates the business logic, security constraints, and identity provisioning
 * for staff members across CEO, HR, Team Lead, and BDA roles.
 */
export class EmployeeService {
  /**
   * Onboards a new employee with an admin-provisioned ID and secure temporary password.
   * Performs root CEO conflict checks, role hierarchy validation, sequential employee code generation,
   * bcrypt password hashing, Clerk user directory provisioning, and optional Team Lead assignment.
   *
   * @param input - The validated employee creation payload
   * @param input.name - Full display name of the employee (minimum 2 characters)
   * @param input.email - Email address used for web and mobile authentication
   * @param input.phoneNumber - Standard 10-digit telephone number
   * @param input.role - Target role: 'BDA', 'TEAM_LEAD', or 'HR'
   * @param input.teamId - Optional ID of the squad to assign this employee to
   * @param input.teamLeadId - Optional ID of a Team Lead whose squad the employee joins
   * @param input.team - Optional fallback text name of the squad
   * @param input.notes - Optional administrative notes or comments
   * @param callerRole - The authenticated role of the actor attempting to create the employee
   *
   * @returns {Promise<EmployeeCreationResult>} The created employee record including the plain-text temporary password
   * @throws {Error} If the email matches the immutable Root CEO in .env
   * @throws {Error} If a non-CEO attempts to onboard an HR administrator
   * @throws {Error} If an employee with the provided email already exists
   */
  static async createEmployee(
    input: CreateEmployeeInput,
    callerRole: Role,
    callerCompanyId?: string | null
  ): Promise<EmployeeCreationResult> {
    const { name, email, phoneNumber, role, teamId, teamLeadId, team, notes } = input;
    const normalizedEmail = email.toLowerCase().trim();

    // Security Rule: Root CEO email defined in .env cannot be registered as an employee
    if (isAllowedCeoEmail(normalizedEmail)) {
      throw new Error('Security Error: This email belongs to the Root CEO in .env and cannot be registered as an employee.');
    }

    // Role Hierarchy: Only CEO can onboard new HR administrators
    if (role === 'HR' && callerRole !== Role.CEO) {
      throw new Error('Unauthorized: Only the CEO can appoint or onboard Human Resources administrators.');
    }

    // Check email uniqueness before external provisioning
    const existing = await prisma.employee.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new Error('An employee with this email address already exists.');
    }

    // Resolve target teamId if assigned to a Team Lead
    let resolvedTeamId = teamId || null;
    let resolvedTeamName = team?.trim() || 'General';

    if (teamLeadId) {
      const tl = await prisma.employee.findUnique({
        where: { id: teamLeadId },
        include: { ledTeam: true, teamGroup: true },
      });
      if (tl) {
        resolvedTeamId = tl.ledTeam?.id || tl.teamId || null;
        resolvedTeamName = tl.ledTeam?.name || tl.teamGroup?.name || tl.team || 'Squad';
      }
    }

    // Generate credentials
    const employeeCode = await generateNextEmployeeCode();
    const assignedPassword =
      input.password && input.password.trim().length >= 8
        ? input.password.trim()
        : generateRandomPassword(16);
    const passwordHash = await hashPassword(assignedPassword);
    const employeeRole = role as Role;

    // Provision account in Clerk backend so employee can log in immediately
    let clerkUserId: string | null = null;
    try {
      clerkUserId = await ClerkSyncService.provisionUser({
        email: normalizedEmail,
        password: assignedPassword,
        name,
        employeeCode,
      });
    } catch (clerkErr) {
      console.warn(`[EmployeeService] Clerk provisioning notice for ${normalizedEmail}:`, clerkErr);
    }

    // Atomically enforce seat quota and persist employee inside a database transaction to prevent race conditions
    const employee = await prisma.$transaction(async (tx) => {
      // Re-verify email uniqueness inside transaction
      const existingInTx = await tx.employee.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingInTx) {
        throw new Error('An employee with this email address already exists.');
      }

      // Enforce Caller Seat Limit for BDAs inside transaction with pessimistic row lock
      if (role === 'BDA' && callerCompanyId) {
        // Pessimistic exclusive row lock on the target company row.
        // Serializes concurrent BDA creation for this company without affecting other companies.
        // FAIL CLOSED: Never swallow locking errors. If row locking fails, abort operation immediately.
        await tx.$queryRaw`SELECT "id" FROM "companies" WHERE "id" = ${callerCompanyId} FOR UPDATE;`;

        const company = await tx.company.findUnique({
          where: { id: callerCompanyId },
          select: { maxBdas: true, name: true },
        });
        if (company) {
          const activeBdaCount = await tx.employee.count({
            where: {
              companyId: callerCompanyId,
              role: 'BDA',
              isActive: true,
            },
          });
          if (activeBdaCount >= company.maxBdas) {
            throw new Error(`Caller seat limit reached (${activeBdaCount} / ${company.maxBdas} BDAs). Contact platform administrator to increase caller seats.`);
          }
        }
      }

      // Generate sequential unique employee code inside the transaction
      const txEmployeeCode = await generateNextEmployeeCode(tx);

      const created = await tx.employee.create({
        data: {
          employeeCode: txEmployeeCode || employeeCode,
          name: name.trim(),
          email: normalizedEmail,
          phoneNumber: phoneNumber.trim(),
          role: employeeRole,
          companyId: callerCompanyId || null,
          clerkUserId,
          teamId: resolvedTeamId,
          team: resolvedTeamName,
          notes: notes?.trim() || null,
          passwordHash,
          isActive: true,
        },
        select: {
          id: true,
          employeeCode: true,
          name: true,
          email: true,
          role: true,
        },
      });

      // If newly created employee is a TEAM_LEAD and has a teamId, assign as teamLeadId
      if (employeeRole === Role.TEAM_LEAD && resolvedTeamId) {
        await tx.team.update({
          where: { id: resolvedTeamId },
          data: { teamLeadId: created.id },
        });
      }

      return created;
    });

    return {
      ...employee,
      tempPassword: assignedPassword,
    };
  }

  /**
   * Updates an employee profile while strictly enforcing CEO and HR organizational boundaries.
   * Synchronizes changes to Clerk user directory if the profile is linked.
   *
   * @param input - The validated employee update payload
   * @param input.id - Unique ID of the employee record to update
   * @param input.name - Updated full display name
   * @param input.email - Updated email address
   * @param input.phoneNumber - Updated 10-digit phone number
   * @param input.role - Optional new role ('BDA', 'TEAM_LEAD', 'HR')
   * @param input.teamId - Optional new squad ID
   * @param input.teamLeadId - Optional Team Lead ID to inherit squad from
   * @param input.team - Optional fallback squad name
   * @param input.notes - Optional administrative notes
   * @param callerRole - The authenticated role of the actor attempting the update
   *
   * @returns {Promise<void>} Resolves when database and Clerk synchronization succeed
   * @throws {Error} If employee record does not exist
   * @throws {Error} If attempting to modify a Root CEO account
   * @throws {Error} If HR attempts to modify another HR administrator or promote someone to HR
   * @throws {Error} If email address is already claimed by another employee
   */
  static async updateEmployee(
    input: UpdateEmployeeInput,
    callerRole: Role,
    callerCompanyId?: string | null,
    isSuperAdmin: boolean = false
  ): Promise<void> {
    const { id, name, email, phoneNumber, role, teamId, teamLeadId, team, notes } = input;
    const normalizedEmail = email.toLowerCase().trim();

    const target = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, role: true, email: true, clerkUserId: true, companyId: true },
    });

    if (!target) {
      throw new Error('Employee not found.');
    }

    if (!isSuperAdmin) {
      if (!callerCompanyId || target.companyId !== callerCompanyId) {
        throw new Error('Unauthorized: Cannot access or modify an employee from another organization.');
      }
    }

    if (target.role === Role.CEO || isAllowedCeoEmail(target.email)) {
      throw new Error('Unauthorized: Root CEO accounts are managed via .env and cannot be modified.');
    }

    if (callerRole === Role.HR && target.role === Role.HR) {
      throw new Error('Unauthorized: Only the CEO can modify HR administrator profiles.');
    }

    if (callerRole === Role.HR && role === 'HR' && target.role !== Role.HR) {
      throw new Error('Unauthorized: Only the CEO can promote employees to HR administrator.');
    }

    if (isAllowedCeoEmail(normalizedEmail)) {
      throw new Error('Security Error: Cannot assign the Root CEO email to an employee.');
    }

    // Check email uniqueness if email changed
    const existing = await prisma.employee.findFirst({
      where: {
        email: normalizedEmail,
        NOT: { id },
      },
    });
    if (existing) {
      throw new Error('Another employee is already registered with this email address.');
    }

    let resolvedTeamId = teamId !== undefined ? teamId : undefined;
    let resolvedTeamName = team !== undefined ? team.trim() : undefined;

    if (teamLeadId) {
      const tl = await prisma.employee.findUnique({
        where: { id: teamLeadId },
        include: { ledTeam: true, teamGroup: true },
      });
      if (tl) {
        resolvedTeamId = tl.ledTeam?.id || tl.teamId || null;
        resolvedTeamName = tl.ledTeam?.name || tl.teamGroup?.name || tl.team || 'Squad';
      }
    }

    const updateData = {
      name: name.trim(),
      email: normalizedEmail,
      phoneNumber: phoneNumber.trim(),
      role: role ? (role as Role) : undefined,
      teamId: resolvedTeamId,
      team: resolvedTeamName,
      notes: notes?.trim() || null,
    };

    // Caller seat limit check when changing role to BDA (atomic row lock inside transaction)
    if (role === 'BDA' && target.role !== Role.BDA && target.companyId) {
      const targetCompanyId = target.companyId;
      await prisma.$transaction(async (tx) => {
        // FAIL CLOSED: Never swallow locking errors.
        await tx.$queryRaw`SELECT "id" FROM "companies" WHERE "id" = ${targetCompanyId} FOR UPDATE;`;
        const company = await tx.company.findUnique({
          where: { id: targetCompanyId },
          select: { maxBdas: true },
        });
        if (company) {
          const activeBdaCount = await tx.employee.count({
            where: {
              companyId: targetCompanyId,
              role: Role.BDA,
              isActive: true,
            },
          });
          if (activeBdaCount >= company.maxBdas) {
            throw new Error(`Cannot change role to BDA: Caller seat limit reached (${activeBdaCount} / ${company.maxBdas} BDAs).`);
          }
        }
        await tx.employee.update({
          where: { id },
          data: updateData,
        });
      });
    } else {
      await prisma.employee.update({
        where: { id },
        data: updateData,
      });
    }

    if (target.clerkUserId) {
      await ClerkSyncService.updateProfile(target.clerkUserId, name);
    }
  }

  /**
   * Resets an employee password to a new cryptographically random temporary password.
   * Updates bcrypt hash in PostgreSQL and synchronizes the password to Clerk.
   *
   * @param employeeId - Unique database ID of the employee
   * @param callerRole - The authenticated role of the actor attempting the password reset
   *
   * @returns {Promise<PasswordResetResult>} Contains the newly generated temporary password and employeeCode
   * @throws {Error} If employee record does not exist
   * @throws {Error} If attempting to reset a CEO account
   * @throws {Error} If an HR actor attempts to reset another HR administrator
   */
  static async resetPassword(
    employeeId: string,
    callerRole: Role,
    manualPassword?: string,
    callerCompanyId?: string | null,
    isSuperAdmin: boolean = false
  ): Promise<PasswordResetResult> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, employeeCode: true, name: true, role: true, email: true, clerkUserId: true, companyId: true },
    });

    if (!employee) {
      throw new Error('Employee not found.');
    }

    if (!isSuperAdmin) {
      if (!callerCompanyId || employee.companyId !== callerCompanyId) {
        throw new Error('Unauthorized: Cannot reset credentials for an employee belonging to another organization.');
      }
    }

    if (employee.role === Role.CEO || isAllowedCeoEmail(employee.email)) {
      throw new Error('Unauthorized: Cannot reset executive credentials via dashboard.');
    }

    if (employee.role === Role.HR && callerRole !== Role.CEO) {
      throw new Error('Unauthorized: Only the CEO can reset HR administrator credentials.');
    }

    const assignedPassword =
      manualPassword && manualPassword.trim().length >= 8
        ? manualPassword.trim()
        : generateRandomPassword(16);

    // 1. Update Clerk user directory directly first (throws if Clerk rejects password)
    const activeClerkUserId = await ClerkSyncService.updatePasswordDirectly({
      clerkUserId: employee.clerkUserId,
      email: employee.email,
      password: assignedPassword,
      name: employee.name,
    });

    // 2. Only once Clerk directly accepts the new credentials, hash and save to PostgreSQL
    const passwordHash = await hashPassword(assignedPassword);
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        passwordHash,
        clerkUserId: activeClerkUserId ?? employee.clerkUserId,
      },
    });

    return {
      tempPassword: assignedPassword,
      employeeCode: employee.employeeCode,
    };
  }

  /**
   * Permanently deletes an employee from PostgreSQL, unlinks assigned leads and squads,
   * and purges the user from the Clerk authentication service.
   *
   * @param employeeId - Unique database ID of the employee to delete
   * @param callerId - Database ID of the actor (prevents self-deletion)
   * @param callerRole - Role of the actor (CEO or HR)
   *
   * @returns {Promise<void>}
   * @throws {Error} If employee record does not exist
   * @throws {Error} If attempting to delete a CEO account
   * @throws {Error} If HR attempts to delete an HR administrator
   * @throws {Error} If user attempts to delete their own account
   */
  static async deleteEmployee(
    employeeId: string,
    callerId: string | undefined,
    callerRole: Role,
    callerCompanyId?: string | null,
    isSuperAdmin: boolean = false
  ): Promise<void> {
    const target = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, role: true, email: true, clerkUserId: true, companyId: true },
    });

    if (!target) {
      throw new Error('Employee not found.');
    }

    if (!isSuperAdmin) {
      if (!callerCompanyId || target.companyId !== callerCompanyId) {
        throw new Error('Unauthorized: Cannot delete an employee belonging to another organization.');
      }
    }

    if (target.role === Role.CEO || isAllowedCeoEmail(target.email)) {
      throw new Error('Unauthorized: CEO accounts cannot be deleted.');
    }

    if (callerRole === Role.HR && target.role === Role.HR) {
      throw new Error('Unauthorized: HR cannot delete other HR administrators or executive accounts.');
    }

    if (callerId && callerId === employeeId) {
      throw new Error('Action blocked: You cannot delete your own active account.');
    }

    // Check if employee has historical call records
    const callCount = await prisma.callLog.count({
      where: { employeeId },
    });

    if (callCount > 0) {
      // Deactivate account instead of hard deleting to preserve critical telemetry & historical call logs
      await prisma.lead.updateMany({
        where: { assignedEmployeeId: employeeId },
        data: { assignedEmployeeId: null, assignedAt: null },
      });

      await prisma.team.updateMany({
        where: { teamLeadId: employeeId },
        data: { teamLeadId: null },
      });

      await prisma.employee.update({
        where: { id: employeeId },
        data: {
          isActive: false,
          teamId: null,
          team: 'Deactivated',
        },
      });

      if (target.clerkUserId) {
        await ClerkSyncService.deleteUser(target.clerkUserId, target.email);
      }
      return;
    }

    // If zero call logs, safely perform hard deletion
    await prisma.lead.updateMany({
      where: { assignedEmployeeId: employeeId },
      data: { assignedEmployeeId: null, assignedAt: null },
    });

    await prisma.team.updateMany({
      where: { teamLeadId: employeeId },
      data: { teamLeadId: null },
    });

    await prisma.employee.delete({
      where: { id: employeeId },
    });

    if (target.clerkUserId) {
      await ClerkSyncService.deleteUser(target.clerkUserId, target.email);
    }
  }

  /**
   * Toggles an employee's active status between active (true) and deactivated (false).
   * Deactivated employees are rejected at login and cannot be assigned new leads.
   *
   * @param employeeId - Unique database ID of the employee
   * @param callerRole - Role of the caller enforcing authorization hierarchy
   *
   * @returns {Promise<boolean>} The new `isActive` boolean value
   * @throws {Error} If employee is not found
   * @throws {Error} If attempting to deactivate a CEO account
   * @throws {Error} If HR attempts to deactivate another HR administrator
   */
  static async toggleStatus(
    employeeId: string,
    callerRole: Role,
    callerCompanyId?: string | null,
    isSuperAdmin: boolean = false
  ): Promise<boolean> {
    const target = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, role: true, email: true, isActive: true, companyId: true },
    });

    if (!target) {
      throw new Error('Employee not found.');
    }

    if (!isSuperAdmin) {
      if (!callerCompanyId || target.companyId !== callerCompanyId) {
        throw new Error('Unauthorized: Cannot modify an employee belonging to another organization.');
      }
    }

    if (target.role === Role.CEO || isAllowedCeoEmail(target.email)) {
      throw new Error('Unauthorized: CEO accounts cannot be deactivated.');
    }

    if (callerRole === Role.HR && target.role === Role.HR) {
      throw new Error('Unauthorized: HR cannot deactivate other HR administrators.');
    }

    // If reactivating a deactivated BDA, verify caller seat capacity atomically with pessimistic row lock
    if (!target.isActive && target.role === Role.BDA && target.companyId) {
      const targetCompanyId = target.companyId;
      return await prisma.$transaction(async (tx) => {
        // FAIL CLOSED: Never swallow locking errors.
        await tx.$queryRaw`SELECT "id" FROM "companies" WHERE "id" = ${targetCompanyId} FOR UPDATE;`;
        const company = await tx.company.findUnique({
          where: { id: targetCompanyId },
          select: { maxBdas: true },
        });
        if (company) {
          const activeBdaCount = await tx.employee.count({
            where: {
              companyId: targetCompanyId,
              role: Role.BDA,
              isActive: true,
            },
          });
          if (activeBdaCount >= company.maxBdas) {
            throw new Error(`Cannot reactivate BDA: Caller seat limit reached (${activeBdaCount} / ${company.maxBdas} BDAs). Contact administrator to increase caller seats.`);
          }
        }
        const updated = await tx.employee.update({
          where: { id: employeeId },
          data: { isActive: true },
          select: { isActive: true },
        });
        return updated.isActive;
      });
    }

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: { isActive: !target.isActive },
      select: { isActive: true },
    });

    return updated.isActive;
  }
}
