'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { generateNextLeadCode } from '@/lib/lead/code';
import { LeadStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { invalidateDashboardMetricsCache } from '@/lib/dashboard/metrics';
import { zodPhoneNumberSchema } from '@/lib/lead/phone';

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
  assignedEmployeeId: z.string().optional().or(z.literal('')),
});

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Creates a new lead manually with an auto-generated unique LED-xxxx code.
 */
export async function createLeadAction(input: unknown): Promise<ActionResponse<{ id: string; leadCode: string }>> {
  try {
    await assertAdminAccess();

    const validated = CreateLeadSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    const { name, phoneNumber, email, company, source, notes, assignedEmployeeId } = validated.data;
    let initialStatus = validated.data.status;

    let targetEmployeeId: string | null = null;
    let assignedAt: Date | null = null;

    if (assignedEmployeeId && assignedEmployeeId.trim() !== '') {
      const employee = await prisma.employee.findUnique({
        where: { id: assignedEmployeeId },
        select: { id: true, isActive: true },
      });

      if (!employee) {
        return { success: false, error: 'Selected employee does not exist.' };
      }
      if (!employee.isActive) {
        return { success: false, error: 'Cannot assign leads to a deactivated employee.' };
      }

      targetEmployeeId = employee.id;
      assignedAt = new Date();
      if (initialStatus === 'NEW') {
        initialStatus = 'ASSIGNED';
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
    console.error('Error creating lead:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create lead.',
    };
  }
}

/**
 * Updates lead details, status, and assignment.
 */
export async function updateLeadAction(input: unknown): Promise<ActionResponse> {
  try {
    await assertAdminAccess();

    const validated = UpdateLeadSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    const { id, name, phoneNumber, email, company, source, status, notes, assignedEmployeeId } = validated.data;

    const existing = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, assignedEmployeeId: true, status: true },
    });

    if (!existing) {
      return { success: false, error: 'Lead not found.' };
    }

    let targetEmployeeId: string | null = null;
    let assignedAt: Date | undefined = undefined;
    let newStatus: LeadStatus = status;

    if (assignedEmployeeId && assignedEmployeeId.trim() !== '') {
      const employee = await prisma.employee.findUnique({
        where: { id: assignedEmployeeId },
        select: { id: true, isActive: true },
      });

      if (!employee) {
        return { success: false, error: 'Selected employee does not exist.' };
      }
      if (!employee.isActive) {
        return { success: false, error: 'Cannot assign leads to a deactivated employee.' };
      }

      targetEmployeeId = employee.id;
      // If reassigned or newly assigned, update assignedAt
      if (existing.assignedEmployeeId !== targetEmployeeId) {
        assignedAt = new Date();
      }
      if (newStatus === 'NEW') {
        newStatus = 'ASSIGNED';
      }
    } else {
      // Unassigned
      targetEmployeeId = null;
      assignedAt = undefined;
      if (newStatus === 'ASSIGNED') {
        newStatus = 'NEW';
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
    console.error('Error updating lead:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update lead.',
    };
  }
}

/**
 * Deletes or archives a lead record.
 */
export async function deleteLeadAction(id: string): Promise<ActionResponse> {
  try {
    await assertAdminAccess();

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, assignedEmployeeId: true },
    });

    if (!lead) {
      return { success: false, error: 'Lead not found.' };
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
    console.error('Error deleting lead:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete lead.',
    };
  }
}
