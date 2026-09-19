import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEmployeeToken } from '@/lib/auth/employee-token';
import { resolveEmployeeIdentity } from '@/lib/employee/resolve';

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

    const leads = await prisma.lead.findMany({
      where: {
        assignedEmployeeId: { in: employeeIds },
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
        assignedAt: true,
        createdAt: true,
        updatedAt: true,
        callLogs: {
          where: {
            connected: true,
            durationSeconds: { gt: 0 },
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    const enrichedLeads = leads.map(({ callLogs, ...l }) => ({
      ...l,
      hasConnectedCall: (callLogs && callLogs.length > 0) || false,
    }));

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
