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

// The wishlist is a separate page: it must be reachable from the gift section,
// and that link must carry the guest's code or claiming is impossible.
assert.match(html, /id="wishlistLink"/);
assert.match(html, /data-i18n="gift\.wishlistLink"/);
assert.match(frontend, /syncWishlistLink/);
assert.match(frontend, /url\.searchParams\.set\('code', inviteCode\)/);
const wishlistPage = fs.readFileSync('wishlist.html', 'utf8');
const wishlistScript = fs.readFileSync('wishlist.js', 'utf8');
assert.match(wishlistPage, /id="wishlistGrid"/);
assert.match(wishlistPage, /id="claimDialog"/);
// Claims must never be sent over JSONP, which mobile browsers block.
assert.doesNotMatch(wishlistScript, /createElement\('script'\)/);
assert.match(wishlistScript, /type: 'claim'/);
// Returning links must carry `from`, or the invitation shows the cover instead
// of honouring the #gift hash and the guest has to open the letter again.
assert.match(wishlistScript, /if \(url\.hash\) url\.searchParams\.set\('from', url\.hash\)/);
assert.match(frontend, /function deepLinkTarget/);
assert.match(frontend, /options\.instant \|\| options\.section \|\| prefersReducedMotion\(\)/, 'a deep link must bypass the envelope animation');
assert.match(frontend, /const section = options\.section \|\| pendingDeepLink;/, 'a deep link must reach the scroll step');
assert.match(frontend, /if \(section\) scrollToSection\(section\);/, 'a deep link must scroll to its section instead of the top');
assert.match(frontend, /behavior: 'instant'/, 'the deep-link scroll must not animate');
// The settle loop used to re-place the section for ~1.4s no matter what. A
// guest scrolling during that window was dragged back, which reads as a frozen
// page, so the correction has to yield as soon as the scroll is not where it
// was put.
assert.match(frontend, /function scrollToSection/, 'the deep-link placement must exist');
const settleBlock = frontend.slice(frontend.indexOf('function scrollToSection'), frontend.indexOf('function scrollToSection') + 2200);
assert.match(settleBlock, /Math\.abs\(current - expected\) > 2\) return;/, 'the settle loop must stop once the guest scrolls');
assert.match(settleBlock, /let placed = place\(\);/, 'the placed position must be recorded to detect a takeover');
assert.match(settleBlock, /if \(placed === null\) return;/, 'a section without layout must not start the loop');
assert.match(frontend, /function abandonDeepLink/, 'a failed guest check must restore the cover controls');
// Item content is written as text nodes. The only innerHTML assignments are
// hardcoded SVG icons, so a sheet value can never become markup.
assert.doesNotMatch(wishlistScript, /\.innerHTML\s*=\s*gift\./, 'sheet content is never injected as HTML');
assert.doesNotMatch(wishlistScript, /\.insertAdjacentHTML\(/, 'sheet content is never injected as HTML');
assert.doesNotMatch(wishlistScript, /textContent\s*\+=/, 'item text is assigned, never concatenated');

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
        // Cosmetic sheet formatting is a no-op in the harness.
        setFontWeight() { return this; },
        setNumberFormat() { return this; },
        setBackground() { return this; },
        setColumnWidth() { return this; },
        setFrozenRows() { return this; },
        clearContent() {
          for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) {
            if (rows[r-1+i]) rows[r-1+i][c-1+j] = '';
          }
          return this;
        },
        setValues: values => {
          if (this.failNextWrite) { this.failNextWrite = false; throw new Error('simulated current projection failure'); }
          values.forEach((row,i) => row.forEach((value,j) => { rows[r-1+i] ||= []; rows[r-1+i][c-1+j] = value; }));
        },
        setValue: value => { rows[r-1] ||= []; rows[r-1][c-1] = value; },
        getA1Notation: () => `${String.fromCharCode(64+c)}${r}`
      };
    },
    appendRow: row => rows.push([...row]),
    // Sheet-level formatting helpers are cosmetic no-ops in the harness.
    setColumnWidth() { return this; },
    setFrozenRows() { return this; }
  };
}

