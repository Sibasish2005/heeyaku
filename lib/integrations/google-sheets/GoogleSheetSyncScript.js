/**
 * ==============================================================================
 * HEEYAKU CRM - AUTOMATIC TWO-WAY GOOGLE SHEETS SYNCHRONIZATION
 * ==============================================================================
 * 
 * Instructions for Setup:
 * 1. Open your Google Sheet.
 * 2. Click "Extensions" -> "Apps Script".
 * 3. Delete any code in the editor, and paste this entire file.
 * 4. Replace HEEYAKU_API_URL and HEEYAKU_API_KEY with your credentials.
 * 5. Click "Save" (disk icon) and then reload your Google Sheet.
 * 6. You will see a new menu: "⚡ Heeyaku CRM" -> Click "Setup Sheet Columns".
 * 7. Click "Start Auto-Sync" to enable continuous background sync!
 */

// CONFIGURATION: Replace these values with your server credentials
var HEEYAKU_API_URL = "https://heeyaku.vercel.app/api/v1/integrations/google-sheets/sync";
var HEEYAKU_API_KEY = "heeyaku_sync_9f4b8a2c7e1d5e3f9a2b4c6e8d0f1a3b";

/**
 * Creates custom menu when spreadsheet opens.
 */
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

/**
 * Sets up standard column headers in the active sheet.
 */
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
  SpreadsheetApp.getUi().alert('✅ Standard columns configured! You can now start typing leads.');
}

/**
 * Manual trigger from Menu
 */
function manualSyncNow() {
  var result = executeTwoWaySync();
  SpreadsheetApp.getUi().alert(result);
}

/**
 * Enables automated continuous sync via Google Apps Script 1-minute time trigger.
 */
function startAutoSyncTrigger() {
  stopAutoSyncTrigger(); // Clear any existing duplicate triggers
  ScriptApp.newTrigger('executeTwoWaySync')
    .timeBased()
    .everyMinutes(1)
    .create();
  SpreadsheetApp.getUi().alert('🚀 Auto-Sync is now ACTIVE! Your sheet will automatically sync with Heeyaku every minute in the background.');
}

/**
 * Stops automatic background sync.
 */
function stopAutoSyncTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'executeTwoWaySync') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

/**
 * Core Two-Way Synchronization Engine:
 * 1. Scans for unsynced rows and sends them in a single batch.
 * 2. Receives database status updates (CONTACTED, INTERESTED, CONVERTED, call talk time) and updates sheet rows.
 */
function executeTwoWaySync() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return 'Sheet is empty (no leads to sync).';
  }

  var scriptProps = PropertiesService.getScriptProperties();
  var lastSyncTimestamp = scriptProps.getProperty('HEEYAKU_LAST_SYNC_TIME') || '';

  // Read all rows
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

    // Map phone numbers to row index for fast in-memory lookups
    var cleanDigits = phone.replace(/[^0-9]/g, '');
    var last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
    if (last10) {
      phoneToRowMap[last10] = rowNum;
    }

    // Collect new or un-synced rows
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

  // Prepare payload
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

    // 1. Mark newly inserted/existing rows as Synced
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

    // 2. Apply inbound status updates from Heeyaku Database to Sheet rows
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

    // Update timestamp
    if (json.serverTimestamp) {
      scriptProps.setProperty('HEEYAKU_LAST_SYNC_TIME', json.serverTimestamp);
    }

    return '✅ Synced successfully! Ingested: ' + (json.insertedCount || 0) + ' new leads, Updated: ' + (json.deltaUpdates ? json.deltaUpdates.length : 0) + ' statuses.';
  } catch (err) {
    return 'Connection error: ' + err.message;
  }
}

/**
 * Formats status cells with distinct color badges in Google Sheets.
 */
function applyStatusColor(cell, status) {
  var s = String(status).toUpperCase();
  if (s === 'CONVERTED') {
    cell.setBackground('#D1FAE5'); // Green
    cell.setFontColor('#065F46');
    cell.setFontWeight('bold');
  } else if (s === 'INTERESTED') {
    cell.setBackground('#E0F2FE'); // Blue
    cell.setFontColor('#0369A1');
    cell.setFontWeight('bold');
  } else if (s === 'CONTACTED') {
    cell.setBackground('#FEF3C7'); // Amber
    cell.setFontColor('#92400E');
    cell.setFontWeight('bold');
  } else if (s === 'FOLLOW_UP' || s === 'CALL_BACK') {
    cell.setBackground('#EDE9FE'); // Purple
    cell.setFontColor('#5B21B6');
    cell.setFontWeight('bold');
  } else if (s === 'NOT_INTERESTED' || s === 'NOT_QUALIFIED') {
    cell.setBackground('#FEE2E2'); // Red
    cell.setFontColor('#991B1B');
  }
}
