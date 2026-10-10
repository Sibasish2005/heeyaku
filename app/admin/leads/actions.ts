'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { generateNextLeadCode } from '@/lib/lead/code';
import { canManageLeads } from '@/lib/auth/rbac';
import { LeadStatus, Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { invalidateDashboardMetricsCache } from '@/lib/dashboard/metrics';
import { zodPhoneNumberSchema } from '@/lib/lead/phone';
import { sanitizeErrorMessage } from '@/lib/security/errors';

const LeadStatusEnum = z.enum([
  'NEW',
  'ASSIGNED',
  'CONTACTED',
  'INTERESTED',
  'FOLLOW_UP',
  'CALL_BACK',
  'NOT_INTERESTED',
  'NO_ANSWER',
  'BUSY',
  'WRONG_NUMBER',
  'CONVERTED',
  'NOT_QUALIFIED',
  'OTHER',
]);

const CreateLeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: zodPhoneNumberSchema,
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  source: z.string().optional().default('MANUAL'),
  status: LeadStatusEnum.optional().default('NEW'),
  notes: z.string().optional().or(z.literal('')),
  teamId: z.string().optional().or(z.literal('')),
  assignedEmployeeId: z.string().optional().or(z.literal('')),
});

const UpdateLeadSchema = z.object({
  id: z.string().min(1, 'Lead ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: zodPhoneNumberSchema,
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  source: z.string().optional().default('MANUAL'),
  status: LeadStatusEnum,
  notes: z.string().optional().or(z.literal('')),
  teamId: z.string().optional().or(z.literal('')),
  assignedEmployeeId: z.string().optional().or(z.literal('')),
});

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Server Action: Creates a new sales/admissions lead manually with an auto-generated unique LED-xxxx code.
 * Accessible ONLY by CEO and Team Leads (scoped to Team Lead squad).
 * Validates 10-digit phone number, parses optional assigned employee, sets status (NEW vs ASSIGNED),
 * invalidates dashboard caches, and revalidates Next.js lead tables.
 *
 * @param input - Unknown client form input parsed against CreateLeadSchema
 * @returns {Promise<ActionResponse<{ id: string; leadCode: string }>>} ActionResponse with ID and unique Lead Code
 */
export async function createLeadAction(input: unknown): Promise<ActionResponse<{ id: string; leadCode: string }>> {
  try {
    const admin = await assertAdminAccess();
    if (!canManageLeads(admin.role)) {
      return { success: false, error: 'Unauthorized: Only CEO and Team Leads can create leads.' };
    }

    const tlTeamId = admin.role === Role.TEAM_LEAD ? (admin.ledTeamId || admin.teamId || null) : null;
    if (admin.role === Role.TEAM_LEAD && !tlTeamId) {
      return { success: false, error: 'Unauthorized: Team Lead is not assigned to any squad.' };
    }

    const validated = CreateLeadSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    const { name, phoneNumber, email, company, source, notes, teamId, assignedEmployeeId } = validated.data;
    let initialStatus = validated.data.status;

    let targetTeamId: string | null = tlTeamId;
    let targetEmployeeId: string | null = null;
    let assignedAt: Date | null = null;

    if (admin.role === Role.CEO) {
      if (assignedEmployeeId && assignedEmployeeId.trim() !== '') {
        return {
          success: false,
          error: 'As CEO, assign leads to a Squad / Team. The Team Lead will assign to individual BDAs.',
        };
      }
      if (teamId && teamId.trim() !== '') {
        const team = await prisma.team.findUnique({
          where: { id: teamId },
          select: { id: true },
        });
        if (!team) {
          return { success: false, error: 'Selected squad was not found.' };
        }
        targetTeamId = team.id;
      }
    } else if (admin.role === Role.TEAM_LEAD) {
      targetTeamId = tlTeamId;
      if (assignedEmployeeId && assignedEmployeeId.trim() !== '') {
        const employee = await prisma.employee.findUnique({
          where: { id: assignedEmployeeId },
          select: { id: true, isActive: true, teamId: true, role: true },
        });

        if (!employee) {
          return { success: false, error: 'Selected employee does not exist.' };
        }
        if (!employee.isActive) {
          return { success: false, error: 'Cannot assign leads to a deactivated employee.' };
        }
        if (employee.role !== Role.BDA || employee.teamId !== tlTeamId) {
          return { success: false, error: 'Unauthorized: You can only assign leads to BDA members of your own squad.' };
        }

        targetEmployeeId = employee.id;
        assignedAt = new Date();
        if (initialStatus === 'NEW') {
          initialStatus = 'ASSIGNED';
        }
      }
    }

    const leadCode = await generateNextLeadCode();

    const lead = await prisma.lead.create({
      data: {
        leadCode,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email?.trim() || null,
        company: company?.trim() || null,
        source: source?.trim() || 'MANUAL',
        status: initialStatus,
        notes: notes?.trim() || null,
        teamId: targetTeamId || null,
        assignedEmployeeId: targetEmployeeId,
        assignedAt,
      },
      select: {
        id: true,
        leadCode: true,
      },
    });

    invalidateDashboardMetricsCache();
    revalidatePath('/admin/leads');
    revalidatePath('/admin/dashboard');
    if (targetEmployeeId) {
      revalidatePath(`/admin/employees/${targetEmployeeId}`);
    }

    return {
      success: true,
      data: lead,
    };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to create lead. Please check the entered information and try again.'),
    };
  }
}

