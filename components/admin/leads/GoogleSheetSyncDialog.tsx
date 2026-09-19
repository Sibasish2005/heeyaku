'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Copy,
  Check,
  Zap,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  MousePointerClick,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

interface GoogleSheetSyncDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoogleSheetSyncDialog({
  isOpen,
  onClose,
}: GoogleSheetSyncDialogProps) {
  const [baseUrl, setBaseUrl] = useState('https://heeyaku.vercel.app');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const apiKey = 'heeyaku_sync_9f4b8a2c7e1d5e3f9a2b4c6e8d0f1a3b';

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setBaseUrl(window.location.origin);
    }
  }, []);

  if (!isOpen) return null;

  const syncUrl = `${baseUrl}/api/v1/integrations/google-sheets/sync`;

  // Clean, button-only sync script with smart column detection
  const simpleSyncScript = `/**
 * ==============================================================================
 * HEEYAKU CRM - ONE-CLICK GOOGLE SHEETS SYNC
 * Syncs leads and telecaller outcomes ONLY when you click the button!
 * ==============================================================================
 */

var HEEYAKU_API_URL = "${syncUrl}";
var HEEYAKU_API_KEY = "${apiKey}";

/**
 * Creates the friendly Heeyaku menu in your spreadsheet
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ Heeyaku CRM')
    .addItem('🔄 Sync Leads Now', 'manualSyncNow')
    .addSeparator()
    .addItem('📋 Check & Setup Sync Columns', 'setupOrVerifyColumns')
    .addToUi();
}

/**
 * Runs the sync when you click "Sync Leads Now"
 */
function manualSyncNow() {
  var result = executeTwoWaySync();
  SpreadsheetApp.getUi().alert(result);
}

/**
 * Adds Lead Code, Status, and Caller columns safely without modifying existing data
 */
function setupOrVerifyColumns() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  var headers = headerRange.getValues()[0].map(function(h) { return String(h || '').trim(); });

  var requiredCols = ['Lead Code', 'Live Status', 'Assigned To', 'Talk Time', 'Sync Status'];
  var appended = [];

  for (var i = 0; i < requiredCols.length; i++) {
    var colName = requiredCols[i];
    var exists = false;
    for (var j = 0; j < headers.length; j++) {
      if (headers[j].toLowerCase() === colName.toLowerCase()) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      lastCol++;
      sheet.getRange(1, lastCol).setValue(colName)
        .setBackground('#10B981')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold');
      appended.push(colName);
    }
  }

  sheet.setFrozenRows(1);

  if (appended.length > 0) {
    SpreadsheetApp.getUi().alert('✅ Added Heeyaku columns: ' + appended.join(', ') + '\\nReady to sync!');
  } else {
    SpreadsheetApp.getUi().alert('✅ All Heeyaku columns are already present and verified!');
  }
}

/**
 * The One-Click Sync Engine
 */
function executeTwoWaySync() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow < 2 || lastCol < 2) {
    return 'Sheet is empty. Add at least 1 lead row to sync.';
  }

  // 1. Detect headers in Row 1
  var headerValues = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var colMap = {};

  for (var c = 0; c < headerValues.length; c++) {
    var h = String(headerValues[c] || '').trim().toLowerCase();
    if (!h) continue;

    if (h.indexOf('phone') !== -1 || h.indexOf('mobile') !== -1 || h.indexOf('contact') !== -1) {
      if (!colMap.phone) colMap.phone = c + 1;
    } else if (h.indexOf('lead code') !== -1 || h === 'code') {
      colMap.leadCode = c + 1;
    } else if (h.indexOf('live status') !== -1 || h === 'status' || h.indexOf('disposition') !== -1) {
      colMap.status = c + 1;
    } else if (h.indexOf('assigned') !== -1 || h.indexOf('telecaller') !== -1 || h.indexOf('caller') !== -1) {
      colMap.assignedTo = c + 1;
    } else if (h.indexOf('talk') !== -1 || h.indexOf('duration') !== -1) {
      colMap.talkTime = c + 1;
    } else if (h.indexOf('sync') !== -1) {
      colMap.syncStatus = c + 1;
    } else if (h.indexOf('name') !== -1 || h.indexOf('student') !== -1 || h.indexOf('candidate') !== -1) {
      if (!colMap.name) colMap.name = c + 1;
    } else if (h.indexOf('email') !== -1) {
      colMap.email = c + 1;
    } else if (h.indexOf('course') !== -1 || h.indexOf('company') !== -1 || h.indexOf('school') !== -1 || h.indexOf('college') !== -1) {
      colMap.company = c + 1;
    } else if (h.indexOf('note') !== -1 || h.indexOf('remark') !== -1 || h.indexOf('comment') !== -1) {
      colMap.notes = c + 1;
    }
  }

  if (!colMap.phone) {
    return 'Please make sure you have a "Phone Number" or "Mobile" column in Row 1.';
  }

  var scriptProps = PropertiesService.getScriptProperties();
  var lastSyncTimestamp = scriptProps.getProperty('HEEYAKU_LAST_SYNC_TIME') || '';

  // 2. Read rows
  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
  var values = dataRange.getValues();

  var rowsToPush = [];
  var phoneToRowMap = {};

  for (var i = 0; i < values.length; i++) {
    var rowNum = i + 2;
    var row = values[i];

    var name = colMap.name ? String(row[colMap.name - 1] || '').trim() : '';
    var phone = String(row[colMap.phone - 1] || '').trim();
    var email = colMap.email ? String(row[colMap.email - 1] || '').trim() : '';
    var company = colMap.company ? String(row[colMap.company - 1] || '').trim() : '';
    var notes = colMap.notes ? String(row[colMap.notes - 1] || '').trim() : '';
    var syncStatus = colMap.syncStatus ? String(row[colMap.syncStatus - 1] || '').trim() : '';

    var cleanDigits = phone.replace(/[^0-9]/g, '');
    var last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
    if (last10) {
      phoneToRowMap[last10] = rowNum;
    }

    if (phone && syncStatus !== 'Synced') {
      rowsToPush.push({
        rowNumber: rowNum,
        name: name,
        phoneNumber: phone,
        email: email,
        company: company,
        notes: notes
      });
    }
  }

  var payload = {
    rows: rowsToPush,
    since: lastSyncTimestamp
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': HEEYAKU_API_KEY
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(HEEYAKU_API_URL, options);
    var resCode = response.getResponseCode();
    var resText = response.getContentText();

    if (resCode !== 200) {
      return 'Sync failed: Server returned error ' + resCode;
    }

    var json = JSON.parse(resText);
    if (!json.success) {
      return 'Sync error: ' + (json.error || 'Unknown error');
    }

    // 3. Stamping synced leads with Lead Codes
    if (json.processedRows && json.processedRows.length > 0) {
      for (var p = 0; p < json.processedRows.length; p++) {
        var proc = json.processedRows[p];
        var targetRow = proc.rowNumber;
        if (!targetRow && proc.phoneNumber) {
          var d = proc.phoneNumber.replace(/[^0-9]/g, '').slice(-10);
          targetRow = phoneToRowMap[d];
        }

        if (targetRow) {
          if (colMap.leadCode && proc.leadCode) {
            sheet.getRange(targetRow, colMap.leadCode).setValue(proc.leadCode);
          }
          if (colMap.syncStatus) {
            sheet.getRange(targetRow, colMap.syncStatus).setValue('Synced');
          }
        }
      }
    }

    // 4. Updating live telecaller outcomes
    if (json.deltaUpdates && json.deltaUpdates.length > 0) {
      for (var d = 0; d < json.deltaUpdates.length; d++) {
        var delta = json.deltaUpdates[d];
        var deltaDigits = delta.phoneNumber.replace(/[^0-9]/g, '').slice(-10);
        var matchingRow = phoneToRowMap[deltaDigits];

        if (matchingRow) {
          if (colMap.leadCode && delta.leadCode) {
            sheet.getRange(matchingRow, colMap.leadCode).setValue(delta.leadCode);
          }
          if (colMap.status && delta.status) {
            var cell = sheet.getRange(matchingRow, colMap.status);
            cell.setValue(delta.status);
            applyStatusColor(cell, delta.status);
          }
          if (colMap.assignedTo && delta.assignedTo) {
            sheet.getRange(matchingRow, colMap.assignedTo).setValue(delta.assignedTo);
          }
          if (colMap.talkTime && delta.lastTalkSeconds > 0) {
            var m = Math.floor(delta.lastTalkSeconds / 60);
            var s = delta.lastTalkSeconds % 60;
            sheet.getRange(matchingRow, colMap.talkTime).setValue(m + 'm ' + s + 's');
          }
          if (colMap.syncStatus) {
            sheet.getRange(matchingRow, colMap.syncStatus).setValue('Synced');
          }
        }
      }
    }

    if (json.serverTimestamp) {
      scriptProps.setProperty('HEEYAKU_LAST_SYNC_TIME', json.serverTimestamp);
    }

    return '✅ Synced Successfully!\\n\\n• New leads sent to CRM: ' + (json.insertedCount || 0) + '\\n• Call outcomes updated in Sheet: ' + (json.deltaUpdates ? json.deltaUpdates.length : 0);
  } catch (err) {
    return 'Connection error: ' + err.message;
  }
}

function applyStatusColor(cell, status) {
  var s = String(status).toUpperCase();
  if (s === 'CONVERTED') {
    cell.setBackground('#D1FAE5');
    cell.setFontColor('#065F46');
    cell.setFontWeight('bold');
  } else if (s === 'INTERESTED') {
    cell.setBackground('#E0F2FE');
    cell.setFontColor('#0369A1');
    cell.setFontWeight('bold');
  } else if (s === 'CONTACTED') {
    cell.setBackground('#FEF3C7');
    cell.setFontColor('#92400E');
    cell.setFontWeight('bold');
  } else if (s === 'FOLLOW_UP' || s === 'CALL_BACK') {
    cell.setBackground('#EDE9FE');
    cell.setFontColor('#5B21B6');
    cell.setFontWeight('bold');
  } else if (s === 'NOT_INTERESTED' || s === 'NOT_QUALIFIED') {
    cell.setBackground('#FEE2E2');
    cell.setFontColor('#991B1B');
  }
}
`;

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(simpleSyncScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
    toast.success('Connection code copied to clipboard!');
  };

  const copyText = (text: string, type: 'url' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      toast.success('URL copied!');
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      toast.success('Key copied!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-card text-card-foreground border border-border w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Friendly Header */}
        <div className="p-5 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">Connect Your Google Sheet</h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <MousePointerClick className="w-3 h-3" />
                  Sync On Button Click
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Import leads into Heeyaku whenever you click the sync button in your Google Sheet.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Friendly Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Big Action Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Ready to Connect
              </div>
              <p className="text-muted-foreground text-xs">
                Click the button on the right to copy your ready-made Google Sheets connection code.
              </p>
            </div>

            <button
              onClick={copyCodeToClipboard}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Code Copied!' : 'Copy Connection Code'}</span>
            </button>
          </div>

          {/* 3 Simple Steps */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider text-muted-foreground">
              Simple 3-Step Setup
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Step 1 */}
              <div className="p-3.5 bg-muted/20 border border-border rounded-xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-foreground">Open your Google Sheet</div>
                  <p className="text-muted-foreground leading-relaxed">
                    Open your lead spreadsheet in Google Sheets. In the top menu, click <strong className="text-foreground">Extensions ➔ Apps Script</strong>.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 bg-muted/20 border border-border rounded-xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-foreground">Paste and Save</div>
                  <p className="text-muted-foreground leading-relaxed">
                    Delete any text in the Apps Script box, paste the code you copied above, and press <strong className="text-foreground">Save (Ctrl + S)</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 bg-muted/20 border border-border rounded-xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-foreground">Click the Sync Button in Google Sheets</div>
                  <p className="text-muted-foreground leading-relaxed">
                    Refresh your Google Sheet. You will now see a new menu:
                    <br />
                    👉 <span className="font-semibold text-emerald-600 dark:text-emerald-400">⚡ Heeyaku CRM ➔ 🔄 Sync Leads Now</span>
                    <br />
                    <span className="text-[11px] text-muted-foreground">
                      Click this button anytime you want to sync your leads to the CRM!
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Explanation */}
          <div className="p-3.5 bg-muted/30 border border-border/70 rounded-xl space-y-2">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              How It Works:
            </div>
            <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>It syncs <strong>only when you click the button</strong> (no automated background loops).</li>
              <li>Your existing columns (Name, Phone, Email, etc.) are detected automatically.</li>
              <li>Phone numbers are automatically checked so duplicates are never created.</li>
              <li>When telecallers make calls in the Heeyaku app, their outcomes and talk duration update in your sheet when you sync.</li>
            </ul>
          </div>

          {/* Advanced / Developer Options (Collapsed by Default) */}
          <div className="border border-border/60 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-3 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between text-muted-foreground hover:text-foreground font-medium text-xs cursor-pointer"
            >
              <span>⚙️ Technical / API Details (Optional)</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="p-4 bg-muted/10 border-t border-border/60 space-y-3">
                <div>
                  <div className="text-[11px] text-muted-foreground mb-1 font-medium">Sync Webhook URL:</div>
                  <div className="bg-background border border-border p-2 rounded-lg font-mono text-[11px] text-foreground flex items-center justify-between">
                    <span className="truncate">{syncUrl}</span>
                    <button
                      onClick={() => copyText(syncUrl, 'url')}
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground mb-1 font-medium">API Secret Key:</div>
                  <div className="bg-background border border-border p-2 rounded-lg font-mono text-[11px] text-foreground flex items-center justify-between">
                    <span className="truncate font-mono">{apiKey}</span>
                    <button
                      onClick={() => copyText(apiKey, 'key')}
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Copy Key"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-muted-foreground">
            Leads sync on-demand when you click the button in your spreadsheet.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-foreground bg-card hover:bg-muted/70 border border-border rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