const sheets = {
  Guests: sheet(guests),
  RSVP: sheet([['Submitted at','Name','Attendance','Guests','Message','Invited as','Page','Events','Guest code']]),
  'RSVP History': sheet([['Submitted at','Guest code','Request ID','Action','Name','Attendance','Guests','Events','Private note','Invited as','Page']]),
  Wishes: sheet(wishes)
};
sheets.Gifts = sheet([
  ['ID','Group','Method','Label','Network','Account','Account name','Details','Link','Memo','Hide','SWIFT / BIC','Bank address'],
  ['bca','domestic','bca','BCA','','123456','Alice','','','',false],
  ['jago','domestic','jago','Jago','','654321','Alice','','','',true],
  ['paypal','international','paypal','PayPal','','alice@example.test','Alice','','https://paypal.me/example','',false],
  ['base','international','crypto','Base','Base','0xTest','','','','',false],
  ['empty','international','crypto','Solana','Solana','','','','','',false],
  ['unsafe','international','paypal','Unsafe','','','','','javascript:alert(1)','',false],
  // A SEPA row with no IBAN is unusable, and a domestic SEPA row is invalid.
  ['sepa','international','sepa','SEPA transfer','','DE89370400440532013000','Alice','','','',false,'COBADEFFXXX'],
  ['sepa-empty','international','sepa','SEPA empty','','','Alice','','','',false,''],
  ['sepa-wrong-group','domestic','sepa','SEPA domestic','','DE89370400440532013001','Alice','','','',false]
]);
const cache = new Map();
const lockStats = {waits:0};
const context = vm.createContext({
  SpreadsheetApp: {openById: () => ({
    getSheetByName: name => sheets[name],
    // Mirrors getSheet_: an absent tab is created on first use.
    insertSheet: name => (sheets[name] = sheet([]))
  })},
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
assert.equal(gifts.length,4);
assert.equal(gifts.some(gift=>gift.id==='jago'||gift.id==='empty'||gift.id==='unsafe'),false);
assert.equal(gifts.find(gift=>gift.id==='base').network,'Base');
assert.equal(gifts.find(gift=>gift.id==='paypal').link,'https://paypal.me/example');
// SEPA survives the read with its IBAN and BIC; a blank IBAN and a domestic
// SEPA row are both dropped rather than reaching the page.
const sepaGift = gifts.find(gift=>gift.id==='sepa');
assert.equal(sepaGift.group,'international');
assert.equal(sepaGift.account,'DE89370400440532013000');
assert.equal(sepaGift.swift,'COBADEFFXXX');
assert.equal(gifts.some(gift=>gift.id==='sepa-empty'),false,'a SEPA row without an IBAN is dropped');
assert.equal(gifts.some(gift=>gift.id==='sepa-wrong-group'),false,'SEPA is international only');
sheets.Gifts.rows.forEach((row,i)=>row.splice(2,0,i===0?'Private admin notes':'Never expose this'));
assert.equal(run('readGifts_().length'),4,'gift fields use header names');
context.e={parameter:{action:'guest',code}};
assert.equal(json(run('doGet(e)')).gifts.length,4);
assert.equal(JSON.stringify(json(run('doGet(e)')).gifts).includes('Never expose this'),false);
console.log('Gift checks passed: visibility, blank filtering, crypto networks, HTTPS links, header reordering, and whitelisted response fields.');

// Wishlist: the public read never leaks claimer identity, and claims are
// bound to the invitation code that made them.
sheets.Wishlist = sheet([
  ['ID','Name','Description','Image','Link','Price','Hide','Claimed by','Claimed at','Claim ID'],
  ['dinner-ware','Dinnerware Set','A table setting.','https://cdn.example.test/plate.jpg','https://shop.example.test/plate','Rp 1.500.000',false,'','',''],
  ['hidden-row','Secret Gift','Not published.','','','',true,'','',''],
  ['no-name','','Missing a name.','','','',false,'','',''],
  ['odd id!','Bad Id','Invalid id.','','','',false,'','',''],
  ['unsafe-image','Unsafe Image','','javascript:alert(1)','javascript:alert(1)','',false,'','',''],
  ['linen-set','Linen Set','Soft sheets.','http://insecure.example.test/x.jpg','','','',false,'','','']
]);
let list = run('readWishlist_()');
assert.equal(list.length,3,'hidden, nameless and malformed rows are dropped');
assert.equal(list.find(gift=>gift.id==='odd id!'),undefined,'IDs must match the allowed pattern');
const unsafe = list.find(gift=>gift.id==='unsafe-image');
assert.equal(unsafe.image,'','non-https images are stripped');
assert.equal(unsafe.link,'','javascript: links are stripped');
assert.equal(list.find(gift=>gift.id==='linen-set').image,'','http images are stripped');
assert.equal(list.every(gift=>!('claimedBy' in gift) && !('claimId' in gift)),true,'public payload carries no claimer identity');
const guestLookup = json(run('doGet({parameter:{action:"guest",code:"' + code + '"}})'));
assert.equal(guestLookup.wishlist.length,3,'the guest lookup ships the wishlist alongside gifts');
assert.equal(JSON.stringify(guestLookup.wishlist).includes('Claimed by'),false);

const claimIds = {first:'claim-1111111111111111', second:'claim-2222222222222222', release:'claim-3333333333333333'};
let result = json(post({type:'claim', code, requestId:claimIds.first, id:'dinner-ware'}));
assert.equal(result.ok,true);
assert.equal(result.claimed,true);
assert.equal(result.gift.name,'Dinnerware Set');
const claimRow = sheets.Wishlist.rows.find(row=>row[0]==='dinner-ware');
assert.equal(claimRow[7],code,'the claim records the invitation code');
assert.equal(claimRow[9],claimIds.first,'the claim records its request id');
assert.ok(claimRow[8] && !Number.isNaN(new Date(claimRow[8]).getTime()),'the claim records when it happened');

result = json(post({type:'claim', code:other, requestId:claimIds.second, id:'dinner-ware'}));
assert.equal(result.byOther,true,'a second household sees the item as taken');
assert.equal(sheets.Wishlist.rows.find(row=>row[0]==='dinner-ware')[7],code,'another household cannot overwrite the claim');
assert.equal(JSON.stringify(result).includes('Alice'),false,'the claimer is never revealed to other guests');

const firstStamp = sheets.Wishlist.rows.find(row=>row[0]==='dinner-ware')[8];
result = json(post({type:'claim', code, requestId:'claim-4444444444444444', id:'dinner-ware'}));
assert.equal(result.claimed,true);
assert.equal(sheets.Wishlist.rows.find(row=>row[0]==='dinner-ware')[8],firstStamp,'re-claiming keeps the original timestamp');

assert.equal(json(post({type:'claim', code:other, requestId:'claim-5555555555555555', id:'dinner-ware', release:true})).ok,false,'only the claimer can release');
assert.equal(sheets.Wishlist.rows.find(row=>row[0]==='dinner-ware')[7],code,'a refused release leaves the claim intact');

result = json(post({type:'claim', code, requestId:claimIds.release, id:'dinner-ware', release:true}));
assert.equal(result.claimed,false);
assert.equal(sheets.Wishlist.rows.find(row=>row[0]==='dinner-ware')[7],'','release clears the claimer');

assert.equal(json(post({type:'claim', code:'bad', requestId:'claim-6666666666666666', id:'linen-set'})).ok,false,'an unknown invitation cannot claim');
assert.equal(json(post({type:'claim', code, requestId:'short', id:'linen-set'})).ok,false,'a weak request id is rejected');
assert.equal(json(post({type:'claim', code, requestId:'claim-7777777777777777', id:'hidden-row'})).ok,true,'hidden rows remain claimable by direct id, but are never listed');
assert.equal(run('readWishlist_()').some(gift=>gift.id==='hidden-row'),false);
assert.equal(json(post({type:'claim', code, requestId:'claim-8888888888888888', id:'missing-sku'})).ok,false);
// An extra Guests column was inserted above, so Revoke now sits at index 3.
guests[1][3] = true;
assert.equal(json(post({type:'claim', code, requestId:'claim-9999999999999999', id:'linen-set'})).ok,false,'revoked invitations cannot claim');
guests[1][3] = '';

// A lost HTTP response is read back from the sheet instead of failing.
result = json(post({type:'claim', code, requestId:'claim-aaaaaaaaaaaaaaaa', id:'linen-set'}));
assert.equal(result.ok,true);
assert.equal(JSON.stringify(result).includes('Alice'),false,'the claim response never repeats the claimer name');
let receipt = json(run('doGet({parameter:{action:"receipt",code:"' + code + '",requestId:"claim-aaaaaaaaaaaaaaaa"}})'));
assert.equal(receipt.claimed,true,'a lost claim response is recovered');
assert.equal(receipt.gift.id,'linen-set');
receipt = json(run('doGet({parameter:{action:"receipt",code:"' + code + '",requestId:"claim-bbbbbbbbbbbbbbbb"}})'));
assert.equal(receipt.pending,true,'an unrelated request id stays pending');
receipt = json(run('doGet({parameter:{action:"receipt",code:"' + other + '",requestId:"claim-aaaaaaaaaaaaaaaa"}})'));
assert.equal(receipt.ok,true,'another household cannot read a claim receipt as its own');
assert.equal(receipt.claimed,false,'the recovered claim never reports as their own');

sheets.Wishlist.rows.forEach((row,i)=>row.splice(3,0,i===0?'Private note':'Internal remark'));
assert.equal(run('readWishlist_().length'),3,'wishlist fields resolve by header name');
assert.equal(JSON.stringify(run('readWishlist_()')).includes('Internal remark'),false);
console.log('Wishlist checks passed: visibility filtering, safe images and links, hidden claimer identity, claim locking, idempotent retries, owner-only release, revocation and header reordering.');

const configuredWishlist = sheets.Wishlist;
sheets.Wishlist = sheet([['ID','Name','Description','Image','Link','Price','Hide']]);
run('setupWishlist_()');
assert.equal(sheets.Wishlist.rows.length,5,'setup seeds starter rows');
assert.deepEqual(sheets.Wishlist.rows[0].slice(7),['Claimed by','Claimed at','Claim ID'],'claim columns are appended to a hand-made tab');
assert.equal(run('readWishlist_().length'),4);
assert.equal(run('readWishlist_()').every(gift=>gift.claimed === false),true);
sheets.Wishlist.rows[1][1]='My Own Gift';
run('setupWishlist_()');
assert.equal(sheets.Wishlist.rows[1][1],'My Own Gift','setup never overwrites edited rows');
assert.equal(run('readWishlist_()').length,4,'setup does not duplicate rows');
sheets.Wishlist=configuredWishlist;
console.log('Wishlist setup checks passed: starter rows, empty claims and idempotent reruns.');

const configuredGifts = sheets.Gifts;
sheets.Gifts = sheet([['ID','Group','Method','Label','Network','Account','Account name','Details','Link','Memo','Hide']]);
run('setupGifts_()');
assert.equal(sheets.Gifts.rows.length,11);
assert.equal(sheets.Gifts.rows[1][5],'YOUR_BCA_ACCOUNT_NUMBER');
assert.equal(run('readGifts_().every(gift => gift.example)'),true);
assert.equal(run('readGifts_().find(gift => gift.method === "bank").swift'), 'YOUR_SWIFT_BIC');
assert.equal(run('readGifts_().find(gift => gift.method === "bank").bankAddress'), 'YOUR_BANK_ADDRESS');
assert.equal(run('readGifts_().filter(gift => gift.method === "crypto").length'), 5);
// SEPA is a second way to reach an international account, so it needs its own
// row with an IBAN in Account and a BIC, and must not appear domestically.
const sepa = run('readGifts_().find(gift => gift.method === "sepa")');
assert.equal(sepa.account, 'YOUR_IBAN', 'the SEPA row carries its IBAN');
assert.equal(sepa.swift, 'YOUR_BIC', 'the SEPA row carries its BIC');
assert.equal(sepa.group, 'international');
assert.equal(run('readGifts_().find(gift => gift.id === "international-sepa").group'), 'international');
assert.equal(run('GIFT_HEADERS.indexOf("SWIFT / BIC") > 0'), true);
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
