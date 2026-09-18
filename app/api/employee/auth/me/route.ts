import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEmployeeToken } from '@/lib/auth/employee-token';
import { resolveEmployeeIdentity } from '@/lib/employee/resolve';
import { getStartOfTodayIST } from '@/lib/utils/date';

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
        { success: false, error: 'Invalid or expired session token. Please log in again.' },
        { status: 401 }
      );
    }

    const resolved = await resolveEmployeeIdentity(payload);
    if (!resolved || !resolved.employee || !resolved.employee.isActive) {
      return NextResponse.json(
        { success: false, error: 'Employee account is not active or found.' },
        { status: 403 }
      );
    }

    const { employee, allIds: employeeIds } = resolved;
    const startOfToday = getStartOfTodayIST();

    const [totalAssigned, contactedToday, convertedTotal] = await Promise.all([
      prisma.lead.count({ where: { assignedEmployeeId: { in: employeeIds } } }),
      prisma.lead.count({
        where: {
          assignedEmployeeId: { in: employeeIds },
          updatedAt: { gte: startOfToday },
          status: { in: ['CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'CALL_BACK'] },
        },
      }),
      prisma.lead.count({
        where: {
          assignedEmployeeId: { in: employeeIds },
          status: 'CONVERTED',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      employee: {
        ...employee,
        role: employee.team || 'Business Development Associate',
      },
      stats: {
        totalAssigned,
        contactedToday,
        convertedTotal,
      },
    });
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve employee profile.' },
      { status: 500 }
    );
  }
}
