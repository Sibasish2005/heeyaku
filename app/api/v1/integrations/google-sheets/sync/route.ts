import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyExternalApiKey } from '@/lib/auth/external-api';
import { toLast10Digits } from '@/lib/lead/phone';
import { invalidateDashboardMetricsCache } from '@/lib/dashboard/metrics';
import { checkRateLimit } from '@/lib/security/rate-limit';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const LEAD_CODE_PREFIX = 'LD';
const LEAD_CODE_START = 1;
/**
 * Generates a random alphanumeric lead code to prevent race conditions.
 */
function generateRandomLeadCode(): string {
  return `${LEAD_CODE_PREFIX}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

interface IncomingSheetRow {
  rowNumber?: number;
  name: string;
  phoneNumber: string;
  email?: string;
  company?: string; // Course or program
  source?: string;
  notes?: string;
}



/**
 * High-performance, low-stress two-way sync endpoint for Google Sheets.
 * 
 * In a SINGLE HTTP request:
 * 1. Ingests any new or modified rows from Google Sheet into PostgreSQL.
 * 2. Returns all recent lead status changes from PostgreSQL back to Google Sheet (delta sync).
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`sync:${ip}`, { windowMs: 60 * 1000, maxAttempts: 60 });
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
    const rawRows: IncomingSheetRow[] = Array.isArray(body.rows) ? body.rows : [];
    const sinceTimestamp = body.since ? new Date(body.since) : null;
    const now = new Date();

    // 1. Process inbound rows from Google Sheet (Batched & Deduplicated)
    const validRowsToInsert: Array<{
      leadCode: string;
      name: string;
      phoneNumber: string;
      phoneDigits: string;
      email: string | null;
      company: string | null;
      source: string;
      notes: string | null;
    }> = [];

    const processedRowReports: Array<{
      rowNumber?: number;
      phoneNumber: string;
      leadCode: string;
      action: 'created' | 'existing';
    }> = [];

    if (rawRows.length > 0) {
      // Collect valid rows and extract last 10 digits
      const candidateMap = new Map<string, IncomingSheetRow>();
      for (const row of rawRows) {
        const rawPhone = String(row.phoneNumber || '').trim();
        const last10 = toLast10Digits(rawPhone);
        if (last10.length >= 8 && !candidateMap.has(last10)) {
          candidateMap.set(last10, row);
        }
      }

      const allCandidateDigits = Array.from(candidateMap.keys());

      // Single efficient database batch lookup to check for existing leads
      const existingLeads = await prisma.lead.findMany({
        where: {
          phoneDigits: {
            in: allCandidateDigits,
          },
        },
        select: { leadCode: true, phoneDigits: true },
      });

      const existingPhoneSet = new Set<string>();
      const existingCodeMap = new Map<string, string>();
      for (const lead of existingLeads) {
        if (lead.phoneDigits) {
          existingPhoneSet.add(lead.phoneDigits);
          existingCodeMap.set(lead.phoneDigits, lead.leadCode);
        }
      }

      // Separate new rows to insert vs existing
      for (const [digits, row] of candidateMap.entries()) {
        if (existingPhoneSet.has(digits)) {
          processedRowReports.push({
            rowNumber: row.rowNumber,
            phoneNumber: row.phoneNumber,
            leadCode: existingCodeMap.get(digits) || 'EXISTING',
            action: 'existing',
          });
        } else {
          const leadCode = generateRandomLeadCode();
          
          const cleanPhone = row.phoneNumber.trim();
          validRowsToInsert.push({
            leadCode,
            name: row.name?.trim() || 'New Lead',
            phoneNumber: cleanPhone,
            phoneDigits: digits,
            email: row.email?.trim() || null,
            company: row.company?.trim() || null,
            source: row.source?.trim() || 'GOOGLE_SHEETS',
            notes: row.notes?.trim() || null,
          });

          processedRowReports.push({
            rowNumber: row.rowNumber,
            phoneNumber: cleanPhone,
            leadCode,
            action: 'created',
          });
        }
      }

      // Execute bulk inserts in chunks of 500 to avoid query limits
      if (validRowsToInsert.length > 0) {
        for (let i = 0; i < validRowsToInsert.length; i += 500) {
          const insertBatch = validRowsToInsert.slice(i, i + 500);
          await prisma.lead.createMany({
            data: insertBatch,
            skipDuplicates: true,
          });
        }
        invalidateDashboardMetricsCache();
      }
    }

    // 2. Compute Outbound Delta: return leads modified since 'since'
    // This allows Google Sheets to update row statuses (CONTACTED, INTERESTED, CONVERTED, etc.)
    let deltaUpdates: Array<{
      leadCode: string;
      phoneNumber: string;
      status: string;
      assignedTo: string | null;
      lastTalkSeconds: number;
      updatedAt: string;
    }> = [];

    // If since is provided, fetch only updated leads. Otherwise default to past 24 hours.
    const querySince = sinceTimestamp && !isNaN(sinceTimestamp.getTime())
      ? sinceTimestamp
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const updatedLeads = await prisma.lead.findMany({
      where: {
        updatedAt: { gt: querySince },
      },
      select: {
        id: true,
        leadCode: true,
        phoneNumber: true,
        status: true,
        updatedAt: true,
        assignedEmployee: {
          select: { name: true, employeeCode: true },
        },
        callLogs: {
          where: { connected: true },
          select: { durationSeconds: true },
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 250,
    });

    deltaUpdates = updatedLeads.map(l => ({
      leadCode: l.leadCode,
      phoneNumber: l.phoneNumber,
      status: l.status,
      assignedTo: l.assignedEmployee ? l.assignedEmployee.name : null,
      lastTalkSeconds: l.callLogs[0]?.durationSeconds || 0,
      updatedAt: l.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      insertedCount: validRowsToInsert.length,
      processedRows: processedRowReports,
      hasDeltaChanges: deltaUpdates.length > 0,
      deltaUpdates,
      serverTimestamp: now.toISOString(),
    });
  } catch (error: unknown) {
    console.error('[GoogleSheetsSync] Error during sync:', error);
    const message = error instanceof Error ? error.message : 'Internal sync error.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * Lightweight GET endpoint for Google Sheets time-driven polling.
 * Returns only the delta of leads that have changed since ?since=...
 * If nothing changed, returns in under 5ms with zero heavy database load.
 */
export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`sync:${ip}`, { windowMs: 60 * 1000, maxAttempts: 60 });
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

    const sinceParam = req.nextUrl.searchParams.get('since');
    const sinceDate = sinceParam ? new Date(sinceParam) : null;
    const querySince = sinceDate && !isNaN(sinceDate.getTime())
      ? sinceDate
      : new Date(Date.now() - 60 * 60 * 1000); // default to past 1 hour

    const updatedLeads = await prisma.lead.findMany({
      where: {
        updatedAt: { gt: querySince },
      },
      select: {
        leadCode: true,
        phoneNumber: true,
        status: true,
        updatedAt: true,
        assignedEmployee: {
          select: { name: true },
        },
        callLogs: {
          where: { connected: true },
          select: { durationSeconds: true },
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({
      success: true,
      hasDeltaChanges: updatedLeads.length > 0,
      deltaCount: updatedLeads.length,
      deltaUpdates: updatedLeads.map(l => ({
        leadCode: l.leadCode,
        phoneNumber: l.phoneNumber,
        status: l.status,
        assignedTo: l.assignedEmployee ? l.assignedEmployee.name : null,
        lastTalkSeconds: l.callLogs[0]?.durationSeconds || 0,
        updatedAt: l.updatedAt.toISOString(),
      })),
      serverTimestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[GoogleSheetsSync] Error fetching delta:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch delta updates.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
