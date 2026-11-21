// Checks the sync trigger: an edit on Guests, Gifts or the Wishlist pushes a
// snapshot, other sheets do nothing, a burst of edits collapses into one sync,
// and a claim is never held back by the debounce.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function build() {
  const props = new Map();
  const syncs = [];
  const triggers = [];
  const sheets = {
    Guests: {name: 'Guests'},
    Gifts: {name: 'Gifts'},
    Wishlist: {name: 'Wishlist'},
    RSVP: {name: 'RSVP'}
  };
  const context = vm.createContext({
    PropertiesService: {getScriptProperties: () => ({
      getProperty: key => (props.has(key) ? props.get(key) : null),
      setProperty: (key, value) => props.set(key, value),
      deleteProperty: key => props.delete(key)
    })},
    ScriptApp: {
      getProjectTriggers: () => triggers,
      // Apps Script removes the trigger from the project by id, so the same
      // handler must never appear twice after a reinstall.
      deleteTrigger: trigger => {
        const at = triggers.indexOf(trigger);
        if (at >= 0) triggers.splice(at, 1);
      },
      newTrigger: handler => {
        const trigger = {handler, getHandlerFunction: () => handler,
          forSpreadsheet: () => trigger, onEdit: () => trigger,
          timeBased: () => trigger, everyMinutes: () => trigger, create: () => triggers.push(trigger)};
        return trigger;
      }
    },
    UrlFetchApp: {fetch: (url, options) => {
      syncs.push(JSON.parse(options.payload));
      return {getResponseCode: () => 200};
    }},
    Utilities: {computeDigest: () => []},
    SpreadsheetApp: {openById: () => ({getSheetByName: name => sheets[name]})},
    LockService: {getScriptLock: () => ({waitLock(){}, releaseLock(){}})},
    CacheService: {getScriptCache: () => ({get: () => null, put(){}})},
    ContentService: {createTextOutput: text => ({text, setMimeType(){return this;}}), MimeType: {JSON: 'json'}}
  });
  props.set('INVITE_WORKER_URL', 'https://worker.test');
  props.set('INVITE_WORKER_SYNC_SECRET', 'test-secret');
  vm.runInContext(fs.readFileSync('rsvp-backend/Code.gs', 'utf8'), context);
  // The snapshot readers are stubbed: this test is about *when* a sync runs,
  // not what it reads. Assigned after the script loads so they replace the real
  // definitions rather than being hoisted under them.
  vm.runInContext(`
    validationSnapshot_ = () => [{codeHash: 'a'.repeat(64), name: 'Guest', maxGuests: 2, revoked: false}];
    readGifts_ = () => [{id: 'bca', method: 'bca'}];
    wishlistSnapshot_ = () => [{id: 'kettle', name: 'Kettle', claimed: false, claimedByHash: ''}];
  `, context);
  const run = expression => vm.runInContext(expression, context);
  return {run, syncs, props, triggers, context};
}

// Each of the three mirrored sheets triggers a sync.
for (const sheetName of ['Guests', 'Gifts', 'Wishlist']) {
  const {run, syncs} = build();
  run(`syncInvitationWorkerOnEdit({range:{getSheet:() => ({getName:() => '${sheetName}'})}})`);
  assert.equal(syncs.length, 1, sheetName + ' edits must sync');
  assert.equal(syncs[0].gifts.length, 1, 'gifts ride along');
  assert.equal(syncs[0].wishlist.length, 1, 'the wishlist rides along');
}

// Other sheets, and a trigger fired without an event, do nothing.
for (const sheetName of ['RSVP']) {
  const {run, syncs} = build();
  run(`syncInvitationWorkerOnEdit({range:{getSheet:() => ({getName:() => '${sheetName}'})}})`);
  assert.equal(syncs.length, 0, sheetName + ' edits must not sync');
}
{
  const {run, syncs} = build();
  run('syncInvitationWorkerOnEdit()');
  run('syncInvitationWorkerOnEdit({})');
  run('syncInvitationWorkerOnEdit({range:null})');
  assert.equal(syncs.length, 0, 'a malformed event must not throw or sync');
}

// A burst of edits collapses into a single push.
{
  const {run, syncs} = build();
  for (let i = 0; i < 5; i++) run(`syncInvitationWorkerOnEdit({range:{getSheet:() => ({getName:() => 'Gifts'})}})`);
  assert.equal(syncs.length, 1, 'five quick edits must produce one sync');
}

// A claim is re-synced even when an edit sync just happened.
{
  const {run, syncs} = build();
  run(`syncInvitationWorkerOnEdit({range:{getSheet:() => ({getName:() => 'Wishlist'})}})`);
  assert.equal(syncs.length, 1);
  // Simulate doPost's claim path immediately afterwards.
  run('syncInvitationWorker({force:true})');
  assert.equal(syncs.length, 2, 'a forced sync ignores the debounce');
}

// A manual run and the installer always push, so seeding cannot be skipped.
{
  const {run, syncs} = build();
  run('syncInvitationWorker({force:true})');
  run('syncInvitationWorker({force:true})');
  assert.equal(syncs.length, 2);
}
{
  const {run, syncs, triggers} = build();
  run('installInvitationWorkerSync()');
  assert.equal(syncs.length, 1, 'installation seeds the mirror');
  assert.equal(triggers.length, 2, 'one edit trigger and one timer, never duplicates');
  run('installInvitationWorkerSync()');
  assert.equal(triggers.length, 2, 'reinstalling replaces rather than adds');
}

// A failed sync must not block the next attempt with its own debounce.
{
  const {run, syncs, props} = build();
  run(`UrlFetchApp.fetch = () => ({getResponseCode: () => 500})`);
  assert.throws(() => run('syncInvitationWorker({force:true})'), /HTTP 500/);
  assert.equal(props.get('INVITE_WORKER_SYNC_AT'), undefined, 'a failure clears the debounce mark');
}

console.log('Sync trigger checks passed: all three mirrored sheets sync, other sheets and malformed events are inert, edit bursts collapse, claims and setup always force, and a failure clears its own debounce.');
