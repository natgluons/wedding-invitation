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
 * Sheets used:
 *   Guests - private invitation whitelist, allowances, and generated links
 *   RSVP   - one row per invitation code (re-submitting updates the row)
 *   RSVP History - append-only RSVP snapshots and request IDs
 *   Wishes - one editable wish per invitation; Hide moderates visibility
 *   Settings - base invitation URL
 */

const SHEET_ID = '1VU4vJkH8tRVbrXcJOosjkiE_TcQ7WOTJfOZcwdzlpUM';
const RSVP_SHEET = 'RSVP';
const WISHES_SHEET = 'Wishes';
const GUESTS_SHEET = 'Guests';
const GUEST_HEADERS = ['Name', 'Max guests', 'Revoke', 'Code', 'Invitation link'];
const SETTINGS_SHEET = 'Settings';
const GIFTS_SHEET = 'Gifts';
const GIFT_HEADERS = ['ID', 'Group', 'Method', 'Label', 'Network', 'Account', 'Account name', 'Details', 'Link', 'Memo', 'Hide', 'SWIFT / BIC', 'Bank address'];
const RSVP_HEADERS = ['Submitted at', 'Name', 'Attendance', 'Guests', 'Message', 'Invited as', 'Page', 'Events', 'Guest code'];
const RSVP_HISTORY = 'RSVP History';
const HISTORY_HEADERS = ['Submitted at', 'Guest code', 'Request ID', 'Action', 'Name', 'Attendance', 'Guests', 'Events', 'Private note', 'Invited as', 'Page'];
const EVENT_LABELS = {
  'both': 'Holy Matrimony + Reception',
  'holy-matrimony': 'Holy Matrimony only',
  'reception': 'Reception only'
};
const WISHES_HEADERS = ['Submitted at', 'Name', 'Message', 'Hide', 'Guest code', 'Request ID'];
const WISHLIST_SHEET = 'Wishlist';
const WISHLIST_HEADERS = ['ID', 'Name', 'Description', 'Image', 'Link', 'Price', 'Hide', 'Claimed by', 'Claimed at', 'Claim ID'];

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
  }
  getSheet_(GUESTS_SHEET, GUEST_HEADERS);
  const settings = getSheet_(SETTINGS_SHEET, ['Setting', 'Value']);
  if (settings.getLastRow() < 2) {
    settings.appendRow(['Invitation URL', 'https://books-house-our-seconds.trycloudflare.com/']);
  }
  setupGifts_();
  setupWishlist_();
  const rsvpSheet = getSheet_(RSVP_SHEET, RSVP_HEADERS);
  const wishesSheet = getSheet_(WISHES_SHEET, WISHES_HEADERS);
  ensureHeaders_(rsvpSheet, RSVP_HEADERS.concat(['Request ID']));
  ensureHeaders_(getSheet_(RSVP_HISTORY, HISTORY_HEADERS), HISTORY_HEADERS);

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
      payload = {ok: true, guest: {name: guest.name, maxGuests: guest.maxGuests}, response: recoverLatestRsvp_(p.code), wish: readOwnWish_(p.code), gifts: readGifts_(), wishlist: readWishlist_(p.code)};
    } else if (p.action === 'receipt') {
      findGuest_(p.code);
      const key = receiptKey_(p.code, p.requestId);
      const receipt = CacheService.getScriptCache().get(key);
      if (receipt) payload = JSON.parse(receipt);
      else {
        const ownWish = readOwnWish_(p.code);
        if (ownWish && ownWish.requestId === String(p.requestId)) {
          return jsonOrCallback_({ok: true, wish: ownWish, wishes: readWishes_()}, p.callback);
        }
        // A claim whose HTTP response was lost is read back from the sheet, so
        // the guest gets the real outcome instead of an error.
        const claim = readWishlistClaim_(p.code, String(p.requestId));
        if (claim) {
          return jsonOrCallback_({...claim, gift: {id: claim.id, name: claim.name, claimed: claim.claimed}}, p.callback);
        }
        const audit = findHistoryRequest_(getSheet_(RSVP_HISTORY, HISTORY_HEADERS), p.code, String(p.requestId));
        if (audit) recoverLatestRsvp_(p.code);
        payload = audit ? {ok: true, updated: audit.action === 'update', submittedAt: audit.snapshot.submittedAt}
          : {ok: false, pending: true};
      }
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

function setupWishlist_() {
  const sheet = getSheet_(WISHLIST_SHEET, WISHLIST_HEADERS);
  // Starter rows use empty https images so the page shows its own ornament
  // rather than silently rendering a broken picture.
  const examples = [
    ['dinner-ware', 'Dinnerware Set', 'A table setting for four to start our home together.', '', '', 'Rp 1.500.000', false],
    ['linen-set', 'Bed Linen Set', 'Soft cotton sheets in a warm neutral shade.', '', '', 'Rp 900.000', false],
    ['coffee-brewer', 'Coffee Brewer', 'For slow Sunday mornings at home.', '', '', 'Rp 750.000', false],
    ['cookware', 'Cookware Set', 'Pots and pans for our first kitchen.', '', '', 'Rp 2.000.000', false]
  ];
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(value => String(value).trim());
  if (values.length > 1) return;
  sheet.getRange(2, 1, examples.length, headers.length)
    .setValues(examples.map(row => headers.map(header => row[WISHLIST_HEADERS.indexOf(header)] ?? '')));
}

function setupGifts_() {
  const sheet = getSheet_(GIFTS_SHEET, GIFT_HEADERS);
  const examples = [
    ['bca', 'domestic', 'bca', 'Bank Central Asia (BCA)', '', 'YOUR_BCA_ACCOUNT_NUMBER', 'YOUR_ACCOUNT_NAME', '', '', '', false],
    ['jago', 'domestic', 'jago', 'Bank Jago', '', 'YOUR_JAGO_ACCOUNT_NUMBER', 'YOUR_ACCOUNT_NAME', '', '', '', false],
    ['international-bank', 'international', 'bank', 'Bank Central Asia (BCA)', '', 'YOUR_INTERNATIONAL_ACCOUNT_NUMBER', 'YOUR_ACCOUNT_NAME', '', '', '', false, 'YOUR_SWIFT_BIC', 'YOUR_BANK_ADDRESS'],
    ['paypal', 'international', 'paypal', 'PayPal', '', 'YOUR_PAYPAL_EMAIL', 'YOUR_ACCOUNT_NAME', '', '', '', false],
    ...['Ethereum', 'Base', 'Solana', 'Tron', 'Bitcoin'].map(network =>
      ['crypto-' + network.toLowerCase(), 'international', 'crypto', network, network, 'YOUR_' + network.toUpperCase() + '_ADDRESS', '', '', '', '', false])
  ];
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(value => String(value).trim());
  if (values.length < 2) {
    sheet.getRange(2, 1, examples.length, headers.length).setValues(examples.map(row => headers.map(header => row[GIFT_HEADERS.indexOf(header)] ?? '')));
    return;
  }
  // Add missing starter options and upgrade blank accounts only. Preserve user data,
  // formulas, extra columns, visibility choices and custom rows.
  const accountColumn = headers.indexOf('Account');
  const idColumn = headers.indexOf('ID');
  const methodColumn = headers.indexOf('Method');
  const linkColumn = headers.indexOf('Link');
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const example = examples.find(example => example[0] === String(row[idColumn]) && example[2] === String(row[methodColumn]));
    if (example && !String(row[accountColumn] || '').trim() && !String(row[linkColumn] || '').trim()) {
      sheet.getRange(i + 1, accountColumn + 1).setValue(example[5]);
    }
  }
  const knownIds = new Set(values.slice(1).map(row => String(row[idColumn])));
  const missing = examples.filter(example => !knownIds.has(example[0]));
  if (missing.length) sheet.getRange(sheet.getLastRow() + 1, 1, missing.length, headers.length)
    .setValues(missing.map(row => headers.map(header => row[GIFT_HEADERS.indexOf(header)] ?? '')));

}

