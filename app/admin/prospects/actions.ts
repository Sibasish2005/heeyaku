'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { Role, LeadStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { invalidateDashboardMetricsCache } from '@/lib/dashboard/metrics';
import { sanitizeErrorMessage } from '@/lib/security/errors';

const UpdateProspectStatusSchema = z.object({
  leadId: z.string().min(1, 'Prospect ID is required'),
  status: z.nativeEnum(LeadStatus),
  notes: z.string().optional(),
});

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Server Action: Updates the disposition status and closing remarks for a Prospect.
 * Restricted to CEOs (global) and Team Leads (scoped to their assigned prospects / squad).
 */
export async function updateProspectStatusAction(
  input: unknown
): Promise<ActionResponse<{ id: string; status: LeadStatus; updatedNotes: string | null }>> {
  try {
    const admin = await assertAdminAccess();

    if (admin.role !== Role.CEO && admin.role !== Role.TEAM_LEAD) {
      return { success: false, error: 'Unauthorized: Only CEO and Team Leads can update prospects.' };
    }

    const validated = UpdateProspectStatusSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    const { leadId, status, notes } = validated.data;

    // Fetch existing prospect
    const prospect = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        isProspect: true,
        assignedEmployeeId: true,
        teamId: true,
        notes: true,
        leadCode: true,
        name: true,
      },
    });

    if (!prospect) {
      return { success: false, error: 'Prospect not found.' };
    }

    // Authorization Boundary Check
    if (admin.role === Role.TEAM_LEAD) {
      const tlTeamId = admin.ledTeamId || admin.teamId;
      const isAssignedToThisTl = prospect.assignedEmployeeId === admin.employeeId;
      const belongsToTlSquad = tlTeamId && prospect.teamId === tlTeamId;

      if (!isAssignedToThisTl && !belongsToTlSquad) {
        return {
          success: false,
          error: 'Unauthorized: You can only update prospects assigned to you or your squad.',
        };
      }
    }

    // Format new timestamped remarks from Team Lead / CEO
    let updatedNotes = prospect.notes || '';
    if (notes && notes.trim()) {
      const timestamp = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      });
      const noteEntry = `[${timestamp} - ${admin.name} (${admin.role === Role.TEAM_LEAD ? 'TL' : 'CEO'})]: ${notes.trim()}`;
      updatedNotes = updatedNotes ? `${updatedNotes}\n${noteEntry}` : noteEntry;
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status,
        notes: updatedNotes,
        isProspect: true, // Guarantees prospect flag remains set
        updatedAt: new Date(),
      },
    });

    invalidateDashboardMetricsCache();
    revalidatePath('/admin/prospects');
    revalidatePath('/admin/leads');
    revalidatePath('/admin/dashboard');

    return {
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        updatedNotes: updated.notes,
      },
    };
  } catch (error) {
    console.error('Error updating prospect status:', error);
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Failed to update prospect status.'),
    };
  }
}
