-- Two PCs (home and work), each with its own local dashboard database, both syncing with this D1 (the hub).
-- machines: each PC registers once and gets an index; it creates local ids (runs, contacts, outreach, research
-- candidates) only in its own range [idx * 1e9 + 1, (idx + 1) * 1e9), so rows from both PCs never share an id.
CREATE TABLE IF NOT EXISTS machines(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  idx INTEGER NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  last_seen TEXT
);

-- One heartbeat row per PC (was a single row).
DROP TABLE IF EXISTS pc_heartbeat;
CREATE TABLE pc_heartbeat(
  machine TEXT PRIMARY KEY,
  name TEXT,
  at TEXT NOT NULL,
  version TEXT,
  busy INTEGER NOT NULL DEFAULT 0,
  current_run INTEGER,
  current_task TEXT,
  current_request INTEGER
);

-- Which PC claimed a request (machines.id).
ALTER TABLE run_requests ADD COLUMN claimed_by TEXT;