function readGifts_() {
  const sheet = getSheet_(GIFTS_SHEET, GIFT_HEADERS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(value => String(value).trim());
  const seen = new Set();
  return values.slice(1).flatMap(row => {
    const get = header => row[headers.indexOf(header)];
    const id = String(get('ID') || '').trim();
    const group = String(get('Group') || '').trim().toLowerCase();
    const method = String(get('Method') || '').trim().toLowerCase();
    if (isTrue_(get('Hide')) || !/^[a-zA-Z0-9_-]{1,64}$/.test(id) || seen.has(id)) return [];
    if (!['domestic', 'international'].includes(group) || !['bca','jago','bank','paypal','crypto'].includes(method)) return [];
    if ((['bca','jago'].includes(method) && group !== 'domestic') || (['bank','paypal','crypto'].includes(method) && group !== 'international')) return [];
    const link = String(get('Link') || '').trim();
    const safeLink = /^https:\/\/[^\s]+$/i.test(link) ? link : '';
    const account = String(get('Account') || '').trim();
    const network = String(get('Network') || '').trim();
    if ((!account && !safeLink) || (method === 'crypto' && (!account || !network))) return [];
    if (['bca','jago','bank'].includes(method) && !account) return [];
    seen.add(id);
    return [{id, group, method, example: /^YOUR_/i.test(account), label:String(get('Label') || method).trim(), network,
      account, accountName:String(get('Account name') || '').trim(), details:String(get('Details') || '').trim(),
      link:safeLink, memo:String(get('Memo') || '').trim(),
      swift:String(get('SWIFT / BIC') || '').trim(), bankAddress:String(get('Bank address') || '').trim()}];
  });
}

function receiptKey_(code, requestId) {
  if (!/^[a-zA-Z0-9]{8,64}$/.test(String(code)) || !/^[a-zA-Z0-9-]{16,80}$/.test(String(requestId))) {
    throw new Error('Invalid request');
  }
  return 'rsvp:' + code + ':' + requestId;
}

// Only http(s) image sources are kept: an unchecked value here would end up in
// an <img src> on a public page.
function safeImage_(value) {
  const url = String(value || '').trim();
  return /^https:\/\/[^\s]+$/i.test(url) ? url : '';
}

function wishlistRows_() {
  const sheet = getSheet_(WISHLIST_SHEET, WISHLIST_HEADERS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(value => String(value).trim());
  return {sheet, headers, rows: values.slice(1)};
}

function wishlistFromRow_(row, headers) {
  const get = header => row[headers.indexOf(header)];
  const id = String(get('ID') || '').trim();
  let link = '';
  try {
    const parsed = new URL(String(get('Link') || '').trim());
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') link = parsed.href;
  } catch (error) { /* A malformed link is simply dropped. */ }
  return {
    id,
    name: String(get('Name') || '').trim(),
    description: String(get('Description') || '').trim(),
    image: safeImage_(get('Image')),
    link,
    price: String(get('Price') || '').trim(),
    hidden: isTrue_(get('Hide')),
    // The claimer is kept in the sheet for the couple, never published.
    claimed: Boolean(String(get('Claimed by') || '').trim()),
    claimId: String(get('Claim ID') || '').trim()
  };
}

function readWishlist_(code) {
  const info = wishlistRows_();
  const seen = new Set();
  return info.rows.flatMap(row => {
    const gift = wishlistFromRow_(row, info.headers);
    if (gift.hidden || !/^[a-zA-Z0-9_-]{1,64}$/.test(gift.id) || seen.has(gift.id)) return [];
    if (!gift.name) return [];
    seen.add(gift.id);
    // `mine` tells this guest which claims are theirs. It is computed from the
    // caller's own code, so it never reveals another party's claim.
    const holder = String(row[info.headers.indexOf('Claimed by')] || '').trim();
    return [{id: gift.id, name: gift.name, description: gift.description,
      image: gift.image, link: gift.link, price: gift.price, claimed: gift.claimed,
      mine: Boolean(code) && holder === String(code)}];
  });
}

// Looks up the outcome of one claim request after an unreadable HTTP response.
// Claim ID is rewritten on every successful claim or release, so a matching
// row is proof that this guest's request landed.
function readWishlistClaim_(code, claimId) {
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(claimId)) return null;
  const info = wishlistRows_();
  const claimColumn = info.headers.indexOf('Claim ID');
  const byColumn = info.headers.indexOf('Claimed by');
  const row = info.rows.find(candidate => String(candidate[claimColumn] || '').trim() === claimId);
  if (!row) return null;
  const gift = wishlistFromRow_(row, info.headers);
  const claimed = String(row[byColumn] || '').trim() === String(code);
  return {ok: true, claimed, id: gift.id, name: gift.name, claimId};
}

// Claims are read-modify-write on one row, so they must run under the script
// lock. Claim and release share this function, and both are replay-safe.
function saveClaim_(data) {
  // Authorizes the code and rejects revoked invitations before anything is written.
  findGuest_(data.code);
  const claimId = String(data.requestId || '');
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(claimId)) throw new Error('Invalid claim request');
  const release = data.release === true;
  const id = String(data.id || '').trim();
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) throw new Error('Invalid gift');
  // Resolve columns from the live header row so a reordered sheet keeps working.
  const info = wishlistRows_();
  const index = info.rows.findIndex(row => String(row[info.headers.indexOf('ID')] || '').trim() === id);
  if (index < 0) throw new Error('Gift not found');
  const gift = wishlistFromRow_(info.rows[index], info.headers);
  const holder = String(info.rows[index][info.headers.indexOf('Claimed by')] || '').trim();
  const row = index + 2;
  const column = header => info.headers.indexOf(header) + 1;
  const publicGift = claimed => ({id, name: gift.name, claimed});
  if (release) {
    // Releasing another guest's claim is refused. An already-free row is left
    // untouched so a stale replay cannot clear a newer claim.
    if (holder && holder !== data.code) throw new Error('This gift was claimed on another invitation');
    if (holder === data.code) {
      info.sheet.getRange(row, column('Claimed by')).setValue('');
      info.sheet.getRange(row, column('Claimed at')).clearContent();
      info.sheet.getRange(row, column('Claim ID')).setValue(claimId);
    }
    return {ok: true, claimed: false, gift: publicGift(false)};
  }
  if (holder && holder !== data.code) {
    // Already taken by another party. Reporting success lets their page refresh
    // the item into the taken state instead of showing an error.
    return {ok: true, claimed: true, byOther: true, gift: publicGift(true)};
  }
  // Our own claim is left alone, including the original timestamp, so repeated
  // taps and replayed requests stay idempotent.
  if (!holder) {
    info.sheet.getRange(row, column('Claimed by')).setValue(data.code);
    info.sheet.getRange(row, column('Claimed at')).setNumberFormat('yyyy-mm-dd hh:mm:ss').setValue(new Date());
    info.sheet.getRange(row, column('Claim ID')).setValue(claimId);
  }
  return {ok: true, claimed: true, gift: publicGift(true)};
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

    const key = receiptKey_(data.code, data.requestId);
    findGuest_(data.code);
    const cache = CacheService.getScriptCache();
    const previous = cache.get(key);
    if (previous) return json_(JSON.parse(previous));
    let result;
    try {
      const type = String(data.type || 'rsvp');
      if (type === 'wish') result = saveWish_(data);
      else if (type === 'claim') result = saveClaim_(data);
      else result = saveRsvp_(data);
    }
    catch (error) { result = {ok: false, error: String(error.message || error)}; }
    if (result.ok) cache.put(key, JSON.stringify(result), 600);
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

  const submittedAt = new Date();
  const eventKey = data.attendance === 'attending' ? data.events : '';
  const snapshot = {
    submittedAt: Utilities.formatDate(submittedAt, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'),
    code: data.code, requestId: String(data.requestId), name,
    attendance: data.attendance, guests: data.attendance === 'attending' ? guests : 0,
    eventKey, events: eventKey ? EVENT_LABELS[eventKey] : '',
    message: clean_(data.message === undefined ? (readRsvp_(data.code) || {}).message : data.message, 500), invitedAs: clean_(guest.name, 100),
    page: clean_(String(data.page || '').split(/[?#]/)[0], 300)
  };
  const sheet = ensureHeaders_(getSheet_(RSVP_SHEET, RSVP_HEADERS.concat(['Request ID'])), RSVP_HEADERS.concat(['Request ID']));
  const history = ensureHeaders_(getSheet_(RSVP_HISTORY, HISTORY_HEADERS), HISTORY_HEADERS);
  const oldAudit = findHistoryRequest_(history, data.code, String(data.requestId));
  if (oldAudit) {
    const latest = readRsvp_(data.code);
    const latestAudit = findLatestHistory_(history, data.code);
    if (latestAudit === oldAudit.snapshot.requestId && (!latest || latest.requestId !== oldAudit.snapshot.requestId)) {
      writeCurrent_(sheet, oldAudit.snapshot);
    }
    return {ok: true, updated: oldAudit.action === 'update', submittedAt: oldAudit.snapshot.submittedAt, recovered: true};
  }
  const existing = readRsvp_(data.code);
  const action = existing ? 'update' : 'create';
  const auditValues = {
    'Submitted at': snapshot.submittedAt, 'Guest code': snapshot.code,
    'Request ID': snapshot.requestId, 'Action': action, 'Name': snapshot.name,
    'Attendance': snapshot.attendance, 'Guests': snapshot.guests,
    'Events': snapshot.events, 'Private note': snapshot.message,
    'Invited as': snapshot.invitedAs, 'Page': snapshot.page
  };
  const historyHeaders = history.getRange(1, 1, 1, history.getLastColumn()).getValues()[0].map(value => String(value).trim());
  const auditRow = historyHeaders.map(header => Object.prototype.hasOwnProperty.call(auditValues, header) ? auditValues[header] : '');
  history.appendRow(auditRow); // durable idempotency record is written before the projection
  writeCurrent_(sheet, snapshot);
  return {ok: true, updated: action === 'update', submittedAt: snapshot.submittedAt};
}

function readRsvp_(code) {
  const sheet = getSheet_(RSVP_SHEET, RSVP_HEADERS);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;
  const headers = values[0].map(value => String(value).trim());
  const codeCol = headers.indexOf('Guest code');
  if (codeCol < 0) return null;
  const rowIndex = values.slice(1).findIndex(row => String(row[codeCol]).trim() === String(code));
  if (rowIndex < 0) return null;
  const row = values[rowIndex + 1];
  const get = key => row[headers.indexOf(key)];
  const attendance = String(get('Attendance') || '');
  return {
    name: String(get('Name') || ''), attendance,
    guests: Number(get('Guests') || 0),
    events: eventKey_(String(get('Events') || '')),
    message: String(get('Message') || ''), submittedAt: String(get('Submitted at') || ''),
    requestId: headers.indexOf('Request ID') >= 0 ? String(get('Request ID') || '') : ''
  };
}

function eventKey_(value) {
  if (Object.prototype.hasOwnProperty.call(EVENT_LABELS, value)) return value;
  return Object.keys(EVENT_LABELS).find(key => EVENT_LABELS[key] === value) || '';
}

function writeCurrent_(sheet, snapshot) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(value => String(value).trim());
  const cells = {
    'Submitted at': snapshot.submittedAt, 'Name': snapshot.name,
    'Attendance': snapshot.attendance, 'Guests': snapshot.guests,
    'Message': snapshot.message, 'Invited as': snapshot.invitedAs,
    'Page': snapshot.page, 'Events': EVENT_LABELS[snapshot.events] || snapshot.events, 'Guest code': snapshot.code,
    'Request ID': snapshot.requestId
  };
  const row = findRowByCode_(sheet, snapshot.code, headers.indexOf('Guest code') + 1, 2);
  const values = row ? sheet.getRange(row, 1, 1, headers.length).getValues()[0] : Array(headers.length).fill('');
  headers.forEach((header, index) => {
    if (Object.prototype.hasOwnProperty.call(cells, header)) values[index] = cells[header];
  });
  if (row) sheet.getRange(row, 1, 1, headers.length).setValues([values]);
  else sheet.appendRow(values);
}

function findHistoryRequest_(sheet, code, requestId, loadedValues) {
  const values = loadedValues || sheet.getDataRange().getValues();
  if (values.length < 2) return null;
  const headers = values[0].map(value => String(value).trim());
  const c = headers.indexOf('Guest code'), r = headers.indexOf('Request ID');
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][c]) === String(code) && String(values[i][r]) === requestId) {
      const row = values[i], get = key => row[headers.indexOf(key)];
      const label = String(get('Events') || '');
      return {action: String(get('Action')), snapshot: {
        submittedAt: String(get('Submitted at')), code: String(get('Guest code')),
        requestId: String(get('Request ID')), name: String(get('Name')),
        attendance: String(get('Attendance')), guests: Number(get('Guests') || 0),
        events: eventKey_(label), message: String(get('Private note') || ''),
        invitedAs: String(get('Invited as') || ''), page: String(get('Page') || '')
      }};
    }
  }
  return null;
}

