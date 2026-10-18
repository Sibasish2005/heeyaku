import Papa from 'papaparse';
import ExcelJS from 'exceljs';

export interface RawImportRow {
  [key: string]: string | number | undefined | null;
}

export interface ColumnMapping {
  nameCol: string;
  phoneCol: string;
  emailCol?: string;
  companyCol?: string;
  sourceCol?: string;
  notesCol?: string;
}

/**
 * Executes a parser operation within a defensive prototype guard.
 * Captures Object.prototype property names prior to execution and immediately purges
 * any properties attached or mutated on Object.prototype during parsing.
 */
export function runWithPrototypeGuard<T>(fn: () => T): T {
  const initialKeys = new Set(Object.getOwnPropertyNames(Object.prototype));
  try {
    return fn();
  } finally {
    for (const key of Object.getOwnPropertyNames(Object.prototype)) {
      if (!initialKeys.has(key)) {
        try {
          delete (Object.prototype as Record<string, unknown>)[key];
        } catch {
          // Ignore delete failures
        }
      }
    }
  }
}

/**
 * Parses an uploaded browser File object (.csv, .xlsx, or .xls) into table headers and row objects.
 * Uses PapaParse for streaming CSV and ExcelJS for hardened, secure Excel workbook ingestion.
 *
 * @param file - Browser File instance from file input or drag-and-drop
 * @returns {Promise<{ headers: string[]; rows: RawImportRow[] }>} Array of string header keys and row records
 * @throws {Error} If the file format is unsupported or contains no sheets
 */
export async function parseImportFile(file: File): Promise<{
  headers: string[];
  rows: RawImportRow[];
}> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv')) {
    const text = await file.text();
    return new Promise((resolve, reject) => {
      Papa.parse<RawImportRow>(text, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          const headers = results.meta.fields || [];
          resolve({
            headers,
            rows: results.data,
          });
        },
        error: (err: Error) => reject(err),
      });
    });
  }

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer);
    } catch {
      throw new Error('Unable to parse Excel workbook. Please verify the file is a valid .xlsx spreadsheet.');
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet || worksheet.rowCount === 0) {
      throw new Error('Spreadsheet contains no sheets or is empty.');
    }

    // Resource limit defense: Cap workbook size at 25,000 rows
    if (worksheet.rowCount > 25000) {
      throw new Error('Spreadsheet exceeds maximum upload batch size of 25,000 rows. Please split into smaller files.');
    }

    // Extract and sanitize headers from Row 1
    const headersMap = new Map<number, string>();
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      let rawVal: unknown = cell.value;
      if (rawVal !== null && typeof rawVal === 'object') {
        const obj = rawVal as Record<string, unknown>;
        if ('result' in obj) rawVal = obj.result;
        else if ('text' in obj) rawVal = obj.text;
      }
      const headerStr = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';
      if (headerStr && headerStr !== '__proto__' && headerStr !== 'constructor' && headerStr !== 'prototype') {
        headersMap.set(colNumber, headerStr);
      }
    });

    const headers = Array.from(new Set(headersMap.values()));
    if (headers.length === 0) {
      return { headers: [], rows: [] };
    }

    // Extract data rows with prototype pollution defense (clean Object.create(null))
    const cleanRows: RawImportRow[] = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      const record: RawImportRow = Object.create(null);
      let hasData = false;

      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const header = headersMap.get(colNumber);
        if (header) {
          let cellValue: unknown = cell.value;
          if (cellValue !== null && typeof cellValue === 'object') {
            const obj = cellValue as Record<string, unknown>;
            if ('result' in obj) cellValue = obj.result;
            else if ('text' in obj) cellValue = obj.text;
            else if (cellValue instanceof Date) cellValue = cellValue.toISOString().split('T')[0];
          }
          const valStr = cellValue !== undefined && cellValue !== null ? String(cellValue).trim() : '';
          if (valStr !== '') {
            hasData = true;
            record[header] = valStr;
          }
        }
      });

      if (hasData) {
        cleanRows.push(record);
      }
    });

    return { headers, rows: cleanRows };
  }

  throw new Error('Unsupported file format. Please upload a .csv or .xlsx file.');
}

/**
 * Parses raw text (e.g. pasted CSV, TSV, or tabular clipboard data) into headers and JSON rows.
 *
 * @param text - Raw text string from textarea or clipboard
 * @returns {{ headers: string[]; rows: RawImportRow[] }} Extracted headers and row records
 * @throws {Error} If text is empty or contains no valid header/data rows
 */
