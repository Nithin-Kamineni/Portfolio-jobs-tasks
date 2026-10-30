// Row shapes returned by the API (and printed by the CLI).
import type { Channel, EmailConfidence, JobStatus, LinkedinConfidence, OutreachStatus, OutreachType, Relationship } from './statuses';

export interface Job {
  id: string;
  company: string;
  company_priority: string;
  title: string;
  location: string;
  url: string;
  source: string;
  ats: string;
  posted_date: string;
  posted_raw: string;
  first_seen: string;
  score: number | null;
  hits: string[];
  tags: string[];
  flags: string[];
  degrees: string;
  sponsorship_flag: string;
  description?: string;
  has_description: boolean;
  description_fetched_at: string | null;
  fit_score: number | null;
  fit_reason: string | null;
  ranked_at: string | null;
  status: JobStatus;
  decision_at: string | null;
  applied_date: string | null;
  outcome_date: string | null;
  resume_version: string;
  application_dir: string | null;
  notes: string | null;
  referral_requested_at: string | null;
  updated_at: string | null;
  /** Last write by a dashboard Claude run (for the "updated by Claude" chip). */
  claude_at?: string | null;
  /** v2 ranking stage: rule (code) | quick (light model) | final (Opus re-check); null = ranked before v2 / not ranked. */
  rank_stage?: 'rule' | 'quick' | 'final' | null;
  rank_model?: string | null;
  /** v2: the older posting of the same role (a re-post stays visible; this only links it). */
  previous_posting_id?: string | null;
  /** Legacy columns from the removed application filling (2026-10-17); kept so old rows and cloud sync stay intact. */
  fill_status?: string | null;
  fill_report?: string | null;
  fill_at?: string | null;
  /** Joined in the job detail: what happened to the older posting. */
  previous_posting?: { id: string; title: string; url: string; status: JobStatus; first_seen: string; decision_at: string | null; applied_date: string | null } | null;
}

export interface Paper { title: string; venue?: string; year?: number | string; url?: string }

export interface Contact {
  id: number;
  name: string;
  company: string;
  title_or_lab: string | null;
  relationship: Relationship;
  linkedin_url: string | null;
  email: string | null;
  email_source: string | null;
  email_confidence: EmailConfidence | null;
  work_summary: string | null;
  papers: Paper[];
  notes: string | null;
  /** v2 P6: where the LinkedIn link came from and whether the owner confirmed it (null: none, or he entered it himself). */
  linkedin_confidence?: LinkedinConfidence | null;
  linkedin_source?: string | null;
  /** A link the owner marked "Wrong person" (never suggested again). */
  linkedin_rejected?: string | null;
  /** OpenAlex author id (A…), for researchers found from papers. */
  openalex_id?: string | null;
  created_at: string;
  updated_at: string;
  claude_at?: string | null;
}

/** A paper as a research candidate lists it (OpenAlex + Semantic Scholar). */
export interface CandidatePaper {
  title: string; venue: string; year: number | null; doi: string | null; url: string | null; pdf_url: string | null;
  /** first | middle | last author. */
  position: string; topics: string[];
}

/** A researcher found in papers at a target company, not (yet) a contact (plan v2 §6.1). */
export interface ResearchCandidate {
  id: number;
  openalex_id: string;
  name: string;
  company: string;
  institution: string | null;
  country: string | null;
  papers: CandidatePaper[];
  topics: string[];
  score: number;
  status: 'new' | 'picked' | 'skipped' | 'contacted';
  contact_id: number | null;
  first_seen: string;
  updated_at: string;
}

export interface Outreach {
  id: number;
  type: OutreachType;
  contact_id: number | null;
  job_id: string | null;
  channel: Channel | null;
  subject: string | null;
  body: string | null;
  status: OutreachStatus;
  sent_at: string | null;
  follow_up_due: string | null;
  reply_notes: string | null;
  parent_id: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  /** Joined for display. */
  contact_name?: string | null;
  contact_company?: string | null;
  contact_email?: string | null;
  contact_linkedin?: string | null;
  contact_confidence?: EmailConfidence | null;
  contact_linkedin_confidence?: LinkedinConfidence | null;
  contact_linkedin_source?: string | null;
  job_title?: string | null;
  job_company?: string | null;
  /** True when a sent item's follow-up date has passed and no follow-up exists yet. */
  follow_up_is_due?: boolean;
  has_follow_up?: boolean;
}

export interface Company {
  name: string;
  priority: string;
  ats: string;
  careers_url: string;
  fit_notes: string;
  enabled: string;
  open_jobs: number;
  contacts: number;
  manual: boolean;
  /** v2: search URL template for the Chrome check ("…?q={q}") and the last check. */
  search_url?: string;
  last_check?: { checked_at: string | null; result: string | null; found: number | null; added: number | null } | null;
  /** "Check these yourself" (Home): you_check=yes in companies.csv, its short reason, and the last "I checked" click. */
  you_check?: string;
  you_check_reason?: string;
  self_checked_at?: string | null;
}

export interface WatcherHealth {
  lastRunAt: string | null;
  matches: number | null;
  errors: string[];
  digest: string | null;
  source: 'last_run' | 'digest' | 'none';
}

