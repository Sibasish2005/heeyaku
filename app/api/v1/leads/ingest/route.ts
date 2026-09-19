import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyExternalApiKey } from '@/lib/auth/external-api';
import { toLast10Digits } from '@/lib/lead/phone';
import { invalidateDashboardMetricsCache } from '@/lib/dashboard/metrics';
import { generateNextLeadCode } from '@/lib/lead/code';

export const dynamic = 'force-dynamic';



/**
 * Public/External REST API for Ingesting Leads into HEEYAKU.
 * Can be called by Web forms, landing pages, Meta Lead Ads webhooks, Zapier, etc.
 * Authentication: Header 'x-api-key: <KEY>' or query '?apiKey=<KEY>'
 */
export async function POST(req: NextRequest) {
  try {
    if (!verifyExternalApiKey(req)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Invalid or missing API key.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawItems = Array.isArray(body.leads)
      ? body.leads
      : Array.isArray(body)
      ? body
      : body.phoneNumber || body.phone
      ? [body]
      : [];

    if (rawItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No lead data provided in request body.' },
        { status: 400 }
      );
    }

    const results: Array<{
      phoneNumber: string;
      leadCode?: string;
      id?: string;
      status: string;
      action: 'created' | 'updated' | 'duplicate_skipped';
    }> = [];

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of rawItems) {
      const rawPhone = String(item.phoneNumber || item.phone || '').trim();
      const last10 = toLast10Digits(rawPhone);

      if (last10.length < 8) {
        continue;
      }

      // Check if lead already exists by 10-digit number
      const existing = await prisma.lead.findFirst({
        where: { phoneNumber: { contains: last10 } },
      });

      if (existing) {
        // Lead exists: optionally append notes if provided
        let newNotes = existing.notes || '';
        if (item.notes && !newNotes.includes(item.notes.trim())) {
          newNotes = newNotes ? `${newNotes}\n[External Note]: ${item.notes.trim()}` : item.notes.trim();
          await prisma.lead.update({
            where: { id: existing.id },
            data: { notes: newNotes, updatedAt: new Date() },
          });
          updatedCount++;
        }

        results.push({
          phoneNumber: existing.phoneNumber,
          leadCode: existing.leadCode,
          id: existing.id,
          status: existing.status,
          action: item.notes ? 'updated' : 'duplicate_skipped',
        });
      } else {
        // Create new lead
        const leadCode = await generateNextLeadCode();
        const created = await prisma.lead.create({
          data: {
            leadCode,
            name: String(item.name || 'New Lead').trim(),
            phoneNumber: rawPhone,
            email: item.email ? String(item.email).trim() : null,
            company: item.company ? String(item.company).trim() : null,
            source: item.source ? String(item.source).trim() : 'EXTERNAL_API',
            notes: item.notes ? String(item.notes).trim() : null,
          },
        });
        createdCount++;

        results.push({
          phoneNumber: created.phoneNumber,
          leadCode: created.leadCode,
          id: created.id,
          status: created.status,
          action: 'created',
        });
      }
    }

    if (createdCount > 0) {
      invalidateDashboardMetricsCache();
    }

    return NextResponse.json({
      success: true,
      createdCount,
      updatedCount,
      leads: results,
    });
  } catch (error: unknown) {
    console.error('[ExternalLeadIngest] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal error processing leads.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
