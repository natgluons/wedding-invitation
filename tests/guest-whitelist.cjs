const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const frontend = fs.readFileSync('main.js', 'utf8');
assert.match(html, /name="attendance" value="attending" required(?! checked)/);
assert.match(html, /id="savedRsvp"/);
assert.match(html, /id="editRsvp"/);
assert.match(html, /id="cancelRsvpEdit"/);
assert.doesNotMatch(html, /id="guestMessage"/);
assert.match(html, /public in the Words of Love feed/);
assert.doesNotMatch(frontend, /STORAGE_KEY|readSavedResponse/);
assert.match(frontend, /backendQuery\(\{action: 'guest', code: inviteCode\}\)/);

const code = 'K7ZM3PQ8X2';
const other = 'b'.repeat(32);
const guests = [['Name','Max guests','Revoke','Code','Invitation link'], ['Alice',2,'',code,''], ['Alice',1,false,other,'']];
const wishes = [['Submitted at','Name','Message','Hide'], ['2026-11-12','A','Visible',''], ['2026-11-12','B','Hidden',true], ['2026-11-12','C','Visible too',false], ['2026-11-12','D','Hidden too','TRUE']];

function sheet(rows) {
  return {
    rows,
    getLastRow: () => rows.length,
    getLastColumn: () => Math.max(0, ...rows.map(row => row.length)),
    getDataRange: () => ({getValues: () => rows.map(row => [...row])}),
    getRange(r, c, h = 1, w = 1) {
      return {
        getValues: () => Array.from({length:h}, (_,i) => Array.from({length:w}, (_,j) => rows[r-1+i]?.[c-1+j] ?? '')),
        setValues: values => {
          if (this.failNextWrite) { this.failNextWrite = false; throw new Error('simulated current projection failure'); }
          values.forEach((row,i) => row.forEach((value,j) => { rows[r-1+i] ||= []; rows[r-1+i][c-1+j] = value; }));
        },
        setValue: value => { rows[r-1] ||= []; rows[r-1][c-1] = value; },
        getA1Notation: () => `${String.fromCharCode(64+c)}${r}`
      };
    },
    appendRow: row => rows.push([...row])
  };
}

const sheets = {
  Guests: sheet(guests),
  RSVP: sheet([['Submitted at','Name','Attendance','Guests','Message','Invited as','Page','Events','Guest code']]),
  'RSVP History': sheet([['Submitted at','Guest code','Request ID','Action','Name','Attendance','Guests','Events','Private note','Invited as','Page']]),
  Wishes: sheet(wishes)
};
sheets.Gifts = sheet([
  ['ID','Group','Method','Label','Network','Account','Account name','Details','Link','Memo','Hide'],
  ['bca','domestic','bca','BCA','','123456','Alice','','','',false],
  ['jago','domestic','jago','Jago','','654321','Alice','','','',true],
  ['paypal','international','paypal','PayPal','','alice@example.test','Alice','','https://paypal.me/example','',false],
  ['base','international','crypto','Base','Base','0xTest','','','','',false],
  ['empty','international','crypto','Solana','Solana','','','','','',false],
  ['unsafe','international','paypal','Unsafe','','','','','javascript:alert(1)','',false]
]);
const cache = new Map();
const lockStats = {waits:0};
const context = vm.createContext({
  SpreadsheetApp: {openById: () => ({getSheetByName: name => sheets[name]})},
  Utilities: {formatDate: () => '2026-11-12 12:00:00'},
  LockService: {getScriptLock: () => ({waitLock(){lockStats.waits++;}, releaseLock(){}})},
  CacheService: {getScriptCache: () => ({get:key => cache.get(key) || null, put:(key,value) => cache.set(key,value)})},
  ContentService: {createTextOutput: text => ({text,setMimeType(){return this;}}),MimeType:{JSON:'json',JAVASCRIPT:'js'}}
});
vm.runInContext(fs.readFileSync('rsvp-backend/Code.gs','utf8'), context);
const run = expression => vm.runInContext(expression, context);
const post = data => context.doPost({postData:{contents:JSON.stringify(data)}});
const json = result => JSON.parse(result.text);

