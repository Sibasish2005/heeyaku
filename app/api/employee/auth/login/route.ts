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
    const accountRateLimitKey = `login:account:${normalizedId}`;
    const accountRateLimit = checkRateLimit(accountRateLimitKey, { windowMs: 2 * 60 * 1000, maxAttempts: 5 });

    if (!accountRateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts for this account. Please wait ${accountRateLimit.resetSeconds} seconds before trying again.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(accountRateLimit.resetSeconds),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

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
      include: {
        teamGroup: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Invalid Employee ID or password.' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, employee.passwordHash);
    if (!isMatch || !employee.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid Employee ID or password.' },
        { status: 401 }
      );
    }

    // Role boundary: Mobile app is strictly for Business Development Associates (BDA)
    if (employee.role !== 'BDA') {
      return NextResponse.json(
        {
          success: false,
          error: 'Mobile app access is restricted to Business Development Associates (BDA). For administrative or team lead access, please log in via the Web Portal.',
        },
        { status: 403 }
      );
    }

    // Reset rate limiter on successful authentication
    resetRateLimit(rateLimitKey);
    resetRateLimit(accountRateLimitKey);

    const token = signEmployeeToken({
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      email: employee.email,
      name: employee.name,
      role: employee.role,
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
        role: employee.role,
        team: employee.teamGroup?.name || employee.team || 'General',
        teamId: employee.teamId,
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
