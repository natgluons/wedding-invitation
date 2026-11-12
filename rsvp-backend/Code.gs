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
 * Two tabs are used:
 *   RSVP   - one row per guest (re-submitting updates the row)
 *   Wishes - one row per guestbook message; delete a row to hide a wish
 */

const SHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const RSVP_SHEET = 'RSVP';
const WISHES_SHEET = 'Wishes';
const RSVP_HEADERS = ['Submitted at', 'Name', 'Attendance', 'Guests', 'Message', 'Invited as', 'Page', 'Events'];
const EVENT_LABELS = {
  'both': 'Holy Matrimony + Reception',
  'holy-matrimony': 'Holy Matrimony only',
  'reception': 'Reception only'
};
const WISHES_HEADERS = ['Submitted at', 'Name', 'Message'];

function setup() {
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

  return 'Ready. RSVP and Wishes tabs are in place.';
}

function doGet(e) {
  const wishes = readWishes_();
  const payload = {ok: true, message: 'RSVP endpoint is live.', wishes: wishes};
  const callback = e && e.parameter ? String(e.parameter.callback || '') : '';

  if (callback && /^[A-Za-z_$][A-Za-z0-9_$]*(\.[A-Za-z_$][A-Za-z0-9_$]*)*$/.test(callback)) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(payload)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return json_(payload);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.tryLock(10000);
    const data = parseBody_(e);

    if (String(data.type || 'rsvp') === 'wish') {
      return saveWish_(data);
    }
    return saveRsvp_(data);
  } catch (error) {
    return json_({ok: false, error: String(error)});
  } finally {
    lock.releaseLock();
  }
}

function saveRsvp_(data) {
  const name = clean_(data.name, 100);
  if (!name) return json_({ok: false, error: 'Missing name'});

  const sheet = getSheet_(RSVP_SHEET, RSVP_HEADERS);
  const row = [
    Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'),
    name,
    clean_(data.attendance, 20),
    Number(data.guests) || 0,
    clean_(data.message, 500),
    clean_(data.invitedAs, 60),
    clean_(data.page, 300),
    clean_(EVENT_LABELS[data.events] || data.events, 60)
  ];

  // A guest submitting twice updates their existing row instead of duplicating it.
  const existingRow = findRowByName_(sheet, name, 2, 2);
  if (existingRow) {
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return json_({ok: true, updated: Boolean(existingRow)});
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
    .filter((row) => String(row[1]).trim() && String(row[2]).trim())
    .map((row) => ({
      submittedAt: row[0] instanceof Date ? row[0].toISOString() : String(row[0]),
      name: String(row[1]).trim(),
      message: String(row[2]).trim()
    }))
    .reverse()
    .slice(0, 60);
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
  const wanted = name.toLowerCase();
  for (let index = values.length - 1; index >= 0; index--) {
    if (String(values[index][0]).trim().toLowerCase() === wanted) return index + startRow;
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