/**
 * Server Action: Updates lead details, pipeline status, remarks, and employee assignment.
 * Accessible ONLY by CEO and Team Leads (Team Leads can only update leads within their squad).
 * Automatically handles status transitions between NEW and ASSIGNED when employee assignment changes.
 *
 * @param input - Unknown client form input parsed against UpdateLeadSchema
 * @returns {Promise<ActionResponse>} Success indicator
 */
export async function updateLeadAction(input: unknown): Promise<ActionResponse> {
  try {
    const admin = await assertAdminAccess();
    if (!canManageLeads(admin.role)) {
      return { success: false, error: 'Unauthorized: Only CEO and Team Leads can update leads.' };
    }

    const tlTeamId = admin.role === Role.TEAM_LEAD ? (admin.ledTeamId || admin.teamId || null) : null;
    if (admin.role === Role.TEAM_LEAD && !tlTeamId) {
      return { success: false, error: 'Unauthorized: Team Lead is not assigned to any squad.' };
    }

    const validated = UpdateLeadSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    const { id, name, phoneNumber, email, company, source, status, notes, teamId, assignedEmployeeId } = validated.data;

    const existing = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, assignedEmployeeId: true, status: true, teamId: true },
    });

    if (!existing) {
      return { success: false, error: 'Lead not found.' };
    }

    if (admin.role === Role.TEAM_LEAD && existing.teamId !== tlTeamId && existing.assignedEmployeeId !== admin.employeeId) {
      return { success: false, error: 'Unauthorized: You can only modify leads assigned to your squad or assigned to you.' };
    }

    let targetEmployeeId: string | null = existing.assignedEmployeeId;
    let targetEmployeeTeamId: string | null = existing.teamId;
    let assignedAt: Date | undefined = undefined;
    let newStatus: LeadStatus = status;

    if (admin.role === Role.CEO) {
      if (assignedEmployeeId && assignedEmployeeId.trim() !== '' && assignedEmployeeId !== existing.assignedEmployeeId) {
        return {
          success: false,
          error: 'As CEO, assign leads to a Squad / Team. The Team Lead will assign to individual BDAs.',
        };
      }
      if (teamId !== undefined) {
        if (teamId && teamId.trim() !== '') {
          targetEmployeeTeamId = teamId;
          if (teamId !== existing.teamId) {
            targetEmployeeId = null;
            assignedAt = undefined;
            if (newStatus === 'ASSIGNED') newStatus = 'NEW';
          }
        } else {
          targetEmployeeTeamId = null;
          targetEmployeeId = null;
          assignedAt = undefined;
          if (newStatus === 'ASSIGNED') newStatus = 'NEW';
        }
      }
    } else if (admin.role === Role.TEAM_LEAD) {
      targetEmployeeTeamId = tlTeamId;
      if (assignedEmployeeId && assignedEmployeeId.trim() !== '') {
        const employee = await prisma.employee.findUnique({
          where: { id: assignedEmployeeId },
          select: { id: true, isActive: true, teamId: true, role: true },
        });

        if (!employee) {
          return { success: false, error: 'Selected employee does not exist.' };
        }
        if (!employee.isActive) {
          return { success: false, error: 'Cannot assign leads to a deactivated employee.' };
        }
        if (employee.role !== Role.BDA || employee.teamId !== tlTeamId) {
          return { success: false, error: 'Unauthorized: Cannot assign leads to employees outside your squad.' };
        }

        targetEmployeeId = employee.id;
        if (existing.assignedEmployeeId !== targetEmployeeId) {
          assignedAt = new Date();
        }
        if (newStatus === 'NEW') {
          newStatus = 'ASSIGNED';
        }
      } else {
        targetEmployeeId = null;
        assignedAt = undefined;
        if (newStatus === 'ASSIGNED') {
          newStatus = 'NEW';
        }
      }
    }

    await prisma.lead.update({
      where: { id },
      data: {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email?.trim() || null,
        company: company?.trim() || null,
        source: source?.trim() || 'MANUAL',
        status: newStatus,
        notes: notes?.trim() || null,
        teamId: tlTeamId || targetEmployeeTeamId || undefined,
        assignedEmployeeId: targetEmployeeId,
        ...(assignedAt !== undefined ? { assignedAt } : {}),
      },
    });

    invalidateDashboardMetricsCache();
    revalidatePath('/admin/leads');
    revalidatePath('/admin/dashboard');
    if (existing.assignedEmployeeId) {
      revalidatePath(`/admin/employees/${existing.assignedEmployeeId}`);
    }
    if (targetEmployeeId && targetEmployeeId !== existing.assignedEmployeeId) {
      revalidatePath(`/admin/employees/${targetEmployeeId}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to update lead details.'),
    };
  }
}

/**
 * Server Action: Permanently removes a lead record from PostgreSQL.
 * Accessible ONLY by CEO and Team Leads (scoped strictly to Team Lead squad).
 * Invalidates metrics cache and updates lead tables.
 *
 * @param id - Unique database ID of the lead record to delete
 * @returns {Promise<ActionResponse>} Success indicator
 */
export async function deleteLeadAction(id: string): Promise<ActionResponse> {
  try {
    const admin = await assertAdminAccess();
    if (!canManageLeads(admin.role)) {
      return { success: false, error: 'Unauthorized: Only CEO and Team Leads can delete leads.' };
    }

    const tlTeamId = admin.role === Role.TEAM_LEAD ? (admin.ledTeamId || admin.teamId || null) : null;
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, assignedEmployeeId: true, teamId: true },
    });

    if (!lead) {
      return { success: false, error: 'Lead not found.' };
    }

    if (admin.role === Role.TEAM_LEAD && (!tlTeamId || lead.teamId !== tlTeamId)) {
      return { success: false, error: 'Unauthorized: You can only delete leads belonging to your squad.' };
    }

    await prisma.lead.delete({
      where: { id },
    });

    invalidateDashboardMetricsCache();
    revalidatePath('/admin/leads');
    revalidatePath('/admin/dashboard');
    if (lead.assignedEmployeeId) {
      revalidatePath(`/admin/employees/${lead.assignedEmployeeId}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to delete lead.'),
    };
  }
}
