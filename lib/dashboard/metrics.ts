import { prisma } from '@/lib/prisma';
import { LeadStatus } from '@prisma/client';
import { LeadStatusCount } from '@/components/admin/dashboard/TodayLeadStatusSection';
import { TopEmployeeReport } from '@/components/admin/dashboard/TodayTopPerformerSpotlight';

export const ALL_STATUS_METADATA: Array<{
  status: LeadStatus;
  label: string;
  colorClass: string;
  dotClass: string;
}> = [
  { status: 'NEW', label: 'New Intake', colorClass: 'text-blue-700 bg-blue-50', dotClass: 'bg-blue-500' },
  { status: 'ASSIGNED', label: 'Assigned', colorClass: 'text-indigo-700 bg-indigo-50', dotClass: 'bg-indigo-500' },
  { status: 'CONTACTED', label: 'Contacted', colorClass: 'text-slate-700 bg-slate-100', dotClass: 'bg-slate-500' },
  { status: 'INTERESTED', label: 'Interested', colorClass: 'text-emerald-700 bg-emerald-50', dotClass: 'bg-emerald-500' },
  { status: 'FOLLOW_UP', label: 'Follow-up needed', colorClass: 'text-blue-700 bg-blue-50', dotClass: 'bg-blue-600' },
  { status: 'CALL_BACK', label: 'Call back later', colorClass: 'text-cyan-700 bg-cyan-50', dotClass: 'bg-cyan-500' },
  { status: 'NOT_INTERESTED', label: 'Not Interested', colorClass: 'text-red-700 bg-red-50', dotClass: 'bg-red-500' },
  { status: 'NO_ANSWER', label: 'No Answer', colorClass: 'text-amber-700 bg-amber-50', dotClass: 'bg-amber-500' },
  { status: 'BUSY', label: 'Busy', colorClass: 'text-orange-700 bg-orange-50', dotClass: 'bg-orange-500' },
  { status: 'WRONG_NUMBER', label: 'Wrong Number', colorClass: 'text-slate-600 bg-slate-100', dotClass: 'bg-slate-400' },
  { status: 'CONVERTED', label: 'Converted', colorClass: 'text-emerald-800 bg-emerald-100', dotClass: 'bg-emerald-600' },
  { status: 'NOT_QUALIFIED', label: 'Not qualified', colorClass: 'text-orange-800 bg-orange-50', dotClass: 'bg-orange-600' },
  { status: 'OTHER', label: 'Other', colorClass: 'text-purple-700 bg-purple-50', dotClass: 'bg-purple-500' },
];

export interface DashboardMetricsResult {
  totalLeadsToday: number;
  statusBreakdown: LeadStatusCount[];
  employeeReports: TopEmployeeReport[];
  topPerformer: TopEmployeeReport | null;
  topPerformerToday: TopEmployeeReport | null;
  topPerformerThisMonth: TopEmployeeReport | null;
}

interface CachedMetrics {
  data: DashboardMetricsResult;
  expiresAt: number;
}

let cachedMetrics: CachedMetrics | null = null;
const DASHBOARD_CACHE_TTL_MS = 25 * 1000; // 25 seconds fast cache

/**
 * Manually busts the dashboard cache when a mutation (create/update lead or employee) happens.
 */
export function invalidateDashboardMetricsCache() {
  cachedMetrics = null;
}

/**
 * Fetches dashboard metrics with a 25-second server-side TTL cache to eliminate
 * redundant remote database roundtrips on rapid tab transitions.
 */
