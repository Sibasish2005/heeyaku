import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEmployeeToken } from '@/lib/auth/employee-token';
import { resolveEmployeeIdentity } from '@/lib/employee/resolve';
import { LeadStatus } from '@prisma/client';
import { invalidateDashboardMetricsCache } from '@/lib/dashboard/metrics';

const VALID_STATUSES = new Set(Object.values(LeadStatus));

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

    // Validate status
    let targetStatus: LeadStatus = existingLead.status;
    if (status && VALID_STATUSES.has(status as LeadStatus)) {
      targetStatus = status as LeadStatus;
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

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: targetStatus,
        notes: updatedNotes,
        updatedAt: new Date(),
      },
    });

    // Sync outcome to the latest CallLog for this lead so KPIs and call history match
    const latestCallLog = await prisma.callLog.findFirst({
      where: { leadId, employeeId: { in: resolved.allIds } },
      orderBy: { startedAt: 'desc' },
    });

    if (latestCallLog) {
      await prisma.callLog.update({
        where: { id: latestCallLog.id },
        data: {
          outcomeId: targetStatus.toLowerCase(),
          outcomeLabel: targetStatus,
          notes: notes?.trim() || latestCallLog.notes,
        },
      });
    }

    // Invalidate dashboard metrics cache so admin KPIs immediately update
    invalidateDashboardMetricsCache();

    return NextResponse.json({
      success: true,
      lead: updatedLead,
    });
  } catch (error) {
    console.error('Error submitting lead disposition:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record lead disposition.' },
      { status: 500 }
    );
  }
}
