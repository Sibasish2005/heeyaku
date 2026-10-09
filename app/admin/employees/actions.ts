'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  assertAuthenticatedUser,
  canManageEmployees,
  canDeleteEmployee,
  canManageTeams,
} from '@/lib/auth/rbac';
import { generateRandomPassword, hashPassword } from '@/lib/crypto/passwords';
import { generateNextEmployeeCode } from '@/lib/employee/code';
import { revalidatePath } from 'next/cache';
import { invalidateDashboardMetricsCache } from '@/lib/dashboard/metrics';
import { clearEmployeeIdentityCache } from '@/lib/employee/resolve';
import { clearEmployeeChunkCache } from './fetch-actions';
import { zodPhoneNumberSchema } from '@/lib/lead/phone';
import { Role } from '@prisma/client';

const CreateEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: zodPhoneNumberSchema,
  role: z.enum(['BDA', 'TEAM_LEAD', 'HR']).default('BDA'),
  teamId: z.string().optional().nullable(),
  teamLeadId: z.string().optional().nullable(),
  team: z.string().optional().default('Business Development Associates'),
  notes: z.string().optional(),
});

const UpdateEmployeeSchema = z.object({
  id: z.string().min(1, 'Employee ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: zodPhoneNumberSchema,
  role: z.enum(['BDA', 'TEAM_LEAD', 'HR']).optional(),
  teamId: z.string().optional().nullable(),
  teamLeadId: z.string().optional().nullable(),
  team: z.string().optional().default('Business Development Associates'),
  notes: z.string().optional(),
});

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Creates a new employee (BDA, Team Lead, or HR).
 * Accessible ONLY by CEO and HR.
 * Team Leads CANNOT create employees.
 */
export async function createEmployeeAction(input: unknown): Promise<ActionResponse<{
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  tempPassword: string;
  role: Role;
}>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageEmployees(user.role)) {
      return {
        success: false,
        error: 'Unauthorized: Team Leads cannot onboard employees. This action requires HR or CEO privileges.',
      };
    }

    const validated = CreateEmployeeSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    const { name, email, phoneNumber, role, teamId, teamLeadId, team, notes } = validated.data;

    // Only CEO can onboard new HR administrators
    if (role === 'HR' && user.role !== Role.CEO) {
      return {
        success: false,
        error: 'Unauthorized: Only the CEO can appoint or onboard Human Resources administrators.',
      };
    }

    // Check email uniqueness
    const existing = await prisma.employee.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return {
        success: false,
        error: 'An employee with this email address already exists.',
      };
    }

    // Resolve target teamId if HR assigned BDA to a specific Team Lead
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

    const employeeCode = await generateNextEmployeeCode();
    const tempPassword = generateRandomPassword(10);
    const passwordHash = await hashPassword(tempPassword);

    const employeeRole = role as Role;

    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phoneNumber: phoneNumber.trim(),
        role: employeeRole,
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

    // If newly created employee is a TEAM_LEAD and has a teamId, set them as teamLeadId for that team
    if (employeeRole === Role.TEAM_LEAD && resolvedTeamId) {
      await prisma.team.update({
        where: { id: resolvedTeamId },
        data: { teamLeadId: employee.id },
      });
    }

    invalidateDashboardMetricsCache();
    clearEmployeeChunkCache();
    revalidatePath('/admin/employees');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/teams');

    return {
      success: true,
      data: {
        ...employee,
        tempPassword,
      },
    };
  } catch (error) {
    console.error('Error creating employee:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create employee.',
    };
  }
}

/**
 * Updates an employee's profile, role, or team lead assignment.
 * Accessible ONLY by CEO and HR.
 */
