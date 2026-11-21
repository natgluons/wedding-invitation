CREATE TABLE IF NOT EXISTS guests (
  code_hash TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  max_guests INTEGER NOT NULL CHECK(max_guests BETWEEN 1 AND 100),
  revoked INTEGER NOT NULL CHECK(revoked IN (0,1))
);
CREATE TABLE IF NOT EXISTS sync_state (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  synced_at INTEGER NOT NULL,
  source_version INTEGER NOT NULL
);
-- Gift methods and the wishlist, mirrored so the invitation renders without a
-- round trip to Apps Script. Both are public to a verified guest; the sheet
-- stays the source of truth.
CREATE TABLE IF NOT EXISTS content (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  gifts TEXT NOT NULL,
  wishlist TEXT NOT NULL
);