const base = {type:'rsvp',name:'Attacker controlled name',attendance:'attending',guests:2,events:'both',message:'private names and dietary needs',code,page:'https://example.com/?code=secret'};
context.data = {...base, requestId:'create-111111111111'};
assert.equal(run('saveRsvp_(data).ok'), true);
assert.equal(sheets.RSVP.rows.length, 2);
assert.equal(sheets.RSVP.rows[1][1], 'Alice', 'the Guests sheet owns the saved name');
assert.equal(sheets.RSVP.rows[1][6], 'https://example.com/');
assert.equal(sheets['RSVP History'].rows[1][3], 'create');
assert.equal(sheets['RSVP History'].rows[1][8], 'private names and dietary needs');

for (const n of [0, 3, 1.5, 'nope']) {
  context.data = {...base, requestId:'bad-count-1111111111', guests:n};
  assert.throws(() => run('saveRsvp_(data)'), /Party size/);
}
context.data = {...base, requestId:'bad-event-1111111111', events:'fake'};
assert.throws(() => run('saveRsvp_(data)'), /Invalid event/);
context.data = {...base, requestId:'bad-attend-1111111111', attendance:''};
assert.throws(() => run('saveRsvp_(data)'), /Invalid attendance/);

const update = {...base, requestId:'update-111111111111', attendance:'not-attending', guests:0, events:'', message:''};
context.data = update;
assert.equal(run('saveRsvp_(data).updated'), true);
assert.equal(sheets.RSVP.rows.length, 2);
assert.equal(sheets.RSVP.rows[1][3], 0);
assert.equal(sheets['RSVP History'].rows[2][3], 'update');

const third = {...base, requestId:'update-222222222222', guests:1, events:'reception'};
sheets.RSVP.failNextWrite = true;
assert.equal(json(post(third)).ok, false, 'projection failure is not reported as success');
assert.equal(sheets['RSVP History'].rows.length, 4, 'audit row persists before the failed projection');
assert.equal(json(post(third)).ok, true, 'same request recovers from the audit snapshot');
assert.equal(sheets.RSVP.rows[1][3], 1);
assert.equal(sheets.RSVP.rows[1][7], 'Reception only');
assert.equal(sheets['RSVP History'].rows.length, 4, 'retry does not duplicate audit history');
assert.equal(json(post(third)).ok, true, 'request replay remains idempotent');
assert.equal(sheets['RSVP History'].rows.length, 4);
guests[1][2] = true;
assert.match(json(post(third)).error, /revoked/, 'cached success must not bypass revocation');
guests[1][2] = '';

const fourth = {...base, requestId:'update-333333333333', guests:2, events:'holy-matrimony'};
sheets.RSVP.failNextWrite = true;
assert.equal(json(post(fourth)).ok, false);
assert.equal(sheets['RSVP History'].rows.length, 5);
context.e = {parameter:{action:'guest',code}};
assert.equal(json(run('doGet(e)')).response.events, 'holy-matrimony', 'authenticated lookup repairs a partial projection');
assert.equal(sheets.RSVP.rows[1][7], 'Holy Matrimony only');
assert.equal(sheets['RSVP History'].rows.length, 5);
cache.clear();
assert.equal(json(post(third)).ok, true, 'old retries remain idempotent after cache expiry');
assert.equal(sheets.RSVP.rows[1][7], 'Holy Matrimony only', 'an older replay cannot replace a newer response');
assert.equal(sheets['RSVP History'].rows.length, 5);

