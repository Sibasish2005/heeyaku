import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEmployeeToken } from '@/lib/auth/employee-token';

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

    const employee = await prisma.employee.findUnique({
      where: { id: payload.employeeId },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        email: true,
        phoneNumber: true,
        team: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!employee || !employee.isActive) {
      return NextResponse.json(
        { success: false, error: 'Employee account is not active.' },
        { status: 403 }
      );
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalAssigned, contactedToday, convertedTotal] = await Promise.all([
      prisma.lead.count({ where: { assignedEmployeeId: employee.id } }),
      prisma.lead.count({
        where: {
          assignedEmployeeId: employee.id,
          updatedAt: { gte: startOfToday },
          status: { in: ['CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'CALL_BACK'] },
        },
      }),
      prisma.lead.count({
        where: {
          assignedEmployeeId: employee.id,
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
