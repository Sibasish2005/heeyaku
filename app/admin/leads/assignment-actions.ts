'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { revalidatePath } from 'next/cache';

const AssignLeadsSchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1, 'Please select at least one lead'),
  employeeId: z.string().min(1, 'Please select an employee'),
});

const UnassignLeadsSchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1, 'Please select at least one lead'),
});

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Assigns one or multiple leads to an active employee within an atomic database transaction.
 * Follows the status transition policy:
 * - Leads with status 'NEW' are transitioned to 'ASSIGNED'.
 * - Leads with advanced stages ('CONTACTED', 'INTERESTED', etc.) retain their current stage.
 */
export async function assignLeadsAction(input: unknown): Promise<ActionResponse<{
  count: number;
  employeeName: string;
  employeeCode: string;
}>> {
  try {
    await assertAdminAccess();

    const validated = AssignLeadsSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    const { leadIds, employeeId } = validated.data;

    // Verify employee exists and is active
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true, employeeCode: true, isActive: true },
    });

    if (!employee) {
      return { success: false, error: 'The selected employee could not be found.' };
    }

    if (!employee.isActive) {
      return {
        success: false,
        error: `Cannot assign leads to ${employee.name} (${employee.employeeCode}) because their account is deactivated.`,
      };
    }

    const assignedAt = new Date();

    // Execute atomic transaction
    await prisma.$transaction(async (tx) => {
      // 1. Leads currently NEW -> update to ASSIGNED and set assignedEmployeeId
      await tx.lead.updateMany({
        where: {
          id: { in: leadIds },
          status: 'NEW',
        },
        data: {
          assignedEmployeeId: employee.id,
          assignedAt,
          status: 'ASSIGNED',
        },
      });

      // 2. Leads in other stages -> keep their status, only update assignedEmployeeId
      await tx.lead.updateMany({
        where: {
          id: { in: leadIds },
          status: { not: 'NEW' },
        },
        data: {
          assignedEmployeeId: employee.id,
          assignedAt,
        },
      });
    });

    revalidatePath('/admin/leads');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/employees');
    revalidatePath(`/admin/employees/${employee.id}`);

    return {
      success: true,
      data: {
        count: leadIds.length,
        employeeName: employee.name,
        employeeCode: employee.employeeCode,
      },
    };
  } catch (error) {
    console.error('Error assigning leads:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete lead assignment.',
    };
  }
}

/**
 * Unassigns one or multiple leads from their current employees within an atomic transaction.
 * Follows the status transition policy:
 * - Leads with status 'ASSIGNED' transition back to 'NEW' (pool).
 * - Leads with advanced stages retain their stage while clearing employee association.
 */
export async function unassignLeadsAction(input: unknown): Promise<ActionResponse<{ count: number }>> {
  try {
    await assertAdminAccess();

    const validated = UnassignLeadsSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    const { leadIds } = validated.data;

    // Execute atomic transaction
    await prisma.$transaction(async (tx) => {
      // 1. Leads with status 'ASSIGNED' -> transition back to 'NEW'
      await tx.lead.updateMany({
        where: {
          id: { in: leadIds },
          status: 'ASSIGNED',
        },
        data: {
          assignedEmployeeId: null,
          assignedAt: null,
          status: 'NEW',
        },
      });

      // 2. Leads with other stages -> clear assignment without regressing stage
      await tx.lead.updateMany({
        where: {
          id: { in: leadIds },
          status: { not: 'ASSIGNED' },
        },
        data: {
          assignedEmployeeId: null,
          assignedAt: null,
        },
      });
    });

    revalidatePath('/admin/leads');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/employees');

    return {
      success: true,
      data: {
        count: leadIds.length,
      },
    };
  } catch (error) {
    console.error('Error unassigning leads:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unassign leads.',
    };
  }
}
