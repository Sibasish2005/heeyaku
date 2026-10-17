import { NextRequest, NextResponse } from 'next/server';
import { verifyDeviceChallengeToken, signDeviceChallengeToken } from '@/lib/auth/employee-token';
import { ClerkSyncService } from '@/lib/auth/clerk-sync';
import { maskEmail } from '@/lib/auth/clerk-device-otp';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/security/rate-limit';

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
    const rateLimitKey = `resend-otp:${ip}`;
    const rateLimit = checkRateLimit(rateLimitKey, { windowMs: 60 * 1000, maxAttempts: 3 });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${rateLimit.resetSeconds} seconds before requesting a new code.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { tempToken, deviceId } = body;

    if (!tempToken) {
      return NextResponse.json(
        { success: false, error: 'Verification session token is required.' },
        { status: 400 }
      );
    }

    const challenge = verifyDeviceChallengeToken(String(tempToken));
    if (!challenge) {
      return NextResponse.json(
        { success: false, error: 'Verification session has expired. Please sign in again.', sessionExpired: true },
        { status: 401 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: challenge.employeeId },
      select: { id: true, name: true, email: true },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee account not found.' },
        { status: 404 }
      );
    }

    const prep = await ClerkSyncService.prepareEmailOtpVerification({
      email: employee.email,
      name: employee.name,
    });

    const newTempToken = signDeviceChallengeToken({
      employeeId: employee.id,
      email: employee.email,
      deviceId: challenge.deviceId,
      emailAddressId: prep.emailAddressId,
      verificationId: prep.verificationId,
    });

    const masked = maskEmail(employee.email);

    return NextResponse.json({
      success: true,
      tempToken: newTempToken,
      maskedEmail: masked,
      message: `A new 6-digit Clerk verification code has been sent to ${masked}.`,
    });
  } catch (error: any) {
    console.error('Resend device OTP error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to resend verification code via Clerk.' },
      { status: 500 }
    );
  }
}

