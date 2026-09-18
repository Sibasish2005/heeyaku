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

    let syncedCount = 0;
    const syncedIds: string[] = [];

    // Pre-fetch employee's assigned leads to efficiently map phone numbers
    const employeeLeads = await prisma.lead.findMany({
      where: { assignedEmployeeId: { in: resolved.allIds } },
      select: { id: true, phoneNumber: true, status: true, notes: true },
    });

    for (const c of rawCalls) {
      const rawNumber = String(c.phoneNumber || c.number || '').trim();
      if (!rawNumber) continue;

      const last10 = toLast10Digits(rawNumber);

      // Match lead by matching last 10 digits
      let matchedLead = employeeLeads.find((l) => {
        const leadDigits = toLast10Digits(l.phoneNumber);
        return (last10.length >= 8 && leadDigits.endsWith(last10)) || (leadDigits.length >= 8 && last10.endsWith(leadDigits));
      });

      // If not in assigned leads, fallback to any lead
      if (!matchedLead && last10.length >= 8) {
        matchedLead = await prisma.lead.findFirst({
          where: {
            phoneNumber: { contains: last10 },
          },
          select: { id: true, phoneNumber: true, status: true, notes: true },
        }) || undefined;
      }

      const duration = Number(c.durationSeconds ?? c.duration ?? 0);
      const rawIsConnected = Boolean(c.connected || duration > 0);
      let isConnected = rawIsConnected;
      const outcomeId = c.outcomeId ? String(c.outcomeId) : null;
      const outcomeLabel = c.outcomeLabel ? String(c.outcomeLabel) : null;
      const notes = c.notes ? String(c.notes).trim() : null;

      let startedAt = new Date();
      if (c.startedAt || c.date) {
        const ts = Number(c.startedAt || c.date);
        if (!isNaN(ts) && ts > 0) {
          startedAt = new Date(ts);
        }
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

      // Check if call log already exists (by ID or employee + number + timestamp within 2 mins)
      let existingLog = null;
      if (c.id && !c.id.includes('_')) {
        existingLog = await prisma.callLog.findUnique({
          where: { id: c.id },
        });
      }

      if (!existingLog && last10.length >= 8) {
        const timeWindowStart = new Date(startedAt.getTime() - 120 * 1000);
        const timeWindowEnd = new Date(startedAt.getTime() + 120 * 1000);
        existingLog = await prisma.callLog.findFirst({
          where: {
            employeeId,
            phoneNumber: { contains: last10 },
            startedAt: {
              gte: timeWindowStart,
              lte: timeWindowEnd,
            },
          },
        });
      }

      // RULE: Only the first connected call for the same lead is considered connected. Same lead cannot have 2 connected calls.
      const targetLeadId = matchedLead?.id || c.leadId || null;
      if (isConnected) {
        const priorConnected = await prisma.callLog.findFirst({
          where: {
            OR: [
              ...(targetLeadId ? [{ leadId: targetLeadId }] : []),
              ...(last10.length >= 8 ? [{ employeeId, phoneNumber: { contains: last10 } }] : []),
            ],
            connected: true,
            ...(existingLog ? { id: { not: existingLog.id } } : {}),
            startedAt: { lt: startedAt },
          },
        });

        if (priorConnected) {
          isConnected = false;
        } else {
          // If this call is the first connected call, demote any subsequent calls for this lead to connected: false
          await prisma.callLog.updateMany({
            where: {
              OR: [
                ...(targetLeadId ? [{ leadId: targetLeadId }] : []),
                ...(last10.length >= 8 ? [{ employeeId, phoneNumber: { contains: last10 } }] : []),
              ],
              connected: true,
              ...(existingLog ? { id: { not: existingLog.id } } : {}),
              startedAt: { gt: startedAt },
            },
            data: {
              connected: false,
            },
          });
        }
      }

      let targetCallId = '';

      if (existingLog) {
        // Update existing call log
        const updated = await prisma.callLog.update({
          where: { id: existingLog.id },
          data: {
            leadId: matchedLead?.id || existingLog.leadId,
            contactName: c.contactName || c.name || existingLog.contactName,
            durationSeconds: Math.max(existingLog.durationSeconds, duration),
            connected: isConnected,
            outcomeId: outcomeId || existingLog.outcomeId,
            outcomeLabel: outcomeLabel || existingLog.outcomeLabel,
            notes: notes || existingLog.notes,
            endedAt: endedAt || existingLog.endedAt,
          },
        });
        targetCallId = updated.id;
      } else {
        // Create the CallLog
        const createdCall = await prisma.callLog.create({
          data: {
            employeeId,
            leadId: matchedLead?.id || c.leadId || null,
            phoneNumber: rawNumber,
            contactName: c.contactName || c.name || null,
            callType,
            durationSeconds: duration,
            connected: isConnected,
            outcomeId,
            outcomeLabel,
            notes,
            startedAt,
            endedAt,
          },
        });
        targetCallId = createdCall.id;
      }

      syncedIds.push(targetCallId);
      syncedCount++;

      // If outcome was provided and we have a matched lead, update lead status & append notes
      if (matchedLead && outcomeId) {
        const targetStatus = OUTCOME_TO_LEAD_STATUS[outcomeId];
        if (targetStatus) {
          let updatedLeadNotes = matchedLead.notes || '';
          if (notes) {
            const timeStr = new Date().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: 'short',
            });
            const noteEntry = `[${timeStr} - Call ${duration}s]: ${notes}`;
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
