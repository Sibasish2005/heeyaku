import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEmployeeToken } from '@/lib/auth/employee-token';
import { resolveEmployeeIdentity } from '@/lib/employee/resolve';
import { toLast10Digits } from '@/lib/lead/phone';
import { CallType, LeadStatus } from '@prisma/client';
import { invalidateDashboardMetricsCache } from '@/lib/dashboard/metrics';

const OUTCOME_TO_LEAD_STATUS: Record<string, LeadStatus> = {
  contacted: 'CONTACTED',
  interested: 'INTERESTED',
  follow_up: 'FOLLOW_UP',
  call_back: 'CALL_BACK',
  not_interested: 'NOT_INTERESTED',
  no_answer: 'NO_ANSWER',
  busy: 'BUSY',
  wrong_number: 'WRONG_NUMBER',
  converted: 'CONVERTED',
  not_qualified: 'NOT_QUALIFIED',
  other: 'OTHER',
  CONTACTED: 'CONTACTED',
  INTERESTED: 'INTERESTED',
  FOLLOW_UP: 'FOLLOW_UP',
  CALL_BACK: 'CALL_BACK',
  NOT_INTERESTED: 'NOT_INTERESTED',
  NO_ANSWER: 'NO_ANSWER',
  BUSY: 'BUSY',
  WRONG_NUMBER: 'WRONG_NUMBER',
  CONVERTED: 'CONVERTED',
  NOT_QUALIFIED: 'NOT_QUALIFIED',
  OTHER: 'OTHER',
};

