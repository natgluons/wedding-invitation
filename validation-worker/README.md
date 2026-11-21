# Fast invitation opening

Worker: https://wedding-invitation-validation.richardputra2910.workers.dev

The Worker validates the short invitation code against a private D1 mirror. It stores only SHA-256 code hashes, the invitation name, maximum party size, and revocation state. It also mirrors the gift methods and the wishlist, so a verified guest renders the page without waiting for the spreadsheet. It cannot read saved responses or wishes. It never publishes a list of invitations.

`POST /validate` accepts `{ "code": "..." }` as `text/plain` JSON (no CORS preflight) and returns one matching guest. `GET /invite?code=...` returns the guest, the gift methods and the wishlist in one call; a wish's owner arrives as a code hash, so `mine` is decided at the edge and the raw code never reaches D1. `POST /sync` requires the private sync secret and atomically replaces the mirror; older snapshots cannot replace newer snapshots. `GET /health` reports whether an initial sync has happened.

Saved RSVP answers and wishes deliberately stay in the spreadsheet, because they are per-guest private data. A guest lookup therefore still finishes on Apps Script, but only to fill in those two fields: the invitation, the guest's name, the gift methods and the wishlist are already on screen from the edge.

## One-time Google-side activation

Cloudflare and D1 are deployed. Google access was not available through the connected tools, so activate the saved-script sync once:

1. Replace the existing Apps Script project's Code.gs with `rsvp-backend/Code.gs` and save.
2. Add a script file named WorkerConfig. Paste the local contents of `rsvp-backend/worker-sync.private.gs` into it. That file is ignored by git and contains the matching private sync secret; don't paste it into the website config or Guests sheet.
3. Run `configureInvitationWorker()` once and authorize the requested spreadsheet, trigger, and external-request permissions. It saves configuration in Script Properties, installs the triggers, and pushes the first snapshot. You can remove the one-time WorkerConfig script afterward; its settings remain in Script Properties.
4. Update the existing Web App deployment to a new version, retaining the same /exec URL.
5. Reload the invitation. `/health` should now report `ready: true` and a sync timestamp.

No setup() run is needed specifically for the Worker. Guest codes and link formulas are untouched. Existing guest links do not change.

## Ongoing sync

Edits on Guests, Gifts and the Wishlist all trigger a sync automatically. A five-minute trigger catches what an edit cannot: formula recalculation, imports, and writes made by a script, which never fire `onEdit` at all. `syncInvitationWorker()` can also be run manually. Duplicate codes and malformed guest records are blocked in the mirror rather than granting access.

Typing in a cell can fire the edit trigger repeatedly, so a sync that ran less than three seconds ago is skipped; the timer catches whatever the debounce drops. Claims always push regardless, because a guest who just claimed must not wait. The installer seeds the mirror itself, so a reinstall also refreshes the edge copy. If a push fails, its debounce mark is cleared so the retry is not blocked by the failure.

Claims are the exception to the debounce: `doPost` re-syncs itself after a successful claim, because Google's `onEdit` trigger does not fire for cells written by a script and a guest must not see their own claim go missing.

Revocations become effective for the opening gate after the next successful sync. Apps Script still checks the current private sheet when reading saved responses or saving RSVP/wishes, independently of the mirror. A mirror older than 15 minutes returns unavailable, causing a fallback to the original sheet check. This is distinct from an invalid code: Worker errors do not incorrectly reject invitations.

The frontend opens immediately after a successful edge check; the Apps Script response hydrates RSVP, the own wish, and gifts in the background. Both response editors remain inert until hydration completes. A failed response load shows an inline reload instruction, without an opening popup. If the Worker is not initialized or unavailable, opening falls back to Apps Script.

## Maintenance

```sh
npx wrangler deploy --config validation-worker/wrangler.jsonc
node tests/validation-worker.mjs
node tests/invite-mirror.mjs
node tests/guest-whitelist.cjs
```

The D1 schema is in `schema.sql`. `wrangler secret bulk` sets the Worker `SYNC_SECRET`; the Apps Script `INVITE_WORKER_SYNC_SECRET` must match. The secret is never part of committed source or browser responses. Avoid changing it without updating both sides.

**A schema change needs `wrangler d1 execute wedding-invitation-validation --remote --file validation-worker/schema.sql` before the new Worker is deployed.** Every statement is `CREATE TABLE IF NOT EXISTS`, so running it repeatedly is safe. Until the `content` table exists, `GET /invite` answers 503 and the page quietly reads the sheet instead, exactly as before the mirror.
