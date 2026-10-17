import { NextRequest, NextResponse } from 'next/server';
import { verifyDeviceChallengeToken, signDeviceChallengeToken } from '@/lib/auth/employee-token';
import { initiateClerkDeviceOtp } from '@/lib/auth/clerk-device-otp';
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

    const otpResult = await initiateClerkDeviceOtp(challenge.email);
    if (!otpResult.success || !otpResult.clerkSignInId) {
      return NextResponse.json(
        { success: false, error: otpResult.error || 'Failed to dispatch new Clerk code.' },
        { status: 500 }
      );
    }

    const newTempToken = signDeviceChallengeToken({
      employeeId: challenge.employeeId,
      email: challenge.email,
      deviceId: challenge.deviceId,
      clerkSignInId: otpResult.clerkSignInId,
    });

    return NextResponse.json({
      success: true,
      tempToken: newTempToken,
      maskedEmail: otpResult.maskedEmail,
      message: `A new 6-digit code has been sent via Clerk to ${otpResult.maskedEmail}.`,
    });
  } catch (error) {
    console.error('Resend device OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend verification code.' },
      { status: 500 }
    );
  }
}
