import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyDeviceChallengeToken, signEmployeeToken } from '@/lib/auth/employee-token';
import { ClerkSyncService } from '@/lib/auth/clerk-sync';
import { checkRateLimit, resetRateLimit } from '@/lib/security/rate-limit';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, x-employee-token',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown-ip';
    const rateLimitKey = `verify-otp:${ip}`;
    const rateLimit = checkRateLimit(rateLimitKey, { windowMs: 60 * 1000, maxAttempts: 10 });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many verification attempts. Please wait ${rateLimit.resetSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { tempToken, code, deviceId, deviceName } = body;

    if (!tempToken || !code || !deviceId) {
      return NextResponse.json(
        { success: false, error: 'Verification token, 6-digit code, and deviceId are required.' },
        { status: 400 }
      );
    }

    // Step 1: Validate temporary challenge token
    const challenge = verifyDeviceChallengeToken(String(tempToken));
    if (!challenge) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification session expired or invalid. Please sign in again.',
          sessionExpired: true,
        },
        { status: 401 }
      );
    }

    const cleanDeviceId = String(deviceId).trim();
    if (challenge.deviceId !== cleanDeviceId) {
      return NextResponse.json(
        { success: false, error: 'Device identity mismatch. Please try signing in again.' },
        { status: 400 }
      );
    }

    // Step 2: Verify the 6-digit code
    const verification = await ClerkSyncService.attemptEmailOtpVerification({
      emailAddressId: challenge.emailAddressId,
      verificationId: challenge.verificationId,
      code: String(code).trim(),
    });

    if (!verification.verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired verification code. Please try again.',
        },
        { status: 400 }
      );
    }

    // Step 3: Fetch active employee record
    const employee = await prisma.employee.findUnique({
      where: { id: challenge.employeeId },
      include: {
        teamGroup: true,
        company: true,
      },
    });

    if (!employee || !employee.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is inactive or not found.' },
        { status: 401 }
      );
    }

    if (employee.company && employee.company.status === 'SUSPENDED_BY_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Your workspace has been suspended.' },
        { status: 403 }
      );
    }

    // Step 4: Register / Bind this device as trusted for this employee
    await prisma.employeeDevice.upsert({
      where: {
        employeeId_deviceId: {
          employeeId: employee.id,
          deviceId: cleanDeviceId,
        },
      },
      update: {
        lastUsedAt: new Date(),
        ...(deviceName ? { deviceName: String(deviceName).trim() } : {}),
      },
      create: {
        employeeId: employee.id,
        deviceId: cleanDeviceId,
        deviceName: deviceName ? String(deviceName).trim() : 'Android Device',
        verifiedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });

    // Reset rate limiter
    resetRateLimit(rateLimitKey);

    // Step 5: Issue official signed session token
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
      deviceVerified: true,
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
      { success: false, error: 'Unable to complete verification. Please try again.' },
      { status: 500 }
    );
  }
}
