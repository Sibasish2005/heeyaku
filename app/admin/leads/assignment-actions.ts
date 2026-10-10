'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assertAuthenticatedUser, canAssignLeads } from '@/lib/auth/rbac';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { sanitizeErrorMessage } from '@/lib/security/errors';

const AssignLeadsSchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1, 'Please select at least one lead'),
  employeeId: z.string().min(1, 'Please select an employee'),
});

const AssignLeadsToTeamSchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1, 'Please select at least one lead'),
  teamId: z.string().min(1, 'Please select a squad / team'),
});

const UnassignLeadsSchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1, 'Please select at least one lead'),
});

const AutoAssignLeadsSchema = z.object({
  employeeIds: z.array(z.string().min(1)).min(1, 'Please select at least one employee'),
  assignAll: z.boolean().default(false),
  leadsPerEmployee: z.number().int().min(1).optional(),
  distributionMethod: z.enum(['EVENLY', 'SEQUENTIAL']),
});

const AutoAssignLeadsToTeamsSchema = z.object({
  teamIds: z.array(z.string().min(1)).min(1, 'Please select at least one squad / team'),
  assignAll: z.boolean().default(false),
  leadsPerTeam: z.number().int().min(1).optional(),
  distributionMethod: z.enum(['EVENLY', 'SEQUENTIAL']),
});

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Server Action: Assigns one or multiple leads to an active staff employee within an atomic database transaction.
 * Follows the status transition policy:
 * - Leads with status 'NEW' transition to 'ASSIGNED'.
 * - Leads in advanced pipeline stages ('CONTACTED', 'INTERESTED', etc.) preserve their stage while setting the employee association.
 * Enforces squad boundary checks: Team Leads may only assign leads belonging to their squad to BDAs of their squad.
 *
 * @param input - Unknown client form input parsed against AssignLeadsSchema (`{ leadIds: string[], employeeId: string }`)
 * @returns {Promise<ActionResponse<{ count: number; employeeName: string; employeeCode: string }>>} ActionResponse with assignment stats
 */
export async function assignLeadsAction(input: unknown): Promise<ActionResponse<{
  count: number;
  employeeName: string;
  employeeCode: string;
}>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canAssignLeads(user.role)) {
      return { success: false, error: 'Unauthorized: HR cannot assign sales leads. This requires CEO or Team Lead access.' };
    }

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
      select: { id: true, name: true, employeeCode: true, isActive: true, teamId: true, role: true },
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

    // Role check: Leads can strictly be assigned to BDA or TEAM_LEAD. Non-telephony roles like HR and CEO cannot receive leads.
    if (employee.role === Role.HR || employee.role === Role.CEO) {
      return {
        success: false,
        error: 'Leads can only be assigned to Business Development Associates (BDA) or Team Leads.',
      };
    }

    // Role check: CEO assigns leads to a Squad/Team, not directly to individual BDAs
    if (user.role === Role.CEO) {
      return {
        success: false,
        error: 'As CEO, leads must be assigned to a Squad / Team. The Team Lead will distribute squad leads to individual BDAs.',
      };
    }

    // Squad isolation and reassignment rules for Team Leads
    if (user.role === Role.TEAM_LEAD) {
      const tlTeamId = user.ledTeamId || user.teamId;
      if (!tlTeamId || employee.teamId !== tlTeamId || employee.role !== Role.BDA) {
        return { success: false, error: 'Unauthorized: You can only assign leads to BDA members of your own squad.' };
      }

      // Check leads belong to TL squad OR are assigned directly to this Team Lead
      const eligibleLeadsCount = await prisma.lead.count({
        where: {
          id: { in: leadIds },
          OR: [
            { teamId: tlTeamId },
            ...(user.employeeId ? [{ assignedEmployeeId: user.employeeId }] : []),
          ],
        },
      });

      if (eligibleLeadsCount !== leadIds.length) {
        return { success: false, error: 'Unauthorized: One or more selected leads do not belong to your squad or are not assigned to you.' };
      }
    }

    const assignedAt = new Date();
    const targetTeamId = employee.teamId || (user.role === Role.TEAM_LEAD ? (user.ledTeamId || user.teamId) : undefined);

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
          ...(targetTeamId ? { teamId: targetTeamId } : {}),
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
          ...(targetTeamId ? { teamId: targetTeamId } : {}),
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
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to assign leads.'),
    };
  }
}

