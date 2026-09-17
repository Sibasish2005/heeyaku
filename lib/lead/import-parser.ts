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
