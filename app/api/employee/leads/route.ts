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
    const existingEmp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!existingEmp && (payload.employeeCode || payload.email)) {
      const fallbackEmp = await prisma.employee.findFirst({
        where: {
          OR: [
            ...(payload.employeeCode ? [{ employeeCode: payload.employeeCode }] : []),
            ...(payload.email ? [{ email: payload.email }] : []),
          ],
        },
      });
      if (fallbackEmp) {
        employeeId = fallbackEmp.id;
      }
    }

    const leads = await prisma.lead.findMany({
      where: {
        assignedEmployeeId: employeeId,
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