export interface SyncResult {
  at: string;
  pulled: boolean;
  warning: string | null;
  importedFiles: string[];
  importedJobs: number;
  exportWarning: string | null;
  /** v2: the dashboard's files were committed / local commits pushed ("Commit and push automatically"). */
  committed?: boolean;
  pushed?: boolean;
}

/** Facts the web's claudeSteps.ts turns into "Your turn in Claude" hand-offs. */
export interface ClaudeFacts {
  newCount: number;
  toPrepare: { id: string; company: string; title: string; status: JobStatus }[];
  referralRequested: { id: string; company: string; title: string }[];
  referralNoContact: string[];
  followUpsDue: number;
  researcherCount: number;
  watcherErrors: string[];
  lastWeeklyReview: string | null;
  lastManualCheck: string | null;
  manualCompanies: string[];
  /** v2: manual companies whose last Chrome check is older than the setting (visited by the next "Process new jobs"). */
  manualDue?: string[];
  /** v2: quick scores at or above this get the Opus final check (config runs.finalMinFit). */
  finalMinFit?: number;
  today: string;
}

export interface Stats {
  byStatus: Record<string, number>;
  kpis: { new: number; awaiting: number; referral: number; applied: number; interviews: number };
  /** The last job search the owner ran by hand ("Process new jobs", a manual-company check), for the Home countdown. */
  lastJobSearch: { at: string; what: string } | null;
}

/** One note per company (matched by companyKey), shown on every role of that company (Referral, Interview). */
export interface CompanyNote { company_key: string; company: string; note: string; updated_at: string }

/** "Find R&D emails from papers": an address printed on one of the person's papers (never guessed). */
export interface PaperEmailHit {
  name: string;
  email: string;
  paper: { title: string; venue: string; year: number | null; url: string | null; pdf_url: string };
}

export interface PaperEmailSearch {
  company: string;
  company_key: string;
  status: 'running' | 'done' | 'error';
  started_at: string;
  finished_at: string | null;
  error: string | null;
  /** While running: how far it got. When done: the people checked, the addresses found and any warnings. */
  result: { total: number; checked: number; papers: number; hits: PaperEmailHit[]; warnings: string[]; institution: string | null };
}

// ---------- v2: Claude runs ----------
export const RUN_STATUSES = ['queued', 'running', 'succeeded', 'failed', 'cancelled', 'timed_out', 'needs_user'] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];
export const ACTIVE_RUN_STATUSES: readonly RunStatus[] = ['queued', 'running'];

export interface RunStep { at: string; text: string; kind: 'tool' | 'text' | 'info' | 'error' | 'step' }

export interface RunCounters {
  ranked: number; statuses: number; outreach: number; contacts: number; jobsAdded: number; fetched: number; notes: number;
  toolCalls: number; denied: number;
}

export interface RunUsage { input_tokens: number; output_tokens: number; cache_read_input_tokens: number; cache_creation_input_tokens: number }

/** One step of a pipeline run ("Process new jobs": sync → manual companies → rules → quick rank → final check). */
export interface PipelineStep {
  key: string; label: string;
  status: 'pending' | 'running' | 'done' | 'skipped' | 'failed';
  detail?: string; runId?: number;
}

export interface RunProgress {
  model?: string;
  mcp?: { name: string; status: string }[];
  toolsLoaded?: number;
  steps: RunStep[];
  counters: RunCounters;
  /** e.g. the job limit, for "ranked 7/25". */
  target?: number;
  lastText?: string;
  usage?: RunUsage;
  malformed: number;
  usageLimit?: { resetsAt: string | null; text: string };
  pipeline?: PipelineStep[];
  /** After-run git ("Commit and push automatically"). */
  git?: { committed: boolean; files: string[]; pushed: boolean; warning: string | null };
}

export interface Settings { autoCommit: boolean; manualCheckEveryHours: number }

export interface Run {
  id: number;
  task: string;
  params: Record<string, unknown>;
  status: RunStatus;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  pid: number | null;
  session_id: string | null;
  parent_id: number | null;
  progress: RunProgress;
  summary: string | null;
  result_subtype: string | null;
  num_turns: number | null;
  usage_usd: number | null;
  error: string | null;
  /** From the task catalog, for display. */
  label: string;
  activity: string;
}

export interface Preflight {
  ok: boolean;
  command: string;
  resolved: string | null;
  version: string | null;
  loggedIn: boolean | null;
  message: string | null;
  lastChromeRunAt: string | null;
  checkedAt: string;
}

export interface AppMeta {
  /** Changes when the server restarts (the page reloads itself into the new version). */
  bootId: string;
  health: WatcherHealth;
  lastSync: SyncResult | null;
  /** Two-way sync with the website (server/cloudSync.ts); enabled = the automatic loop runs in this server. */
  cloudSync?: {
    enabled: boolean; running: boolean; lastAt: string | null; lastOk: boolean | null; lastError: string | null;
    lastSuccessAt: string | null; lastChanges: number | null; lastPullAt: string | null;
  };
  config: { outlookComposeUrl: string; outlookMaxUrlLength: number; resumePath: string; repoRoot: string };
}
