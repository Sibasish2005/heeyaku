import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEmployeeToken } from '@/lib/auth/employee-token';
import { resolveEmployeeIdentity } from '@/lib/employee/resolve';
import { toLast10Digits } from '@/lib/lead/phone';
import { CallType, LeadStatus } from '@prisma/client';
import { invalidateDashboardMetricsCache } from '@/lib/dashboard/metrics';

const OUTCOME_TO_LEAD_STATUS: Record<string, LeadStatus> = {
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
      if (c.id && typeof c.id === 'string' && !c.id.includes('_')) {
        idCandidate = c.id;
        candidateIds.push(c.id);
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

    // 2. Pre-fetch employee's assigned leads
    const employeeLeads = await prisma.lead.findMany({
      where: { assignedEmployeeId: { in: resolved.allIds } },
      select: { id: true, phoneNumber: true, status: true, notes: true },
    });

    const leadMap = new Map<string, { id: string; phoneNumber: string; status: LeadStatus; notes: string | null }>();
    for (const lead of employeeLeads) {
      const digits = toLast10Digits(lead.phoneNumber);
      if (digits) leadMap.set(digits, lead);
    }

    // Identify phone numbers not in employee leads and batch fetch them
    const unmatchedLast10 = Array.from(allLast10Set).filter(digits => !leadMap.has(digits));
    if (unmatchedLast10.length > 0) {
      const fallbackLeads = await prisma.lead.findMany({
        where: {
          OR: unmatchedLast10.map(digits => ({ phoneNumber: { contains: digits } })),
        },
        select: { id: true, phoneNumber: true, status: true, notes: true },
      });
      for (const lead of fallbackLeads) {
        const digits = toLast10Digits(lead.phoneNumber);
        if (digits && !leadMap.has(digits)) {
          leadMap.set(digits, lead);
        }
      }
    }

    // Helper to find matched lead for a last10
    const findMatchedLead = (last10: string) => {
      if (leadMap.has(last10)) return leadMap.get(last10);
      for (const [digits, lead] of leadMap.entries()) {
        if ((last10.length >= 8 && digits.endsWith(last10)) || (digits.length >= 8 && last10.endsWith(digits))) {
          return lead;
        }
      }
      return undefined;
    };

    // 3. Batch pre-fetch existing call logs
    const minTimestamp = new Date(Math.min(...parsedCalls.map(p => p.startedAt.getTime())) - 120 * 1000);
    const maxTimestamp = new Date(Math.max(...parsedCalls.map(p => p.startedAt.getTime())) + 120 * 1000);

    const [existingById, existingByTime] = await Promise.all([
      candidateIds.length > 0
        ? prisma.callLog.findMany({ where: { id: { in: candidateIds } } })
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
    const findExistingLog = (item: ParsedCall) => {
      if (item.idCandidate && existingLogsMap.has(item.idCandidate)) {
        return existingLogsMap.get(item.idCandidate);
      }
      if (item.last10.length >= 8) {
        const itemTime = item.startedAt.getTime();
        return existingByTime.find(log => {
          const logTime = log.startedAt.getTime();
          const logLast10 = toLast10Digits(log.phoneNumber);
          const sameNum = logLast10.endsWith(item.last10) || item.last10.endsWith(logLast10);
          return sameNum && Math.abs(logTime - itemTime) <= 120 * 1000;
        });
      }
      return undefined;
    };

    // 4. Batch check prior connected calls for all leads / phone numbers
    const targetLeadIds = new Set<string>();
    for (const item of parsedCalls) {
      const matched = findMatchedLead(item.last10);
      const leadId = matched?.id || item.raw.leadId;
      if (leadId) targetLeadIds.add(leadId);
    }

    const allLast10Array = Array.from(allLast10Set);
    const existingConnectedInDb = await prisma.callLog.findMany({
      where: {
        connected: true,
        OR: [
          ...(targetLeadIds.size > 0 ? [{ leadId: { in: Array.from(targetLeadIds) } }] : []),
          ...(allLast10Array.length > 0
            ? allLast10Array.map(digits => ({ employeeId, phoneNumber: { contains: digits } }))
            : []),
        ],
      },
      select: { id: true, leadId: true, phoneNumber: true, startedAt: true },
    });

    // In-memory set of entities (lead ID or phone last10) that already have a connected call
    // Mapping entity identifier -> earliest connected call timestamp
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

    for (const item of parsedCalls) {
      const matchedLead = findMatchedLead(item.last10);
      const targetLeadId = matchedLead?.id || item.raw.leadId || null;
      const existingLog = findExistingLog(item);

      let isConnected = item.rawIsConnected;
      const leadKey = targetLeadId || null;
      const phoneKey = item.last10.length >= 8 ? item.last10 : null;

      if (isConnected) {
        const earliestLeadConn = leadKey ? connectedEntityEarliestTime.get(leadKey) : undefined;
        const earliestPhoneConn = phoneKey ? connectedEntityEarliestTime.get(phoneKey) : undefined;
        const earliestConnected = Math.min(
          earliestLeadConn ?? Infinity,
          earliestPhoneConn ?? Infinity
        );

        // If there is already a connected call at or before this call, this call cannot be connected
        if (earliestConnected < item.startedAt.getTime()) {
          isConnected = false;
        } else {
          // This call is the earliest connected call for this lead
          isConnected = true;
          if (leadKey) connectedEntityEarliestTime.set(leadKey, item.startedAt.getTime());
          if (phoneKey) connectedEntityEarliestTime.set(phoneKey, item.startedAt.getTime());

          // Demote any subsequent connected calls in DB for this lead
          if (leadKey || phoneKey) {
            await prisma.callLog.updateMany({
              where: {
                OR: [
                  ...(leadKey ? [{ leadId: leadKey }] : []),
                  ...(phoneKey ? [{ employeeId, phoneNumber: { contains: phoneKey } }] : []),
                ],
                connected: true,
                ...(existingLog ? { id: { not: existingLog.id } } : {}),
                startedAt: { gt: item.startedAt },
              },
              data: { connected: false },
            });
          }
        }
      }

      let targetCallId = '';
      if (existingLog) {
        const updated = await prisma.callLog.update({
          where: { id: existingLog.id },
          data: {
            leadId: targetLeadId || existingLog.leadId,
            contactName: item.raw.contactName || item.raw.name || existingLog.contactName,
            durationSeconds: Math.max(existingLog.durationSeconds, item.duration),
            connected: isConnected,
            outcomeId: item.outcomeId || existingLog.outcomeId,
            outcomeLabel: item.outcomeLabel || existingLog.outcomeLabel,
            notes: item.notes || existingLog.notes,
            endedAt: item.endedAt || existingLog.endedAt,
          },
        });
        targetCallId = updated.id;
      } else {
        const createdCall = await prisma.callLog.create({
          data: {
            employeeId,
            leadId: targetLeadId,
            phoneNumber: item.rawNumber,
            contactName: item.raw.contactName || item.raw.name || null,
            callType: item.callType,
            durationSeconds: item.duration,
            connected: isConnected,
            outcomeId: item.outcomeId,
            outcomeLabel: item.outcomeLabel,
            notes: item.notes,
            startedAt: item.startedAt,
            endedAt: item.endedAt,
          },
        });
        targetCallId = createdCall.id;
      }

      syncedIds.push(targetCallId);
      syncedCount++;

      // If outcome was provided and we have a matched lead, update lead status & append notes
      if (matchedLead && item.outcomeId) {
        const targetStatus = OUTCOME_TO_LEAD_STATUS[item.outcomeId];
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

          await prisma.lead.update({
            where: { id: matchedLead.id },
            data: {
              status: targetStatus,
              notes: updatedLeadNotes || undefined,
              updatedAt: new Date(),
            },
          });
          matchedLead.status = targetStatus;
          matchedLead.notes = updatedLeadNotes;
        }
      }
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