function findLatestHistory_(sheet, code, loadedValues) {
  const values = loadedValues || sheet.getDataRange().getValues();
  if (values.length < 2) return '';
  const headers = values[0].map(value => String(value).trim());
  const c = headers.indexOf('Guest code'), r = headers.indexOf('Request ID');
  for (let i = values.length - 1; i > 0; i--) {
    if (String(values[i][c]) === String(code)) return String(values[i][r] || '');
  }
  return '';
}

function recoverLatestRsvp_(code) {
  const history = getSheet_(RSVP_HISTORY, HISTORY_HEADERS);
  const values = history.getDataRange().getValues();
  const requestId = findLatestHistory_(history, code, values);
  const current = readRsvp_(code);
  // Ordinary lookups are read-only and do not queue behind RSVP/wish writes.
  if (!requestId || (current && current.requestId === requestId)) return current;
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    // Re-read under the lock only for actual audit recovery.
    const freshValues = history.getDataRange().getValues();
    const latestId = findLatestHistory_(history, code, freshValues);
    const audit = latestId ? findHistoryRequest_(history, code, latestId, freshValues) : null;
    const latestCurrent = readRsvp_(code);
    if (audit && (!latestCurrent || latestCurrent.requestId !== latestId)) {
      writeCurrent_(getSheet_(RSVP_SHEET, RSVP_HEADERS.concat(['Request ID'])), audit.snapshot);
      return readRsvp_(code);
    }
    return latestCurrent;
  } finally { lock.releaseLock(); }
}