export async function POST(req: NextRequest) {
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

    const resolved = await resolveEmployeeIdentity(payload);
    if (!resolved) {
      return NextResponse.json(
        { success: false, error: 'Employee account not found.' },
        { status: 401 }
      );
    }
    const employeeId = resolved.primaryId;
    const body = await req.json();

    const rawCalls = Array.isArray(body.calls)
      ? body.calls
      : body.phoneNumber || body.durationSeconds !== undefined
      ? [body]
      : [];

    if (rawCalls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No call records provided.' },
        { status: 400 }
      );
    }

    // 1. Collect all numbers and last 10 digits
    interface ParsedCall {
      raw: any;
      rawNumber: string;
      last10: string;
      duration: number;
      rawIsConnected: boolean;
      outcomeId: string | null;
      outcomeLabel: string | null;
      notes: string | null;
      startedAt: Date;
      endedAt: Date | null;
      callType: CallType;
      idCandidate: string | null;
    }

    const parsedCalls: ParsedCall[] = [];
    const candidateIds: string[] = [];
    const allLast10Set = new Set<string>();

    for (const c of rawCalls) {
      const rawNumber = String(c.phoneNumber || c.number || '').trim();
      if (!rawNumber) continue;

      const last10 = toLast10Digits(rawNumber);
      if (last10.length >= 8) allLast10Set.add(last10);

      const duration = Number(c.durationSeconds ?? c.duration ?? 0);
      const rawIsConnected = Boolean(c.connected || duration > 0);
      const outcomeId = c.outcomeId ? String(c.outcomeId) : null;
      const outcomeLabel = c.outcomeLabel ? String(c.outcomeLabel) : null;
      const notes = c.notes ? String(c.notes).trim() : null;

      let startedAt = new Date();
      if (c.startedAt || c.date) {
        const ts = Number(c.startedAt || c.date);
        if (!isNaN(ts) && ts > 0) startedAt = new Date(ts);
      }

      let endedAt: Date | null = null;
      if (c.endedAt) {
        const ts = Number(c.endedAt);
        if (!isNaN(ts) && ts > 0) endedAt = new Date(ts);
      } else if (duration > 0) {
        endedAt = new Date(startedAt.getTime() + duration * 1000);
      }

      let callType: CallType = 'OUTGOING';
      if (c.callType && ['OUTGOING', 'INCOMING', 'MISSED', 'REJECTED'].includes(c.callType)) {
        callType = c.callType as CallType;
      }

      let idCandidate: string | null = null;
      if (c.id && typeof c.id === 'string') {
        const trimmed = c.id.trim();
        if (trimmed) {
          idCandidate = trimmed;
          candidateIds.push(trimmed);
        }
      }

      parsedCalls.push({
        raw: c,
        rawNumber,
        last10,
        duration,
        rawIsConnected,
        outcomeId,
        outcomeLabel,
        notes,
        startedAt,
        endedAt,
        callType,
        idCandidate,
      });
    }

    if (parsedCalls.length === 0) {
      return NextResponse.json({ success: true, syncedCount: 0, syncedIds: [] });
    }

    // Sort parsed calls chronologically so earliest calls are processed first
    parsedCalls.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());

    // 2. Pre-fetch employee's assigned leads ONLY
    const employeeLeads = await prisma.lead.findMany({
      where: { assignedEmployeeId: { in: resolved.allIds } },
      select: { id: true, phoneNumber: true, status: true, notes: true },
    });

    const leadMap = new Map<string, typeof employeeLeads[0]>();
    const leadIdMap = new Map<string, typeof employeeLeads[0]>();
    for (const lead of employeeLeads) {
      leadIdMap.set(lead.id, lead);
      const digits = toLast10Digits(lead.phoneNumber);
      if (digits) leadMap.set(digits, lead);
    }

    // Helper to find matched assigned lead for a last10 or leadId
    const findMatchedAssignedLead = (last10: string, rawLeadId?: string | null) => {
      if (rawLeadId && leadIdMap.has(rawLeadId)) {
        return leadIdMap.get(rawLeadId);
      }
      if (leadMap.has(last10)) return leadMap.get(last10);
      for (const [digits, lead] of leadMap.entries()) {
        if ((last10.length >= 8 && digits.endsWith(last10)) || (digits.length >= 8 && last10.endsWith(digits))) {
          return lead;
        }
      }
      return undefined;
    };

    // App-initiated call queue processing
    interface QualifiedCall {
      item: ParsedCall;
      matchedLead: typeof employeeLeads[0] | null;
    }

    const assignedCalls: QualifiedCall[] = [];
    for (const item of parsedCalls) {
      const matchedLead = findMatchedAssignedLead(item.last10, item.raw.leadId) || null;
      assignedCalls.push({ item, matchedLead });
    }

    if (assignedCalls.length === 0) {
      return NextResponse.json({
        success: true,
        syncedCount: 0,
        syncedIds: [],
        message: 'No calls found to sync.',
      });
    }

    // 3. Batch pre-fetch existing call logs for deduplication
    const assignedCandidateIds = assignedCalls.map(a => a.item.idCandidate).filter(Boolean) as string[];
    const minTimestamp = new Date(Math.min(...assignedCalls.map(a => a.item.startedAt.getTime())) - 120 * 1000);
    const maxTimestamp = new Date(Math.max(...assignedCalls.map(a => a.item.startedAt.getTime())) + 120 * 1000);

    const [existingById, existingByTime] = await Promise.all([
      assignedCandidateIds.length > 0
        ? prisma.callLog.findMany({ where: { id: { in: assignedCandidateIds } } })
        : Promise.resolve([]),
      prisma.callLog.findMany({
        where: {
          employeeId,
          startedAt: { gte: minTimestamp, lte: maxTimestamp },
        },
      }),
    ]);

    const existingLogsMap = new Map<string, typeof existingById[0]>();
    for (const log of existingById) {
      existingLogsMap.set(log.id, log);
    }

    // Helper to find existing call log
    const findExistingLog = (item: ParsedCall, leadId?: string | null) => {
      if (item.idCandidate && existingLogsMap.has(item.idCandidate)) {
        return existingLogsMap.get(item.idCandidate);
      }
      if (item.last10.length >= 8) {
        const itemTime = item.startedAt.getTime();
        return existingByTime.find(log => {
          if (leadId && log.leadId && log.leadId !== leadId) return false;
          const logTime = log.startedAt.getTime();
          const logLast10 = toLast10Digits(log.phoneNumber);
          const sameNum = logLast10.endsWith(item.last10) || item.last10.endsWith(logLast10);
          return sameNum && Math.abs(logTime - itemTime) <= 120 * 1000;
        });
      }
      return undefined;
    };

    // 4. Batch check prior connected calls for assigned leads
    const targetLeadIds = Array.from(
      new Set(assignedCalls.map(a => a.matchedLead?.id).filter(Boolean) as string[])
    );

    const existingConnectedInDb = targetLeadIds.length > 0
      ? await prisma.callLog.findMany({
          where: {
            connected: true,
            leadId: { in: targetLeadIds },
          },
          select: { id: true, leadId: true, phoneNumber: true, startedAt: true },
        })
      : [];

    // In-memory set of entities (lead ID or phone last10) that already have a connected call
    const connectedEntityEarliestTime = new Map<string, number>();
    for (const conn of existingConnectedInDb) {
      const connTime = conn.startedAt.getTime();
      if (conn.leadId) {
        const prev = connectedEntityEarliestTime.get(conn.leadId) ?? Infinity;
        if (connTime < prev) connectedEntityEarliestTime.set(conn.leadId, connTime);
      }
      const num10 = toLast10Digits(conn.phoneNumber);
      if (num10.length >= 8) {
        const prev = connectedEntityEarliestTime.get(num10) ?? Infinity;
        if (connTime < prev) connectedEntityEarliestTime.set(num10, connTime);
      }
    }

    let syncedCount = 0;
    const syncedIds: string[] = [];

    // 5. Build transaction batch to execute all writes in a single round-trip
    const dbOperations: any[] = [];

    for (const { item, matchedLead } of assignedCalls) {
      const targetLeadId = matchedLead ? matchedLead.id : null;
      const existingLog = findExistingLog(item, targetLeadId);

      // A call is connected if it has talk time (> 0s) or native telephony reported it connected
      const isConnected = item.duration > 0 || item.rawIsConnected;
      const leadKey = targetLeadId;
      const phoneKey = item.last10.length >= 8 ? item.last10 : null;

      if (isConnected) {
        if (leadKey) connectedEntityEarliestTime.set(leadKey, item.startedAt.getTime());
        if (phoneKey) connectedEntityEarliestTime.set(phoneKey, item.startedAt.getTime());
      }

      const hasConnectedCall =
        isConnected ||
        (leadKey ? connectedEntityEarliestTime.has(leadKey) : false) ||
        (phoneKey ? connectedEntityEarliestTime.has(phoneKey) : false);

      // Sanitize call outcome for unconnected calls only if lead has never had a connected call
      let callOutcomeId = item.outcomeId;
      let callOutcomeLabel = item.outcomeLabel;
      const CONNECTED_OUTCOMES_SET = new Set([
        'contacted',
        'interested',
        'follow_up',
        'call_back',
        'converted',
        'not_interested',
        'not_qualified',
      ]);

      if (!hasConnectedCall && callOutcomeId && CONNECTED_OUTCOMES_SET.has(callOutcomeId.toLowerCase())) {
        callOutcomeId = 'no_answer';
        callOutcomeLabel = 'No Answer';
      }

      let targetCallId = '';
      if (existingLog) {
        targetCallId = existingLog.id;
        dbOperations.push(
          prisma.callLog.update({
            where: { id: existingLog.id },
            data: {
              leadId: targetLeadId,
              contactName: item.raw.contactName || item.raw.name || existingLog.contactName,
              durationSeconds: Math.max(existingLog.durationSeconds, item.duration),
              connected: existingLog.connected || isConnected,
              outcomeId: callOutcomeId || existingLog.outcomeId,
              outcomeLabel: callOutcomeLabel || existingLog.outcomeLabel,
              notes: item.notes || existingLog.notes,
              endedAt: item.endedAt || existingLog.endedAt,
            },
          })
        );
      } else {
        targetCallId = item.idCandidate || crypto.randomUUID();
        dbOperations.push(
          prisma.callLog.create({
            data: {
              id: targetCallId,
              employeeId,
              leadId: targetLeadId,
              phoneNumber: item.rawNumber,
              contactName: item.raw.contactName || item.raw.name || null,
              callType: item.callType,
              durationSeconds: item.duration,
              connected: isConnected,
              outcomeId: callOutcomeId,
              outcomeLabel: callOutcomeLabel,
              notes: item.notes,
              startedAt: item.startedAt,
              endedAt: item.endedAt,
            },
          })
        );
      }

      syncedIds.push(targetCallId);
      syncedCount++;

      // Sync lead status & outcome: update lead status and append notes
      if (matchedLead) {
        let targetStatus: LeadStatus | undefined = undefined;
        if (callOutcomeId) {
          const mapped = OUTCOME_TO_LEAD_STATUS[callOutcomeId] || OUTCOME_TO_LEAD_STATUS[callOutcomeId.toLowerCase()];
          const isConnectedStatus = [
            'CONTACTED',
            'INTERESTED',
            'FOLLOW_UP',
            'CALL_BACK',
            'CONVERTED',
            'NOT_INTERESTED',
            'NOT_QUALIFIED',
          ].includes(mapped);

          if (isConnectedStatus) {
            const hasPriorConnected =
              (targetLeadId && connectedEntityEarliestTime.has(targetLeadId)) ||
              (phoneKey && connectedEntityEarliestTime.has(phoneKey));
            if (isConnected || hasPriorConnected) {
              targetStatus = mapped;
            } else {
              targetStatus = 'NO_ANSWER';
            }
          } else {
            targetStatus = mapped;
          }
        } else if (isConnected && (matchedLead.status === 'NEW' || matchedLead.status === 'ASSIGNED')) {
          targetStatus = 'CONTACTED';
        }

        if (targetStatus) {
          let updatedLeadNotes = matchedLead.notes || '';
          if (item.notes) {
            const timeStr = new Date().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: 'short',
            });
            const noteEntry = `[${timeStr} - Call ${item.duration}s]: ${item.notes}`;
            updatedLeadNotes = updatedLeadNotes ? `${updatedLeadNotes}\n${noteEntry}` : noteEntry;
          }

          dbOperations.push(
            prisma.lead.update({
              where: { id: matchedLead.id },
              data: {
                status: targetStatus,
                notes: updatedLeadNotes || undefined,
                updatedAt: new Date(),
              },
            })
          );
          matchedLead.status = targetStatus;
          matchedLead.notes = updatedLeadNotes;
        }
      }
    }

    if (dbOperations.length > 0) {
      await prisma.$transaction(dbOperations);
    }

    invalidateDashboardMetricsCache();

    return NextResponse.json({
      success: true,
      syncedCount,
      syncedIds,
    });
  } catch (error: unknown) {
    console.error('Error syncing call logs:', error);
    const message = error instanceof Error ? error.message : 'Failed to sync call logs.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
