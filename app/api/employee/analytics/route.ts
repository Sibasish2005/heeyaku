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
    if (!payload || !payload.employeeId) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }

    // 1. Resilient lookup: Find employee by id, fallback to employeeCode or email
    let employee = await prisma.employee.findUnique({
      where: { id: payload.employeeId },
    });

    if (!employee && (payload.employeeCode || payload.email)) {
      employee = await prisma.employee.findFirst({
        where: {
          OR: [
            ...(payload.employeeCode ? [{ employeeCode: payload.employeeCode }] : []),
            ...(payload.email ? [{ email: payload.email }] : []),
          ],
        },
      });
    }

    // Collect all matching employee IDs to safeguard history across DB resets/reseeds
    const matchingEmployees = await prisma.employee.findMany({
      where: {
        OR: [
          { id: payload.employeeId },
          ...(employee ? [{ id: employee.id }] : []),
          ...(payload.employeeCode ? [{ employeeCode: payload.employeeCode }] : []),
          ...(payload.email ? [{ email: payload.email }] : []),
          ...(employee?.employeeCode ? [{ employeeCode: employee.employeeCode }] : []),
        ],
      },
      select: { id: true },
    });

    const employeeIds = Array.from(
      new Set([
        payload.employeeId,
        ...(employee ? [employee.id] : []),
        ...matchingEmployees.map((e) => e.id),
      ])
    ).filter(Boolean);

    // 2. Determine Start of Day in Indian Standard Time (IST, UTC+05:30)
    // Avoids server-side UTC skew where 5:00 AM IST is treated as previous day UTC
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const istDate = new Date(nowMs + IST_OFFSET_MS);
    const startOfTodayMs =
      Date.UTC(
        istDate.getUTCFullYear(),
        istDate.getUTCMonth(),
        istDate.getUTCDate(),
        0,
        0,
        0,
        0
      ) - IST_OFFSET_MS;

    // 3. Fetch all call logs for this employee
    const callLogs = await prisma.callLog.findMany({
      where: {
        employeeId: { in: employeeIds },
      },
      orderBy: { startedAt: 'desc' },
      take: 1000,
    });

    // 4. RULE: Only the first connected call for the same lead ID across all time is considered connected.
    // A lead cannot have 2 connected calls.
    const sortedAllChronological = [...callLogs].sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );

    const seenConnectedLeads = new Set<string>();
    const firstConnectedCallIds = new Set<string>();

    for (const c of sortedAllChronological) {
      const isCallConnected = Boolean(c.connected);
      if (isCallConnected) {
        const cleanPhone = (c.phoneNumber || '').replace(/[^0-9]/g, '').slice(-10);
        const leadKey = c.leadId
          ? `lead_${c.leadId}`
          : cleanPhone
          ? `phone_${cleanPhone}`
          : `call_${c.id}`;

        if (!seenConnectedLeads.has(leadKey)) {
          seenConnectedLeads.add(leadKey);
          firstConnectedCallIds.add(c.id);
        }
      }
    }

    // 5. Partition into Today vs All Logs
    const todayLogs = callLogs.filter(
      (c) => new Date(c.startedAt).getTime() >= startOfTodayMs
    );

    function computeMetrics(logs: typeof callLogs) {
      const totalAttempts = logs.length;
      let totalConnected = 0;
      let totalDurationSeconds = 0;
      let connectedDurationSeconds = 0;
      const outcomeDistribution: Record<string, number> = {};

      for (const c of logs) {
        const dur = c.durationSeconds || 0;
        totalDurationSeconds += dur;

        // Strictly check against firstConnectedCallIds to prevent repeat calls to same lead
        // from being falsely counted as connected today
        if (firstConnectedCallIds.has(c.id)) {
          totalConnected++;
          connectedDurationSeconds += dur;
        }

        if (c.outcomeId) {
          const key = c.outcomeId.trim().toLowerCase();
          outcomeDistribution[key] = (outcomeDistribution[key] || 0) + 1;
        }
      }

      const totalUnconnected = Math.max(0, totalAttempts - totalConnected);
      const connectionRatePercent =
        totalAttempts > 0 ? Math.round((totalConnected / totalAttempts) * 100) : 0;

      const averageDurationSeconds =
        totalConnected > 0 ? Math.round(connectedDurationSeconds / totalConnected) : 0;

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

    // 6. Format calls for mobile client with authoritative connected status
    const formattedCalls = callLogs.map((c) => {
      const isConnected = firstConnectedCallIds.has(c.id);
      const startedAtMs = new Date(c.startedAt).getTime();
      const endedAtMs = c.endedAt
        ? new Date(c.endedAt).getTime()
        : startedAtMs + (c.durationSeconds || 0) * 1000;

      return {
        id: c.id,
        employeeId: c.employeeId,
        leadId: c.leadId || undefined,
        phoneNumber: c.phoneNumber || '',
        contactName: c.contactName || '',
        callType: c.callType,
        startedAt: startedAtMs,
        endedAt: endedAtMs,
        durationSeconds: c.durationSeconds || 0,
        connected: isConnected,
        outcomeId: c.outcomeId ? c.outcomeId.toLowerCase() : undefined,
        outcomeLabel: c.outcomeLabel || undefined,
        notes: c.notes || undefined,
        createdAt: new Date(c.createdAt).getTime(),
        isAppInitiated: true,
        synced: true,
        // Compatibility aliases for legacy mobile components
        number: c.phoneNumber || '',
        name: c.contactName || '',
        duration: c.durationSeconds || 0,
        date: startedAtMs,
      };
    });

    const formattedTodayCalls = formattedCalls.filter(
      (c) => c.startedAt >= startOfTodayMs
    );

    return NextResponse.json({
      success: true,
      source: 'backend_db',
      todayMetrics,
      lifetimeMetrics,
      todayCalls: formattedTodayCalls,
      allCalls: formattedCalls,
    });
  } catch (error: unknown) {
    console.error('Error fetching employee analytics:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch analytics.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