/**
 * Server Action: Assigns one or multiple leads to a Squad / Team within an atomic database transaction.
 * Executed by CEO to route leads into a Squad pool without assigning to an individual BDA.
 * Sets `lead.teamId = team.id`, sets `assignedEmployeeId = null`, and resets status from 'ASSIGNED' to 'NEW'.
 *
 * @param input - Form input parsed against AssignLeadsToTeamSchema (`{ leadIds: string[], teamId: string }`)
 * @returns {Promise<ActionResponse<{ count: number; teamName: string; teamLeadName?: string }>>} Result
 */
export async function assignLeadsToTeamAction(input: unknown): Promise<ActionResponse<{
  count: number;
  teamName: string;
  teamLeadName?: string;
}>> {
  try {
    const user = await assertAuthenticatedUser();
    if (user.role !== Role.CEO) {
      return { success: false, error: 'Unauthorized: Only the CEO can assign leads to a Squad / Team.' };
    }

    const validated = AssignLeadsToTeamSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    const { leadIds, teamId } = validated.data;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        teamLead: {
          select: { id: true, name: true, employeeCode: true },
        },
      },
    });

    if (!team) {
      return { success: false, error: 'The selected Squad / Team could not be found.' };
    }

    // Atomically assign leads to the squad pool and clear individual BDA assignment
    await prisma.$transaction(async (tx) => {
      // 1. Leads currently ASSIGNED -> transition back to NEW (unassigned within squad)
      await tx.lead.updateMany({
        where: {
          id: { in: leadIds },
          status: 'ASSIGNED',
        },
        data: {
          teamId: team.id,
          assignedEmployeeId: null,
          assignedAt: null,
          status: 'NEW',
        },
      });

      // 2. Leads with other stages -> update squad and clear individual associate
      await tx.lead.updateMany({
        where: {
          id: { in: leadIds },
          status: { not: 'ASSIGNED' },
        },
        data: {
          teamId: team.id,
          assignedEmployeeId: null,
          assignedAt: null,
        },
      });
    });

    revalidatePath('/admin/leads');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/teams');

    return {
      success: true,
      data: {
        count: leadIds.length,
        teamName: team.name,
        teamLeadName: team.teamLead ? `${team.teamLead.name} (${team.teamLead.employeeCode})` : undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to assign leads to squad.'),
    };
  }
}

/**
 * Server Action: Unassigns one or multiple leads from their current staff association within an atomic transaction.
 * Follows the status transition policy:
 * - Leads with status 'ASSIGNED' transition back to 'NEW' (unassigned pool).
 * - Leads in advanced pipeline stages retain their stage while clearing employee association.
 * Enforces squad boundaries for Team Leads.
 *
 * @param input - Unknown client form input parsed against UnassignLeadsSchema (`{ leadIds: string[] }`)
 * @returns {Promise<ActionResponse<{ count: number }>>} Count of unassigned leads
 */
export async function unassignLeadsAction(input: unknown): Promise<ActionResponse<{ count: number }>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canAssignLeads(user.role)) {
      return { success: false, error: 'Unauthorized: HR cannot unassign sales leads.' };
    }

    const validated = UnassignLeadsSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    const { leadIds } = validated.data;

    // If Team Lead, check all leadIds belong to this TL squad or are assigned to the TL
    if (user.role === Role.TEAM_LEAD) {
      const tlTeamId = user.ledTeamId || user.teamId;
      const eligibleCount = await prisma.lead.count({
        where: {
          id: { in: leadIds },
          OR: [
            ...(tlTeamId ? [{ teamId: tlTeamId }] : []),
            ...(user.employeeId ? [{ assignedEmployeeId: user.employeeId }] : []),
          ],
        },
      });
      if (eligibleCount !== leadIds.length) {
        return { success: false, error: 'Unauthorized: Cannot unassign leads outside your squad.' };
      }
    }

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
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to unassign leads.'),
    };
  }
}