context.e = {parameter:{action:'guest',code}};
const guestPayload = json(run('doGet(e)'));
assert.equal(guestPayload.guest.name, 'Alice');
assert.equal(guestPayload.response.events, 'holy-matrimony');
assert.equal(guestPayload.response.message, 'private names and dietary needs');
context.e = {parameter:{action:'guest',code:other}};
assert.equal(json(run('doGet(e)')).response, null, 'a second code cannot see another party response');
guests[1][2] = true;
context.e = {parameter:{action:'guest',code}};
assert.match(json(run('doGet(e)')).error, /revoked/);
guests[1][2] = '';

context.data = {...base, requestId:'decline-111111111111', attendance:'not-attending', guests:99, events:'fake'};
assert.equal(run('saveRsvp_(data).ok'), true);
context.data = {...base, requestId:'bad-format-111111111111', code:'invalid'};
assert.throws(() => run('findGuest_(data.code)'), /Invalid invitation/);
guests.push(['Duplicate',2,true,code,'']);
context.data.code = code;
assert.throws(() => run('findGuest_(data.code)'), /Duplicate invitation/);
guests.pop();

assert.equal(run('readWishes_().length'), 2);
assert.equal(run('readWishes_().some(wish => wish.name === \'B\' || wish.name === \'D\')'), false);
assert.equal(json(run('doGet({parameter:{action:"wishes"}})')).wishes[0].message, 'Visible too');
guests.forEach((row,index) => row.splice(2,0,index === 0 ? 'Private notes' : 'Custom value'));
assert.equal(run('findGuest_("' + code + '").maxGuests'), 2, 'inserted Guests columns remain supported');
guests[1][3] = true;
assert.throws(() => run('findGuest_("' + code + '")'), /revoked/);
guests[1][3] = '';
console.log('RSVP checks passed: whitelist, authoritative names, scoped restore, revocation, validations, audit history, retry recovery, durable idempotency, and public wishes.');

