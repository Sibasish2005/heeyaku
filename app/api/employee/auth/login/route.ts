import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signEmployeeToken, signDeviceChallengeToken } from '@/lib/auth/employee-token';
import { ClerkSyncService } from '@/lib/auth/clerk-sync';
import { maskEmail } from '@/lib/auth/clerk-device-otp';
import { checkRateLimit, resetRateLimit } from '@/lib/security/rate-limit';

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

export async function GET() {
  return NextResponse.json({
    success: true,
    service: 'heeyaku-employee-auth',
    message: 'HEEYAKU Employee Authentication API is operational',
  });
}

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
    const { identifier, password, deviceId, deviceName } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Employee ID/Email and password are required.' },
        { status: 400 }
      );
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters.' },
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
        company: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Please verify and try again.' },
        { status: 401 }
      );
    }

    let isMatch = false;

    // Step 1: Verify credentials with authentication service if user is linked
    if (employee.clerkUserId && process.env.CLERK_SECRET_KEY) {
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const client = await clerkClient();
        const verification = await client.users.verifyPassword({
          userId: employee.clerkUserId,
          password: String(password),
        });
        if (verification?.verified) {
          isMatch = true;
        }
      } catch {
        // Fall through to hash verification
      }
    }

    // Step 2: Fall back to local hash
    if (!isMatch) {
      isMatch = await bcrypt.compare(password, employee.passwordHash);
    }

    if (!isMatch || !employee.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Please verify and try again.' },
        { status: 401 }
      );
    }

    // 1-Click Master Kill-Switch: Block login if company is suspended
    if (employee.company && employee.company.status === 'SUSPENDED_BY_ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Your workspace has been suspended by the platform administrator. Access is temporarily restricted.',
        },
        { status: 403 }
      );
    }

    // Role boundary: Mobile app is strictly for Business Development Associates (BDA)
    if (employee.role !== 'BDA') {
      return NextResponse.json(
        {
          success: false,
          error: 'Mobile app access is restricted to Business Development Associates (BDA).',
        },
        { status: 403 }
      );
    }

    // Reset rate limiter on successful authentication
    resetRateLimit(rateLimitKey);
    resetRateLimit(accountRateLimitKey);

    // Device Verification Gate: If deviceId is provided, enforce OTP on first login from that device
    if (deviceId) {
      const cleanDeviceId = String(deviceId).trim();
      const trustedDevice = await prisma.employeeDevice.findUnique({
        where: {
          employeeId_deviceId: {
            employeeId: employee.id,
            deviceId: cleanDeviceId,
          },
        },
      });

      // If this device has not been verified yet, trigger verification code challenge!
      if (!trustedDevice) {
        try {
          const prep = await ClerkSyncService.prepareEmailOtpVerification({
            email: employee.email,
            name: employee.name,
          });

          const tempToken = signDeviceChallengeToken({
            employeeId: employee.id,
            email: employee.email,
            deviceId: cleanDeviceId,
            emailAddressId: prep.emailAddressId,
            verificationId: prep.verificationId,
          });

          const masked = maskEmail(employee.email);

          return NextResponse.json({
            success: true,
            requiresOtp: true,
            maskedEmail: masked,
            tempToken,
            message: `First-time device login detected. A 6-digit verification code has been sent to ${masked}.`,
          });
        } catch {
          return NextResponse.json(
            {
              success: false,
              error: 'Unable to send verification code. Please try again.',
            },
            { status: 500 }
          );
        }
      }

      // Device is already trusted - update lastUsedAt
      await prisma.employeeDevice.update({
        where: { id: trustedDevice.id },
        data: {
          lastUsedAt: new Date(),
          ...(deviceName ? { deviceName: String(deviceName).trim() } : {}),
        },
      });
    }

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
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to process login. Please try again.' },
      { status: 500 }
    );
  }
}