/**
 * Server Action: Automatically distributes unassigned leads to a designated list of employees.
 * Supports round-robin ('EVENLY') distribution or chunked ('SEQUENTIAL') assignment.
 * Executed inside an atomic `$transaction` to ensure zero lead duplicates or lost assignments.
 *
 * @param input - Unknown client form input parsed against AutoAssignLeadsSchema
 * @returns {Promise<ActionResponse<{ assignedCount: number; distribution: Record<string, number> }>>} Count and breakdown per employee
 */
export async function autoAssignLeadsAction(input: unknown): Promise<ActionResponse<{ assignedCount: number; distribution: Record<string, number> }>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canAssignLeads(user.role)) {
      return { success: false, error: 'Unauthorized: HR cannot auto-assign sales leads.' };
    }

    const validated = AutoAssignLeadsSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    const { employeeIds, assignAll, leadsPerEmployee, distributionMethod } = validated.data;

    if (!assignAll && !leadsPerEmployee) {
      return { success: false, error: 'Please specify the number of leads per employee or choose to assign all.' };
    }

    const isTeamLead = user.role === Role.TEAM_LEAD;
    const tlTeamId = isTeamLead ? (user.ledTeamId || user.teamId) : null;

    // Verify all employees exist and are active (and belong to squad if TL)
    const employees = await prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        isActive: true,
        role: isTeamLead ? Role.BDA : { in: [Role.BDA, Role.TEAM_LEAD] },
        ...(tlTeamId ? { teamId: tlTeamId } : {}),
      },
      select: { id: true, name: true, employeeCode: true, teamId: true },
    });

    if (employees.length !== employeeIds.length) {
      return {
        success: false,
        error: isTeamLead
          ? 'One or more selected employees are not active BDAs in your squad.'
          : 'Leads can only be assigned to active BDAs or Team Leads.',
      };
    }

    // Fetch unassigned leads (scoped to squad if TL)
    const totalRequestedLeads = assignAll ? undefined : employeeIds.length * (leadsPerEmployee || 0);
    const unassignedLeads = await prisma.lead.findMany({
      where: {
        assignedEmployeeId: null,
        ...(tlTeamId ? { teamId: tlTeamId } : {}),
      },
      orderBy: { createdAt: 'asc' }, // Prioritize oldest unassigned leads
      take: totalRequestedLeads,
      select: { id: true },
    });

    if (unassignedLeads.length === 0) {
      return { success: false, error: 'There are no unassigned leads available in the pool.' };
    }

    const leadIds = unassignedLeads.map(l => l.id);
    const assignmentMap = new Map<string, string[]>(); // Employee ID -> Lead IDs
    employees.forEach(emp => assignmentMap.set(emp.id, []));

    if (assignAll || distributionMethod === 'EVENLY') {
      // Round-robin assignment (Evenly distributes)
      let currentEmployeeIdx = 0;
      for (const leadId of leadIds) {
        const empId = employeeIds[currentEmployeeIdx];
        assignmentMap.get(empId)!.push(leadId);
        currentEmployeeIdx = (currentEmployeeIdx + 1) % employeeIds.length;
      }
    } else {
      // Sequential assignment
      const targetPerEmp = leadsPerEmployee || 0;
      let currentLeadIdx = 0;
      for (const empId of employeeIds) {
        for (let i = 0; i < targetPerEmp; i++) {
          if (currentLeadIdx < leadIds.length) {
            assignmentMap.get(empId)!.push(leadIds[currentLeadIdx]);
            currentLeadIdx++;
          } else {
            break; // Ran out of leads
          }
        }
      }
    }

    const assignedAt = new Date();
    const distributionResult: Record<string, number> = {};
    let totalAssigned = 0;

    // Execute atomic transaction
    await prisma.$transaction(async (tx) => {
      for (const [empId, assignedLeadIds] of assignmentMap.entries()) {
        if (assignedLeadIds.length === 0) continue;
        const emp = employees.find(e => e.id === empId);
        
        await tx.lead.updateMany({
          where: { id: { in: assignedLeadIds } },
          data: {
            assignedEmployeeId: empId,
            assignedAt,
            status: 'ASSIGNED',
            ...(emp?.teamId ? { teamId: emp.teamId } : {}),
          },
        });
        
        if (emp) distributionResult[emp.name] = assignedLeadIds.length;
        totalAssigned += assignedLeadIds.length;
      }
    });

    revalidatePath('/admin/leads');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/employees');

    return {
      success: true,
      data: {
        assignedCount: totalAssigned,
        distribution: distributionResult,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to distribute leads.'),
    };
  }
}

