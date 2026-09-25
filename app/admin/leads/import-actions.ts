'use server';

import Papa from 'papaparse';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { normalizePhoneNumber, isValidPhoneNumber, zodPhoneNumberSchema } from '@/lib/lead/phone';
import { RawImportRow, parseGoogleSheetUrl } from '@/lib/lead/import-parser';
import { revalidatePath } from 'next/cache';

export interface PreparedImportLead {
  rowNumber: number;
  name: string;
  phoneNumber: string;
  normalizedPhone: string;
  email?: string;
  company?: string;
  source?: string;
  notes?: string;
}

export interface DuplicateReport {
  rowNumber: number;
  name: string;
  phoneNumber: string;
  reason: string;
  existingLeadCode?: string;
}

export interface InvalidRowReport {
  rowNumber: number;
  name: string;
  phoneNumber: string;
  error: string;
}

export interface ImportPreviewResult {
  totalRows: number;
  validRows: PreparedImportLead[];
  duplicates: DuplicateReport[];
  invalidRows: InvalidRowReport[];
}

export interface FetchGoogleSheetResult {
  sheetTitle: string;
  headers: string[];
  rows: RawImportRow[];
}

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Validates imported rows, normalizes phone numbers, and performs duplicate detection
 * both within the file and against the Supabase database.
 */
export async function validateAndPreviewImportAction(
  rows: Array<{
    rowNumber: number;
    name: string;
    phoneNumber: string;
    email?: string;
    company?: string;
    source?: string;
    notes?: string;
  }>
): Promise<ActionResponse<ImportPreviewResult>> {
  try {
    await assertAdminAccess();

    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: false, error: 'No data rows provided for import.' };
    }

    if (rows.length > 25000) {
      return {
        success: false,
        error: 'File exceeds maximum upload batch size of 25,000 rows. Please split into smaller files.',
      };
    }

    const validCandidates: PreparedImportLead[] = [];
    const invalidRows: InvalidRowReport[] = [];
    const duplicates: DuplicateReport[] = [];

    const seenInFilePhones = new Set<string>();

    for (const row of rows) {
      const trimmedName = (row.name || '').trim();
      const rawPhone = (row.phoneNumber || '').toString().trim();

      // Validate required fields
      if (!trimmedName) {
        invalidRows.push({
          rowNumber: row.rowNumber,
          name: '',
          phoneNumber: rawPhone,
          error: 'Prospect name is missing or empty.',
        });
        continue;
      }

      const phoneValidation = zodPhoneNumberSchema.safeParse(rawPhone);
      if (!phoneValidation.success) {
        invalidRows.push({
          rowNumber: row.rowNumber,
          name: trimmedName,
          phoneNumber: rawPhone,
          error: 'Missing or invalid phone number (must be exactly 10 digits).',
        });
        continue;
      }

      const normalizedPhone = phoneValidation.data;

      // Check duplicate within the uploaded file
      if (seenInFilePhones.has(normalizedPhone)) {
        duplicates.push({
          rowNumber: row.rowNumber,
          name: trimmedName,
          phoneNumber: rawPhone,
          reason: 'Duplicate phone number found within this upload file.',
        });
        continue;
      }

      seenInFilePhones.add(normalizedPhone);

      validCandidates.push({
        rowNumber: row.rowNumber,
        name: trimmedName,
        phoneNumber: rawPhone,
        normalizedPhone,
        email: (row.email || '').trim() || undefined,
        company: (row.company || '').trim() || undefined,
        source: (row.source || '').trim() || 'File Import',
        notes: (row.notes || '').trim() || undefined,
      });
    }

    // Check duplicate against existing database records in chunks to prevent query parameter limits
    const allCandidatePhones = Array.from(
      new Set([...validCandidates.map((c) => c.normalizedPhone), ...validCandidates.map((c) => c.phoneNumber)])
    );

    const existingPhoneMap = new Map<string, string>();
    const QUERY_CHUNK_SIZE = 2000;
    for (let i = 0; i < allCandidatePhones.length; i += QUERY_CHUNK_SIZE) {
      const phoneChunk = allCandidatePhones.slice(i, i + QUERY_CHUNK_SIZE);
      const existingLeads = await prisma.lead.findMany({
        where: {
          phoneNumber: { in: phoneChunk },
        },
        select: {
          leadCode: true,
          phoneNumber: true,
          name: true,
        },
      });

      for (const lead of existingLeads) {
        existingPhoneMap.set(lead.phoneNumber, lead.leadCode);
        existingPhoneMap.set(normalizePhoneNumber(lead.phoneNumber), lead.leadCode);
      }
    }

    const finalValidRows: PreparedImportLead[] = [];

    for (const candidate of validCandidates) {
      const existingCode =
        existingPhoneMap.get(candidate.normalizedPhone) ||
        existingPhoneMap.get(candidate.phoneNumber);

      if (existingCode) {
        duplicates.push({
          rowNumber: candidate.rowNumber,
          name: candidate.name,
          phoneNumber: candidate.phoneNumber,
          reason: `Lead already exists in database with Lead ID ${existingCode}.`,
          existingLeadCode: existingCode,
        });
      } else {
        finalValidRows.push(candidate);
      }
    }

    return {
      success: true,
      data: {
        totalRows: rows.length,
        validRows: finalValidRows,
        duplicates,
        invalidRows,
      },
    };
  } catch (error) {
    console.error('Error previewing lead import:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate import file.',
    };
  }
}

