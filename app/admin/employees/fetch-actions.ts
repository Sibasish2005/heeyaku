'use server';

import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { EmployeeListItem } from '@/components/admin/employees/EmployeeTable';

interface CachedChunk {
  items: EmployeeListItem[];
  totalCount: number;
  timestamp: number;
}

const chunkCache = new Map<string, CachedChunk>();
const CACHE_TTL_MS = 20 * 1000; // 20 seconds server-side memory cache

export async function clearEmployeeChunkCache() {
  chunkCache.clear();
}

export async function fetchEmployeesChunkAction(params: {
  skip: number;
  take?: number;
  searchQuery?: string;
  statusFilter?: 'ALL' | 'ACTIVE' | 'INACTIVE';
  teamFilter?: string;
}): Promise<{
  success: boolean;
  items: EmployeeListItem[];
  totalCount: number;
  hasMore: boolean;
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const { skip = 0, take = 10, searchQuery = '', statusFilter = 'ALL', teamFilter = 'ALL' } = params;

    const cacheKey = `${skip}-${take}-${searchQuery.trim().toLowerCase()}-${statusFilter}-${teamFilter}`;
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
          team: true,
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
    const talkTimes = employeeIds.length > 0
      ? await prisma.callLog.groupBy({
          by: ['employeeId'],
          where: { employeeId: { in: employeeIds }, leadId: { not: null } },
          _sum: { durationSeconds: true },
        })
      : [];

    const talkTimeMap = new Map<string, number>();
    for (const t of talkTimes) {
      if (t.employeeId) {
        talkTimeMap.set(t.employeeId, t._sum.durationSeconds || 0);
      }
    }

    const items: EmployeeListItem[] = employees.map((e) => {
      const empTalkTime = talkTimeMap.get(e.id) || 0;
      return {
        id: e.id,
        employeeCode: e.employeeCode,
        name: e.name,
        email: e.email,
        phoneNumber: e.phoneNumber,
        team: e.team,
        notes: e.notes,
        isActive: e.isActive,
        createdAt: e.createdAt.toISOString(),
        _count: {
          leads: e._count.leads,
          callLogs: e._count.callLogs,
        },
        totalCalls: e._count.callLogs,
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
    console.error('Error in fetchEmployeesChunkAction:', error);
    return {
      success: false,
      items: [],
      totalCount: 0,
      hasMore: false,
      error: error instanceof Error ? error.message : 'Failed to fetch employees.',
    };
  }
}
