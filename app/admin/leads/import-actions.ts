'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { normalizePhoneNumber, isValidPhoneNumber, zodPhoneNumberSchema } from '@/lib/lead/phone';
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

    let currentNumber = 1001;
    if (latestLead && latestLead.leadCode.startsWith('LED-')) {
      const parsed = parseInt(latestLead.leadCode.replace('LED-', ''), 10);
      if (!isNaN(parsed)) {
        currentNumber = parsed + 1;
      }
    }

    const recordsToInsert = leads.map((lead, idx) => ({
      leadCode: `LED-${currentNumber + idx}`,
      name: lead.name,
      phoneNumber: lead.phoneNumber,
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