/**
 * Inserts valid leads into Supabase with generated sequential lead codes and optional assignment.
 */
export async function executeImportAction(input: {
  leads: PreparedImportLead[];
  assignedEmployeeId?: string;
}): Promise<ActionResponse<{ insertedCount: number; assignedEmployeeName?: string }>> {
  try {
    await assertAdminAccess();

    const { leads, assignedEmployeeId } = input;

    if (!leads || leads.length === 0) {
      return { success: false, error: 'No valid leads selected for import.' };
    }

    let targetEmployeeId: string | null = null;
    let targetEmployeeName: string | undefined = undefined;
    let assignedAt: Date | null = null;
    let initialStatus: 'NEW' | 'ASSIGNED' = 'NEW';

    if (assignedEmployeeId && assignedEmployeeId.trim() !== '') {
      const employee = await prisma.employee.findUnique({
        where: { id: assignedEmployeeId },
        select: { id: true, name: true, employeeCode: true, isActive: true },
      });

      if (!employee) {
        return { success: false, error: 'Selected employee not found.' };
      }
      if (!employee.isActive) {
        return { success: false, error: 'Cannot assign imported leads to a deactivated employee.' };
      }

      targetEmployeeId = employee.id;
      targetEmployeeName = `${employee.name} (${employee.employeeCode})`;
      assignedAt = new Date();
      initialStatus = 'ASSIGNED';
    }

    // Determine sequential lead codes
    const latestLead = await prisma.lead.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { leadCode: true },
    });

    let currentNumber = 1;
    if (latestLead && latestLead.leadCode.startsWith('LD-')) {
      const parsed = parseInt(latestLead.leadCode.replace('LD-', ''), 10);
      if (!isNaN(parsed)) {
        currentNumber = parsed + 1;
      }
    }

    const recordsToInsert = leads.map((lead, idx) => ({
      leadCode: `LD-${String(currentNumber + idx).padStart(5, '0')}`,
      name: lead.name,
      phoneNumber: lead.phoneNumber,
      phoneDigits: lead.normalizedPhone || normalizePhoneNumber(lead.phoneNumber),
      email: lead.email || null,
      company: lead.company || null,
      source: lead.source || 'File Import',
      status: initialStatus,
      notes: lead.notes || null,
      assignedEmployeeId: targetEmployeeId,
      assignedAt,
    }));

    // Perform database insertion in batches of 1,000 to stay well under Postgres parameter limits
    const INSERT_BATCH_SIZE = 1000;
    for (let i = 0; i < recordsToInsert.length; i += INSERT_BATCH_SIZE) {
      const batch = recordsToInsert.slice(i, i + INSERT_BATCH_SIZE);
      await prisma.lead.createMany({
        data: batch,
      });
    }

    revalidatePath('/admin/leads');
    revalidatePath('/admin/dashboard');
    if (targetEmployeeId) {
      revalidatePath(`/admin/employees/${targetEmployeeId}`);
    }

    return {
      success: true,
      data: {
        insertedCount: recordsToInsert.length,
        assignedEmployeeName: targetEmployeeName,
      },
    };
  } catch (error) {
    console.error('Error executing lead import:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to insert imported leads.',
    };
  }
}

/**
 * Server action to fetch public Google Sheet CSV data and return column headers and rows.
 */
export async function fetchGoogleSheetDataAction(
  sheetUrl: string
): Promise<ActionResponse<FetchGoogleSheetResult>> {
  try {
    await assertAdminAccess();

    const parsedUrl = parseGoogleSheetUrl(sheetUrl);
    if ('error' in parsedUrl) {
      return { success: false, error: parsedUrl.error };
    }

    const signal = AbortSignal.timeout(15000);
    let res = await fetch(parsedUrl.exportUrl, {
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
      const redirectUrl = new URL(location, parsedUrl.exportUrl);
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

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        error: 'Access denied. Please click "Share" in Google Sheets and set General access to "Anyone with the link can view".',
      };
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      return {
        success: false,
        error: 'The Google Sheet requires sign-in. In Google Sheets, click "Share" and change General access to "Anyone with the link can view" (Viewer).',
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: `Could not fetch spreadsheet from Google (HTTP ${res.status}). Please check the link.`,
      };
    }

    const csvText = await res.text();
    if (!csvText || !csvText.trim()) {
      return {
        success: false,
        error: 'The Google Sheet is empty or contains no readable data.',
      };
    }

    const parsed = Papa.parse<RawImportRow>(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
    });

    const headers = (parsed.meta.fields || []).filter((h) => h && h.trim().length > 0);
    const rows = (parsed.data || []).filter((row) => {
      return Object.values(row).some((val) => val !== undefined && val !== null && String(val).trim() !== '');
    });

    if (headers.length === 0 || rows.length === 0) {
      return {
        success: false,
        error: 'No data rows or column headers found in this Google Sheet tab. Please ensure Row 1 has headers.',
      };
    }

    let sheetTitle = parsedUrl.sheetIdentifier;
    const contentDisposition = res.headers.get('content-disposition');
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        sheetTitle = decodeURIComponent(match[1].replace(/\.csv$/i, ''));
      }
    }

    return {
      success: true,
      data: {
        sheetTitle,
        headers,
        rows,
      },
    };
  } catch (error) {
    console.error('Error fetching Google Sheet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error fetching Google Sheet data.',
    };
  }
}
