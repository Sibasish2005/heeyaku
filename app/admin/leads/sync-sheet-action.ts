'use server';

import Papa from 'papaparse';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { autoDetectColumnMapping, RawImportRow } from '@/lib/lead/import-parser';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

const LEAD_CODE_PREFIX = 'LD';
const LEAD_CODE_START = 1;
const LEAD_CODE_PAD = 5;

export interface SyncSheetResult {
  success: boolean;
  count?: number;
  totalRows?: number;
  duplicateCount?: number;
  skippedRows?: number;
  error?: string;
}

/**
 * Extracts the Google Spreadsheet ID and gid from any Google Sheet URL format.
 */
function parseGoogleSheetUrl(url: string): { sheetId: string | null; gid: string } {
  const cleanUrl = url.trim();
  const idMatch = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const sheetId = idMatch ? idMatch[1] : null;

  const gidMatch = cleanUrl.match(/[?&#]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  return { sheetId, gid };
}

/**
 * Gets the next sequential lead code number from the database.
 * Returns the starting number for a batch of codes.
 */
async function getNextLeadCodeStart(): Promise<number> {
  const latest = await prisma.lead.findFirst({
    where: { leadCode: { startsWith: `${LEAD_CODE_PREFIX}-` } },
    orderBy: { createdAt: 'desc' },
    select: { leadCode: true },
  });

  if (!latest) {
    return LEAD_CODE_START;
  }

  const numericPart = parseInt(latest.leadCode.replace(`${LEAD_CODE_PREFIX}-`, ''), 10);
  return isNaN(numericPart) ? LEAD_CODE_START : numericPart + 1;
}

/**
 * Normalizes a phone number to its last 10 digits.
 */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Creates a lightweight hash of CSV content for change detection.
 * Uses only the first 1KB + last 1KB + row count for speed.
 */
function fastContentHash(csv: string, rowCount: number): string {
  const head = csv.slice(0, 1024);
  const tail = csv.slice(-1024);
  return crypto
    .createHash('md5')
    .update(`${rowCount}:${head}:${tail}`)
    .digest('hex');
}

/**
 * Optimized Google Sheet Sync — Option A: Hash-based dedup + exact phone match.
 *
 * Key optimizations over the previous version:
 * 1. SINGLE DB QUERY for dedup — loads all phoneDigits from source=GOOGLE_SHEETS into
 *    an in-memory Set, instead of 1000+ chunked `contains` queries.
 * 2. EXACT MATCH via phoneDigits — uses the indexed `phoneDigits` column instead of
 *    slow `LIKE`/`contains` pattern matching.
 * 3. CONTENT HASH — skips the entire sync if the sheet hasn't changed since last time.
 * 4. ROW WATERMARK — skips already-processed rows using the stored lastRowCount.
 * 5. BATCH INSERT with phoneDigits — writes the normalized digits alongside the lead.
 */
export async function syncGoogleSheetDirectAction(customUrl?: string): Promise<SyncSheetResult> {
  try {
    await assertAdminAccess();

    const targetUrl =
      customUrl?.trim() ||
      process.env.GOOGLE_SHEET_URL?.trim() ||
      'https://docs.google.com/spreadsheets/d/1b4y4a0PKJGuzSuR-XFL68GsH-oZ_VVWKIkwL452tJ-w/edit?gid=125246248#gid=125246248';

    const { sheetId, gid } = parseGoogleSheetUrl(targetUrl);

    if (!sheetId) {
      return {
        success: false,
        error: 'Invalid Google Sheet URL configured.',
      };
    }

    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

    const signal = AbortSignal.timeout(15000);
    let res = await fetch(exportUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Heeyaku-CRM/1.0',
      },
      cache: 'no-store',
      redirect: 'manual',
      signal,
    });

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get('location');
      if (!location) {
        return { success: false, error: 'Redirect received without location header from Google.' };
      }
      const redirectUrl = new URL(location, exportUrl);
      const isAllowedGoogleDomain =
        redirectUrl.protocol === 'https:' &&
        (redirectUrl.hostname === 'docs.google.com' ||
          redirectUrl.hostname.endsWith('.googleusercontent.com') ||
          redirectUrl.hostname.endsWith('.google.com'));

      if (!isAllowedGoogleDomain) {
        return { success: false, error: 'Untrusted redirect destination detected.' };
      }

      res = await fetch(redirectUrl.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'Heeyaku-CRM/1.0',
        },
        cache: 'no-store',
        signal,
      });
    }

    if (res.status === 401 || res.status === 403 || res.headers.get('content-type')?.includes('text/html')) {
      return {
        success: false,
        error: 'Something went wrong while syncing. Please try again.',
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: 'Something went wrong while syncing. Please try again.',
      };
    }

    const csvText = await res.text();

    if (!csvText || !csvText.trim()) {
      return {
        success: false,
        error: 'Google Sheet appears to be empty.',
      };
    }

    // Parse CSV
    const parsed = Papa.parse<RawImportRow>(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
    });

    const headers = parsed.meta.fields || [];
    const rows = parsed.data || [];

    if (headers.length === 0 || rows.length === 0) {
      return {
        success: false,
        error: 'No data rows found in Google Sheet.',
      };
    }

    // ──────────────────────────────────────────────────────────
    // OPTIMIZATION 1: Content hash — skip if sheet unchanged
    // ──────────────────────────────────────────────────────────
    const contentHash = fastContentHash(csvText, rows.length);
    const syncMeta = await prisma.syncMeta.findUnique({
      where: { syncType: 'google_sheets' },
    });

    if (syncMeta?.sheetHash === contentHash) {
      return {
        success: true,
        count: 0,
        totalRows: rows.length,
        duplicateCount: 0,
        skippedRows: rows.length,
      };
    }

    const mapping = autoDetectColumnMapping(headers);

    if (!mapping.phoneCol) {
      return {
        success: false,
        error: 'Could not find a Phone Number or Mobile column in Row 1 of your Google Sheet.',
      };
    }

    // ──────────────────────────────────────────────────────────
    // OPTIMIZATION 2: Row watermark — skip already-synced rows
    // Only process rows beyond the last known row count.
    // ──────────────────────────────────────────────────────────
    const startFromRow = syncMeta?.lastRowCount ?? 0;

    // Find lead code / sync status columns for instant skip
    const leadCodeHeader = headers.find((h) => h.toLowerCase().includes('lead code') || h.toLowerCase() === 'code');
    const syncStatusHeader = headers.find((h) => h.toLowerCase().includes('sync'));

    const candidateLeads: Array<{
      leadCode: string;
      name: string;
      phoneNumber: string;
      phoneDigits: string;
      email: string | null;
      company: string | null;
      source: string;
      notes: string | null;
    }> = [];

    const seenPhonesInBatch = new Set<string>();

    for (let i = startFromRow; i < rows.length; i++) {
      const row = rows[i];

      // Instant skip if row is already marked synced or has a lead code
      if (syncStatusHeader && String(row[syncStatusHeader] || '').trim().toLowerCase() === 'synced') {
        continue;
      }
      if (leadCodeHeader && String(row[leadCodeHeader] || '').trim().startsWith('LD-')) {
        continue;
      }

      const rawPhone = String(row[mapping.phoneCol] || '').trim();
      const rawName = mapping.nameCol ? String(row[mapping.nameCol] || '').trim() : '';

      const digits10 = normalizePhone(rawPhone);

      if (!digits10 || digits10.length < 7) {
        continue;
      }

      if (seenPhonesInBatch.has(digits10)) {
        continue;
      }
      seenPhonesInBatch.add(digits10);

      const email = mapping.emailCol ? String(row[mapping.emailCol] || '').trim() || null : null;
      const company = mapping.companyCol ? String(row[mapping.companyCol] || '').trim() || null : null;
      const notes = mapping.notesCol ? String(row[mapping.notesCol] || '').trim() || null : null;

      candidateLeads.push({
        leadCode: '', // Will be assigned sequentially after dedup
        name: rawName || `Lead ${digits10}`,
        phoneNumber: rawPhone.startsWith('+') ? rawPhone : `+91 ${digits10}`,
        phoneDigits: digits10,
        email,
        company,
        source: 'GOOGLE_SHEETS',
        notes: notes ? `[Google Sheets] ${notes}` : '[Imported from Google Sheets]',
      });
    }

    if (candidateLeads.length === 0) {
      // Update sync metadata even if no new leads
      await prisma.syncMeta.upsert({
        where: { syncType: 'google_sheets' },
        create: {
          syncType: 'google_sheets',
          lastRowCount: rows.length,
          sheetHash: contentHash,
          lastSyncedAt: new Date(),
        },
        update: {
          lastRowCount: rows.length,
          sheetHash: contentHash,
          lastSyncedAt: new Date(),
        },
      });

      return {
        success: true,
        count: 0,
        totalRows: rows.length,
        duplicateCount: 0,
        skippedRows: startFromRow,
      };
    }

    // ──────────────────────────────────────────────────────────
    // OPTIMIZATION 3: Single bulk query for dedup
    // Instead of 1000+ chunked `contains` queries, load ALL
    // existing phoneDigits into an in-memory Set with ONE query.
    // For 1 lakh leads, this is ~1MB of memory and ~200ms.
    // ──────────────────────────────────────────────────────────
    const existingPhones = await prisma.lead.findMany({
      where: {
        phoneDigits: {
          in: Array.from(seenPhonesInBatch),
        },
      },
      select: { phoneDigits: true },
    });

    const existingDigitsSet = new Set(
      existingPhones
        .map((l) => l.phoneDigits)
        .filter((d): d is string => d !== null)
    );

    const uniqueNewLeads = candidateLeads.filter(
      (lead) => !existingDigitsSet.has(lead.phoneDigits)
    );

    const duplicateCount = candidateLeads.length - uniqueNewLeads.length;

    if (uniqueNewLeads.length > 0) {
      // Assign sequential lead codes: LD-00001, LD-00002, ...
      const nextCodeStart = await getNextLeadCodeStart();
      for (let i = 0; i < uniqueNewLeads.length; i++) {
        uniqueNewLeads[i].leadCode = `${LEAD_CODE_PREFIX}-${String(nextCodeStart + i).padStart(LEAD_CODE_PAD, '0')}`;
      }

      // Batch insert in chunks of 500
      for (let i = 0; i < uniqueNewLeads.length; i += 500) {
        const insertBatch = uniqueNewLeads.slice(i, i + 500);
        await prisma.lead.createMany({
          data: insertBatch,
          skipDuplicates: true,
        });
      }
    }

    // ──────────────────────────────────────────────────────────
    // Update sync watermark
    // ──────────────────────────────────────────────────────────
    await prisma.syncMeta.upsert({
      where: { syncType: 'google_sheets' },
      create: {
        syncType: 'google_sheets',
        lastRowCount: rows.length,
        sheetHash: contentHash,
        lastSyncedAt: new Date(),
      },
      update: {
        lastRowCount: rows.length,
        sheetHash: contentHash,
        lastSyncedAt: new Date(),
      },
    });

    revalidatePath('/admin/leads');

    return {
      success: true,
      count: uniqueNewLeads.length,
      totalRows: rows.length,
      duplicateCount,
      skippedRows: startFromRow,
    };
  } catch (err) {
    console.error('[SyncGoogleSheetDirectAction] Error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected sync error occurred.',
    };
  }
}
