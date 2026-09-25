import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyExternalApiKey } from '@/lib/auth/external-api';
import { toLast10Digits } from '@/lib/lead/phone';
import { invalidateDashboardMetricsCache } from '@/lib/dashboard/metrics';
import { generateNextLeadCode } from '@/lib/lead/code';
import { checkRateLimit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

const MAX_INGEST_BATCH = 500;

interface IngestItem {
  phoneNumber?: string;
  phone?: string;
  name?: string;
  email?: string;
  company?: string;
  source?: string;
  notes?: string;
}

/**
 * Public/External REST API for Ingesting Leads into HEEYAKU.
 * Can be called by Web forms, landing pages, Meta Lead Ads webhooks, Zapier, etc.
 * Authentication: Header 'x-api-key: <KEY>' or query '?apiKey=<KEY>'
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown-ip';
    const rateLimit = checkRateLimit(`ingest:${ip}`, { windowMs: 60 * 1000, maxAttempts: 60 });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.resetSeconds) } }
      );
    }

    if (!verifyExternalApiKey(req)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Invalid or missing API key.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawItems: IngestItem[] = Array.isArray(body.leads)
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

    if (rawItems.length > MAX_INGEST_BATCH) {
      return NextResponse.json(
        { success: false, error: `Batch size exceeds limit of ${MAX_INGEST_BATCH} leads per request.` },
        { status: 413 }
      );
    }

    // 1. Extract valid last-10-digit phone candidates
    const validItems: Array<{ item: IngestItem; rawPhone: string; last10: string }> = [];
    const candidateDigitsSet = new Set<string>();

    for (const item of rawItems) {
      const rawPhone = String(item.phoneNumber || item.phone || '').trim();
      const last10 = toLast10Digits(rawPhone);
      if (last10.length >= 8) {
        validItems.push({ item, rawPhone, last10 });
        candidateDigitsSet.add(last10);
      }
    }

    if (validItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid phone numbers found in the provided payload.' },
        { status: 400 }
      );
    }

    // 2. High-performance batch lookup using indexed phoneDigits
    const existingLeads = await prisma.lead.findMany({
      where: {
        phoneDigits: { in: Array.from(candidateDigitsSet) },
      },
    });

    const existingMap = new Map<string, typeof existingLeads[0]>();
    for (const el of existingLeads) {
      if (el.phoneDigits) {
        existingMap.set(el.phoneDigits, el);
      }
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

    // Pre-calculate sequential lead code starting number once
    const latestLead = await prisma.lead.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { leadCode: true },
    });

    let currentLeadNumber = 1;
    if (latestLead && latestLead.leadCode.startsWith('LD-')) {
      const parsed = parseInt(latestLead.leadCode.replace('LD-', ''), 10);
      if (!isNaN(parsed)) {
        currentLeadNumber = parsed + 1;
      }
    }

    const recordsToInsert: Array<{
      id: string;
      leadCode: string;
      name: string;
      phoneNumber: string;
      phoneDigits: string;
      email: string | null;
      company: string | null;
      source: string;
      notes: string | null;
    }> = [];
    const updateOperations: any[] = [];

    for (const { item, rawPhone, last10 } of validItems) {
      const existing = existingMap.get(last10);

      if (existing) {
        // Lead exists: append notes if provided and not redundant
        let newNotes = existing.notes || '';
        const itemNote = item.notes?.trim();
        if (itemNote && !newNotes.includes(itemNote)) {
          newNotes = newNotes ? `${newNotes}\n[External Note]: ${itemNote}` : itemNote;
          updateOperations.push(
            prisma.lead.update({
              where: { id: existing.id },
              data: { notes: newNotes, updatedAt: new Date() },
            })
          );
          updatedCount++;
        }

        results.push({
          phoneNumber: existing.phoneNumber,
          leadCode: existing.leadCode,
          id: existing.id,
          status: existing.status,
          action: itemNote ? 'updated' : 'duplicate_skipped',
        });
      } else {
        const leadId = crypto.randomUUID();
        const leadCode = `LD-${String(currentLeadNumber++).padStart(5, '0')}`;
        const newRecord = {
          id: leadId,
          leadCode,
          name: String(item.name || 'New Lead').trim(),
          phoneNumber: rawPhone,
          phoneDigits: last10,
          email: item.email ? String(item.email).trim() : null,
          company: item.company ? String(item.company).trim() : null,
          source: item.source ? String(item.source).trim() : 'EXTERNAL_API',
          notes: item.notes ? String(item.notes).trim() : null,
        };

        recordsToInsert.push(newRecord);
        existingMap.set(last10, { ...newRecord, status: 'NEW', createdAt: new Date(), updatedAt: new Date(), assignedEmployeeId: null, assignedAt: null });
        createdCount++;

        results.push({
          phoneNumber: newRecord.phoneNumber,
          leadCode: newRecord.leadCode,
          id: newRecord.id,
          status: 'NEW',
          action: 'created',
        });
      }
    }

    // Execute bulk insertion in batches of 1000
    const INSERT_BATCH_SIZE = 1000;
    for (let i = 0; i < recordsToInsert.length; i += INSERT_BATCH_SIZE) {
      const batch = recordsToInsert.slice(i, i + INSERT_BATCH_SIZE);
      await prisma.lead.createMany({
        data: batch,
      });
    }

    if (updateOperations.length > 0) {
      await prisma.$transaction(updateOperations);
    }

    if (createdCount > 0 || updatedCount > 0) {
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