export function parseImportCsvText(text: string): {
  headers: string[];
  rows: RawImportRow[];
} {
  const clean = text.trim();
  if (!clean) {
    throw new Error('Please enter or paste tabular or CSV text.');
  }
  const results = Papa.parse<RawImportRow>(clean, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  });
  if (results.errors && results.errors.length > 0 && (!results.data || results.data.length === 0)) {
    throw new Error(results.errors[0]?.message || 'Failed to parse pasted text.');
  }
  const headers = results.meta.fields?.filter(Boolean) || [];
  if (!headers.length || !results.data.length) {
    throw new Error('No valid header row or data rows found in pasted text.');
  }
  return {
    headers,
    rows: results.data,
  };
}

/**
 * Heuristically identifies likely CRM column matches based on common header variations
 * (e.g. 'Student Name', 'Mobile Number', 'Batch', 'Course').
 *
 * @param headers - Array of detected column headers
 * @returns {ColumnMapping} Inferred mapping dictionary connecting CSV columns to CRM fields
 */
export function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const findMatch = (candidates: string[]): string => {
    for (const cand of candidates) {
      const found = headers.find((h) => h.toLowerCase().trim() === cand.toLowerCase());
      if (found) return found;
    }
    for (const cand of candidates) {
      const found = headers.find((h) => h.toLowerCase().includes(cand.toLowerCase()));
      if (found) return found;
    }
    return '';
  };

  return {
    nameCol: findMatch(['name', 'student name', 'full name', 'prospect', 'lead name', 'contact name']),
    phoneCol: findMatch(['phone', 'mobile', 'phone number', 'mobile number', 'contact', 'telephone', 'cell']),
    emailCol: findMatch(['email', 'email address', 'mail']) || undefined,
    companyCol: findMatch(['course', 'target course', 'batch', 'school', 'college', 'institution', 'company']) || undefined,
    sourceCol: findMatch(['source', 'lead source', 'campaign', 'channel', 'medium']) || undefined,
    notesCol: findMatch(['notes', 'remarks', 'comment', 'query', 'inquiry', 'message']) || undefined,
  };
}

/**
 * Parses any Google Sheet link into a direct CSV export URL.
 * Handles edit links, view links, sharing links, published web links, and direct CSV links.
 * Enforces HTTPS protocol and `docs.google.com` domain.
 *
 * @param url - Raw Google Sheet URL string
 * @returns {{ exportUrl: string; sheetIdentifier: string } | { error: string }} Validated export URL or error message
 */
export function parseGoogleSheetUrl(url: string): { exportUrl: string; sheetIdentifier: string } | { error: string } {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    return { error: 'Please enter a Google Sheet URL.' };
  }

  try {
    const parsed = new URL(cleanUrl);
    if (parsed.protocol !== 'https:') {
      return { error: 'Invalid Google Sheet link. Only secure HTTPS URLs are allowed.' };
    }

    if (parsed.hostname !== 'docs.google.com') {
      return { error: 'Invalid Google Sheet link. URL must be hosted on docs.google.com.' };
    }

    const pathname = parsed.pathname;
    const gidMatch = cleanUrl.match(/[?&#]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';

    // Published to web: /spreadsheets/d/e/{pubId}/...
    const pubMatch = pathname.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
    if (pubMatch) {
      const pubId = pubMatch[1];
      return {
        exportUrl: `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv&gid=${gid}`,
        sheetIdentifier: `Published Sheet (gid: ${gid})`,
      };
    }

    // Standard Google Sheet URL: /spreadsheets/d/{sheetId}/...
    const idMatch = pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (idMatch) {
      const sheetId = idMatch[1];
      return {
        exportUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
        sheetIdentifier: `Google Sheet (gid: ${gid})`,
      };
    }

    // Direct export link already strictly on docs.google.com
    if (pathname.startsWith('/spreadsheets/') && (cleanUrl.includes('output=csv') || cleanUrl.includes('format=csv'))) {
      return {
        exportUrl: cleanUrl,
        sheetIdentifier: 'Google Sheet (CSV Export)',
      };
    }

    return {
      error: 'Invalid Google Sheet link format. Please paste a link starting with https://docs.google.com/spreadsheets/d/...',
    };
  } catch {
    return {
      error: 'Invalid URL. Please enter a valid https://docs.google.com/spreadsheets/... link.',
    };
  }
}