export async function updateEmployeeAction(input: unknown): Promise<ActionResponse> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageEmployees(user.role)) {
      return {
        success: false,
        error: 'Unauthorized: Team Leads cannot edit employee profiles or change roles.',
      };
    }

    const validated = UpdateEmployeeSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    const { id, name, email, phoneNumber, role, teamId, teamLeadId, team, notes } = validated.data;

    const target = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!target) {
      return { success: false, error: 'Employee not found.' };
    }

    if (target.role === Role.CEO && user.role !== Role.CEO) {
      return { success: false, error: 'Unauthorized: Only the CEO can modify executive accounts.' };
    }

    if (user.role === Role.HR && role === 'HR' && target.role !== Role.HR) {
      return { success: false, error: 'Unauthorized: Only the CEO can promote employees to HR administrator.' };
    }

    // Check if another employee is already using this email
    const existing = await prisma.employee.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        NOT: { id },
      },
    });

    if (existing) {
      return {
        success: false,
        error: 'Another employee is already registered with this email address.',
      };
    }

    // Resolve target teamId if HR assigned BDA to a specific Team Lead
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

    await prisma.employee.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phoneNumber: phoneNumber.trim(),
        role: role ? (role as Role) : undefined,
        teamId: resolvedTeamId,
        team: resolvedTeamName,
        notes: notes?.trim() || null,
      },
    });

    clearEmployeeIdentityCache(id);
    invalidateDashboardMetricsCache();
    clearEmployeeChunkCache();
    revalidatePath('/admin/employees');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/teams');
    revalidatePath(`/admin/employees/${id}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating employee:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update employee.',
    };
  }
}

/**
 * Toggles an employee's active status.
 * Accessible ONLY by CEO and HR.
 */
export async function toggleEmployeeStatusAction(id: string): Promise<ActionResponse<{ isActive: boolean }>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageEmployees(user.role)) {
      return {
        success: false,
        error: 'Unauthorized: Team Leads cannot deactivate or reactivate staff accounts.',
      };
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, isActive: true, role: true },
    });

    if (!employee) {
      return { success: false, error: 'Employee not found.' };
    }

    if (employee.role === Role.CEO) {
      return { success: false, error: 'Unauthorized: CEO accounts cannot be deactivated.' };
    }

    if (user.role === Role.HR && employee.role === Role.HR) {
      return { success: false, error: 'Unauthorized: HR administrators cannot deactivate other HR administrators.' };
    }

    if (user.employeeId && user.employeeId === id) {
      return { success: false, error: 'Action blocked: You cannot deactivate your own active session account.' };
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: { isActive: !employee.isActive },
      select: { isActive: true },
    });

    clearEmployeeIdentityCache(id);
    invalidateDashboardMetricsCache();
    clearEmployeeChunkCache();
    revalidatePath('/admin/employees');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/teams');
    revalidatePath(`/admin/employees/${id}`);

    return { success: true, data: { isActive: updated.isActive } };
  } catch (error) {
    console.error('Error toggling employee status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update employee status.',
    };
  }
}

/**
 * Resets an employee's password to a newly generated temporary password.
 * Accessible ONLY by CEO and HR.
 */
export async function resetEmployeePasswordAction(id: string): Promise<ActionResponse<{ tempPassword: string; employeeCode: string }>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageEmployees(user.role)) {
      return {
        success: false,
        error: 'Unauthorized: Team Leads cannot reset staff passwords.',
      };
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, employeeCode: true, role: true },
    });

    if (!employee) {
      return { success: false, error: 'Employee not found.' };
    }

    if (employee.role === Role.CEO && user.role !== Role.CEO) {
      return { success: false, error: 'Unauthorized: Only the CEO can reset executive credentials.' };
    }

    const tempPassword = generateRandomPassword(10);
    const passwordHash = await hashPassword(tempPassword);

    await prisma.employee.update({
      where: { id },
      data: { passwordHash },
    });

    clearEmployeeIdentityCache(id);

    return {
      success: true,
      data: {
        tempPassword,
        employeeCode: employee.employeeCode,
      },
    };
  } catch (error) {
    console.error('Error resetting employee password:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset password.',
    };
  }
}

/**
 * Permanently deletes an employee.
 * Accessible ONLY by CEO and HR.
 * Team Leads CANNOT remove employees.
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

    const target = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!target) {
      return { success: false, error: 'Employee not found.' };
    }

    if (target.role === Role.CEO) {
      return { success: false, error: 'Unauthorized: CEO accounts cannot be deleted.' };
    }

    if (user.role === Role.HR && target.role === Role.HR) {
      return { success: false, error: 'Unauthorized: HR cannot delete other HR administrators or executive accounts.' };
    }

    if (user.employeeId && user.employeeId === id) {
      return { success: false, error: 'Action blocked: You cannot delete your own active account.' };
    }

    // Unassign leads from this employee
    await prisma.lead.updateMany({
      where: { assignedEmployeeId: id },
      data: { assignedEmployeeId: null, assignedAt: null },
    });

    // Unlink if this employee was a Team Lead
    await prisma.team.updateMany({
      where: { teamLeadId: id },
      data: { teamLeadId: null },
    });

    await prisma.employee.delete({
      where: { id },
    });

    clearEmployeeIdentityCache(id);
    invalidateDashboardMetricsCache();
    clearEmployeeChunkCache();
    revalidatePath('/admin/employees');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/teams');

    return { success: true };
  } catch (error) {
    console.error('Error deleting employee:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete employee.',
    };
  }
}

/**
 * Fetches all active Team Leads so HR can assign a BDA directly to a specific Team Lead.
 */
export async function fetchActiveTeamLeadsAction(): Promise<ActionResponse<Array<{
  id: string;
  name: string;
  employeeCode: string;
  teamId: string | null;
  teamName: string | null;
}>>> {
  try {
    await assertAuthenticatedUser();
    const teamLeads = await prisma.employee.findMany({
      where: {
        role: Role.TEAM_LEAD,
        isActive: true,
      },
      include: {
        teamGroup: true,
        ledTeam: true,
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: teamLeads.map((tl) => ({
        id: tl.id,
        name: tl.name,
        employeeCode: tl.employeeCode,
        teamId: tl.ledTeam?.id || tl.teamId || null,
        teamName: tl.ledTeam?.name || tl.teamGroup?.name || tl.team || 'Squad',
      })),
    };
  } catch (error) {
    return { success: false, error: 'Failed to fetch active team leads.' };
  }
}

/**
 * Fetches all teams with member and lead counts.
 */
export async function fetchTeamsAction(): Promise<ActionResponse<Array<{
  id: string;
  name: string;
  description: string | null;
  colorTag: string | null;
  teamLead: { id: string; name: string; employeeCode: string } | null;
  _count: { members: number; leads: number };
}>>> {
  try {
    await assertAuthenticatedUser();
    const teams = await prisma.team.findMany({
      include: {
        teamLead: { select: { id: true, name: true, employeeCode: true } },
        _count: { select: { members: true, leads: true } },
      },
      orderBy: { name: 'asc' },
    });

    return { success: true, data: teams };
  } catch (error) {
    return { success: false, error: 'Failed to fetch teams.' };
  }
}

/**
 * Creates or updates a team / squad.
 * Accessible ONLY by CEO and HR.
 */
export async function createTeamAction(input: {
  name: string;
  description?: string;
  teamLeadId?: string;
  colorTag?: string;
}): Promise<ActionResponse<{ id: string; name: string }>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageTeams(user.role)) {
      return { success: false, error: 'Unauthorized: Only CEO and HR can manage squads.' };
    }

    const team = await prisma.team.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        teamLeadId: input.teamLeadId || null,
        colorTag: input.colorTag || '#2563EB',
      },
    });

    if (input.teamLeadId) {
      await prisma.employee.update({
        where: { id: input.teamLeadId },
        data: {
          role: Role.TEAM_LEAD,
          teamId: team.id,
        },
      });
    }

    revalidatePath('/admin/teams');
    revalidatePath('/admin/employees');

    return { success: true, data: { id: team.id, name: team.name } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create team.',
    };
  }
}

/**
 * Updates an existing team / squad.
 * Accessible ONLY by CEO and HR.
 */
export async function updateTeamAction(input: {
  id: string;
  name?: string;
  description?: string;
  teamLeadId?: string | null;
  colorTag?: string;
}): Promise<ActionResponse<{ id: string; name: string }>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageTeams(user.role)) {
      return { success: false, error: 'Unauthorized: Only CEO and HR can manage squads.' };
    }

    const currentTeam = await prisma.team.findUnique({
      where: { id: input.id },
      select: { teamLeadId: true, name: true },
    });
    if (!currentTeam) {
      return { success: false, error: 'Squad not found.' };
    }

    if (input.teamLeadId !== undefined && input.teamLeadId !== currentTeam.teamLeadId) {
      if (input.teamLeadId) {
        await prisma.employee.update({
          where: { id: input.teamLeadId },
          data: {
            role: Role.TEAM_LEAD,
            teamId: input.id,
            team: input.name ? input.name.trim() : currentTeam.name,
          },
        });
      }
    }

    const team = await prisma.team.update({
      where: { id: input.id },
      data: {
        name: input.name ? input.name.trim() : undefined,
        description: input.description !== undefined ? (input.description ? input.description.trim() : null) : undefined,
        teamLeadId: input.teamLeadId !== undefined ? input.teamLeadId : undefined,
        colorTag: input.colorTag ? input.colorTag : undefined,
      },
    });

    if (input.name && input.name.trim() !== currentTeam.name) {
      await prisma.employee.updateMany({
        where: { teamId: team.id },
        data: { team: team.name },
      });
    }

    revalidatePath('/admin/teams');
    revalidatePath(`/admin/teams/${team.id}`);
    revalidatePath('/admin/employees');

    return { success: true, data: { id: team.id, name: team.name } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update team.',
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

    if (!employeeIds.length) {
      return { success: false, error: 'No BDAs selected.' };
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true },
    });
    if (!team) {
      return { success: false, error: 'Squad not found.' };
    }

    const result = await prisma.employee.updateMany({
      where: {
        id: { in: employeeIds },
      },
      data: {
        teamId: team.id,
        team: team.name,
      },
    });

    revalidatePath('/admin/teams');
    revalidatePath(`/admin/teams/${teamId}`);
    revalidatePath('/admin/employees');

    return { success: true, data: { count: result.count } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign BDAs to squad.',
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

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        teamId: null,
        team: 'General',
      },
    });

    revalidatePath('/admin/teams');
    revalidatePath(`/admin/teams/${teamId}`);
    revalidatePath('/admin/employees');

    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove BDA from squad.',
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

    await prisma.lead.updateMany({
      where: { teamId },
      data: { teamId: null },
    });

    await prisma.employee.updateMany({
      where: { teamId },
      data: { teamId: null, team: 'General' },
    });

    await prisma.team.delete({
      where: { id: teamId },
    });

    revalidatePath('/admin/teams');
    revalidatePath('/admin/employees');
    revalidatePath('/admin/leads');

    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete squad.',
    };
  }
}

/**
 * Fetches available BDAs not yet in the target squad.
 */
export async function fetchAvailableBdasForTeamAction(teamId: string): Promise<ActionResponse<Array<{
  id: string;
  name: string;
  employeeCode: string;
  email: string;
  phoneNumber: string;
  currentTeamName: string | null;
}>>> {
  try {
    await assertAuthenticatedUser();
    const bdas = await prisma.employee.findMany({
      where: {
        role: Role.BDA,
        isActive: true,
        OR: [
          { teamId: null },
          { teamId: { not: teamId } },
        ],
      },
      include: {
        teamGroup: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: bdas.map((b) => ({
        id: b.id,
        name: b.name,
        employeeCode: b.employeeCode,
        email: b.email,
        phoneNumber: b.phoneNumber,
        currentTeamName: b.teamGroup?.name || null,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch available BDAs.',
    };
  }
}
