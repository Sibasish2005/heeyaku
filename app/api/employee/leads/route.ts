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
        { success: false, error: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }

    let employeeId = payload.employeeId;
    let employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee && (payload.employeeCode || payload.email)) {
      employee = await prisma.employee.findFirst({
        where: {
          OR: [
            ...(payload.employeeCode ? [{ employeeCode: payload.employeeCode }] : []),
            ...(payload.email ? [{ email: payload.email }] : []),
          ],
        },
      });
    }

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee account not found.' },
        { status: 401 }
      );
    }
    employeeId = employee.id;

    // Collect all matching employee IDs to ensure leads are never orphaned across DB resets
    const matchingEmployees = await prisma.employee.findMany({
      where: {
        OR: [
          { id: payload.employeeId },
          { id: employee.id },
          ...(payload.employeeCode ? [{ employeeCode: payload.employeeCode }] : []),
          ...(payload.email ? [{ email: payload.email }] : []),
          ...(employee.employeeCode ? [{ employeeCode: employee.employeeCode }] : []),
        ],
      },
      select: { id: true },
    });

    const employeeIds = Array.from(
      new Set([payload.employeeId, employee.id, ...matchingEmployees.map((e) => e.id)])
    ).filter(Boolean);

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
      },
    });

    return NextResponse.json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (error) {
    console.error('Error fetching employee leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assigned leads.' },
      { status: 500 }
    );
  }
}
