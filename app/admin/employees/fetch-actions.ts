'use server';

import { prisma } from '@/lib/prisma';
import { assertAuthenticatedUser } from '@/lib/auth/rbac';
import { Role } from '@prisma/client';
import { EmployeeListItem } from '@/components/admin/employees/EmployeeTable';
import { sanitizeErrorMessage } from '@/lib/security/errors';

interface CachedChunk {
  items: EmployeeListItem[];
  totalCount: number;
  timestamp: number;
}

const chunkCache = new Map<string, CachedChunk>();
const CACHE_TTL_MS = 20 * 1000; // 20 seconds server-side memory cache

/**
 * Invalidates the in-memory 20-second chunk pagination cache for employee tables.
 */
export async function clearEmployeeChunkCache(): Promise<void> {
  chunkCache.clear();
}

/**
 * Server Action: Fetches a paginated slice of employees with multi-field search and filters.
 * Enforces squad isolation: Team Leads only receive BDAs belonging to their assigned squad.
 * Cached in-memory with a 20-second TTL keyed by search/filter parameters.
 *
 * @param params - Query criteria
 * @param params.skip - Offset number of records to skip
 * @param params.take - Page size chunk to fetch (default: 10)
 * @param params.searchQuery - Text search matching name, email, employeeCode, or phone
 * @param params.statusFilter - Filter: 'ALL' | 'ACTIVE' | 'INACTIVE'
 * @param params.teamFilter - Filter by squad name ('ALL' or specific squad)
 * @param params.roleFilter - Filter by role ('ALL' | 'BDA' | 'TEAM_LEAD' | 'HR')
 *
 * @returns {Promise<{ success: boolean; items: EmployeeListItem[]; totalCount: number; hasMore: boolean; error?: string }>} Paginated employee records with total count and hasMore flag
 */
export async function fetchEmployeesChunkAction(params: {
  skip: number;
  take?: number;
  searchQuery?: string;
  statusFilter?: 'ALL' | 'ACTIVE' | 'INACTIVE';
  teamFilter?: string;
  roleFilter?: 'ALL' | 'CEO' | 'BDA' | 'TEAM_LEAD' | 'HR';
}): Promise<{
  success: boolean;
  items: EmployeeListItem[];
  totalCount: number;
  hasMore: boolean;
  error?: string;
}> {
  try {
    const user = await assertAuthenticatedUser();
    const { skip = 0, take = 10, searchQuery = '', statusFilter = 'ALL', teamFilter = 'ALL', roleFilter = 'ALL' } = params;

    const userScopeKey = user.role === Role.TEAM_LEAD ? `tl-${user.ledTeamId || user.teamId || 'none'}` : 'all';
    const cacheKey = `${userScopeKey}-${skip}-${take}-${searchQuery.trim().toLowerCase()}-${statusFilter}-${teamFilter}-${roleFilter}`;
    const cached = chunkCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        success: true,
        items: cached.items,
        totalCount: cached.totalCount,
        hasMore: skip + cached.items.length < cached.totalCount,
      };
    }

    // Build requirement-based Prisma filter
    const where: Record<string, unknown> = {};

    // 🔒 Team Leads only see BDAs in their own squad (fail-closed)
    if (user.role === Role.TEAM_LEAD) {
      const tlTeamId = user.ledTeamId || user.teamId;
      where.teamId = tlTeamId || 'UNASSIGNED_SQUAD';
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { employeeCode: { contains: q, mode: 'insensitive' } },
        { phoneNumber: { contains: q } },
      ];
    }
    if (statusFilter !== 'ALL') {
      where.isActive = statusFilter === 'ACTIVE';
    }
    if (roleFilter !== 'ALL') {
      where.role = roleFilter as Role;
    }
    if (teamFilter !== 'ALL') {
      where.team = teamFilter;
    }

    // Strictly fetch 10 records from database at a time
    const [employees, totalCount] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          employeeCode: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          team: true,
          teamId: true,
          notes: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              leads: true,
              callLogs: { where: { leadId: { not: null } } },
            },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    const employeeIds = employees.map((e) => e.id);
    const [talkTimes, connectedCounts] = employeeIds.length > 0
      ? await Promise.all([
          prisma.callLog.groupBy({
            by: ['employeeId'],
            where: { employeeId: { in: employeeIds }, leadId: { not: null } },
            _sum: { durationSeconds: true },
          }),
          prisma.callLog.groupBy({
            by: ['employeeId'],
            where: { employeeId: { in: employeeIds }, leadId: { not: null }, connected: true },
            _count: { id: true },
          }),
        ])
      : [[], []];

    const talkTimeMap = new Map<string, number>();
    for (const t of talkTimes) {
      if (t.employeeId) {
        talkTimeMap.set(t.employeeId, t._sum.durationSeconds || 0);
      }
    }

    const connectedMap = new Map<string, number>();
    for (const c of connectedCounts) {
      if (c.employeeId) {
        connectedMap.set(c.employeeId, c._count.id || 0);
      }
    }

    const items: EmployeeListItem[] = employees.map((e) => {
      const empTalkTime = talkTimeMap.get(e.id) || 0;
      const empConnected = connectedMap.get(e.id) || 0;
      return {
        id: e.id,
        employeeCode: e.employeeCode,
        name: e.name,
        email: e.email,
        phoneNumber: e.phoneNumber,
        role: e.role,
        teamId: e.teamId,
        team: e.team,
        notes: e.notes,
        isActive: e.isActive,
        createdAt: e.createdAt.toISOString(),
        _count: {
          leads: e._count.leads,
          callLogs: e._count.callLogs,
        },
        totalCalls: e._count.callLogs,
        connectedCalls: empConnected,
        totalTalkTimeSeconds: empTalkTime,
      };
    });


    chunkCache.set(cacheKey, { items, totalCount, timestamp: Date.now() });

    return {
      success: true,
      items,
      totalCount,
      hasMore: skip + items.length < totalCount,
    };
  } catch (error) {
    return {
      success: false,
      items: [],
      totalCount: 0,
      hasMore: false,
      error: sanitizeErrorMessage(error, 'Unable to load employee roster.'),
    };
  }
}
