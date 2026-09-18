import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
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

    // Log the validated inquiry for operations
    console.log(`[DEMO_REQUEST] [${bookingId}]`, {
      name,
      email,
      phone,
      institute,
      teamSize: teamSize || '5-15',
      primaryInterest: primaryInterest || 'Android CallTracker & CRM',
      preferredSlot: preferredSlot || 'Tomorrow 2:00 PM IST',
      notes: notes || 'None',
      submittedAt: new Date().toISOString(),
      ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
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
