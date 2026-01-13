-- Initial schema migration
-- This is a placeholder for future tables

-- Example table structure (uncomment when needed):
-- CREATE TABLE IF NOT EXISTS notes (
--   id TEXT PRIMARY KEY,
--   content TEXT NOT NULL,
--   created_at TEXT NOT NULL DEFAULT (datetime('now')),
--   updated_at TEXT NOT NULL DEFAULT (datetime('now'))
-- );

-- For now, just create a simple metadata table
CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO _migrations (name) VALUES ('0001_initial');
