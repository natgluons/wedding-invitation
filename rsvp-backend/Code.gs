/**
 * Richard & Natasha: RSVP and wishes backend (Google Apps Script)
 *
 * Setup, from the README:
 *   1. Create a Google Sheet. Copy its ID from the URL.
 *   2. Go to https://script.google.com and create a new project, then paste this file.
 *   3. Set SHEET_ID below.
 *   4. Run setup() once and accept the permission prompt.
 *   5. Deploy > New deployment > Web app.
 *        Execute as: Me
 *        Who has access: Anyone
 *   6. Copy the /exec URL into rsvpEndpoint in config.js.
 *
 * Three tabs are used:
 *   Guests - private invitation whitelist, allowances, and generated links
 *   RSVP   - one row per invitation code (re-submitting updates the row)
 *   Wishes - one row per guestbook message; delete a row to hide a wish
 */

const SHEET_ID = '1VU4vJkH8tRVbrXcJOosjkiE_TcQ7WOTJfOZcwdzlpUM';
const RSVP_SHEET = 'RSVP';
const WISHES_SHEET = 'Wishes';
const GUESTS_SHEET = 'Guests';
const GUEST_HEADERS = ['Name', 'Max guests', 'Revoke', 'Code', 'Invitation link'];
const SETTINGS_SHEET = 'Settings';
const RSVP_HEADERS = ['Submitted at', 'Name', 'Attendance', 'Guests', 'Message', 'Invited as', 'Page', 'Events', 'Guest code'];
const EVENT_LABELS = {
  'both': 'Holy Matrimony + Reception',
  'holy-matrimony': 'Holy Matrimony only',
  'reception': 'Reception only'
};
const WISHES_HEADERS = ['Submitted at', 'Name', 'Message', 'Hide'];

function setup() {
  const existing = SpreadsheetApp.openById(SHEET_ID).getSheetByName(GUESTS_SHEET);
  if (existing && existing.getLastRow() > 0) {
    let headers = existing.getRange(1, 1, 1, existing.getLastColumn()).getValues()[0].map(String);
    const active = headers.indexOf('Active');
    if (active >= 0 && !headers.includes('Revoke')) {
      if (existing.getLastRow() > 1) {
        const flags = existing.getRange(2, active + 1, existing.getLastRow() - 1, 1).getValues();
        existing.getRange(2, active + 1, flags.length, 1).setValues(flags.map(row => [row[0] === '' ? false : !isTrue_(row[0])]));
      }
      existing.getRange(1, active + 1).setValue('Revoke');
      headers[active] = 'Revoke';
    }
    const suffix = headers.indexOf('Link suffix');
    if (suffix >= 0) {
      existing.deleteColumn(suffix + 1);
      headers.splice(suffix, 1);
      const codeColumn = headers.indexOf('Code') + 1;
      const linkColumn = headers.indexOf('Invitation link') + 1;
      if (codeColumn && linkColumn) {
        for (let row = 2; row <= existing.getLastRow(); row++) {
          const address = existing.getRange(row, codeColumn).getA1Notation();
          existing.getRange(row, linkColumn).setFormula('=IF(OR(' + address + '="",Settings!$B$2=""),"",REGEXREPLACE(Settings!$B$2,"[?#].*$","")&"?code="&' + address + ')');
        }
      }
    }
  }
  getSheet_(GUESTS_SHEET, GUEST_HEADERS);
  const settings = getSheet_(SETTINGS_SHEET, ['Setting', 'Value']);
  if (settings.getLastRow() < 2) {
    settings.appendRow(['Invitation URL', 'https://books-house-our-seconds.trycloudflare.com/']);
  }
  const rsvpSheet = getSheet_(RSVP_SHEET, RSVP_HEADERS);
  const wishesSheet = getSheet_(WISHES_SHEET, WISHES_HEADERS);

  rsvpSheet.setColumnWidth(1, 165);
  rsvpSheet.setColumnWidth(2, 170);
  rsvpSheet.setColumnWidth(5, 320);
  rsvpSheet.setColumnWidth(6, 150);
  rsvpSheet.setColumnWidth(7, 260);
  rsvpSheet.setColumnWidth(8, 190);

  wishesSheet.setColumnWidth(1, 165);
  wishesSheet.setColumnWidth(2, 170);
  wishesSheet.setColumnWidth(3, 420);

  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'handleGuestEdit' && trigger.getTriggerSourceId() === SHEET_ID) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  return 'Ready. Manage Guests manually; Revoke and Wishes Hide default to false when blank.';
}

