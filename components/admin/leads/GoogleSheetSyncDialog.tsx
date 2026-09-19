'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Copy,
  Check,
  Zap,
  Globe,
  Key,
  Play,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw
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
  const [activeTab, setActiveTab] = useState<'sheets' | 'api'>('sheets');
  const [baseUrl, setBaseUrl] = useState('https://heeyaku.vercel.app');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const apiKey = 'heeyaku_sync_9f4b8a2c7e1d5e3f9a2b4c6e8d0f1a3b';

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setBaseUrl(window.location.origin);
    }
  }, []);

  if (!isOpen) return null;

  const syncUrl = `${baseUrl}/api/v1/integrations/google-sheets/sync`;
  const ingestUrl = `${baseUrl}/api/v1/leads/ingest`;

  // Dynamically populated Apps Script code with exact server endpoint & key
  const appsScriptCode = `/**
 * ==============================================================================
 * HEEYAKU CRM - AUTOMATIC TWO-WAY GOOGLE SHEETS SYNCHRONIZATION
 * ==============================================================================
 * 
 * Auto-generated on: ${new Date().toISOString()}
 * 1. Open your Google Sheet
 * 2. Click "Extensions" -> "Apps Script"
 * 3. Delete any code in the editor, and paste this entire file
 * 4. Click "Save" (disk icon) and then reload your Google Sheet
 * 5. Click "⚡ Heeyaku CRM" -> "📋 Setup Standard Columns"
 * 6. Click "⚡ Heeyaku CRM" -> "▶️ Start Auto-Sync (Every 1 Min)"
 */

var HEEYAKU_API_URL = "${syncUrl}";
var HEEYAKU_API_KEY = "${apiKey}";

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ Heeyaku CRM')
    .addItem('🔄 Sync Now (Two-Way)', 'manualSyncNow')
    .addItem('▶️ Start Auto-Sync (Every 1 Min)', 'startAutoSyncTrigger')
    .addItem('⏹️ Stop Auto-Sync', 'stopAutoSyncTrigger')
    .addSeparator()
    .addItem('📋 Setup Standard Columns', 'setupSheetColumns')
    .addToUi();
}

function setupSheetColumns() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var headers = [
    'Name',
    'Phone Number',
    'Email',
    'Course / Company',
    'Lead Code',
    'Live Status',
    'Assigned To',
    'Talk Time',
    'Notes',
    'Sync Status'
  ];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground('#1E293B');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);
  SpreadsheetApp.getUi().alert('✅ Standard columns configured! You can now start entering leads.');
}

function manualSyncNow() {
  var result = executeTwoWaySync();
  SpreadsheetApp.getUi().alert(result);
}

function startAutoSyncTrigger() {
  stopAutoSyncTrigger();
  ScriptApp.newTrigger('executeTwoWaySync')
    .timeBased()
    .everyMinutes(1)
    .create();
  SpreadsheetApp.getUi().alert('🚀 Auto-Sync is now ACTIVE! Your sheet will automatically sync with Heeyaku every minute in the background.');
}

function stopAutoSyncTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'executeTwoWaySync') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function executeTwoWaySync() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return 'Sheet is empty (no leads to sync).';
  }

  var scriptProps = PropertiesService.getScriptProperties();
  var lastSyncTimestamp = scriptProps.getProperty('HEEYAKU_LAST_SYNC_TIME') || '';

  var dataRange = sheet.getRange(2, 1, lastRow - 1, 10);
  var values = dataRange.getValues();

  var rowsToPush = [];
  var phoneToRowMap = {};

  for (var i = 0; i < values.length; i++) {
    var rowNum = i + 2;
    var name = String(values[i][0] || '').trim();
    var phone = String(values[i][1] || '').trim();
    var email = String(values[i][2] || '').trim();
    var company = String(values[i][3] || '').trim();
    var leadCode = String(values[i][4] || '').trim();
    var notes = String(values[i][8] || '').trim();
    var syncStatus = String(values[i][9] || '').trim();

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
      return 'Sync failed: Server returned HTTP ' + resCode + ' (' + resText + ')';
    }

    var json = JSON.parse(resText);
    if (!json.success) {
      return 'Sync error: ' + (json.error || 'Unknown error');
    }

    if (json.processedRows && json.processedRows.length > 0) {
      for (var p = 0; p < json.processedRows.length; p++) {
        var proc = json.processedRows[p];
        var targetRow = proc.rowNumber;
        if (!targetRow && proc.phoneNumber) {
          var d = proc.phoneNumber.replace(/[^0-9]/g, '').slice(-10);
          targetRow = phoneToRowMap[d];
        }

        if (targetRow) {
          if (proc.leadCode) {
            sheet.getRange(targetRow, 5).setValue(proc.leadCode);
          }
          sheet.getRange(targetRow, 10).setValue('Synced');
        }
      }
    }

    if (json.deltaUpdates && json.deltaUpdates.length > 0) {
      for (var d = 0; d < json.deltaUpdates.length; d++) {
        var delta = json.deltaUpdates[d];
        var deltaPhoneDigits = delta.phoneNumber.replace(/[^0-9]/g, '').slice(-10);
        var matchingRow = phoneToRowMap[deltaPhoneDigits];

        if (matchingRow) {
          if (delta.leadCode) sheet.getRange(matchingRow, 5).setValue(delta.leadCode);
          
          var statusCell = sheet.getRange(matchingRow, 6);
          statusCell.setValue(delta.status);
          applyStatusColor(statusCell, delta.status);

          if (delta.assignedTo) sheet.getRange(matchingRow, 7).setValue(delta.assignedTo);
          if (delta.lastTalkSeconds > 0) {
            var mins = Math.floor(delta.lastTalkSeconds / 60);
            var secs = delta.lastTalkSeconds % 60;
            sheet.getRange(matchingRow, 8).setValue(mins + 'm ' + secs + 's');
          }
          sheet.getRange(matchingRow, 10).setValue('Synced');
        }
      }
    }

    if (json.serverTimestamp) {
      scriptProps.setProperty('HEEYAKU_LAST_SYNC_TIME', json.serverTimestamp);
    }

    return '✅ Synced successfully! Ingested: ' + (json.insertedCount || 0) + ' new leads, Updated: ' + (json.deltaUpdates ? json.deltaUpdates.length : 0) + ' statuses.';
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
}`;

  const copyToClipboard = (text: string, type: 'script' | 'url' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'script') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
      toast.success('Google Apps Script copied to clipboard!');
    } else if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      toast.success('Sync Endpoint URL copied!');
    } else if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      toast.success('API Key copied!');
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const res = await fetch(`/api/v1/integrations/google-sheets/sync?since=2026-01-01T00:00:00.000Z`, {
        headers: {
          'x-api-key': apiKey,
        },
      });
      const latency = Math.round(performance.now() - start);
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `Endpoint healthy & authenticated. Returned ${data.deltaUpdates?.length || 0} active deltas.`,
          latencyMs: latency,
        });
        toast.success(`Connection verified (${latency}ms)!`);
      } else {
        setTestResult({
          success: false,
          message: data.error || `HTTP ${res.status}: Failed to authenticate`,
          latencyMs: latency,
        });
        toast.error('Connection check failed');
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Network error testing endpoint',
      });
      toast.error('Could not reach endpoint');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-card text-card-foreground border border-border w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">Google Sheets Continuous Auto-Sync</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-500/30">
                  Two-Way Live
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically ingest new leads and sync call outcomes, telecallers, and talk duration.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-border bg-muted/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sheets')}
            className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sheets'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Google Sheet Quick Setup
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'api'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            External REST API / Webhooks
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Top API Credentials Box */}
          <div className="bg-muted/30 border border-border/70 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Live Sync Endpoint & API Secret
              </span>
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-card hover:bg-muted border border-border transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${testingConnection ? 'animate-spin' : ''}`} />
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-background border border-border rounded-lg p-2 flex items-center justify-between gap-2">
                <div className="truncate">
                  <div className="text-[10px] text-muted-foreground font-medium">Sync Webhook URL</div>
                  <div className="font-mono text-[11px] truncate text-foreground">{syncUrl}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(syncUrl, 'url')}
                  className="p-1 text-muted-foreground hover:text-foreground shrink-0 rounded"
                  title="Copy URL"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="bg-background border border-border rounded-lg p-2 flex items-center justify-between gap-2">
                <div className="truncate">
                  <div className="text-[10px] text-muted-foreground font-medium">External API Key</div>
                  <div className="font-mono text-[11px] truncate text-foreground">{apiKey}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(apiKey, 'key')}
                  className="p-1 text-muted-foreground hover:text-foreground shrink-0 rounded"
                  title="Copy API Key"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Test Connection Banner */}
            {testResult && (
              <div
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span className="truncate">{testResult.message}</span>
                </div>
                {testResult.latencyMs !== undefined && (
                  <span className="font-mono font-bold text-[10px] shrink-0 bg-background/50 px-1.5 py-0.5 rounded border border-border">
                    {testResult.latencyMs} ms
                  </span>
                )}
              </div>
            )}
          </div>

          {activeTab === 'sheets' ? (
            <>
              {/* 4-Step Guide */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Setup Instructions (Takes 60 Seconds)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-muted/20 border border-border rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[11px]">
                        1
                      </span>
                      <span className="font-bold text-foreground">Open Google Sheets</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Create or open your Google Sheet. Open menu <strong className="text-foreground">Extensions &gt; Apps Script</strong>.
                    </p>
                  </div>

                  <div className="p-3 bg-muted/20 border border-border rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[11px]">
                        2
                      </span>
                      <span className="font-bold text-foreground">Paste Apps Script</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Delete default code, paste the script below, and hit <strong className="text-foreground">Save</strong> (Ctrl+S).
                    </p>
                  </div>

                  <div className="p-3 bg-muted/20 border border-border rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[11px]">
                        3
                      </span>
                      <span className="font-bold text-foreground">Setup Columns</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Reload the spreadsheet, then click <strong className="text-foreground">⚡ Heeyaku CRM &gt; 📋 Setup Standard Columns</strong>.
                    </p>
                  </div>

                  <div className="p-3 bg-muted/20 border border-border rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-[11px]">
                        4
                      </span>
                      <span className="font-bold text-foreground">Activate Auto-Sync</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Click <strong className="text-foreground">⚡ Heeyaku CRM &gt; ▶️ Start Auto-Sync (Every 1 Min)</strong>. It will sync 24/7 without taxing your DB!
                    </p>
                  </div>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Turnkey Google Apps Script Code
                  </span>
                  <button
                    onClick={() => copyToClipboard(appsScriptCode, 'script')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-2xs cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Entire Apps Script'}</span>
                  </button>
                </div>

                <div className="relative border border-border rounded-xl overflow-hidden bg-slate-950 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto p-3.5 select-all">
                  <pre>{appsScriptCode.slice(0, 1400)} ...\n// (Click 'Copy Entire Apps Script' to get the full script)</pre>
                </div>
              </div>
            </>
          ) : (
            /* API / Webhook Integration Guide */
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Generic Ingestion Webhook (Meta Ads, Web Forms, Zapier)
                </h3>
                <p className="text-muted-foreground text-[11px] mb-3">
                  You can post any external lead or array of leads directly to Heeyaku. Deduplication against 10-digit phone numbers is automatic.
                </p>

                <div className="bg-muted/40 border border-border rounded-xl p-3 space-y-2">
                  <div className="font-semibold text-foreground">Endpoint:</div>
                  <div className="bg-background border border-border p-2 rounded-lg font-mono text-[11px] text-foreground flex items-center justify-between">
                    <span>POST {ingestUrl}</span>
                    <button
                      onClick={() => copyToClipboard(ingestUrl, 'url')}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-foreground">Example cURL Request:</div>
                <div className="border border-border rounded-xl bg-slate-950 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                  <pre>{`curl -X POST "${ingestUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{
    "name": "Rahul Verma",
    "phoneNumber": "+91 9876543210",
    "email": "rahul@example.com",
    "company": "Fullstack Web Dev",
    "notes": "Incoming lead from Landing Page Form"
  }'`}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-muted-foreground">
            Non-invasive background sync uses batch delta queries to preserve DB health.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-foreground bg-card hover:bg-muted/70 border border-border rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
