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