/**
 * Server Action: Automatically distributes unassigned leads across squads for the CEO.
 * Supports round-robin ('EVENLY') distribution or chunked ('SEQUENTIAL') assignment.
 *
 * @param input - Input parsed against AutoAssignLeadsToTeamsSchema
 * @returns {Promise<ActionResponse<{ assignedCount: number; distribution: Record<string, number> }>>}
 */
export async function autoAssignLeadsToTeamsAction(input: unknown): Promise<ActionResponse<{ assignedCount: number; distribution: Record<string, number> }>> {
  try {
    const user = await assertAuthenticatedUser();
    if (user.role !== Role.CEO) {
      return { success: false, error: 'Unauthorized: Only the CEO can distribute leads across squads.' };
    }

    const validated = AutoAssignLeadsToTeamsSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(', '),
      };
    }

    const { teamIds, assignAll, leadsPerTeam, distributionMethod } = validated.data;

    if (!assignAll && !leadsPerTeam) {
      return { success: false, error: 'Please specify the number of leads per squad or choose to assign all.' };
    }

    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: { id: true, name: true },
    });

    if (teams.length !== teamIds.length) {
      return { success: false, error: 'One or more selected squads could not be found.' };
    }

    // Fetch unassigned leads (not belonging to any team, or teamId is null)
    const totalRequestedLeads = assignAll ? undefined : teamIds.length * (leadsPerTeam || 0);
    const unassignedLeads = await prisma.lead.findMany({
      where: { teamId: null, assignedEmployeeId: null },
      orderBy: { createdAt: 'asc' },
      take: totalRequestedLeads,
      select: { id: true },
    });

    if (unassignedLeads.length === 0) {
      return { success: false, error: 'There are no unassigned leads available in the general pool.' };
    }

    const leadIds = unassignedLeads.map((l) => l.id);
    const assignmentMap = new Map<string, string[]>();
    teams.forEach((t) => assignmentMap.set(t.id, []));

    if (assignAll || distributionMethod === 'EVENLY') {
      let currentIdx = 0;
      for (const leadId of leadIds) {
        const teamId = teamIds[currentIdx];
        assignmentMap.get(teamId)!.push(leadId);
        currentIdx = (currentIdx + 1) % teamIds.length;
      }
    } else {
      const targetPerTeam = leadsPerTeam || 0;
      let currentLeadIdx = 0;
      for (const teamId of teamIds) {
        for (let i = 0; i < targetPerTeam; i++) {
          if (currentLeadIdx < leadIds.length) {
            assignmentMap.get(teamId)!.push(leadIds[currentLeadIdx]);
            currentLeadIdx++;
          } else {
            break;
          }
        }
      }
    }

    const distributionResult: Record<string, number> = {};
    let totalAssigned = 0;

    await prisma.$transaction(async (tx) => {
      for (const [teamId, assignedLeadIds] of assignmentMap.entries()) {
        if (assignedLeadIds.length === 0) continue;
        const team = teams.find((t) => t.id === teamId);

        await tx.lead.updateMany({
          where: { id: { in: assignedLeadIds } },
          data: {
            teamId,
            assignedEmployeeId: null,
            assignedAt: null,
            status: 'NEW',
          },
        });

        if (team) distributionResult[team.name] = assignedLeadIds.length;
        totalAssigned += assignedLeadIds.length;
      }
    });

    revalidatePath('/admin/leads');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/teams');

    return {
      success: true,
      data: {
        assignedCount: totalAssigned,
        distribution: distributionResult,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to distribute leads across squads.'),
    };
  }
}
