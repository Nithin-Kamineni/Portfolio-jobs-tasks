-- The whole database schema (tasks, deadlines, documents, interview prep, and the job tracker's cloud copy) as one
-- migration for a fresh install. Apply: cd site && npm run db:migrate:local  (and npm run db:migrate for the live site).
PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE jobs(
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL DEFAULT '', company_priority TEXT NOT NULL DEFAULT '', title TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '', url TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '', ats TEXT NOT NULL DEFAULT '', posted_date TEXT NOT NULL DEFAULT '', posted_raw TEXT NOT NULL DEFAULT '',
  first_seen TEXT NOT NULL DEFAULT '',
  score INTEGER, hits_json TEXT NOT NULL DEFAULT '[]', tags_json TEXT NOT NULL DEFAULT '[]', flags_json TEXT NOT NULL DEFAULT '[]',
  degrees TEXT NOT NULL DEFAULT '', sponsorship_flag TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '', description_fetched_at TEXT,
  fit_score INTEGER, fit_reason TEXT, ranked_at TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  decision_at TEXT, applied_date TEXT, outcome_date TEXT,
  resume_version TEXT NOT NULL DEFAULT 'master', application_dir TEXT, notes TEXT,
  referral_requested_at TEXT,
  updated_at TEXT,
  -- v4: staged ranking, duplicate merging and re-post links
  rank_stage TEXT,             -- rule | quick | final (null: ranked before v2, or not ranked)
  rank_model TEXT,             -- which model (or "rules") wrote the fit score
  canonical_url TEXT,          -- URL without tracking parameters: the same posting from two sources
  req_id TEXT,                 -- requisition number from the URL/id (Workday JR…, Greenhouse id, …)
  repost_key TEXT,             -- companyKey + normalized title: a re-posted role
  previous_posting_id TEXT,    -- the older posting of the same role (never hidden)
  -- v6: semi-automated application filling (parked; the columns stay)
  fill_status TEXT,            -- ready_for_review | needs_user | failed (null: never filled)
  fill_report TEXT,            -- applications/<dir>/fill_report.md
  fill_at TEXT
);
CREATE TABLE contacts(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, company TEXT NOT NULL DEFAULT '', title_or_lab TEXT,
  relationship TEXT NOT NULL DEFAULT 'researcher',
  linkedin_url TEXT, email TEXT, email_source TEXT, email_confidence TEXT,
  work_summary TEXT, papers_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  -- v5: researcher finding and LinkedIn links confirmed by the owner
  linkedin_confidence TEXT,    -- search_match | confirmed | rejected (null: none, or entered by the owner)
  linkedin_source TEXT,        -- e.g. "web search: 'Jane Doe NVIDIA LinkedIn'"
  linkedin_rejected TEXT,      -- the link the owner said was the wrong person (never suggested again)
  openalex_id TEXT             -- OpenAlex author id (A…): the same researcher across runs
);
CREATE TABLE outreach(
  id INTEGER PRIMARY KEY, type TEXT NOT NULL,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  channel TEXT, subject TEXT, body TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TEXT, follow_up_due TEXT, reply_notes TEXT,
  parent_id INTEGER REFERENCES outreach(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL DEFAULT 'claude', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE events(id INTEGER PRIMARY KEY, at TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT, kind TEXT NOT NULL, detail_json TEXT NOT NULL DEFAULT '{}', undone_at TEXT);
CREATE TABLE imports(file TEXT PRIMARY KEY, imported_at TEXT NOT NULL, rows INTEGER NOT NULL);
CREATE TABLE companies(name TEXT PRIMARY KEY, priority TEXT, ats TEXT, careers_url TEXT, fit_notes TEXT, enabled TEXT, search_url TEXT, you_check TEXT, you_check_reason TEXT);
CREATE TABLE runs(
  id INTEGER PRIMARY KEY, task TEXT NOT NULL, params_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  created_at TEXT NOT NULL, started_at TEXT, finished_at TEXT,
  pid INTEGER, session_id TEXT, parent_id INTEGER REFERENCES runs(id) ON DELETE SET NULL,
  progress_json TEXT NOT NULL DEFAULT '{}',
  summary TEXT, result_subtype TEXT, num_turns INTEGER, usage_usd REAL, error TEXT
);
CREATE TABLE settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE job_aliases(alias_id TEXT PRIMARY KEY, job_id TEXT NOT NULL, reason TEXT NOT NULL, at TEXT NOT NULL);
CREATE TABLE manual_checks(company TEXT PRIMARY KEY, checked_at TEXT, result TEXT, found INTEGER, added INTEGER, note TEXT);
CREATE TABLE research_candidates(
  id INTEGER PRIMARY KEY, openalex_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL, company TEXT NOT NULL,
  institution TEXT, country TEXT, papers_json TEXT NOT NULL DEFAULT '[]', topics_json TEXT NOT NULL DEFAULT '[]',
  score REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',   -- new | picked | skipped | contacted
  contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  first_seen TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 300),
  notes TEXT NOT NULL DEFAULT '',
  project TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high')),
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','doing','done')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  version INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE papers (
  id INTEGER PRIMARY KEY,
  position REAL NOT NULL,                       -- planned reading order (drag to reorder)
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 500),
  authors TEXT NOT NULL DEFAULT '',
  venue TEXT NOT NULL DEFAULT '',
  year INTEGER,
  url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'to_read' CHECK(status IN ('to_read','reading','read','skipped')),
  domains TEXT NOT NULL DEFAULT '[]',           -- JSON array of domain ids
  notes TEXT NOT NULL DEFAULT '',
  extra TEXT NOT NULL DEFAULT '{}',             -- other columns from the original sheet
  source TEXT NOT NULL DEFAULT 'manual',
  read_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
, pages INTEGER, citations INTEGER, citations_at TEXT, impact TEXT NOT NULL DEFAULT '', hidden INTEGER NOT NULL DEFAULT 0);
CREATE TABLE prep_tracks (
  id TEXT PRIMARY KEY,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  goal TEXT NOT NULL DEFAULT '',
  suggested INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE prep_modules (
  id TEXT PRIMARY KEY,
  track_id TEXT NOT NULL REFERENCES prep_tracks(id),
  position INTEGER NOT NULL,
  title TEXT NOT NULL
);
CREATE TABLE prep_items (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES prep_modules(id),
  position REAL NOT NULL,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 300),
  kind TEXT NOT NULL DEFAULT 'concept' CHECK(kind IN ('video','reading','course','exercise','project','concept')),
  url TEXT NOT NULL DEFAULT '',
  est REAL,                                     -- estimated hours
  optional INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',                -- curriculum note
  custom INTEGER NOT NULL DEFAULT 0,            -- added by the owner (deletable)
  status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','doing','done','skipped')),
  confidence INTEGER NOT NULL DEFAULT 0 CHECK(confidence BETWEEN 0 AND 5),
  my_notes TEXT NOT NULL DEFAULT '',
  started_at TEXT,
  done_at TEXT,
  updated_at TEXT
, hide_continue INTEGER NOT NULL DEFAULT 0);
CREATE TABLE prep_log (
  id INTEGER PRIMARY KEY,
  item_id TEXT NOT NULL,
  status TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE TABLE docs (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled document',
  content TEXT NOT NULL DEFAULT '',             -- editor JSON
  text TEXT NOT NULL DEFAULT '',                -- plain text, for search and previews
  pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,                              -- in the trash
  version INTEGER NOT NULL DEFAULT 1
, folder_id INTEGER);
CREATE TABLE coding_progress (
  slug TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','attempted','solved')),
  starred INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  solved_at TEXT,
  review_on TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE reading_projects (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
  position REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE reading_project_papers (
  project_id INTEGER NOT NULL REFERENCES reading_projects(id) ON DELETE CASCADE,
  paper_id INTEGER NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  position REAL NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (project_id, paper_id)
);
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  track TEXT NOT NULL,
  module TEXT NOT NULL DEFAULT '',
  front TEXT NOT NULL CHECK(length(front) BETWEEN 1 AND 2000),
  back TEXT NOT NULL CHECK(length(back) BETWEEN 1 AND 6000),
  custom INTEGER NOT NULL DEFAULT 0,
  suspended INTEGER NOT NULL DEFAULT 0,
  -- SM-2 state; due_on NULL = new (never reviewed)
  ease REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  due_on TEXT,
  last_reviewed TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE card_reviews (
  id INTEGER PRIMARY KEY,
  card_id TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK(grade BETWEEN 1 AND 4),
  at TEXT NOT NULL
);
CREATE TABLE quiz_questions (
  id TEXT PRIMARY KEY,
  track TEXT NOT NULL,
  module TEXT NOT NULL DEFAULT '',
  q TEXT NOT NULL,
  options TEXT NOT NULL,                       -- JSON array of 4 strings
  answer INTEGER NOT NULL,
  explain TEXT NOT NULL DEFAULT ''
);
CREATE TABLE quiz_attempts (
  id INTEGER PRIMARY KEY,
  scope TEXT NOT NULL,                         -- 'all', a track id, or a module id
  total INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  details TEXT NOT NULL DEFAULT '[]',          -- [{id, chosen, ok}]
  at TEXT NOT NULL
);
CREATE TABLE prep_plan (
  day TEXT NOT NULL,                           -- YYYY-MM-DD
  item_id TEXT NOT NULL,
  position REAL NOT NULL,
  PRIMARY KEY (day, item_id)
);
CREATE TABLE ws_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer_md TEXT NOT NULL DEFAULT '',
  topics TEXT NOT NULL DEFAULT '[]',
  concepts TEXT NOT NULL DEFAULT '[]',
  difficulty TEXT NOT NULL DEFAULT 'Medium',
  companies TEXT NOT NULL DEFAULT '[]',
  role TEXT NOT NULL DEFAULT 'both',
  track TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  common INTEGER NOT NULL DEFAULT 0,
  custom INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','practiced','confident')),
  starred INTEGER NOT NULL DEFAULT 0,
  my_answer TEXT NOT NULL DEFAULT '',
  updated_at TEXT
, module TEXT NOT NULL DEFAULT '');
CREATE TABLE doc_versions (
  id INTEGER PRIMARY KEY,
  doc_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  text TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'auto' CHECK(kind IN ('auto','manual','restore')),
  created_at TEXT NOT NULL
);
CREATE TABLE ws_ui (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,                         -- JSON
  updated_at TEXT NOT NULL
);
CREATE TABLE ws_history (
  id INTEGER PRIMARY KEY,
  at TEXT NOT NULL,
  area TEXT NOT NULL,                          -- reading, prep, focus, cards, questions, docs, coding, plan, settings
  action TEXT NOT NULL,                        -- create, update, delete, reorder, undo
  label TEXT NOT NULL,
  entity TEXT NOT NULL DEFAULT '',             -- quick edits to one thing within 10 minutes share one entry
  before TEXT NOT NULL,                        -- JSON: [{table, keys:[…], rows:[…]}]
  undone_at TEXT,
  undo_of INTEGER
);
CREATE TABLE prep_focus (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
  description TEXT NOT NULL DEFAULT '',
  position REAL NOT NULL,
  preset TEXT NOT NULL DEFAULT '',             -- seeded focuses keep a stable key
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE prep_focus_items (
  focus_id INTEGER NOT NULL REFERENCES prep_focus(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  PRIMARY KEY (focus_id, item_id)
);
CREATE TABLE company_notes(
  company_key TEXT PRIMARY KEY,           -- companyKey(name): "NVIDIA" and "NVIDIA Corporation" share one note
  company TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL
);
CREATE TABLE paper_email_searches(
  company_key TEXT PRIMARY KEY, company TEXT NOT NULL,
  status TEXT NOT NULL,                   -- running | done | error
  started_at TEXT NOT NULL, finished_at TEXT,
  result_json TEXT NOT NULL DEFAULT '{}', error TEXT
);
CREATE TABLE run_requests(
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
, claimed_by TEXT);
CREATE TABLE machines(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  idx INTEGER NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  last_seen TEXT
);
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
CREATE TABLE doc_folders (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
  parent_id INTEGER,                           -- NULL = top level; folders nest
  position REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE doc_images (
  id INTEGER PRIMARY KEY,
  doc_id INTEGER,                              -- the document it was added to (kept if the document goes)
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  data BLOB NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE deadlines (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
  due_on TEXT NOT NULL,                        -- YYYY-MM-DD
  due_time TEXT,                               -- HH:MM (local), NULL = end of that day
  tz TEXT NOT NULL DEFAULT 'local',            -- local (this device), AoE (UTC-12, paper deadlines) or UTC
  kind TEXT NOT NULL DEFAULT 'other',          -- paper, application, exam, interview, other
  note TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  done_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
, size TEXT NOT NULL DEFAULT 'M', shown INTEGER NOT NULL DEFAULT 1, source TEXT NOT NULL DEFAULT 'manual', source_url TEXT NOT NULL DEFAULT '', auto_key TEXT, conf TEXT NOT NULL DEFAULT '', seen INTEGER NOT NULL DEFAULT 1, changed_at TEXT, found_at TEXT);
CREATE INDEX jobs_status ON jobs(status);
CREATE INDEX jobs_company ON jobs(company);
CREATE INDEX jobs_canonical ON jobs(canonical_url);
CREATE INDEX jobs_repost ON jobs(repost_key);
CREATE INDEX contacts_company ON contacts(company);
CREATE INDEX contacts_openalex ON contacts(openalex_id);
CREATE INDEX outreach_status ON outreach(status);
CREATE INDEX events_entity ON events(entity, entity_id);
CREATE INDEX events_kind ON events(kind);
CREATE INDEX runs_status ON runs(status);
CREATE INDEX runs_parent ON runs(parent_id);
CREATE INDEX research_candidates_status ON research_candidates(status);
CREATE INDEX tasks_status_due ON tasks(status, due_date);
CREATE INDEX events_job_status ON events(entity, entity_id, kind, id);
CREATE INDEX papers_position ON papers(position);
CREATE INDEX prep_items_module ON prep_items(module_id, position);
CREATE INDEX prep_log_at ON prep_log(at);
CREATE INDEX cards_due ON cards(suspended, due_on);
CREATE INDEX card_reviews_at ON card_reviews(at);
CREATE INDEX doc_versions_doc ON doc_versions(doc_id, created_at);
CREATE INDEX ws_history_at ON ws_history(at);
CREATE INDEX run_requests_status ON run_requests(status, id);
CREATE INDEX deadlines_due ON deadlines(due_on);
CREATE UNIQUE INDEX deadlines_auto_key ON deadlines(auto_key) WHERE auto_key IS NOT NULL;