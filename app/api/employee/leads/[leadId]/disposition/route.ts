import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEmployeeToken } from '@/lib/auth/employee-token';
import { resolveEmployeeIdentity } from '@/lib/employee/resolve';
import { LeadStatus } from '@prisma/client';
import { invalidateDashboardMetricsCache } from '@/lib/dashboard/metrics';

const VALID_STATUSES = new Set(Object.values(LeadStatus));

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
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

    const { leadId } = await params;
    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status, notes, callDuration } = body;

    // Verify lead exists and belongs to this employee
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existingLead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found.' },
        { status: 404 }
      );
    }

    const resolved = await resolveEmployeeIdentity(payload);
    if (!resolved) {
      return NextResponse.json(
        { success: false, error: 'Employee account not found.' },
        { status: 401 }
      );
    }

    const allowedEmployeeIds = new Set(resolved.allIds);

    // Strictly enforce assignment: an employee can only update leads assigned to them.
    // Unassigned leads cannot be updated through this endpoint.
    if (!existingLead.assignedEmployeeId || !allowedEmployeeIds.has(existingLead.assignedEmployeeId)) {
      return NextResponse.json(
        { success: false, error: 'Access denied.' },
        { status: 403 }
      );
    }

    // Validate status & enforce connected call requirement
    const CONNECTED_STATUSES = new Set<LeadStatus>([
      'CONTACTED',
      'INTERESTED',
      'FOLLOW_UP',
      'CALL_BACK',
      'CONVERTED',
      'NOT_INTERESTED',
      'NOT_QUALIFIED',
    ]);

    let targetStatus: LeadStatus = existingLead.status;
    if (status && VALID_STATUSES.has(status as LeadStatus)) {
      const requestedStatus = status as LeadStatus;
      if (CONNECTED_STATUSES.has(requestedStatus)) {
        // Enforce verified connected call (duration > 0s)
        const connectedCall = await prisma.callLog.findFirst({
          where: {
            OR: [
              { leadId, connected: true, durationSeconds: { gt: 0 } },
              { phoneNumber: existingLead.phoneNumber, connected: true, durationSeconds: { gt: 0 } },
              ...(existingLead.phoneDigits
                ? [{ phoneNumber: { endsWith: existingLead.phoneDigits }, connected: true, durationSeconds: { gt: 0 } }]
                : []),
            ],
          },
          select: { id: true },
        });

        if (!connectedCall) {
          return NextResponse.json(
            {
              success: false,
              error: 'Cannot update disposition to Contacted or connected outcome without a verified connected call (talk time > 0s). Please call the student first.',
            },
            { status: 400 }
          );
        }
      }
      targetStatus = requestedStatus;
    }

    // Format new notes
    let updatedNotes = existingLead.notes || '';
    if (notes && notes.trim()) {
      const timestamp = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      });
      const noteEntry = `[${timestamp}]: ${notes.trim()}${callDuration ? ` (Call: ${callDuration}s)` : ''}`;
      updatedNotes = updatedNotes ? `${updatedNotes}\n${noteEntry}` : noteEntry;
    }

    // --- Lead to Prospect Promotion & Team Lead Auto-Assignment ---
    const PROSPECT_TRIGGER_STATUSES = new Set<LeadStatus>([
      'INTERESTED',
      'CALL_BACK',
      'FOLLOW_UP',
    ]);

    let targetEmployeeId = existingLead.assignedEmployeeId;
    let isPromotedToProspect = existingLead.isProspect;
    let promotedToProspectAt = existingLead.promotedToProspectAt;
    let originalBdaId = existingLead.originalBdaId;
    let tlNotificationMessage: string | null = null;

    if (PROSPECT_TRIGGER_STATUSES.has(targetStatus)) {
      isPromotedToProspect = true;
      if (!promotedToProspectAt) {
        promotedToProspectAt = new Date();
      }
      if (!originalBdaId) {
        originalBdaId = resolved.primaryId;
      }

      // Reassign to squad Team Lead for closing
      const callerTeamId = resolved.employee?.teamId || existingLead.teamId;
      if (callerTeamId) {
        const squad = await prisma.team.findUnique({
          where: { id: callerTeamId },
          include: {
            teamLead: {
              select: { id: true, name: true, employeeCode: true, isActive: true },
            },
          },
        });

        if (squad?.teamLead && squad.teamLead.isActive) {
          if (targetEmployeeId !== squad.teamLead.id) {
            targetEmployeeId = squad.teamLead.id;
            tlNotificationMessage = `Promoted to Prospect. Reassigned to Team Lead ${squad.teamLead.name} (${squad.teamLead.employeeCode}) for closing.`;
            const timestamp = new Date().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: 'short',
            });
            const systemNote = `[${timestamp}]: ⚡ ${tlNotificationMessage}`;
            updatedNotes = updatedNotes ? `${updatedNotes}\n${systemNote}` : systemNote;
          }
        }
      }
    }

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: targetStatus,
        notes: updatedNotes,
        isProspect: isPromotedToProspect,
        promotedToProspectAt,
        originalBdaId,
        assignedEmployeeId: targetEmployeeId,
        ...(targetEmployeeId !== existingLead.assignedEmployeeId ? { assignedAt: new Date() } : {}),
        updatedAt: new Date(),
      },
      include: {
        assignedEmployee: {
          select: { id: true, name: true, employeeCode: true, role: true },
        },
        originalBda: {
          select: { id: true, name: true, employeeCode: true },
        },
      },
    });

    // Sync outcome to the latest CallLog for this lead so KPIs and call history match
    const latestCallLog = await prisma.callLog.findFirst({
      where: { leadId, employeeId: { in: resolved.allIds } },
      orderBy: { startedAt: 'desc' },
    });

    if (latestCallLog) {
      const isCallConnected = latestCallLog.connected && latestCallLog.durationSeconds > 0;
      let callOutcomeId = targetStatus.toLowerCase();
      let callOutcomeLabel: string = targetStatus;

      // If this specific latest call was not connected, do not label it as contacted/interested
      if (!isCallConnected && CONNECTED_STATUSES.has(targetStatus)) {
        callOutcomeId = 'no_answer';
        callOutcomeLabel = 'No Answer';
      }

      await prisma.callLog.update({
        where: { id: latestCallLog.id },
        data: {
          outcomeId: callOutcomeId,
          outcomeLabel: callOutcomeLabel,
          notes: notes?.trim() || latestCallLog.notes,
        },
      });
    }

    // Invalidate dashboard metrics cache so admin KPIs immediately update
    invalidateDashboardMetricsCache();

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      isProspect: isPromotedToProspect,
      reassignedToTl: targetEmployeeId !== existingLead.assignedEmployeeId,
      message: tlNotificationMessage || 'Lead disposition recorded successfully.',
    });
  } catch (error) {
    console.error('Error submitting lead disposition:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record lead disposition.' },
      { status: 500 }
    );
  }
}
