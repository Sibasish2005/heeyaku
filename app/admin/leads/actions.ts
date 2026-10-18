'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { generateNextLeadCode } from '@/lib/lead/code';
import { canManageLeads } from '@/lib/auth/rbac';
import { LeadStatus, Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { invalidateDashboardMetricsCache } from '@/lib/dashboard/metrics';
import { zodPhoneNumberSchema, toLast10Digits } from '@/lib/lead/phone';
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
        const employee = await prisma.employee.findUnique({
          where: { id: assignedEmployeeId },
          select: { id: true, isActive: true, teamId: true, role: true, companyId: true },
        });

        if (!employee) {
          return { success: false, error: 'Selected employee does not exist.' };
        }
        if (!admin.isSuperAdmin && (!admin.companyId || employee.companyId !== admin.companyId)) {
          return { success: false, error: 'Unauthorized: Selected employee belongs to another organization.' };
        }
        if (!employee.isActive) {
          return { success: false, error: 'Cannot assign leads to a deactivated employee.' };
        }
        if (employee.role !== Role.BDA && employee.role !== Role.TEAM_LEAD) {
          return { success: false, error: 'Leads can only be assigned to Business Development Associates (BDA) or Team Leads.' };
        }

        targetEmployeeId = employee.id;
        targetTeamId = employee.teamId || targetTeamId;
        assignedAt = new Date();
        if (initialStatus === 'NEW') {
          initialStatus = 'ASSIGNED';
        }
      }
      if (teamId && teamId.trim() !== '') {
        const team = await prisma.team.findUnique({
          where: { id: teamId },
          select: { id: true, companyId: true },
        });
        if (!team) {
          return { success: false, error: 'Selected squad was not found.' };
        }
        if (!admin.isSuperAdmin && (!admin.companyId || team.companyId !== admin.companyId)) {
          return { success: false, error: 'Unauthorized: Selected squad belongs to another organization.' };
        }
        if (!targetEmployeeId) {
          targetTeamId = team.id;
        }
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
        if (employee.role !== Role.BDA) {
          return { success: false, error: 'Unauthorized: You can only assign leads to BDA members.' };
        }

        targetEmployeeId = employee.id;
        targetTeamId = employee.teamId || tlTeamId;
        assignedAt = new Date();
        if (initialStatus === 'NEW') {
          initialStatus = 'ASSIGNED';
        }
      }
    }

    if (!admin.isSuperAdmin && !admin.companyId) {
      return { success: false, error: 'Unauthorized: No active organization associated with administrator account.' };
    }

    const leadCode = await generateNextLeadCode();
    const phoneDigits = toLast10Digits(phoneNumber);

    const lead = await prisma.lead.create({
      data: {
        leadCode,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        phoneDigits: phoneDigits || null,
        email: email?.trim() || null,
        company: company?.trim() || null,
        source: source?.trim() || 'MANUAL',
        status: initialStatus,
        notes: notes?.trim() || null,
        companyId: admin.companyId || null,
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
      select: {
        id: true,
        companyId: true,
        assignedEmployeeId: true,
        status: true,
        teamId: true,
        isProspect: true,
        originalBdaId: true,
        promotedToProspectAt: true,
      },
    });

    if (!existing) {
      return { success: false, error: 'Lead not found.' };
    }

    if (!admin.isSuperAdmin) {
      if (!admin.companyId || existing.companyId !== admin.companyId) {
        return { success: false, error: 'Unauthorized: Cannot modify a lead belonging to another organization.' };
      }
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
        const employee = await prisma.employee.findUnique({
          where: { id: assignedEmployeeId },
          select: { id: true, isActive: true, teamId: true, role: true, companyId: true },
        });

        if (!employee) {
          return { success: false, error: 'Selected employee does not exist.' };
        }
        if (!admin.isSuperAdmin && (!admin.companyId || employee.companyId !== admin.companyId)) {
          return { success: false, error: 'Unauthorized: Selected employee belongs to another organization.' };
        }
        if (!employee.isActive) {
          return { success: false, error: 'Cannot assign leads to a deactivated employee.' };
        }
        if (employee.role !== Role.BDA && employee.role !== Role.TEAM_LEAD) {
          return { success: false, error: 'Leads can only be assigned to Business Development Associates (BDA) or Team Leads.' };
        }

        targetEmployeeId = employee.id;
        targetEmployeeTeamId = employee.teamId || targetEmployeeTeamId;
        assignedAt = new Date();
        if (newStatus === 'NEW') newStatus = 'ASSIGNED';
      } else if (assignedEmployeeId === '') {
        targetEmployeeId = null;
        assignedAt = undefined;
        if (newStatus === 'ASSIGNED') newStatus = 'NEW';
      }

      if (teamId !== undefined) {
        if (teamId && teamId.trim() !== '') {
          targetEmployeeTeamId = teamId;
        } else if (!targetEmployeeId) {
          targetEmployeeTeamId = null;
        }
      }
    } else if (admin.role === Role.TEAM_LEAD) {
      if (assignedEmployeeId && assignedEmployeeId.trim() !== '') {
        const employee = await prisma.employee.findUnique({
          where: { id: assignedEmployeeId },
          select: { id: true, isActive: true, teamId: true, role: true, companyId: true },
        });

        if (!employee) {
          return { success: false, error: 'Selected employee does not exist.' };
        }
        if (!admin.isSuperAdmin && (!admin.companyId || employee.companyId !== admin.companyId)) {
          return { success: false, error: 'Unauthorized: Selected employee belongs to another organization.' };
        }
        if (!employee.isActive) {
          return { success: false, error: 'Cannot assign leads to a deactivated employee.' };
        }
        if (employee.role !== Role.BDA) {
          return { success: false, error: 'Unauthorized: You can only assign leads to BDA members.' };
        }

        targetEmployeeId = employee.id;
        targetEmployeeTeamId = employee.teamId || tlTeamId;
        if (existing.assignedEmployeeId !== targetEmployeeId) {
          assignedAt = new Date();
        }
        if (newStatus === 'NEW') {
          newStatus = 'ASSIGNED';
        }
      } else if (assignedEmployeeId === '') {
        targetEmployeeId = null;
        assignedAt = undefined;
        if (newStatus === 'ASSIGNED') {
          newStatus = 'NEW';
        }
      }
    }

    // --- Prospect Promotion Handling ---
    let isProspect = existing.isProspect;
    let promotedToProspectAt = existing.promotedToProspectAt;
    let originalBdaId = existing.originalBdaId;

    if (['INTERESTED', 'CALL_BACK', 'FOLLOW_UP'].includes(newStatus)) {
      isProspect = true;
      if (!promotedToProspectAt) {
        promotedToProspectAt = new Date();
      }
      if (!originalBdaId && existing.assignedEmployeeId) {
        originalBdaId = existing.assignedEmployeeId;
      }

      // If assigned to a squad that has a Team Lead, auto-assign to the Team Lead
      const effectiveTeamId = tlTeamId || targetEmployeeTeamId || existing.teamId;
      if (effectiveTeamId) {
        const squad = await prisma.team.findUnique({
          where: { id: effectiveTeamId },
          select: { teamLeadId: true },
        });
        if (squad?.teamLeadId && targetEmployeeId !== squad.teamLeadId) {
          targetEmployeeId = squad.teamLeadId;
          assignedAt = new Date();
        }
      }
    }

    const phoneDigits = toLast10Digits(phoneNumber);

    await prisma.lead.update({
      where: { id },
      data: {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        phoneDigits: phoneDigits || null,
        email: email?.trim() || null,
        company: company?.trim() || null,
        source: source?.trim() || 'MANUAL',
        status: newStatus,
        notes: notes?.trim() || null,
        teamId: tlTeamId || targetEmployeeTeamId || undefined,
        assignedEmployeeId: targetEmployeeId,
        isProspect,
        promotedToProspectAt,
        originalBdaId,
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
      select: { id: true, companyId: true, assignedEmployeeId: true, teamId: true },
    });

    if (!lead) {
      return { success: false, error: 'Lead not found.' };
    }

    if (!admin.isSuperAdmin) {
      if (!admin.companyId || lead.companyId !== admin.companyId) {
        return { success: false, error: 'Unauthorized: Cannot delete a lead belonging to another organization.' };
      }
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
