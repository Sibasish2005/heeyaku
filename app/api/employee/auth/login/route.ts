import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signEmployeeToken } from '@/lib/auth/employee-token';
import { checkRateLimit, resetRateLimit } from '@/lib/security/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown-ip';
    const rateLimitKey = `login:${ip}`;
    const rateLimit = checkRateLimit(rateLimitKey, { windowMs: 60 * 1000, maxAttempts: 5 });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please wait ${rateLimit.resetSeconds} seconds before trying again.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Employee ID/Email and password are required.' },
        { status: 400 }
      );
    }

    const trimmedId = String(identifier).trim();
    const normalizedId = trimmedId.toUpperCase();
    const withEmpPrefix = !normalizedId.startsWith('EMP-') && /^\d+$/.test(normalizedId)
      ? `EMP-${normalizedId}`
      : null;

    // Look up employee by employeeCode (EMP-XXXX), numeric code, or email
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeCode: { equals: normalizedId, mode: 'insensitive' } },
          ...(withEmpPrefix ? [{ employeeCode: { equals: withEmpPrefix, mode: 'insensitive' as const } }] : []),
          { email: { equals: trimmedId, mode: 'insensitive' } },
        ],
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Invalid Employee ID or password.' },
        { status: 401 }
      );
    }

    if (!employee.isActive) {
      return NextResponse.json(
        { success: false, error: 'This employee account is deactivated. Please contact your administrator.' },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, employee.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid Employee ID or password.' },
        { status: 401 }
      );
    }

    // Reset rate limiter on successful authentication
    resetRateLimit(rateLimitKey);

    const token = signEmployeeToken({
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      email: employee.email,
      name: employee.name,
    });

    return NextResponse.json({
      success: true,
      token,
      employee: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        name: employee.name,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        team: employee.team || 'Business Development Associate',
      },
    });
  } catch (error) {
    console.error('Employee login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred during login.' },
      { status: 500 }
    );
  }
}
