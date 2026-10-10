import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export interface UpdateTeamInput {
  id: string;
  name: string;
  description?: string;
  colorTag?: string;
  teamLeadId?: string | null;
}

export interface CandidateBdaItem {
  id: string;
  name: string;
  employeeCode: string;
  email: string;
  phoneNumber: string;
  currentTeamName: string | null;
}

export interface TeamLeadOption {
  id: string;
  name: string;
  employeeCode: string;
  teamName: string | null;
}

/**
 * Domain Service: Squad & Team Management
 * Encapsulates squad lifecycle, team lead appointments, and BDA member assignments.
 */
export class TeamService {
  /**
   * Creates a new squad and optionally assigns an initial Team Lead.
   * Ensures squad name uniqueness (case-insensitive) and promotes the appointed
   * employee to TEAM_LEAD while updating their squad association.
   *
   * @param input - Squad creation payload
   * @param input.name - Unique name of the squad (e.g. 'Alpha Hawks')
   * @param input.description - Optional description or KPI focus
   * @param input.colorTag - Hex color tag for badges in UI (e.g. '#2563EB')
   * @param input.teamLeadId - Optional employee ID to assign as Team Lead
   *
   * @returns {Promise<{ id: string; name: string }>} Created team ID and name
   * @throws {Error} If a squad with the given name already exists
   */
  static async createTeam(input: {
    name: string;
    description?: string;
    colorTag?: string;
    teamLeadId?: string;
  }): Promise<{ id: string; name: string }> {
    const { name, description, colorTag, teamLeadId } = input;

    const duplicate = await prisma.team.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
      },
    });
    if (duplicate) {
      throw new Error('A squad with this name already exists.');
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        colorTag: colorTag || '#2563EB',
        teamLeadId: teamLeadId || null,
      },
    });

    if (teamLeadId) {
      await prisma.employee.update({
        where: { id: teamLeadId },
        data: {
          role: Role.TEAM_LEAD,
          teamId: team.id,
          team: team.name,
        },
      });
    }

    return { id: team.id, name: team.name };
  }

  /**
   * Updates squad metadata and synchronizes team lead assignments.
   * Validates name uniqueness if renamed, updates squad description/color,
   * handles promotion of new team leads, and cascades squad name updates to members.
   *
   * @param input - Squad update payload
   * @param input.id - Target squad ID
   * @param input.name - Updated squad name
   * @param input.description - Optional updated description
   * @param input.colorTag - Optional updated hex color tag
   * @param input.teamLeadId - Optional updated Team Lead employee ID or null
   *
   * @returns {Promise<{ id: string; name: string }>} Updated squad ID and name
   * @throws {Error} If squad is not found
   * @throws {Error} If new squad name conflicts with an existing squad
   * @throws {Error} If specified Team Lead employee is not found
   */
  static async updateTeam(input: UpdateTeamInput): Promise<{ id: string; name: string }> {
    const { id, name, description, colorTag, teamLeadId } = input;

    const existingTeam = await prisma.team.findUnique({
      where: { id },
      select: { id: true, name: true, teamLeadId: true },
    });
    if (!existingTeam) {
      throw new Error('Squad not found.');
    }

    // Name uniqueness check if name changed
    if (name.trim().toLowerCase() !== existingTeam.name.toLowerCase()) {
      const duplicate = await prisma.team.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new Error('A squad with this name already exists.');
      }
    }

    const previousLeadId = existingTeam.teamLeadId;
    const newLeadId = teamLeadId || null;

    // If team lead changed, handle promotion and squad assignment
    if (newLeadId && newLeadId !== previousLeadId) {
      const prospectiveLead = await prisma.employee.findUnique({
        where: { id: newLeadId },
        select: { id: true, role: true },
      });
      if (!prospectiveLead) {
        throw new Error('Selected Team Lead was not found.');
      }

      await prisma.employee.update({
        where: { id: newLeadId },
        data: {
          role: Role.TEAM_LEAD,
          teamId: id,
          team: name.trim(),
        },
      });
    }

    const team = await prisma.team.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        colorTag: colorTag || '#2563EB',
        teamLeadId: newLeadId,
      },
    });

    // Synchronize squad text name across assigned employees
    if (name.trim() !== existingTeam.name) {
      await prisma.employee.updateMany({
        where: { teamId: team.id },
        data: { team: team.name },
      });
    }

    return { id: team.id, name: team.name };
  }

  /**
   * Bulk-assigns one or multiple BDAs to a squad.
   * Updates both the relational `teamId` and legacy string `team` field on each employee.
   *
   * @param teamId - Target squad ID
   * @param employeeIds - Array of employee IDs to be transferred/assigned to this squad
   *
   * @returns {Promise<number>} Number of employees successfully updated
   * @throws {Error} If employeeIds array is empty
   * @throws {Error} If target squad does not exist
   */
  static async addBdasToTeam(teamId: string, employeeIds: string[]): Promise<number> {
    if (!employeeIds.length) {
      throw new Error('No BDAs selected.');
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true },
    });
    if (!team) {
      throw new Error('Squad not found.');
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

    return result.count;
  }

  /**
   * Removes a BDA from their current squad and returns them to the 'General' unassigned pool.
   *
   * @param teamId - Context squad ID
   * @param employeeId - Employee ID of the BDA being removed
   *
   * @returns {Promise<void>}
   */
  static async removeBdaFromTeam(teamId: string, employeeId: string): Promise<void> {
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        teamId: null,
        team: 'General',
      },
    });
  }

  /**
   * Safely dissolves/deletes a squad.
   * Unlinks any associated leads (setting teamId to null), moves all member employees
   * back to the 'General' squad, and finally removes the Team record.
   *
   * @param teamId - Unique ID of the squad being dissolved
   *
   * @returns {Promise<void>}
   */
  static async deleteTeam(teamId: string): Promise<void> {
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
  }

  /**
   * Queries candidates available to be added to a squad (BDAs that are active
   * and not currently members of the specified squad).
   *
   * @param teamId - Squad ID to check candidate availability against
   *
   * @returns {Promise<CandidateBdaItem[]>} List of candidate BDAs with contact and current squad details
   */
  static async fetchAvailableBdas(teamId: string): Promise<CandidateBdaItem[]> {
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

    return bdas.map((b) => ({
      id: b.id,
      name: b.name,
      employeeCode: b.employeeCode,
      email: b.email,
      phoneNumber: b.phoneNumber,
      currentTeamName: b.teamGroup?.name || null,
    }));
  }

  /**
   * Queries active Team Leads across the organization for dropdown assignment.
   *
   * @returns {Promise<TeamLeadOption[]>} List of active Team Leads with ID, name, code, and squad name
   */
  static async fetchActiveTeamLeads(): Promise<TeamLeadOption[]> {
    const tls = await prisma.employee.findMany({
      where: {
        role: Role.TEAM_LEAD,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        team: true,
      },
      orderBy: { name: 'asc' },
    });

    return tls.map((t) => ({
      id: t.id,
      name: t.name,
      employeeCode: t.employeeCode,
      teamName: t.team,
    }));
  }
}
