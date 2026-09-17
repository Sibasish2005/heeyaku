import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEmployeeToken } from '@/lib/auth/employee-token';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required.' },
        { status: 401 }
      );
    }

    const payload = verifyEmployeeToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }

    let employeeId = payload.employeeId;

    // Resilient lookup: if employee was recreated with a new ID after DB reset, resolve by employeeCode/email
    const existingEmp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!existingEmp && (payload.employeeCode || payload.email)) {
      const fallbackEmp = await prisma.employee.findFirst({
        where: {
          OR: [
            ...(payload.employeeCode ? [{ employeeCode: payload.employeeCode }] : []),
            ...(payload.email ? [{ email: payload.email }] : []),
          ],
        },
      });
      if (fallbackEmp) {
        employeeId = fallbackEmp.id;
      }
    }

    // Determine Start of Day (UTC / IST boundary)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Fetch all call logs for this employee
    const callLogs = await prisma.callLog.findMany({
      where: { employeeId },
      orderBy: { startedAt: 'desc' },
      take: 500,
    });

    // Partition into Today vs Lifetime
    const todayLogs = callLogs.filter(
      (c) => new Date(c.startedAt).getTime() >= startOfToday.getTime()
    );

    function computeMetrics(logs: typeof callLogs) {
      const totalAttempts = logs.length;

      // RULE: Only the first connected call for the same lead ID is considered connected. Same lead cannot have 2 connected calls.
      const chronological = [...logs].sort(
        (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
      );

      const seenConnectedLeads = new Set<string>();
      let totalConnected = 0;

      for (const c of chronological) {
        if (c.connected) {
          const leadKey = c.leadId
            ? `lead_${c.leadId}`
            : `phone_${c.phoneNumber.replace(/[^0-9]/g, '').slice(-10)}`;

          if (!seenConnectedLeads.has(leadKey)) {
            seenConnectedLeads.add(leadKey);
            totalConnected++;
          }
        }
      }

      const totalUnconnected = totalAttempts - totalConnected;
      const connectionRatePercent =
        totalAttempts > 0 ? Math.round((totalConnected / totalAttempts) * 100) : 0;

      const totalDurationSeconds = logs.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
      const averageDurationSeconds =
        totalConnected > 0 ? Math.round(totalDurationSeconds / totalConnected) : 0;

      const outcomeDistribution: Record<string, number> = {};
      for (const c of logs) {
        if (c.outcomeId) {
          outcomeDistribution[c.outcomeId] = (outcomeDistribution[c.outcomeId] || 0) + 1;
        }
      }

      return {
        totalAttempts,
        totalConnected,
        totalUnconnected,
        connectionRatePercent,
        totalDurationSeconds,
        averageDurationSeconds,
        outcomeDistribution,
      };
    }

    const todayMetrics = computeMetrics(todayLogs);
    const lifetimeMetrics = computeMetrics(callLogs);

    // Format calls for mobile client: only the first connected call for a lead is marked connected: true
    const seenConnectedInAll = new Set<string>();
    const sortedAllChronological = [...callLogs].sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );
    const firstConnectedCallIds = new Set<string>();
    for (const c of sortedAllChronological) {
      if (c.connected) {
        const leadKey = c.leadId
          ? `lead_${c.leadId}`
          : `phone_${c.phoneNumber.replace(/[^0-9]/g, '').slice(-10)}`;
        if (!seenConnectedInAll.has(leadKey)) {
          seenConnectedInAll.add(leadKey);
          firstConnectedCallIds.add(c.id);
        }
      }
    }

    const formattedCalls = callLogs.map((c) => ({
      id: c.id,
      employeeId: c.employeeId,
      phoneNumber: c.phoneNumber,
      contactName: c.contactName || '',
      callType: c.callType,
      startedAt: new Date(c.startedAt).getTime(),
      endedAt: c.endedAt ? new Date(c.endedAt).getTime() : new Date(c.startedAt).getTime() + c.durationSeconds * 1000,
      durationSeconds: c.durationSeconds,
      connected: firstConnectedCallIds.has(c.id),
      outcomeId: c.outcomeId || undefined,
      outcomeLabel: c.outcomeLabel || undefined,
      notes: c.notes || undefined,
      createdAt: new Date(c.createdAt).getTime(),
      isAppInitiated: true,
      synced: true,
      // Compatibility aliases
      number: c.phoneNumber,
      name: c.contactName || '',
      duration: c.durationSeconds,
      date: new Date(c.startedAt).getTime(),
    }));

    const formattedTodayCalls = formattedCalls.filter(
      (c) => c.startedAt >= startOfToday.getTime()
    );

    return NextResponse.json({
      success: true,
      source: 'backend_db',
      todayMetrics,
      lifetimeMetrics,
      todayCalls: formattedTodayCalls,
      allCalls: formattedCalls,
    });
  } catch (error: any) {
    console.error('Error fetching employee analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch analytics.' },
      { status: 500 }
    );
  }
}
