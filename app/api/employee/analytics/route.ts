import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEmployeeToken } from '@/lib/auth/employee-token';
import { resolveEmployeeIdentity } from '@/lib/employee/resolve';
import { getStartOfTodayISTMs } from '@/lib/utils/date';
import { toLast10Digits } from '@/lib/lead/phone';

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

    // 1. Resilient lookup using centralized resolver
    const resolved = await resolveEmployeeIdentity(payload);
    const employeeIds = resolved?.allIds || [payload.employeeId];

    // 2. Start of Day in Indian Standard Time (IST, UTC+05:30)
    const startOfTodayMs = getStartOfTodayISTMs();

    // 3. Fetch all call logs for this employee with matched lead status (assigned lead calls only)
    const callLogs = await prisma.callLog.findMany({
      where: {
        employeeId: { in: employeeIds },
      },
      include: {
        lead: {
          select: { id: true, status: true, name: true, leadCode: true },
        },
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
        const cleanPhone = toLast10Digits(c.phoneNumber);
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

    // RULE: Once a lead is connected, more than one call will not be counted as more than one call on that lead.
    // That connected lead counts as exactly 1 call (1 attempt, 1 connected).
    function computeMetrics(logs: typeof callLogs) {
      const callsByLead = new Map<string, typeof callLogs>();
      for (const c of logs) {
        const cleanPhone = toLast10Digits(c.phoneNumber);
        const leadKey = c.leadId
          ? `lead_${c.leadId}`
          : cleanPhone
          ? `phone_${cleanPhone}`
          : `call_${c.id}`;

        if (!callsByLead.has(leadKey)) {
          callsByLead.set(leadKey, []);
        }
        callsByLead.get(leadKey)!.push(c);
      }

      let totalAttempts = 0;
      let totalConnected = 0;
      let totalUnconnected = 0;
      let totalDurationSeconds = 0;
      let connectedDurationSeconds = 0;
      const outcomeDistribution: Record<string, number> = {};

      for (const [, leadLogs] of callsByLead.entries()) {
        // Check if ANY call in this lead's logs is in firstConnectedCallIds
        const connectedLog = leadLogs.find((c) => firstConnectedCallIds.has(c.id));

        if (connectedLog) {
          // RULE: A connected lead counts as exactly 1 call (1 attempt, 1 connected)
          totalAttempts += 1;
          totalConnected += 1;

          const realTalkSecs = connectedLog.durationSeconds || 0;
          connectedDurationSeconds += realTalkSecs;
          totalDurationSeconds += realTalkSecs; // Only real connected talk time is counted

          const rawOutcome =
            connectedLog.outcomeId ||
            connectedLog.lead?.status ||
            leadLogs[leadLogs.length - 1].outcomeId ||
            leadLogs[leadLogs.length - 1].lead?.status;
          if (rawOutcome) {
            const key = rawOutcome.trim().toLowerCase().replace(/-/g, '_');
            outcomeDistribution[key] = (outcomeDistribution[key] || 0) + 1;
          }
        } else {
          // For leads that were NEVER connected, count each call attempt with 0 talk time
          for (const c of leadLogs) {
            totalAttempts += 1;
            totalUnconnected += 1;
            // Unconnected calls (ringing/missed/busy) have 0 real call duration

            const rawOutcome = c.outcomeId || c.lead?.status;
            if (rawOutcome) {
              const key = rawOutcome.trim().toLowerCase().replace(/-/g, '_');
              outcomeDistribution[key] = (outcomeDistribution[key] || 0) + 1;
            }
          }
        }
      }

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

    // 6. Format calls for mobile client with authoritative connected status and real call duration
    const formattedCalls = callLogs.map((c) => {
      const isConnected = firstConnectedCallIds.has(c.id);
      const realDuration = isConnected ? (c.durationSeconds || 0) : 0;
      const startedAtMs = new Date(c.startedAt).getTime();
      const endedAtMs = c.endedAt
        ? new Date(c.endedAt).getTime()
        : startedAtMs + realDuration * 1000;

      const resolvedOutcomeId = (c.outcomeId || c.lead?.status || '').toLowerCase().replace(/-/g, '_');
      const resolvedOutcomeLabel = c.outcomeLabel || c.lead?.status || undefined;

      return {
        id: c.id,
        employeeId: c.employeeId,
        leadId: c.leadId || undefined,
        phoneNumber: c.phoneNumber || '',
        contactName: c.contactName || c.lead?.name || '',
        callType: c.callType,
        startedAt: startedAtMs,
        endedAt: endedAtMs,
        durationSeconds: realDuration,
        realDurationSeconds: realDuration,
        connected: isConnected,
        outcomeId: resolvedOutcomeId || undefined,
        outcomeLabel: resolvedOutcomeLabel,
        notes: c.notes || undefined,
        createdAt: new Date(c.createdAt).getTime(),
        isAppInitiated: true,
        synced: true,
        // Compatibility aliases for legacy mobile components
        number: c.phoneNumber || '',
        name: c.contactName || c.lead?.name || '',
        duration: realDuration,
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