const wishRequest = {type:'wish', code, requestId:'wish-create-111111111', name:'Forged Name', message:'Our first wish'};
const initialWishes = sheets.Wishes.rows.length;
let wishResult = json(post(wishRequest));
assert.equal(wishResult.ok, true);
assert.equal(wishResult.wish.name, 'Alice');
assert.equal(sheets.Wishes.rows.length, initialWishes + 1);
wishResult = json(post({...wishRequest, requestId:'wish-update-111111111', message:'An edited wish'}));
assert.equal(wishResult.wish.message, 'An edited wish');
assert.equal(sheets.Wishes.rows.length, initialWishes + 1, 'one row per invitation');
assert.equal(json(post({...wishRequest, code:other, requestId:'wish-other-1111111111'})).ok, true);
assert.equal(sheets.Wishes.rows.length, initialWishes + 2, 'same names on different codes remain distinct');
const wishHeaders = sheets.Wishes.rows[0];
const ownRow = sheets.Wishes.rows.find(row => row[wishHeaders.indexOf('Guest code')] === code);
ownRow[wishHeaders.indexOf('Hide')] = true;
wishResult = json(post({...wishRequest, requestId:'wish-hidden-111111111', message:'Still moderated'}));
assert.equal(wishResult.wish.hidden, true);
assert.equal(wishResult.wishes.some(wish => wish.message === 'Still moderated'), false);
assert.equal(wishResult.wishes.some(wish => 'code' in wish || 'requestId' in wish), false);
guests[1][3] = true;
assert.equal(json(post({...wishRequest, requestId:'wish-revoked-11111111'})).ok, false);
guests[1][3] = '';
assert.equal(json(post({...wishRequest, code:'bad', requestId:'wish-invalid-11111111'})).ok, false);
context.e = {parameter:{action:'guest',code:other}};
assert.equal(json(run('doGet(e)')).wish.message, 'Our first wish');
cache.clear();
assert.match(run('doGet({parameter:{action:"receipt",code:"' + code + '",requestId:"wish-hidden-111111111",callback:"wishReceipt"}})').text, /^wishReceipt\(/);
console.log('Editable wish checks passed: code authentication, authoritative name, one wish per code, edits, separate households, moderation, private fields, and restore.');

const gifts = run('readGifts_()');
assert.equal(gifts.length,3);
assert.equal(gifts.some(gift=>gift.id==='jago'||gift.id==='empty'||gift.id==='unsafe'),false);
assert.equal(gifts.find(gift=>gift.id==='base').network,'Base');
assert.equal(gifts.find(gift=>gift.id==='paypal').link,'https://paypal.me/example');
sheets.Gifts.rows.forEach((row,i)=>row.splice(2,0,i===0?'Private admin notes':'Never expose this'));
assert.equal(run('readGifts_().length'),3,'gift fields use header names');
context.e={parameter:{action:'guest',code}};
assert.equal(json(run('doGet(e)')).gifts.length,3);
assert.equal(JSON.stringify(json(run('doGet(e)')).gifts).includes('Never expose this'),false);
console.log('Gift checks passed: visibility, blank filtering, crypto networks, HTTPS links, header reordering, and whitelisted response fields.');

const configuredGifts = sheets.Gifts;
sheets.Gifts = sheet([['ID','Group','Method','Label','Network','Account','Account name','Details','Link','Memo','Hide']]);
run('setupGifts_()');
assert.equal(sheets.Gifts.rows.length,10);
assert.equal(sheets.Gifts.rows[1][5],'YOUR_BCA_ACCOUNT_NUMBER');
assert.equal(run('readGifts_().every(gift => gift.example)'),true);
assert.equal(run('readGifts_().find(gift => gift.method === "bank").swift'), 'YOUR_SWIFT_BIC');
assert.equal(run('readGifts_().find(gift => gift.method === "bank").bankAddress'), 'YOUR_BANK_ADDRESS');
assert.equal(run('readGifts_().filter(gift => gift.method === "crypto").length'), 5);
sheets.Gifts.rows[1][5]='001234567890';
sheets.Gifts.rows[2][10]=true;
run('setupGifts_()');
assert.equal(sheets.Gifts.rows[1][5],'001234567890');
assert.equal(sheets.Gifts.rows[2][10],true);
sheets.Gifts.rows[1][5]='';
run('setupGifts_()');
assert.equal(sheets.Gifts.rows[1][5],'YOUR_BCA_ACCOUNT_NUMBER');
sheets.Gifts=configuredGifts;
console.log('Gift starter checks passed: obvious examples, safe preview flags, idempotent setup, blank-cell upgrade, and preserved accounts/visibility.');

context.e={parameter:{action:'guest',code}};
run('doGet(e)');
const stableLocks=lockStats.waits;
assert.equal(json(run('doGet(e)')).ok,true);
assert.equal(lockStats.waits,stableLocks,'ordinary verified lookups must not take a write lock');
console.log('Lookup performance check passed: current responses do not acquire a write lock.');

const {createHash} = require('node:crypto');
context.Utilities.DigestAlgorithm={SHA_256:'SHA_256'};
context.Utilities.Charset={UTF_8:'UTF_8'};
context.Utilities.computeDigest=(_,value)=>[...createHash('sha256').update(value).digest()].map(byte=>byte>127?byte-256:byte);
let mirror=run('validationSnapshot_()');
assert.equal(mirror.find(row=>row.name==='Alice').codeHash,createHash('sha256').update(code).digest('hex'));
assert.equal(mirror.some(row=>'code' in row),false,'sync never contains working invitation codes');
guests.push(['Duplicate',2,'custom',false,code,'']);
mirror=run('validationSnapshot_()');
assert.equal(mirror.find(row=>row.codeHash===createHash('sha256').update(code).digest('hex')).revoked,true);
guests.pop();
console.log('Worker snapshot checks passed: exact SHA-256 hashes, current header positions, no raw codes, and duplicate-code rejection.');
