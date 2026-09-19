'use server';

import Papa from 'papaparse';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { autoDetectColumnMapping, RawImportRow } from '@/lib/lead/import-parser';
import { revalidatePath } from 'next/cache';

export interface SyncSheetResult {
  success: boolean;
  count?: number;
  totalRows?: number;
  duplicateCount?: number;
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
 * Generates a collision-resistant unique lead code.
 */
function generateLeadCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LD-${rand}`;
}

/**
 * Direct 1-click Google Sheet Synchronization Server Action.
 * Fetches the Google Sheet, auto-detects columns, normalizes 10-digit phones,
 * deduplicates against the database, and bulk-inserts new leads.
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

    const res = await fetch(exportUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Heeyaku-CRM/1.0',
      },
      cache: 'no-store',
    });

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

    const mapping = autoDetectColumnMapping(headers);

    if (!mapping.phoneCol) {
      return {
        success: false,
        error: 'Could not find a Phone Number or Mobile column in Row 1 of your Google Sheet.',
      };
    }

    // Clean and validate rows
    const validRowsToInsert: Array<{
      leadCode: string;
      name: string;
      phoneNumber: string;
      email: string | null;
      company: string | null;
      source: string;
      notes: string | null;
    }> = [];

    // Find lead code / sync status columns to instantly skip already-synced rows
    const leadCodeHeader = headers.find((h) => h.toLowerCase().includes('lead code') || h.toLowerCase() === 'code');
    const syncStatusHeader = headers.find((h) => h.toLowerCase().includes('sync'));

    const phoneLookupList: string[] = [];
    const seenPhonesInBatch = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
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

      const cleanDigits = rawPhone.replace(/[^0-9]/g, '');
      const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

      if (!last10 || last10.length < 7) {
        continue;
      }

      if (seenPhonesInBatch.has(last10)) {
        continue;
      }
      seenPhonesInBatch.add(last10);
      phoneLookupList.push(last10);

      const email = mapping.emailCol ? String(row[mapping.emailCol] || '').trim() || null : null;
      const company = mapping.companyCol ? String(row[mapping.companyCol] || '').trim() || null : null;
      const notes = mapping.notesCol ? String(row[mapping.notesCol] || '').trim() || null : null;

      validRowsToInsert.push({
        leadCode: generateLeadCode(),
        name: rawName || `Lead ${last10}`,
        phoneNumber: rawPhone.startsWith('+') ? rawPhone : `+91 ${last10}`,
        email,
        company,
        source: 'GOOGLE_SHEETS',
        notes: notes ? `[Google Sheets] ${notes}` : '[Imported from Google Sheets]',
      });
    }

    if (validRowsToInsert.length === 0) {
      return {
        success: true,
        count: 0,
        totalRows: rows.length,
        duplicateCount: 0,
      };
    }

    // Deduplicate against database in chunks of 100 to protect DB performance
    const existing10Digits = new Set<string>();
    const CHUNK_SIZE = 100;
    for (let c = 0; c < phoneLookupList.length; c += CHUNK_SIZE) {
      const chunk = phoneLookupList.slice(c, c + CHUNK_SIZE);
      const existingLeads = await prisma.lead.findMany({
        where: {
          OR: chunk.map((digits: string) => ({
            phoneNumber: { contains: digits },
          })),
        },
        select: { phoneNumber: true },
      });

      for (const l of existingLeads) {
        const d = l.phoneNumber.replace(/[^0-9]/g, '').slice(-10);
        if (d) existing10Digits.add(d);
      }
    }

    const uniqueNewLeads = validRowsToInsert.filter((lead) => {
      const d = lead.phoneNumber.replace(/[^0-9]/g, '').slice(-10);
      return !existing10Digits.has(d);
    });

    if (uniqueNewLeads.length > 0) {
      // Chunk inserts in batches of 500 for safety
      for (let i = 0; i < uniqueNewLeads.length; i += 500) {
        const insertBatch = uniqueNewLeads.slice(i, i + 500);
        await prisma.lead.createMany({
          data: insertBatch,
          skipDuplicates: true,
        });
      }
    }

    revalidatePath('/admin/leads');

    return {
      success: true,
      count: uniqueNewLeads.length,
      totalRows: rows.length,
      duplicateCount: validRowsToInsert.length - uniqueNewLeads.length,
    };
  } catch (err) {
    console.error('[SyncGoogleSheetDirectAction] Error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected sync error occurred.',
    };
  }
}