function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
  }
  let current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(value => String(value).trim());
  headers.forEach(header => {
    if (!current.includes(header)) {
      const column = current.length + 1;
      sheet.getRange(1, column).setValue(header);
      current.push(header);
    }
  });
  return sheet;
}

function wishRows_() {
  const sheet = getSheet_(WISHES_SHEET, WISHES_HEADERS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(value => String(value).trim());
  return {sheet, headers, rows: values.slice(1)};
}

function wishFromRow_(row, headers) {
  const get = header => row[headers.indexOf(header)];
  const date = get('Submitted at');
  return {
    submittedAt: date instanceof Date ? date.toISOString() : String(date || ''),
    name: String(get('Name') || '').trim(), message: String(get('Message') || '').trim(),
    hidden: isTrue_(get('Hide')), requestId: String(get('Request ID') || '')
  };
}

function readOwnWish_(code) {
  const data = wishRows_();
  const column = data.headers.indexOf('Guest code');
  const row = data.rows.find(row => String(row[column] || '').trim() === String(code));
  return row ? wishFromRow_(row, data.headers) : null;
}

function saveWish_(data) {
  const guest = findGuest_(data.code);
  const message = clean_(data.message, 300);
  if (!message) throw new Error('Missing message');
  const info = wishRows_();
  const index = info.rows.findIndex(row => String(row[info.headers.indexOf('Guest code')] || '').trim() === String(data.code));
  const previous = index >= 0 ? wishFromRow_(info.rows[index], info.headers) : null;
  if (!previous || previous.requestId !== String(data.requestId)) {
    const values = index >= 0 ? [...info.rows[index]] : Array(info.headers.length).fill('');
    const fields = {'Submitted at': new Date(), 'Name': clean_(guest.name, 100), 'Message': message,
      'Guest code': data.code, 'Request ID': String(data.requestId)};
    // Preserve the moderation flag, including when a hidden wish is edited.
    info.headers.forEach((header, i) => { if (Object.prototype.hasOwnProperty.call(fields, header)) values[i] = fields[header]; });
    if (index >= 0) info.sheet.getRange(index + 2, 1, 1, info.headers.length).setValues([values]);
    else info.sheet.appendRow(values);
  }
  return {ok: true, wish: readOwnWish_(data.code), wishes: readWishes_()};
}

function readWishes_() {
  const info = wishRows_();
  return info.rows.map(row => wishFromRow_(row, info.headers))
    .filter(wish => !wish.hidden && wish.name && wish.message)
    .reverse().map(wish => ({submittedAt: wish.submittedAt, name: wish.name, message: wish.message}));
}

function jsonOrCallback_(payload, callback) {
  const name = String(callback || '');
  if (name && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) {
    return ContentService.createTextOutput(`${name}(${JSON.stringify(payload)})`).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(payload);
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

function findRowByCode_(sheet, code, codeColumn, startRow) {
  const lastRow = sheet.getLastRow();
  if (lastRow < startRow) return 0;
  const values = sheet.getRange(startRow, codeColumn, lastRow - startRow + 1, 1).getValues();
  const wanted = String(code);
  for (let index = values.length - 1; index >= 0; index--) {
    const candidate = String(values[index][0]).trim();
    if (candidate === wanted) return index + startRow;
  }
  return 0;
}

let executionSpreadsheet_;
function getSheet_(name, headers) {
  const spreadsheet = executionSpreadsheet_ || (executionSpreadsheet_ = SpreadsheetApp.openById(SHEET_ID));
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  // Append missing headers so existing columns, custom fields and data remain in place.
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const current = sheet.getLastRow() === 0 ? [] : sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  // The guest whitelist is strict: a renamed or shortened tab must fail loudly
  // rather than silently revoke or admit everyone. Every other tab appends its
  // missing headers, so a hand-made Wishlist gains claim columns on first use.
  const strict = name === GUESTS_SHEET;
  if (strict && current.length) {
    const names = current.map(value => String(value).trim());
    const missing = headers.filter(header => !names.includes(header));
    if (missing.length) throw new Error('Missing ' + name + ' headers: ' + missing.join(', '));
    return sheet;
  }
  if (!current.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else {
    const names = current.map(value => String(value).trim());
    headers.filter(header => !names.includes(header)).forEach(header => {
      sheet.getRange(1, names.length + 1).setValue(header);
      names.push(header);
    });
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

// Fast opening validation: push only code hashes, names, limits and revocation.
// Saved responses, wishes and payment details remain in the private spreadsheet.
function validationSnapshot_() {
  const sheet = getSheet_(GUESTS_SHEET, GUEST_HEADERS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(value => String(value).trim());
  const column = Object.fromEntries(GUEST_HEADERS.map(header => [header, headers.indexOf(header)]));
  const byCode = new Map();
  for (const row of values.slice(1)) {
    const code = String(row[column.Code] || '').trim();
    if (!/^[a-zA-Z0-9]{8,64}$/.test(code)) continue;
    if (byCode.has(code)) { byCode.get(code).revoked = true; continue; }
    const name = String(row[column.Name] || '').trim();
    const maxGuests = Number(row[column['Max guests']]);
    const invalid = !name || name.length > 100 || !Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 100;
    const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, code, Utilities.Charset.UTF_8);
    const codeHash = bytes.map(byte => ((byte + 256) % 256).toString(16).padStart(2, '0')).join('');
    byCode.set(code, {codeHash, name: name.slice(0, 100) || 'Invalid invitation', maxGuests:invalid ? 1 : maxGuests,
      revoked: invalid || isTrue_(row[column.Revoke])});
  }
  return [...byCode.values()];
}

function syncInvitationWorker() {
  const properties = PropertiesService.getScriptProperties();
  const url = String(properties.getProperty('INVITE_WORKER_URL') || '').replace(/\/$/, '');
  const secret = properties.getProperty('INVITE_WORKER_SYNC_SECRET');
  if (!url || !secret) throw new Error('Configure the invitation Worker before syncing.');
  const version = Date.now();
  const guests = validationSnapshot_();
  const response = UrlFetchApp.fetch(url + '/sync', {
    method:'post', contentType:'application/json', headers:{Authorization:'Bearer ' + secret},
    payload:JSON.stringify({version,guests}), muteHttpExceptions:true
  });
  const status = response.getResponseCode();
  if (status === 409) return 'A newer guest-list sync is already active.';
  if (status !== 200) throw new Error('Worker sync failed (HTTP ' + status + ').');
  properties.setProperty('INVITE_WORKER_LAST_SYNC', new Date().toISOString());
  return 'Synced ' + guests.length + ' invitation records.';
}

function syncInvitationWorkerOnEdit(e) {
  if (e && e.range && e.range.getSheet().getName() === GUESTS_SHEET) syncInvitationWorker();
}

function installInvitationWorkerSync() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('INVITE_WORKER_URL') || !properties.getProperty('INVITE_WORKER_SYNC_SECRET')) {
    throw new Error('Run configureInvitationWorker() first.');
  }
  // Idempotent: one immediate edit trigger and one formula/import backup timer.
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (['syncInvitationWorkerOnEdit','syncInvitationWorker'].includes(trigger.getHandlerFunction())) ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('syncInvitationWorkerOnEdit').forSpreadsheet(SHEET_ID).onEdit().create();
  ScriptApp.newTrigger('syncInvitationWorker').timeBased().everyMinutes(5).create();
  return syncInvitationWorker();
}
