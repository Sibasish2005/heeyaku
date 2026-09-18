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

    let employee = await prisma.employee.findUnique({
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

    if (!employee && (payload.employeeCode || payload.email)) {
      employee = await prisma.employee.findFirst({
        where: {
          OR: [
            ...(payload.employeeCode ? [{ employeeCode: payload.employeeCode }] : []),
            ...(payload.email ? [{ email: payload.email }] : []),
          ],
        },
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
    }

    if (!employee || !employee.isActive) {
      return NextResponse.json(
        { success: false, error: 'Employee account is not active.' },
        { status: 403 }
      );
    }

    const matchingEmployees = await prisma.employee.findMany({
      where: {
        OR: [
          { id: payload.employeeId },
          { id: employee.id },
          ...(employee.employeeCode ? [{ employeeCode: employee.employeeCode }] : []),
          ...(employee.email ? [{ email: employee.email }] : []),
        ],
      },
      select: { id: true },
    });
    const employeeIds = Array.from(
      new Set([payload.employeeId, employee.id, ...matchingEmployees.map((e) => e.id)])
    ).filter(Boolean);

    // Determine Start of Day in Indian Standard Time (IST, UTC+05:30)
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const istDate = new Date(nowMs + IST_OFFSET_MS);
    const startOfTodayMs =
      Date.UTC(
        istDate.getUTCFullYear(),
        istDate.getUTCMonth(),
        istDate.getUTCDate(),
        0, 0, 0, 0
      ) - IST_OFFSET_MS;
    const startOfToday = new Date(startOfTodayMs);

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
