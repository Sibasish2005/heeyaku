import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown-ip';
    const rateLimit = checkRateLimit(`demo:${ip}`, { windowMs: 60 * 1000, maxAttempts: 5 });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many demo requests. Please wait ${rateLimit.resetSeconds} seconds before trying again.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
          },
        }
      );
    }

    const body = await req.json();
    const { name, email, phone, institute, teamSize, primaryInterest, preferredSlot, notes } = body;

    if (!name || !email || !phone || !institute) {
      return NextResponse.json(
        { error: 'Please provide name, email, phone, and institute name.' },
        { status: 400 }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid work email address.' },
        { status: 400 }
      );
    }

    const bookingId = `HKU-DEMO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Mask sensitive PII for operations logging
    const maskedPhone = String(phone).length > 4 ? `***-${String(phone).slice(-4)}` : '***';
    const [emailUser = '', emailDomain = ''] = String(email).split('@');
    const maskedEmail = emailDomain ? `${emailUser.slice(0, 1)}***@${emailDomain}` : '***';

    console.log(`[DEMO_REQUEST] [${bookingId}]`, {
      name,
      email: maskedEmail,
      phone: maskedPhone,
      institute,
      teamSize: teamSize || '5-15',
      primaryInterest: primaryInterest || 'Android CallTracker & CRM',
      preferredSlot: preferredSlot || 'Tomorrow 2:00 PM IST',
      notes: notes ? 'Provided' : 'None',
      submittedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      bookingId,
      message: 'Demo request received successfully. Our solutions team will contact you within 2 business hours.',
    });
  } catch (error) {
    console.error('[DEMO_REQUEST_ERROR]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your demo request.' },
      { status: 500 }
    );
  }
}
