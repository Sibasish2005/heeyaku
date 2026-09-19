import Papa from 'papaparse';
import * as XLSX from 'xlsx';

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
 * Parses an uploaded File object (CSV or XLSX) into headers and JSON rows.
 */
export async function parseImportFile(file: File): Promise<{
  headers: string[];
  rows: RawImportRow[];
}> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv')) {
    return new Promise((resolve, reject) => {
      Papa.parse<RawImportRow>(file, {
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
        error: (err) => reject(err),
      });
    });
  }

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error('Spreadsheet contains no sheets.');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: RawImportRow[] = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      raw: false,
    });

    if (rawRows.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = Object.keys(rawRows[0] || {});
    return { headers, rows: rawRows };
  }

  throw new Error('Unsupported file format. Please upload a .csv or .xlsx file.');
}

/**
 * Heuristically identifies likely column matches based on common header variations.
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
 */
export function parseGoogleSheetUrl(url: string): { exportUrl: string; sheetIdentifier: string } | { error: string } {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    return { error: 'Please enter a Google Sheet URL.' };
  }

  // Published to web: /spreadsheets/d/e/{pubId}/...
  const pubMatch = cleanUrl.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  const gidMatch = cleanUrl.match(/[?&#]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  if (pubMatch) {
    const pubId = pubMatch[1];
    return {
      exportUrl: `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv&gid=${gid}`,
      sheetIdentifier: `Published Sheet (gid: ${gid})`,
    };
  }

  // Standard Google Sheet URL: /spreadsheets/d/{sheetId}/...
  const idMatch = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (idMatch) {
    const sheetId = idMatch[1];
    return {
      exportUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
      sheetIdentifier: `Google Sheet (gid: ${gid})`,
    };
  }

  // Already a direct Google Docs CSV export link
  if (cleanUrl.includes('docs.google.com/spreadsheets') && (cleanUrl.includes('output=csv') || cleanUrl.includes('format=csv'))) {
    return {
      exportUrl: cleanUrl,
      sheetIdentifier: 'Google Sheet (CSV Export)',
    };
  }

  return {
    error: 'Invalid Google Sheet link. Please paste a link starting with https://docs.google.com/spreadsheets/...',
  };
}
