-- The website's queue for work only the PC can do (Claude runs, git sync, description fetches, the paper-email search).
-- The website inserts a request; the local dashboard on the PC polls this table through wrangler, claims a request
-- (UPDATE ... WHERE status='queued' RETURNING), runs it through the same code as its own buttons and writes the outcome back.
CREATE TABLE IF NOT EXISTS run_requests(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK(kind IN ('run','sync','fetch-description','paper-emails','cancel-run')),
  task TEXT,
  params_json TEXT NOT NULL DEFAULT '{}',
  requested_at TEXT NOT NULL,
  requested_by TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','claimed','started','done','failed','cancelled')),
  claimed_at TEXT,
  local_run_id INTEGER,
  message TEXT,
  result_json TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS run_requests_status ON run_requests(status, id);

-- One row (id = 1): the PC dashboard's last check-in. Older than ~2 min = the PC is off.
CREATE TABLE IF NOT EXISTS pc_heartbeat(
  id INTEGER PRIMARY KEY CHECK(id = 1),
  at TEXT NOT NULL,
  version TEXT,
  busy INTEGER NOT NULL DEFAULT 0,
  current_run INTEGER,
  current_request INTEGER
);