function doGet(e) {
  const p = e && e.parameter || {};
  let payload;
  try {
    if (p.action === 'guest') {
      const guest = findGuest_(p.code);
      payload = {ok: true, guest: {name: guest.name, maxGuests: guest.maxGuests}};
    } else if (p.action === 'receipt') {
      findGuest_(p.code);
      const receipt = CacheService.getScriptCache().get(receiptKey_(p.code, p.requestId));
      payload = receipt ? JSON.parse(receipt) : {ok: false, pending: true};
    } else {
      payload = {ok: true, message: 'RSVP endpoint is live.', wishes: readWishes_()};
    }
  } catch (error) { payload = {ok: false, error: String(error.message || error)}; }
  const callback = String(p.callback || '');
  if (callback && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(callback)) {
    return ContentService.createTextOutput(`${callback}(${JSON.stringify(payload)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(payload);
}

function receiptKey_(code, requestId) {
  if (!/^[a-zA-Z0-9]{8,64}$/.test(String(code)) || !/^[a-zA-Z0-9-]{16,80}$/.test(String(requestId))) {
    throw new Error('Invalid request');
  }
  return 'rsvp:' + code + ':' + requestId;
}

function findGuest_(code) {
  if (!/^[a-zA-Z0-9]{8,64}$/.test(String(code))) throw new Error('Invalid invitation code format');
  const sheet = getSheet_(GUESTS_SHEET, GUEST_HEADERS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(value => String(value).trim());
  const column = Object.fromEntries(GUEST_HEADERS.map(header => [header, headers.indexOf(header)]));
  const matches = values.slice(1).filter(row => String(row[column.Code]).trim() === code);
  if (!matches.length) throw new Error('Invitation code not found in Guests sheet');
  if (matches.length > 1) throw new Error('Duplicate invitation code in Guests sheet');
  const row = matches[0];
  if (isTrue_(row[column.Revoke])) throw new Error('Invitation revoked');
  const maxGuests = Number(row[column['Max guests']]);
  if (!String(row[column.Name]).trim() || !Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 100) {
    throw new Error('Invalid guest allowance');
  }
  return {name: String(row[column.Name]).trim(), maxGuests: maxGuests};
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const data = parseBody_(e);

    if (String(data.type || 'rsvp') === 'wish') {
      return saveWish_(data);
    }
    const key = receiptKey_(data.code, data.requestId);
    const cache = CacheService.getScriptCache();
    const previous = cache.get(key);
    if (previous) return json_(JSON.parse(previous));
    let result;
    try { result = saveRsvp_(data); }
    catch (error) { result = {ok: false, error: String(error.message || error)}; }
    cache.put(key, JSON.stringify(result), 600);
    return json_(result);
  } catch (error) {
    return json_({ok: false, error: String(error)});
  } finally {
    lock.releaseLock();
  }
}

function saveRsvp_(data) {
  const guest = findGuest_(data.code);
  const name = clean_(guest.name, 100);
  if (!name) throw new Error('Missing name');
  if (!['attending', 'not-attending'].includes(data.attendance)) throw new Error('Invalid attendance');
  const guests = Number(data.guests);
  if (data.attendance === 'attending' && (!Number.isInteger(guests) || guests < 1 || guests > guest.maxGuests)) {
    throw new Error('Party size exceeds invitation allowance');
  }
  if (data.attendance === 'attending' && !Object.prototype.hasOwnProperty.call(EVENT_LABELS, data.events)) throw new Error('Invalid event');

  const sheet = getSheet_(RSVP_SHEET, RSVP_HEADERS);
  const row = [
    Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'),
    name,
    clean_(data.attendance, 20),
    data.attendance === 'attending' ? guests : 0,
    clean_(data.message, 500),
    clean_(guest.name, 100),
    clean_(String(data.page || '').split(/[?#]/)[0], 300),
    data.attendance === 'attending' ? EVENT_LABELS[data.events] : '',
    data.code
  ];

  // Resubmission updates this invitation, even if the response name changes.
  const existingRow = findRowByName_(sheet, data.code, 9, 2);
  if (existingRow) {
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return {ok: true, updated: Boolean(existingRow)};
}

function saveWish_(data) {
  const name = clean_(data.name, 60);
  const message = clean_(data.message, 300);
  if (!name || !message) return json_({ok: false, error: 'Missing name or message'});

  const sheet = getSheet_(WISHES_SHEET, WISHES_HEADERS);
  sheet.appendRow([new Date(), name, message]);
  return json_({ok: true});
}

function readWishes_() {
  const sheet = getSheet_(WISHES_SHEET, WISHES_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, WISHES_HEADERS.length).getValues();
  return values
    .filter((row) => !isTrue_(row[3]) && String(row[1]).trim() && String(row[2]).trim())
    .map((row) => ({
      submittedAt: row[0] instanceof Date ? row[0].toISOString() : String(row[0]),
      name: String(row[1]).trim(),
      message: String(row[2]).trim()
    }))
    .reverse()
    .slice(0, 60);
}

function isTrue_(value) {
  return value === true || String(value).trim().toLowerCase() === 'true';
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch {
    return e.parameter || {};
  }
}

function findRowByName_(sheet, name, nameColumn, startRow) {
  const lastRow = sheet.getLastRow();
  if (lastRow < startRow) return 0;
  const values = sheet.getRange(startRow, nameColumn, lastRow - startRow + 1, 1).getValues();
  const wanted = nameColumn === 9 ? name : name.toLowerCase();
  for (let index = values.length - 1; index >= 0; index--) {
    const candidate = String(values[index][0]).trim();
    if ((nameColumn === 9 ? candidate : candidate.toLowerCase()) === wanted) return index + startRow;
  }
  return 0;
}

function getSheet_(name, headers) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  // Keep existing sheets working when new columns (such as Events) are added.
  const lastColumn = Math.max(sheet.getLastColumn(), headers.length);
  const current = sheet.getLastRow() === 0
    ? []
    : sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  if (name === GUESTS_SHEET && current.length) {
    const names = current.map(value => String(value).trim());
    const missing = headers.filter(header => !names.includes(header));
    if (missing.length) throw new Error('Missing Guests headers: ' + missing.join(', '));
    return sheet;
  }
  const needsHeaders = headers.some((header, index) => String(current[index] || '').trim() !== header);
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Prevent spreadsheet formula injection and keep cells tidy.
function clean_(value, maxLength) {
  let text = String(value === undefined || value === null ? '' : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, maxLength);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return text;
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
