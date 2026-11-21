// Checks the /invite edge route: one call returns the guest, the gift methods
// and the wishlist, with ownership decided by code hash so the raw invitation
// code never reaches the database.
import assert from 'node:assert/strict';
import worker, {sha256} from '../validation-worker/src.mjs';

const CODE = 'HDUQCDH404';
const OTHER = 'ZZZZZZZZ99';

// Minimal stand-in for the D1 binding: enough to answer the two prepared
// statements the route uses, and to fail like an un-migrated database.
function fakeDb(state) {
  return {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (state.noContentTable) throw new Error('no such table: content');
              if (!/FROM sync_state s LEFT JOIN guests/.test(sql)) throw new Error('unexpected query');
              return state.row;
            }
          };
        }
      };
    }
  };
}

async function call(env, path) {
  const response = await worker.fetch(new Request('https://edge.test' + path), env);
  return {status: response.status, body: await response.json()};
}

const hash = await sha256(CODE);
const otherHash = await sha256(OTHER);

const base = {
  row: {
    synced_at: Date.now(),
    name: 'testing',
    max_guests: 2,
    revoked: 0,
    gifts: JSON.stringify([{id: 'bca', group: 'domestic', method: 'bca', account: '123', label: 'BCA'}]),
    wishlist: JSON.stringify([
      {id: 'a', name: 'Kettle', claimed: true, claimedByHash: hash},
      {id: 'b', name: 'Toaster', claimed: true, claimedByHash: otherHash},
      {id: 'c', name: 'Mug', claimed: false, claimedByHash: ''}
    ])
  },
  env: {DB: null, MAX_SYNC_AGE_SECONDS: '900'}
};

// Happy path: everything arrives in one response.
{
  const env = {...base.env, DB: fakeDb(base)};
  const {status, body} = await call(env, '/invite?code=' + CODE);
  assert.equal(status, 200);
  assert.equal(body.guest.name, 'testing');
  assert.equal(body.guest.maxGuests, 2);
  assert.equal(body.gifts.length, 1);
  assert.equal(body.wishlist.length, 3);
  assert.deepEqual(body.wishlist.map(item => item.mine), [true, false, false], 'only this guest\'s own claim is mine');
  assert.deepEqual(body.wishlist.map(item => item.claimed), [true, true, false]);
  // The claimer's identity must never be published.
  assert.ok(!JSON.stringify(body).includes(hash), 'claim hash must not leak to the browser');
  assert.ok(!JSON.stringify(body).includes(OTHER), 'raw codes must not appear');
}

// A second guest sees the same list, and nothing is theirs.
{
  const env = {...base.env, DB: fakeDb(base)};
  const {body} = await call(env, '/invite?code=' + OTHER);
  assert.deepEqual(body.wishlist.map(item => item.mine), [false, true, false]);
}

// A revoked or unknown guest is refused, not served.
for (const [label, row] of [['unknown', {...base.row, name: null}], ['revoked', {...base.row, revoked: 1}]]) {
  const env = {...base.env, DB: fakeDb({row})};
  const {status, body} = await call(env, '/invite?code=' + CODE);
  assert.equal(status, 403, label + ' must be refused');
  assert.equal(body.ok, false);
}

// A stale mirror falls back to the sheet instead of serving yesterday's gifts.
{
  const env = {...base.env, DB: fakeDb({row: {...base.row, synced_at: Date.now() - 901 * 1000}})};
  const {status, body} = await call(env, '/invite?code=' + CODE);
  assert.equal(status, 503);
  assert.equal(body.unavailable, true);
}

// A database without the content table must not 500; it reports unavailable.
{
  const env = {...base.env, DB: fakeDb({...base, noContentTable: true})};
  const {status, body} = await call(env, '/invite?code=' + CODE);
  assert.equal(status, 503);
  assert.equal(body.unavailable, true);
}

// Malformed codes never reach the database.
for (const bad of ['', 'short', 'has space', 'x'.repeat(65)]) {
  const env = {...base.env, DB: fakeDb(base)};
  const {status} = await call(env, '/invite?code=' + encodeURIComponent(bad));
  assert.equal(status, 400, 'rejects ' + JSON.stringify(bad));
}

// The snapshot now carries content, and rejects a payload that omits it.
{
  const {validateSnapshot} = await import('../validation-worker/src.mjs');
  assert.throws(() => validateSnapshot({version: 1, guests: []}), /Invalid content/);
  const valid = validateSnapshot({
    version: 1,
    guests: [{codeHash: hash, name: 'x', maxGuests: 2, revoked: false}],
    gifts: [], wishlist: []
  });
  assert.equal(valid.guests.length, 1);
  assert.equal(valid.gifts, '[]');
}

console.log('Invite mirror checks passed: one-call guest bundle, hash-only claim ownership, refused unknown/revoked guests, stale and un-migrated fallback, malformed code rejection, and snapshot content validation.');
