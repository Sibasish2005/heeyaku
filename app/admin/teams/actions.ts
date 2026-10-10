'use server';

import { revalidatePath } from 'next/cache';
import { assertAuthenticatedUser, canManageTeams } from '@/lib/auth/rbac';
import { TeamService, UpdateTeamInput, CandidateBdaItem, TeamLeadOption } from '@/lib/team/team.service';
import { sanitizeErrorMessage } from '@/lib/security/errors';

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Server Action: Creates a new squad and registers it in PostgreSQL.
 * Enforces role restriction (CEO or HR only).
 *
 * @param input - Team creation parameters
 * @param input.name - Display name of the squad
 * @param input.description - Optional squad summary or goals
 * @param input.colorTag - Optional UI badge color hex string
 * @param input.teamLeadId - Optional employee ID to assign as Team Lead
 *
 * @returns {Promise<ActionResponse<{ id: string; name: string }>>} ActionResponse wrapping the team ID and name
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

    const team = await TeamService.createTeam(input);

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
 * Server Action: Updates squad metadata and synchronizes team lead appointments.
 * Accessible ONLY by CEO and HR administrators.
 *
 * @param input - Squad update input object containing squad id, new name, description, colorTag, and teamLeadId
 * @returns {Promise<ActionResponse<{ id: string; name: string }>>} ActionResponse with updated squad data
 */
export async function updateTeamAction(input: UpdateTeamInput): Promise<ActionResponse<{ id: string; name: string }>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageTeams(user.role)) {
      return { success: false, error: 'Unauthorized: Only CEO and HR can manage squads.' };
    }

    const team = await TeamService.updateTeam(input);

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
 * Server Action: Bulk assigns one or more BDAs to a squad.
 * Accessible ONLY by CEO and HR administrators.
 *
 * @param teamId - Target squad ID
 * @param employeeIds - List of employee IDs to move into the squad
 * @returns {Promise<ActionResponse<{ count: number }>>} Number of staff updated
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

    const count = await TeamService.addBdasToTeam(teamId, employeeIds);

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
 * Server Action: Removes a BDA from a squad and returns them to the 'General' pool.
 * Accessible ONLY by CEO and HR administrators.
 *
 * @param teamId - Current squad ID
 * @param employeeId - Employee ID of the BDA being removed
 * @returns {Promise<ActionResponse<boolean>>} Success boolean
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

    await TeamService.removeBdaFromTeam(teamId, employeeId);

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
 * Server Action: Safely dissolves a squad, unlinking assigned leads and returning staff to 'General'.
 * Accessible ONLY by CEO and HR administrators.
 *
 * @param teamId - ID of squad to delete
 * @returns {Promise<ActionResponse<boolean>>} Success boolean
 */
export async function deleteTeamAction(teamId: string): Promise<ActionResponse<boolean>> {
  try {
    const user = await assertAuthenticatedUser();
    if (!canManageTeams(user.role)) {
      return { success: false, error: 'Unauthorized: Only CEO and HR can dissolve squads.' };
    }

    await TeamService.deleteTeam(teamId);

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
 * Server Action: Fetches candidate BDAs not yet in the specified squad for member picker dialogs.
 *
 * @param teamId - Context squad ID
 * @returns {Promise<ActionResponse<CandidateBdaItem[]>>} Candidate list
 */
export async function fetchAvailableBdasForTeamAction(teamId: string): Promise<ActionResponse<CandidateBdaItem[]>> {
  try {
    await assertAuthenticatedUser();
    const data = await TeamService.fetchAvailableBdas(teamId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to fetch available BDAs.'),
    };
  }
}

/**
 * Server Action: Fetches active Team Leads across the organization for leader dropdown selectors.
 *
 * @returns {Promise<ActionResponse<TeamLeadOption[]>>} List of active Team Leads
 */
export async function fetchActiveTeamLeadsAction(): Promise<ActionResponse<TeamLeadOption[]>> {
  try {
    await assertAuthenticatedUser();
    const data = await TeamService.fetchActiveTeamLeads();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error, 'Unable to fetch active team leads.'),
    };
  }
}
