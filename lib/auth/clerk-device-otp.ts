import { clerkClient } from '@clerk/nextjs/server';

interface InitiateOtpResult {
  success: boolean;
  clerkSignInId?: string;
  maskedEmail: string;
  error?: string;
}

interface VerifyOtpResult {
  verified: boolean;
  error?: string;
}

function getClerkFrontendApi(): string {
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  if (!pubKey) {
    throw new Error('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not configured');
  }
  const cleanKey = pubKey.replace(/^pk_(test|live)_/, '');
  const decoded = Buffer.from(cleanKey, 'base64').toString('ascii').replace(/\$$/, '');
  return decoded.trim();
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${local[local.length - 1]}@${domain}`;
}

/**
 * Initiates an official Clerk Email OTP challenge for device verification.
 * Dispatches a 6-digit OTP to the employee's registered email via Clerk.
 */
export async function initiateClerkDeviceOtp(
  email: string,
  employeeName?: string,
  deviceName?: string
): Promise<InitiateOtpResult> {
  const masked = maskEmail(email);

  try {
    const fapi = getClerkFrontendApi();
    const cleanEmail = email.trim().toLowerCase();

    // Step 1: Create Sign-In on Clerk Frontend API
    const signInRes = await fetch(`https://${fapi}/v1/client/sign_ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Heeyaku-Backend/1.0',
      },
      body: new URLSearchParams({
        identifier: cleanEmail,
      }),
    });

    const signInData = await signInRes.json();
    const signInObj = signInData.response;

    if (!signInObj || !signInObj.id) {
      const errMsg = signInData.errors?.[0]?.message || 'Could not initiate Clerk verification.';
      throw new Error(errMsg);
    }

    const signInId = signInObj.id;
    const firstFactors = signInObj.supported_first_factors || [];
    const emailFactor = firstFactors.find((f: any) => f.strategy === 'email_code');

    if (!emailFactor) {
      throw new Error('Clerk email_code verification strategy is not available for this account.');
    }

    // Step 2: Prepare First Factor (Clerk dispatches the real 6-digit OTP email)
    const prepRes = await fetch(`https://${fapi}/v1/client/sign_ins/${signInId}/prepare_first_factor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Heeyaku-Backend/1.0',
      },
      body: new URLSearchParams({
        strategy: 'email_code',
        email_address_id: emailFactor.email_address_id,
      }),
    });

    const prepData = await prepRes.json();
    if (prepRes.status >= 400 || prepData.errors?.length) {
      throw new Error('Verification challenge dispatch failed.');
    }

    return {
      success: true,
      clerkSignInId: signInId,
      maskedEmail: emailFactor.safe_identifier ? maskEmail(emailFactor.safe_identifier) : masked,
    };
  } catch {
    return {
      success: false,
      maskedEmail: masked,
      error: 'Unable to send verification code. Please try again.',
    };
  }
}

/**
 * Verifies the 6-digit OTP code against verification engine.
 */
export async function verifyClerkDeviceOtp(
  clerkSignInId: string,
  code: string
): Promise<VerifyOtpResult> {
  try {
    const fapi = getClerkFrontendApi();
    const cleanCode = code.trim().replace(/\s+/g, '');

    const verifyRes = await fetch(`https://${fapi}/v1/client/sign_ins/${clerkSignInId}/attempt_first_factor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Heeyaku-Backend/1.0',
      },
      body: new URLSearchParams({
        strategy: 'email_code',
        code: cleanCode,
      }),
    });

    const verifyData = await verifyRes.json();

    if (verifyRes.status >= 400 || verifyData.errors?.length) {
      return {
        verified: false,
        error: 'Invalid or expired verification code. Please try again.',
      };
    }

    const status = verifyData.response?.status;
    if (status === 'complete' || status === 'needs_second_factor') {
      return { verified: true };
    }

    return {
      verified: false,
      error: 'Verification could not be completed. Please request a new code.',
    };
  } catch {
    return {
      verified: false,
      error: 'Unable to reach verification service. Please try again.',
    };
  }
}

