import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEmployeeToken } from '@/lib/auth/employee-token';
import { resolveEmployeeIdentity } from '@/lib/employee/resolve';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      'Access-Control-Max-Age': '86400',
    },
  });
}

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

    const resolved = await resolveEmployeeIdentity(payload);
    if (!resolved) {
      return NextResponse.json(
        { success: false, error: 'Employee account not found.' },
        { status: 401 }
      );
    }

    const employeeIds = resolved.allIds;
    const employeeIdSet = new Set(employeeIds);

    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { assignedEmployeeId: { in: employeeIds } },
          { originalBdaId: { in: employeeIds } },
          { callLogs: { some: { employeeId: { in: employeeIds } } } },
        ],
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        leadCode: true,
        name: true,
        phoneNumber: true,
        email: true,
        company: true, // Course / Institution
        source: true,
        status: true,
        notes: true,
        isProspect: true,
        assignedEmployeeId: true,
        assignedEmployee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            role: true,
          },
        },
        originalBdaId: true,
        originalBda: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
          },
        },
        assignedAt: true,
        createdAt: true,
        updatedAt: true,
        callLogs: {
          where: {
            employeeId: { in: employeeIds },
            connected: true,
            durationSeconds: { gt: 0 },
          },
          select: { id: true, durationSeconds: true, startedAt: true },
          take: 5,
        },
      },
    });

    const enrichedLeads = leads.map(({ callLogs, assignedEmployee, originalBda, ...l }) => {
      const isReassigned = Boolean(l.assignedEmployeeId && !employeeIdSet.has(l.assignedEmployeeId));
      const hasConnectedCall = (callLogs && callLogs.length > 0) || Boolean(l.originalBdaId && employeeIdSet.has(l.originalBdaId));
      return {
        ...l,
        assignedEmployee,
        originalBda,
        isReassigned,
        assignedEmployeeName: assignedEmployee?.name || null,
        assignedEmployeeRole: assignedEmployee?.role || null,
        originalBdaName: originalBda?.name || null,
        hasConnectedCall,
        callsMadeByMe: callLogs ? callLogs.length : 0,
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedLeads.length,
      leads: enrichedLeads,
    });
  } catch (error) {
    console.error('Error fetching employee leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assigned leads.' },
      { status: 500 }
    );
  }
}