export async function getDashboardMetrics(): Promise<DashboardMetricsResult> {
  const now = Date.now();
  if (cachedMetrics && now < cachedMetrics.expiresAt) {
    return cachedMetrics.data;
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  try {
    const [
      todayStatusCounts,
      allEmployees,
      todayAssignedAgg,
      monthAssignedAgg,
      todayConvertedAgg,
      monthConvertedAgg,
      allTimeConvertedAgg,
      todayContactedAgg,
      monthContactedAgg,
    ] = await Promise.all([
      prisma.lead.groupBy({
        by: ['status'],
        where: {
          updatedAt: { gte: startOfToday },
        },
        _count: { _all: true },
      }),
      prisma.employee.findMany({
        where: { isActive: true },
        select: {
          id: true,
          employeeCode: true,
          name: true,
          email: true,
          phoneNumber: true,
          team: true,
          _count: {
            select: { leads: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.lead.groupBy({
        by: ['assignedEmployeeId'],
        where: {
          assignedAt: { gte: startOfToday },
          assignedEmployeeId: { not: null },
        },
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ['assignedEmployeeId'],
        where: {
          assignedAt: { gte: startOfMonth },
          assignedEmployeeId: { not: null },
        },
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ['assignedEmployeeId'],
        where: {
          status: 'CONVERTED',
          updatedAt: { gte: startOfToday },
          assignedEmployeeId: { not: null },
        },
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ['assignedEmployeeId'],
        where: {
          status: 'CONVERTED',
          updatedAt: { gte: startOfMonth },
          assignedEmployeeId: { not: null },
        },
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ['assignedEmployeeId'],
        where: {
          status: 'CONVERTED',
          assignedEmployeeId: { not: null },
        },
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ['assignedEmployeeId'],
        where: {
          status: { in: ['CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CALL_BACK', 'CONVERTED'] },
          updatedAt: { gte: startOfToday },
          assignedEmployeeId: { not: null },
        },
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ['assignedEmployeeId'],
        where: {
          status: { in: ['CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CALL_BACK', 'CONVERTED'] },
          updatedAt: { gte: startOfMonth },
          assignedEmployeeId: { not: null },
        },
        _count: { _all: true },
      }),
    ]);

    const totalLeadsToday = todayStatusCounts.reduce((acc, sc) => acc + sc._count._all, 0);

    const statusCountMap = new Map<LeadStatus, number>();
    todayStatusCounts.forEach((sc) => statusCountMap.set(sc.status, sc._count._all));

    const statusBreakdown: LeadStatusCount[] = ALL_STATUS_METADATA.map((meta) => ({
      status: meta.status,
      label: meta.label,
      count: statusCountMap.get(meta.status) || 0,
      colorClass: meta.colorClass,
      dotClass: meta.dotClass,
    }));

    // Build lookup maps for employee counts in O(1) time
    const mapAgg = (agg: Array<{ assignedEmployeeId: string | null; _count: { _all: number } }>) => {
      const m = new Map<string, number>();
      for (const item of agg) {
        if (item.assignedEmployeeId) m.set(item.assignedEmployeeId, item._count._all);
      }
      return m;
    };

    const todayAssignedMap = mapAgg(todayAssignedAgg);
    const monthAssignedMap = mapAgg(monthAssignedAgg);
    const todayConvertedMap = mapAgg(todayConvertedAgg);
    const monthConvertedMap = mapAgg(monthConvertedAgg);
    const allTimeConvertedMap = mapAgg(allTimeConvertedAgg);
    const todayContactedMap = mapAgg(todayContactedAgg);
    const monthContactedMap = mapAgg(monthContactedAgg);

    const employeeReports: TopEmployeeReport[] = allEmployees.map((emp) => {
      const todayAssigned = todayAssignedMap.get(emp.id) || 0;
      const monthAssigned = monthAssignedMap.get(emp.id) || 0;
      const allTimeTotal = emp._count.leads;

      const todayConverted = todayConvertedMap.get(emp.id) || 0;
      const monthConverted = monthConvertedMap.get(emp.id) || 0;
      const allTimeConverted = allTimeConvertedMap.get(emp.id) || 0;

      const todayContacted = todayContactedMap.get(emp.id) || 0;
      const monthContacted = monthContactedMap.get(emp.id) || 0;

      const rateToday = todayAssigned > 0
        ? ((todayConverted / todayAssigned) * 100).toFixed(1)
        : allTimeTotal > 0
        ? ((allTimeConverted / allTimeTotal) * 100).toFixed(1)
        : '0.0';

      const rateMonth = monthAssigned > 0
        ? ((monthConverted / monthAssigned) * 100).toFixed(1)
        : allTimeTotal > 0
        ? ((allTimeConverted / allTimeTotal) * 100).toFixed(1)
        : '0.0';

      return {
        id: emp.id,
        employeeCode: emp.employeeCode,
        name: emp.name,
        email: emp.email,
        phoneNumber: emp.phoneNumber,
        team: emp.team,
        totalAssignedToday: todayAssigned,
        totalAssignedMonth: monthAssigned,
        totalAssignedAllTime: allTimeTotal,
        convertedToday: todayConverted,
        convertedMonth: monthConverted,
        convertedAllTime: allTimeConverted,
        contactedToday: todayContacted,
        contactedMonth: monthContacted,
        conversionRate: rateToday,
        conversionRateMonth: rateMonth,
      };
    });

  // Determine top performer today
  const sortedToday = [...employeeReports].sort((a, b) => {
    if (b.convertedToday !== a.convertedToday) return b.convertedToday - a.convertedToday;
    if (b.contactedToday !== a.contactedToday) return b.contactedToday - a.contactedToday;
    if (b.totalAssignedToday !== a.totalAssignedToday) return b.totalAssignedToday - a.totalAssignedToday;
    return b.convertedAllTime - a.convertedAllTime;
  });

  // Determine top performer this month
  const sortedMonth = [...employeeReports].sort((a, b) => {
    const bConv = b.convertedMonth ?? 0;
    const aConv = a.convertedMonth ?? 0;
    if (bConv !== aConv) return bConv - aConv;

    const bCont = b.contactedMonth ?? 0;
    const aCont = a.contactedMonth ?? 0;
    if (bCont !== aCont) return bCont - aCont;

    const bAssigned = b.totalAssignedMonth ?? 0;
    const aAssigned = a.totalAssignedMonth ?? 0;
    if (bAssigned !== aAssigned) return bAssigned - aAssigned;

    return b.convertedAllTime - a.convertedAllTime;
  });

  const topPerformerToday = sortedToday.length > 0 ? sortedToday[0] : null;
  const topPerformerThisMonth = sortedMonth.length > 0 ? sortedMonth[0] : null;

  // Primary sort for table: by activity
  employeeReports.sort((a, b) => {
    const bConv = b.convertedMonth ?? 0;
    const aConv = a.convertedMonth ?? 0;
    if (bConv !== aConv) return bConv - aConv;

    if (b.totalAssignedToday !== a.totalAssignedToday) return b.totalAssignedToday - a.totalAssignedToday;
    return b.totalAssignedAllTime - a.totalAssignedAllTime;
  });

    const result: DashboardMetricsResult = {
      totalLeadsToday,
      statusBreakdown,
      employeeReports,
      topPerformer: topPerformerToday,
      topPerformerToday,
      topPerformerThisMonth,
    };

    cachedMetrics = {
      data: result,
      expiresAt: now + DASHBOARD_CACHE_TTL_MS,
    };

    return result;
  } catch (error) {
    console.error('Database connection error in getDashboardMetrics:', error);
    if (cachedMetrics) {
      return cachedMetrics.data;
    }
    return {
      totalLeadsToday: 0,
      statusBreakdown: ALL_STATUS_METADATA.map((meta) => ({
        status: meta.status,
        label: meta.label,
        count: 0,
        colorClass: meta.colorClass,
        dotClass: meta.dotClass,
      })),
      employeeReports: [],
      topPerformer: null,
      topPerformerToday: null,
      topPerformerThisMonth: null,
    };
  }
}
